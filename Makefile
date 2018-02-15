# ---------------------------------------------------------------------
# Build configuration
# ---------------------------------------------------------------------

# A non-existing target to force rules to rebuild
# See https://stackoverflow.com/a/816416
.FORCE:

# This directory will be completely deleted by the `clean` rule
BUILD_DIRECTORY ?= dist

# See http://stackoverflow.com/a/20763842/1641422
BUILD_DIRECTORY_PARENT = $(dir $(BUILD_DIRECTORY))
ifeq ($(wildcard $(BUILD_DIRECTORY_PARENT).),)
$(error $(BUILD_DIRECTORY_PARENT) does not exist)
endif

BUILD_TEMPORARY_DIRECTORY = $(BUILD_DIRECTORY)/.tmp

# See https://github.com/electron/spectron/issues/127
ETCHER_SPECTRON_ENTRYPOINT ?= $(shell node -e 'console.log(require("electron"))')

# See https://stackoverflow.com/a/13468229/1641422
SHELL := /bin/bash
PATH := $(shell pwd)/node_modules/.bin:$(PATH)

# ---------------------------------------------------------------------
# Operating system and architecture detection
# ---------------------------------------------------------------------

# http://stackoverflow.com/a/12099167
ifeq ($(OS),Windows_NT)
PLATFORM = win32

ifeq ($(PROCESSOR_ARCHITEW6432),AMD64)
	HOST_ARCH = x64
else
	ifeq ($(PROCESSOR_ARCHITECTURE),AMD64)
		HOST_ARCH = x64
	endif
	ifeq ($(PROCESSOR_ARCHITECTURE),x86)
		HOST_ARCH = x86
	endif
endif
else
ifeq ($(shell uname -s),Linux)
	PLATFORM = linux

	ifeq ($(shell uname -m),x86_64)
		HOST_ARCH = x64
	endif
	ifneq ($(filter %86,$(shell uname -m)),)
		HOST_ARCH = x86
	endif
	ifeq ($(shell uname -m),armv7l)
		HOST_ARCH = armv7hf
	endif
endif
ifeq ($(shell uname -s),Darwin)
	PLATFORM = darwin

	ifeq ($(shell uname -m),x86_64)
		HOST_ARCH = x64
	endif
endif
endif

ifndef PLATFORM
$(error We couldn't detect your host platform)
endif
ifndef HOST_ARCH
$(error We couldn't detect your host architecture)
endif

# Default to host architecture. You can override by doing:
#
#   make <target> TARGET_ARCH=<arch>
#
TARGET_ARCH ?= $(HOST_ARCH)

# Support x86 builds from x64 in GNU/Linux
# See https://github.com/addaleax/lzma-native/issues/27
ifeq ($(PLATFORM),linux)
ifneq ($(HOST_ARCH),$(TARGET_ARCH))
	ifeq ($(TARGET_ARCH),x86)
		export CFLAGS += -m32
	else
$(error Can't build $(TARGET_ARCH) binaries on a $(HOST_ARCH) host)
	endif
endif
endif

# ---------------------------------------------------------------------
# Application configuration
# ---------------------------------------------------------------------

ELECTRON_VERSION = $(shell jq -r '.devDependencies["electron"]' package.json)
NODE_VERSION = 6.1.0
COMPANY_NAME = Resinio Ltd
APPLICATION_NAME = $(shell jq -r '.displayName' package.json)
APPLICATION_DESCRIPTION = $(shell jq -r '.description' package.json)
APPLICATION_COPYRIGHT = $(shell cat electron-builder.yml | shyaml get-value copyright)

BINTRAY_ORGANIZATION = resin-io
BINTRAY_REPOSITORY_DEBIAN = debian
BINTRAY_REPOSITORY_REDHAT = redhat

# ---------------------------------------------------------------------
# Extra variables
# ---------------------------------------------------------------------

TARGET_ARCH_DEBIAN = $(shell ./scripts/build/architecture-convert.sh -r $(TARGET_ARCH) -t debian)
TARGET_ARCH_REDHAT = $(shell ./scripts/build/architecture-convert.sh -r $(TARGET_ARCH) -t redhat)
TARGET_ARCH_APPIMAGE = $(shell ./scripts/build/architecture-convert.sh -r $(TARGET_ARCH) -t appimage)
TARGET_ARCH_ELECTRON_BUILDER = $(shell ./scripts/build/architecture-convert.sh -r $(TARGET_ARCH) -t electron-builder)
PLATFORM_PKG = $(shell ./scripts/build/platform-convert.sh -r $(PLATFORM) -t pkg)
ENTRY_POINT_CLI = lib/cli/etcher.js
ETCHER_CLI_BINARY = $(APPLICATION_NAME_LOWERCASE)
ifeq ($(PLATFORM),win32)
ETCHER_CLI_BINARY = $(APPLICATION_NAME_LOWERCASE).exe
endif

APPLICATION_NAME_LOWERCASE = $(shell echo $(APPLICATION_NAME) | tr A-Z a-z)
APPLICATION_VERSION_DEBIAN = $(shell echo $(APPLICATION_VERSION) | tr "-" "~")
APPLICATION_VERSION_REDHAT = $(shell echo $(APPLICATION_VERSION) | tr "-" "~")

# ---------------------------------------------------------------------
# Release type
# ---------------------------------------------------------------------

# Add the current commit to the version if release type is "snapshot"
RELEASE_TYPE ?= snapshot
PACKAGE_JSON_VERSION = $(shell jq -r '.version' package.json)
ifeq ($(RELEASE_TYPE),production)
APPLICATION_VERSION = $(PACKAGE_JSON_VERSION)
S3_BUCKET = resin-production-downloads
BINTRAY_COMPONENT = $(APPLICATION_NAME_LOWERCASE)
endif
ifeq ($(RELEASE_TYPE),snapshot)
CURRENT_COMMIT_HASH = $(shell git log -1 --format="%h")
APPLICATION_VERSION = $(PACKAGE_JSON_VERSION)+$(CURRENT_COMMIT_HASH)
S3_BUCKET = resin-nightly-downloads
BINTRAY_COMPONENT = $(APPLICATION_NAME_LOWERCASE)-devel
endif
ifndef APPLICATION_VERSION
$(error Invalid release type: $(RELEASE_TYPE))
endif

# ---------------------------------------------------------------------
# Code signing
# ---------------------------------------------------------------------

ifeq ($(PLATFORM),darwin)
ifndef CSC_NAME
$(warning No code-sign identity found (CSC_NAME is not set))
endif
endif

ifeq ($(PLATFORM),win32)
ifndef CSC_LINK
$(warning No code-sign certificate found (CSC_LINK is not set))
ifndef CSC_KEY_PASSWORD
$(warning No code-sign certificate password found (CSC_KEY_PASSWORD is not set))
endif
endif
endif

# ---------------------------------------------------------------------
# Electron Builder
# ---------------------------------------------------------------------

ELECTRON_BUILDER_OPTIONS = --$(TARGET_ARCH_ELECTRON_BUILDER)

# ---------------------------------------------------------------------
# Analytics
# ---------------------------------------------------------------------

ifndef ANALYTICS_SENTRY_TOKEN
$(warning No Sentry token found (ANALYTICS_SENTRY_TOKEN is not set))
else
ELECTRON_BUILDER_OPTIONS += --extraMetadata.analytics.sentry.token=$(ANALYTICS_SENTRY_TOKEN)
endif

ifndef ANALYTICS_MIXPANEL_TOKEN
$(warning No Mixpanel token found (ANALYTICS_MIXPANEL_TOKEN is not set))
else
ELECTRON_BUILDER_OPTIONS += --extraMetadata.analytics.mixpanel.token=$(ANALYTICS_MIXPANEL_TOKEN)
endif

# ---------------------------------------------------------------------
# Rules
# ---------------------------------------------------------------------

# See http://stackoverflow.com/a/12528721
# Note that the blank line before 'endef' is actually important - don't delete it
define execute-command
$(1)

endef

$(BUILD_DIRECTORY):
mkdir $@

$(BUILD_TEMPORARY_DIRECTORY): | $(BUILD_DIRECTORY)
mkdir $@

# ---------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------

$(BUILD_DIRECTORY)/$(APPLICATION_NAME)-cli-$(APPLICATION_VERSION)-$(PLATFORM)-$(TARGET_ARCH)-app: \
	package.json npm-shrinkwrap.json \
	| $(BUILD_DIRECTORY)
	mkdir -p $@
	./scripts/build/dependencies-npm.sh -p \
		-r "$(TARGET_ARCH)" \
		-v "$(NODE_VERSION)" \
		-x $@ \
		-t node \
		-s "$(PLATFORM)"
	patch --directory=$@ --force --strip=1 --ignore-whitespace < patches/lzma-native-index-static-addon-require.patch
	cp -r lib $@
	cp package.json $@

$(BUILD_DIRECTORY)/$(APPLICATION_NAME)-cli-$(APPLICATION_VERSION)-$(PLATFORM)-$(TARGET_ARCH): \
$(BUILD_DIRECTORY)/$(APPLICATION_NAME)-cli-$(APPLICATION_VERSION)-$(PLATFORM)-$(TARGET_ARCH)-app \
| $(BUILD_DIRECTORY)
mkdir $@
cd $< && pkg --output ../../$@/$(ETCHER_CLI_BINARY) -t node6-$(PLATFORM_PKG)-$(TARGET_ARCH) $(ENTRY_POINT_CLI)
./scripts/build/dependencies-npm-extract-addons.sh \
	-d $</node_modules \
	-o $@/node_modules
# pkg currently has a bug where darwin executables
# can't be code-signed
# See https://github.com/zeit/pkg/issues/128
# ifeq ($(PLATFORM),darwin)
# ifdef CSC_NAME
#		./scripts/build/electron-sign-file-darwin.sh -f $@/$(ETCHER_CLI_BINARY) -i "$(CSC_NAME)"
# endif
# endif

# pkg currently has a bug where Windows executables
# can't be branded
# See https://github.com/zeit/pkg/issues/149
# ifeq ($(PLATFORM),win32)
#		./scripts/build/electron-brand-exe.sh \
#			-f $@/$(ETCHER_CLI_BINARY) \
#			-n $(APPLICATION_NAME) \
#			-d "$(APPLICATION_DESCRIPTION)" \
#			-v "$(APPLICATION_VERSION)" \
#			-c "$(APPLICATION_COPYRIGHT)" \
#			-m "$(COMPANY_NAME)" \
#			-i assets/icon.ico \
#			-w $(BUILD_TEMPORARY_DIRECTORY)
# endif

ifeq ($(PLATFORM),win32)
ifdef CSC_LINK
ifdef CSC_KEY_PASSWORD
./scripts/build/electron-sign-exe-win32.sh -f $@/$(ETCHER_CLI_BINARY) \
	-d "$(APPLICATION_NAME) - $(APPLICATION_VERSION)" \
	-c $(CSC_LINK) \
	-p $(CSC_KEY_PASSWORD)
endif
endif
endif

$(BUILD_DIRECTORY)/$(APPLICATION_NAME)-cli-$(APPLICATION_VERSION)-$(PLATFORM)-$(TARGET_ARCH).zip: \
$(BUILD_DIRECTORY)/$(APPLICATION_NAME)-cli-$(APPLICATION_VERSION)-$(PLATFORM)-$(TARGET_ARCH)
./scripts/build/zip-file.sh -f $< -s $(PLATFORM) -o $@

$(BUILD_DIRECTORY)/$(APPLICATION_NAME)-cli-$(APPLICATION_VERSION)-$(PLATFORM)-$(TARGET_ARCH).tar.gz: \
$(BUILD_DIRECTORY)/$(APPLICATION_NAME)-cli-$(APPLICATION_VERSION)-$(PLATFORM)-$(TARGET_ARCH)
./scripts/build/tar-gz-file.sh -f $< -o $@

# ---------------------------------------------------------------------
# GUI
# ---------------------------------------------------------------------

assets/dmg/background.tiff: assets/dmg/background.png assets/dmg/background@2x.png
tiffutil -cathidpicheck $^ -out $@

build/js/gui.js: .FORCE
	webpack

$(BUILD_DIRECTORY)/$(APPLICATION_NAME)-$(APPLICATION_VERSION).dmg: assets/dmg-installer.tiff build/js/gui.js \
	| $(BUILD_DIRECTORY)
	TARGET_ARCH=$(TARGET_ARCH) build --mac dmg $(ELECTRON_BUILDER_OPTIONS) \
		--extraMetadata.version=$(APPLICATION_VERSION) \
		--extraMetadata.packageType=dmg

$(BUILD_DIRECTORY)/$(APPLICATION_NAME)-$(APPLICATION_VERSION)-mac.zip: assets/dmg-installer.tiff build/js/gui.js \
	| $(BUILD_DIRECTORY)
	TARGET_ARCH=$(TARGET_ARCH) build --mac zip $(ELECTRON_BUILDER_OPTIONS) \
		--extraMetadata.version=$(APPLICATION_VERSION) \
		--extraMetadata.packageType=zip

APPLICATION_NAME_ELECTRON = $(APPLICATION_NAME_LOWERCASE)-electron

$(BUILD_DIRECTORY)/$(APPLICATION_NAME_ELECTRON)-$(APPLICATION_VERSION_REDHAT).$(TARGET_ARCH_REDHAT).rpm: build/js/gui.js \
	| $(BUILD_DIRECTORY)
	build --linux rpm $(ELECTRON_BUILDER_OPTIONS) \
		--extraMetadata.name=$(APPLICATION_NAME_ELECTRON) \
		--extraMetadata.version=$(APPLICATION_VERSION_REDHAT) \
		--extraMetadata.packageType=rpm

$(BUILD_DIRECTORY)/$(APPLICATION_NAME_ELECTRON)_$(APPLICATION_VERSION_DEBIAN)_$(TARGET_ARCH_DEBIAN).deb: build/js/gui.js \
	| $(BUILD_DIRECTORY)
	build --linux deb $(ELECTRON_BUILDER_OPTIONS) \
		--extraMetadata.name=$(APPLICATION_NAME_ELECTRON) \
		--extraMetadata.version=$(APPLICATION_VERSION_DEBIAN) \
		--extraMetadata.packageType=deb

ifeq ($(TARGET_ARCH),x64)
ELECTRON_BUILDER_LINUX_UNPACKED_DIRECTORY = linux-unpacked
else
ELECTRON_BUILDER_LINUX_UNPACKED_DIRECTORY = linux-$(TARGET_ARCH_ELECTRON_BUILDER)-unpacked
endif

$(BUILD_DIRECTORY)/$(ELECTRON_BUILDER_LINUX_UNPACKED_DIRECTORY)/$(APPLICATION_NAME_ELECTRON): build/js/gui.js | $(BUILD_DIRECTORY)
	build --dir --linux $(ELECTRON_BUILDER_OPTIONS) \
		--extraMetadata.name=$(APPLICATION_NAME_ELECTRON) \
		--extraMetadata.version=$(APPLICATION_VERSION) \
		--extraMetadata.packageType=AppImage
	touch $@

$(BUILD_DIRECTORY)/$(APPLICATION_NAME_LOWERCASE)-$(APPLICATION_VERSION)-$(PLATFORM).AppDir: \
	$(BUILD_DIRECTORY)/$(ELECTRON_BUILDER_LINUX_UNPACKED_DIRECTORY)/$(APPLICATION_NAME_ELECTRON) \
	| $(BUILD_DIRECTORY)
	./scripts/build/electron-create-appdir.sh \
		-n $(APPLICATION_NAME) \
		-d "$(APPLICATION_DESCRIPTION)" \
		-p $(dir $<) \
		-r $(TARGET_ARCH) \
		-b $(APPLICATION_NAME_ELECTRON) \
		-i assets/icon.png \
		-o $@

$(BUILD_DIRECTORY)/$(APPLICATION_NAME_LOWERCASE)-$(APPLICATION_VERSION)-$(TARGET_ARCH_APPIMAGE).AppImage: \
	 $(BUILD_DIRECTORY)/$(APPLICATION_NAME_LOWERCASE)-$(APPLICATION_VERSION)-$(PLATFORM).AppDir \
	 | $(BUILD_DIRECTORY) $(BUILD_TEMPORARY_DIRECTORY)
	./scripts/build/electron-create-appimage-linux.sh \
		-d $< \
		-r $(TARGET_ARCH) \
		-w $(BUILD_TEMPORARY_DIRECTORY) \
		-o $@

$(BUILD_DIRECTORY)/$(APPLICATION_NAME_LOWERCASE)-$(APPLICATION_VERSION)-$(PLATFORM)-$(TARGET_ARCH_APPIMAGE).zip: \
	$(BUILD_DIRECTORY)/$(APPLICATION_NAME_LOWERCASE)-$(APPLICATION_VERSION)-$(TARGET_ARCH_APPIMAGE).AppImage \
	| $(BUILD_DIRECTORY)
	./scripts/build/zip-file.sh -f $< -s $(PLATFORM) -o $@

$(BUILD_DIRECTORY)/$(APPLICATION_NAME)-Portable-$(APPLICATION_VERSION)-$(TARGET_ARCH).exe: build/js/gui.js \
	| $(BUILD_DIRECTORY)
	TARGET_ARCH=$(TARGET_ARCH) build --win portable $(ELECTRON_BUILDER_OPTIONS) \
		--extraMetadata.version=$(APPLICATION_VERSION) \
		--extraMetadata.packageType=portable

$(BUILD_DIRECTORY)/$(APPLICATION_NAME)-Setup-$(APPLICATION_VERSION)-$(TARGET_ARCH).exe: build/js/gui.js \
	| $(BUILD_DIRECTORY)
	TARGET_ARCH=$(TARGET_ARCH) build --win nsis $(ELECTRON_BUILDER_OPTIONS) \
		--extraMetadata.version=$(APPLICATION_VERSION) \
		--extraMetadata.packageType=nsis

# ---------------------------------------------------------------------
# Phony targets
# ---------------------------------------------------------------------

TARGETS = \
	help \
	info \
	lint \
	lint-js \
	lint-sass \
	lint-cpp \
	lint-html \
	lint-spell \
	test-spectron \
	test-gui \
	test-sdk \
	test-cli \
	test \
	sanity-checks \
	clean \
	distclean \
	changelog \
	webpack \
	package-electron \
	package-cli \
	cli-develop \
	installers-all \
	publish-all \
	electron-develop

changelog:
	versionist

webpack: build/js/gui.js

package-electron:
	TARGET_ARCH=$(TARGET_ARCH) build --dir $(ELECTRON_BUILDER_OPTIONS)

package-cli: $(BUILD_DIRECTORY)/$(APPLICATION_NAME)-cli-$(APPLICATION_VERSION)-$(PLATFORM)-$(TARGET_ARCH)

ifeq ($(PLATFORM),darwin)
electron-installer-app-zip: $(BUILD_DIRECTORY)/$(APPLICATION_NAME)-$(APPLICATION_VERSION)-mac.zip
electron-installer-dmg: $(BUILD_DIRECTORY)/$(APPLICATION_NAME)-$(APPLICATION_VERSION).dmg
cli-installer-tar-gz: $(BUILD_DIRECTORY)/$(APPLICATION_NAME)-cli-$(APPLICATION_VERSION)-$(PLATFORM)-$(TARGET_ARCH).tar.gz
TARGETS += \
	electron-installer-dmg \
	electron-installer-app-zip \
	cli-installer-tar-gz
PUBLISH_AWS_S3 += \
	$(BUILD_DIRECTORY)/$(APPLICATION_NAME)-$(APPLICATION_VERSION)-mac.zip \
	$(BUILD_DIRECTORY)/$(APPLICATION_NAME)-$(APPLICATION_VERSION).dmg \
	$(BUILD_DIRECTORY)/$(APPLICATION_NAME)-cli-$(APPLICATION_VERSION)-$(PLATFORM)-$(TARGET_ARCH).tar.gz
endif

ifeq ($(PLATFORM),linux)
electron-installer-appimage: $(BUILD_DIRECTORY)/$(APPLICATION_NAME_LOWERCASE)-$(APPLICATION_VERSION)-$(PLATFORM)-$(TARGET_ARCH_APPIMAGE).zip
electron-installer-debian: $(BUILD_DIRECTORY)/$(APPLICATION_NAME_ELECTRON)_$(APPLICATION_VERSION_DEBIAN)_$(TARGET_ARCH_DEBIAN).deb
electron-installer-redhat: $(BUILD_DIRECTORY)/$(APPLICATION_NAME_ELECTRON)-$(APPLICATION_VERSION_REDHAT).$(TARGET_ARCH_REDHAT).rpm
cli-installer-tar-gz: $(BUILD_DIRECTORY)/$(APPLICATION_NAME)-cli-$(APPLICATION_VERSION)-$(PLATFORM)-$(TARGET_ARCH).tar.gz
TARGETS +=  \
	electron-installer-appimage \
	electron-installer-debian \
	electron-installer-redhat \
	cli-installer-tar-gz
PUBLISH_AWS_S3 += \
	$(BUILD_DIRECTORY)/$(APPLICATION_NAME_LOWERCASE)-$(APPLICATION_VERSION)-$(PLATFORM)-$(TARGET_ARCH_APPIMAGE).zip \
	$(BUILD_DIRECTORY)/$(APPLICATION_NAME)-cli-$(APPLICATION_VERSION)-$(PLATFORM)-$(TARGET_ARCH).tar.gz
PUBLISH_BINTRAY_DEBIAN += \
		$(BUILD_DIRECTORY)/$(APPLICATION_NAME_ELECTRON)_$(APPLICATION_VERSION_DEBIAN)_$(TARGET_ARCH_DEBIAN).deb
PUBLISH_BINTRAY_REDHAT += \
		$(BUILD_DIRECTORY)/$(APPLICATION_NAME_ELECTRON)-$(APPLICATION_VERSION_REDHAT).$(TARGET_ARCH_REDHAT).rpm
endif

ifeq ($(PLATFORM),win32)
electron-installer-portable: $(BUILD_DIRECTORY)/$(APPLICATION_NAME)-Portable-$(APPLICATION_VERSION)-$(TARGET_ARCH).exe
electron-installer-nsis: $(BUILD_DIRECTORY)/$(APPLICATION_NAME)-Setup-$(APPLICATION_VERSION)-$(TARGET_ARCH).exe
cli-installer-zip: $(BUILD_DIRECTORY)/$(APPLICATION_NAME)-cli-$(APPLICATION_VERSION)-$(PLATFORM)-$(TARGET_ARCH).zip
TARGETS += \
	electron-installer-portable \
	electron-installer-nsis \
	cli-installer-zip
PUBLISH_AWS_S3 += \
	$(BUILD_DIRECTORY)/$(APPLICATION_NAME)-Portable-$(APPLICATION_VERSION)-$(TARGET_ARCH).exe \
	$(BUILD_DIRECTORY)/$(APPLICATION_NAME)-Setup-$(APPLICATION_VERSION)-$(TARGET_ARCH).exe \
	$(BUILD_DIRECTORY)/$(APPLICATION_NAME)-cli-$(APPLICATION_VERSION)-$(PLATFORM)-$(TARGET_ARCH).zip
endif

installers-all: $(PUBLISH_AWS_S3) $(PUBLISH_BINTRAY_DEBIAN) $(PUBLISH_BINTRAY_REDHAT)

ifdef PUBLISH_AWS_S3
publish-aws-s3: $(PUBLISH_AWS_S3)
ifeq ($(RELEASE_TYPE),production)
	$(foreach publishable,$^,$(call execute-command,./scripts/publish/aws-s3.sh \
		-f $(publishable) \
		-b $(S3_BUCKET) \
		-v $(APPLICATION_VERSION) \
		-p $(APPLICATION_NAME_LOWERCASE)))
endif
ifeq ($(RELEASE_TYPE),snapshot)
	$(foreach publishable,$^,$(call execute-command,./scripts/publish/aws-s3.sh \
		-f $(publishable) \
		-b $(S3_BUCKET) \
		-v $(APPLICATION_VERSION) \
		-p $(APPLICATION_NAME_LOWERCASE) \
		-k $(shell date +"%Y-%m-%d")))
endif

PUBLISHABLES += publish-aws-s3
TARGETS += publish-aws-s3
endif

ifdef PUBLISH_BINTRAY_DEBIAN
publish-bintray-debian: $(PUBLISH_BINTRAY_DEBIAN)
	$(foreach publishable,$^,$(call execute-command,./scripts/publish/bintray.sh \
		-f $(publishable) \
		-v $(APPLICATION_VERSION_DEBIAN) \
		-r $(TARGET_ARCH) \
		-t $(RELEASE_TYPE) \
		-o $(BINTRAY_ORGANIZATION) \
		-p $(BINTRAY_REPOSITORY_DEBIAN) \
		-c $(BINTRAY_COMPONENT) \
		-y debian))

PUBLISHABLES += publish-bintray-debian
TARGETS += publish-bintray-debian
endif

ifdef PUBLISH_BINTRAY_REDHAT
publish-bintray-redhat: $(PUBLISH_BINTRAY_REDHAT)
	$(foreach publishable,$^,$(call execute-command,./scripts/publish/bintray.sh \
		-f $(publishable) \
		-v $(APPLICATION_VERSION_REDHAT) \
		-r $(TARGET_ARCH) \
		-t $(RELEASE_TYPE) \
		-o $(BINTRAY_ORGANIZATION) \
		-p $(BINTRAY_REPOSITORY_REDHAT) \
		-c $(BINTRAY_COMPONENT) \
		-y redhat))

PUBLISHABLES += publish-bintray-redhat
TARGETS += publish-bintray-redhat
endif

publish-all: $(PUBLISHABLES)

.PHONY: $(TARGETS)

cli-develop:
	./scripts/build/dependencies-npm.sh \
		-r "$(TARGET_ARCH)" \
		-v "$(NODE_VERSION)" \
		-t node \
		-s "$(PLATFORM)"

electron-develop:
	./scripts/build/dependencies-npm.sh \
		-r "$(TARGET_ARCH)" \
		-v "$(ELECTRON_VERSION)" \
		-t electron \
		-s "$(PLATFORM)"

sass:
	node-sass lib/gui/app/scss/main.scss > lib/gui/css/main.css

lint-js:
	eslint lib tests scripts bin versionist.conf.js webpack.config.js

lint-sass:
	sass-lint lib/gui/scss

lint-cpp:
	cpplint --recursive src

lint-html:
	node scripts/html-lint.js

lint-spell:
	codespell \
		--dictionary - \
		--dictionary dictionary.txt \
		--skip *.gz,*.bz2,*.xz,*.zip,*.img,*.dmg,*.iso,*.rpi-sdcard,.DS_Store,*.dtb,*.dtbo,*.dat,*.elf,*.bin,*.foo,xz-without-extension \
		lib tests docs scripts Makefile *.md LICENSE

lint: lint-js lint-sass lint-cpp lint-html lint-spell

MOCHA_OPTIONS=--recursive --reporter spec

test-spectron:
	ETCHER_SPECTRON_ENTRYPOINT="$(ETCHER_SPECTRON_ENTRYPOINT)" mocha $(MOCHA_OPTIONS) tests/spectron

test-gui:
	electron-mocha $(MOCHA_OPTIONS) --renderer tests/gui

test-sdk:
	electron-mocha $(MOCHA_OPTIONS) \
		tests/shared \
		tests/image-stream

test-cli:
	mocha $(MOCHA_OPTIONS) \
		tests/shared \
		tests/image-stream

test: test-gui test-sdk test-spectron

help:
	@echo "Available targets: $(TARGETS)"

info:
	@echo "Application version : $(APPLICATION_VERSION)"
	@echo "Release type        : $(RELEASE_TYPE)"
	@echo "Platform            : $(PLATFORM)"
	@echo "Host arch           : $(HOST_ARCH)"
	@echo "Target arch         : $(TARGET_ARCH)"

sanity-checks:
	./scripts/ci/ensure-all-node-requirements-available.sh
	./scripts/ci/ensure-staged-sass.sh
	./scripts/ci/ensure-staged-shrinkwrap.sh
	./scripts/ci/ensure-npm-dependencies-compatibility.sh
	./scripts/ci/ensure-npm-valid-dependencies.sh
	./scripts/ci/ensure-npm-shrinkwrap-versions.sh
	./scripts/ci/ensure-all-file-extensions-in-gitattributes.sh
	./scripts/ci/ensure-all-text-files-only-ascii.sh

clean:
	rm -rf $(BUILD_DIRECTORY)

distclean: clean
	rm -rf node_modules
	rm -rf build

.DEFAULT_GOAL = help
