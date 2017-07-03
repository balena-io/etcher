# ---------------------------------------------------------------------
# Build configuration
# ---------------------------------------------------------------------

NPX = ./node_modules/.bin/npx

# This directory will be completely deleted by the `clean` rule
BUILD_DIRECTORY ?= dist

# See http://stackoverflow.com/a/20763842/1641422
BUILD_DIRECTORY_PARENT = $(dir $(BUILD_DIRECTORY))
ifeq ($(wildcard $(BUILD_DIRECTORY_PARENT).),)
$(error $(BUILD_DIRECTORY_PARENT) does not exist)
endif

BUILD_TEMPORARY_DIRECTORY = $(BUILD_DIRECTORY)/.tmp
BUILD_OUTPUT_DIRECTORY = $(BUILD_DIRECTORY)/out

# ---------------------------------------------------------------------
# Application configuration
# ---------------------------------------------------------------------

ELECTRON_VERSION = $(shell jq -r '.devDependencies["electron"]' package.json)
NODE_VERSION = 6.1.0
COMPANY_NAME = Resinio Ltd
APPLICATION_NAME = $(shell jq -r '.displayName' package.json)
APPLICATION_DESCRIPTION = $(shell jq -r '.description' package.json)
APPLICATION_COPYRIGHT = $(shell cat electron-builder.yml | shyaml get-value copyright)

# ---------------------------------------------------------------------
# Release type
# ---------------------------------------------------------------------

# Add the current commit to the version if release type is "snapshot"
RELEASE_TYPE ?= snapshot
PACKAGE_JSON_VERSION = $(shell jq -r '.version' package.json)
ifeq ($(RELEASE_TYPE),production)
APPLICATION_VERSION = $(PACKAGE_JSON_VERSION)
S3_BUCKET = resin-production-downloads
endif
ifeq ($(RELEASE_TYPE),snapshot)
CURRENT_COMMIT_HASH = $(shell git log -1 --format="%h")
APPLICATION_VERSION = $(PACKAGE_JSON_VERSION)+$(CURRENT_COMMIT_HASH)
S3_BUCKET = resin-nightly-downloads
endif
ifndef APPLICATION_VERSION
$(error Invalid release type: $(RELEASE_TYPE))
endif

# ---------------------------------------------------------------------
# Operating system and architecture detection
# ---------------------------------------------------------------------

# http://stackoverflow.com/a/12099167
ifeq ($(OS),Windows_NT)
	HOST_PLATFORM = win32

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
		HOST_PLATFORM = linux

		ifeq ($(shell uname -m),x86_64)
			HOST_ARCH = x64
		endif
		ifneq ($(filter %86,$(shell uname -m)),)
			HOST_ARCH = x86
		endif
		ifeq ($(shell uname -m),armv7l)
			HOST_ARCH = armv7l
		endif
	endif
	ifeq ($(shell uname -s),Darwin)
		HOST_PLATFORM = darwin

		ifeq ($(shell uname -m),x86_64)
			HOST_ARCH = x64
		endif
	endif
endif

ifndef HOST_PLATFORM
$(error We couldn't detect your host platform)
endif
ifndef HOST_ARCH
$(error We couldn't detect your host architecture)
endif

TARGET_PLATFORM = $(HOST_PLATFORM)

ifneq ($(TARGET_PLATFORM),$(HOST_PLATFORM))
$(error We don't support cross-platform builds yet)
endif

# Default to host architecture. You can override by doing:
#
#   make <target> TARGET_ARCH=<arch>
#
TARGET_ARCH ?= $(HOST_ARCH)

# Support x86 builds from x64 in GNU/Linux
# See https://github.com/addaleax/lzma-native/issues/27
ifeq ($(TARGET_PLATFORM),linux)
	ifneq ($(HOST_ARCH),$(TARGET_ARCH))
		ifeq ($(TARGET_ARCH),x86)
			export CFLAGS += -m32
		else
$(error Can't build $(TARGET_ARCH) binaries on a $(HOST_ARCH) host)
		endif
	endif
endif

# ---------------------------------------------------------------------
# Code signing
# ---------------------------------------------------------------------

ifeq ($(TARGET_PLATFORM),darwin)
ifndef CSC_NAME
$(warning No code-sign identity found (CSC_NAME is not set))
endif
endif

ifeq ($(TARGET_PLATFORM),win32)
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

ELECTRON_BUILDER_OPTIONS = --$(TARGET_ARCH_ELECTRON_BUILDER) --extraMetadata.version=$(APPLICATION_VERSION)

# ---------------------------------------------------------------------
# Updates
# ---------------------------------------------------------------------

DISABLE_UPDATES_ELECTRON_BUILDER_OPTIONS = --extraMetadata.analytics.updates.enabled=false

ifdef DISABLE_UPDATES
$(warning Update notification dialog has been disabled (DISABLE_UPDATES is set))
ELECTRON_BUILDER_OPTIONS += $(DISABLE_UPDATES_ELECTRON_BUILDER_OPTIONS)
endif

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
# Extra variables
# ---------------------------------------------------------------------

TARGET_ARCH_DEBIAN = $(shell ./scripts/build/architecture-convert.sh -r $(TARGET_ARCH) -t debian)
TARGET_ARCH_REDHAT = $(shell ./scripts/build/architecture-convert.sh -r $(TARGET_ARCH) -t redhat)
TARGET_ARCH_APPIMAGE = $(shell ./scripts/build/architecture-convert.sh -r $(TARGET_ARCH) -t appimage)
TARGET_ARCH_ELECTRON_BUILDER = $(shell ./scripts/build/architecture-convert.sh -r $(TARGET_ARCH) -t electron-builder)

PRODUCT_NAME = etcher
APPLICATION_NAME_LOWERCASE = $(shell echo $(APPLICATION_NAME) | tr A-Z a-z)
APPLICATION_VERSION_DEBIAN = $(shell echo $(APPLICATION_VERSION) | tr "-" "~")
APPLICATION_VERSION_REDHAT = $(shell echo $(APPLICATION_VERSION) | tr "-" "~")

# Fix hard link Appveyor issues
CPRF = cp -RLf

# ---------------------------------------------------------------------
# Rules
# ---------------------------------------------------------------------

# See http://stackoverflow.com/a/12528721
# Note that the blank line before 'endef' is actually important - don't delete it
define execute-command
	$(1)

endef

CHANGELOG.md:
	$(NPX) versionist

$(BUILD_DIRECTORY):
	mkdir $@

$(BUILD_TEMPORARY_DIRECTORY): | $(BUILD_DIRECTORY)
	mkdir $@

$(BUILD_OUTPUT_DIRECTORY): | $(BUILD_DIRECTORY)
	mkdir $@

# ---------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------

$(BUILD_DIRECTORY)/node-$(TARGET_PLATFORM)-$(TARGET_ARCH)-dependencies: package.json npm-shrinkwrap.json \
	| $(BUILD_DIRECTORY)
	mkdir $@
	./scripts/build/dependencies-npm.sh -p \
		-r "$(TARGET_ARCH)" \
		-v "$(NODE_VERSION)" \
		-x $@ \
		-t node \
		-s "$(TARGET_PLATFORM)"
	git apply --directory $@/node_modules/lzma-native patches/cli/lzma-native-index-static-addon-require.patch

$(BUILD_DIRECTORY)/$(APPLICATION_NAME)-cli-$(APPLICATION_VERSION)-$(TARGET_PLATFORM)-$(TARGET_ARCH)-app: \
	package.json lib \
	$(BUILD_DIRECTORY)/node-$(TARGET_PLATFORM)-$(TARGET_ARCH)-dependencies \
	| $(BUILD_DIRECTORY)
	mkdir $@
	cp $(word 1,$^) $@
	$(CPRF) $(word 2,$^) $@
	$(CPRF) $(word 3,$^)/* $@

$(BUILD_DIRECTORY)/$(APPLICATION_NAME)-cli-$(APPLICATION_VERSION)-$(TARGET_PLATFORM)-$(TARGET_ARCH).js: \
	$(BUILD_DIRECTORY)/$(APPLICATION_NAME)-cli-$(APPLICATION_VERSION)-$(TARGET_PLATFORM)-$(TARGET_ARCH)-app \
	| $(BUILD_DIRECTORY)
	./scripts/build/concatenate-javascript.sh -e lib/cli/etcher.js -b $< -o $@ -m

$(BUILD_DIRECTORY)/$(APPLICATION_NAME)-cli-$(APPLICATION_VERSION)-$(TARGET_PLATFORM)-$(TARGET_ARCH): \
	$(BUILD_DIRECTORY)/node-$(TARGET_PLATFORM)-$(TARGET_ARCH)-dependencies \
	$(BUILD_DIRECTORY)/$(APPLICATION_NAME)-cli-$(APPLICATION_VERSION)-$(TARGET_PLATFORM)-$(TARGET_ARCH).js \
	| $(BUILD_DIRECTORY) $(BUILD_TEMPORARY_DIRECTORY)
	mkdir $@
	./scripts/build/node-package-cli.sh -o $@ -l $</node_modules \
		-n $(APPLICATION_NAME) \
		-e $(word 2,$^) \
		-r $(TARGET_ARCH) \
		-s $(TARGET_PLATFORM)

ifeq ($(TARGET_PLATFORM),win32)
	./scripts/build/electron-brand-exe.sh \
		-f $@/etcher.exe \
		-n $(APPLICATION_NAME) \
		-d "$(APPLICATION_DESCRIPTION)" \
		-v "$(APPLICATION_VERSION)" \
		-c "$(APPLICATION_COPYRIGHT)" \
		-m "$(COMPANY_NAME)" \
		-i assets/icon.ico \
		-w $(BUILD_TEMPORARY_DIRECTORY)
endif

ifeq ($(TARGET_PLATFORM),darwin)
ifdef CSC_NAME
	./scripts/build/electron-sign-file-darwin.sh -f $@/etcher -i "$(CSC_NAME)"
endif
endif

ifeq ($(TARGET_PLATFORM),win32)
ifdef CSC_LINK
ifdef CSC_KEY_PASSWORD
	./scripts/build/electron-sign-exe-win32.sh -f $@/etcher.exe \
		-d "$(APPLICATION_NAME) - $(APPLICATION_VERSION)" \
		-c $(CSC_LINK) \
		-p $(CSC_KEY_PASSWORD)
endif
endif
endif

$(BUILD_OUTPUT_DIRECTORY)/$(APPLICATION_NAME)-cli-$(APPLICATION_VERSION)-$(TARGET_PLATFORM)-$(TARGET_ARCH).zip: \
	$(BUILD_DIRECTORY)/$(APPLICATION_NAME)-cli-$(APPLICATION_VERSION)-$(TARGET_PLATFORM)-$(TARGET_ARCH) \
	| $(BUILD_OUTPUT_DIRECTORY)
	./scripts/build/zip-file.sh -f $< -s $(TARGET_PLATFORM) -o $@

$(BUILD_OUTPUT_DIRECTORY)/$(APPLICATION_NAME)-cli-$(APPLICATION_VERSION)-$(TARGET_PLATFORM)-$(TARGET_ARCH).tar.gz: \
	$(BUILD_DIRECTORY)/$(APPLICATION_NAME)-cli-$(APPLICATION_VERSION)-$(TARGET_PLATFORM)-$(TARGET_ARCH) \
	| $(BUILD_OUTPUT_DIRECTORY)
	./scripts/build/tar-gz-file.sh -f $< -o $@

# ---------------------------------------------------------------------
# GUI
# ---------------------------------------------------------------------

assets/osx/installer.tiff: assets/osx/installer.png assets/osx/installer@2x.png
	tiffutil -cathidpicheck $^ -out $@

$(BUILD_DIRECTORY)/$(APPLICATION_NAME)-$(APPLICATION_VERSION)-darwin-$(TARGET_ARCH).dmg: assets/osx/installer.tiff \
	| $(BUILD_DIRECTORY)
	TARGET_ARCH=$(TARGET_ARCH) $(NPX) build --mac dmg $(ELECTRON_BUILDER_OPTIONS)

$(BUILD_DIRECTORY)/$(APPLICATION_NAME)-$(APPLICATION_VERSION)-darwin-$(TARGET_ARCH).zip: assets/osx/installer.tiff \
	| $(BUILD_DIRECTORY)
	TARGET_ARCH=$(TARGET_ARCH) $(NPX) build --mac zip $(ELECTRON_BUILDER_OPTIONS)

APPLICATION_NAME_ELECTRON = $(APPLICATION_NAME_LOWERCASE)-electron

$(BUILD_DIRECTORY)/$(APPLICATION_NAME_ELECTRON)-$(APPLICATION_VERSION_REDHAT).$(TARGET_ARCH_REDHAT).rpm: \
	| $(BUILD_DIRECTORY)
	$(NPX) build --linux rpm $(ELECTRON_BUILDER_OPTIONS) \
		--extraMetadata.name=$(APPLICATION_NAME_ELECTRON) \
		--extraMetadata.version=$(APPLICATION_VERSION_REDHAT) \
		$(DISABLE_UPDATES_ELECTRON_BUILDER_OPTIONS)

$(BUILD_DIRECTORY)/$(APPLICATION_NAME_ELECTRON)_$(APPLICATION_VERSION_DEBIAN)_$(TARGET_ARCH_DEBIAN).deb: \
	| $(BUILD_DIRECTORY)
	$(NPX) build --linux deb $(ELECTRON_BUILDER_OPTIONS) \
		--extraMetadata.name=$(APPLICATION_NAME_ELECTRON) \
		--extraMetadata.version=$(APPLICATION_VERSION_DEBIAN) \
		$(DISABLE_UPDATES_ELECTRON_BUILDER_OPTIONS)

$(BUILD_DIRECTORY)/$(APPLICATION_NAME_LOWERCASE)-$(APPLICATION_VERSION)-$(TARGET_ARCH_APPIMAGE).AppImage: \
	| $(BUILD_DIRECTORY)
	$(NPX) build --linux AppImage $(ELECTRON_BUILDER_OPTIONS)

$(BUILD_DIRECTORY)/$(APPLICATION_NAME_LOWERCASE)-$(APPLICATION_VERSION)-linux-$(TARGET_ARCH).zip: \
	$(BUILD_DIRECTORY)/$(APPLICATION_NAME_LOWERCASE)-$(APPLICATION_VERSION)-$(TARGET_ARCH_APPIMAGE).AppImage \
	| $(BUILD_DIRECTORY)
	./scripts/build/zip-file.sh -f $< -s $(TARGET_PLATFORM) -o $@

$(BUILD_DIRECTORY)/$(APPLICATION_NAME)-$(APPLICATION_VERSION)-win32-$(TARGET_ARCH)-portable.exe: \
	| $(BUILD_DIRECTORY)
	TARGET_ARCH=$(TARGET_ARCH) $(NPX) build --win portable $(ELECTRON_BUILDER_OPTIONS)

$(BUILD_DIRECTORY)/$(APPLICATION_NAME)-$(APPLICATION_VERSION)-win32-$(TARGET_ARCH).exe: \
	| $(BUILD_DIRECTORY)
	TARGET_ARCH=$(TARGET_ARCH) $(NPX) build --win nsis $(ELECTRON_BUILDER_OPTIONS)

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
	test-gui \
	test-sdk \
	test \
	sanity-checks \
	clean \
	distclean \
	package-electron \
	package-cli \
	cli-develop \
	installers-all \
	electron-develop

package-electron:
	TARGET_ARCH=$(TARGET_ARCH) $(NPX) build --dir $(ELECTRON_BUILDER_OPTIONS)

package-cli: $(BUILD_DIRECTORY)/$(APPLICATION_NAME)-cli-$(APPLICATION_VERSION)-$(TARGET_PLATFORM)-$(TARGET_ARCH)

ifeq ($(TARGET_PLATFORM),darwin)
electron-installer-app-zip: $(BUILD_DIRECTORY)/$(APPLICATION_NAME)-$(APPLICATION_VERSION)-$(TARGET_PLATFORM)-$(TARGET_ARCH).zip
electron-installer-dmg: $(BUILD_DIRECTORY)/$(APPLICATION_NAME)-$(APPLICATION_VERSION)-$(TARGET_PLATFORM)-$(TARGET_ARCH).dmg
cli-installer-tar-gz: $(BUILD_OUTPUT_DIRECTORY)/$(APPLICATION_NAME)-cli-$(APPLICATION_VERSION)-$(TARGET_PLATFORM)-$(TARGET_ARCH).tar.gz
TARGETS += \
	electron-installer-dmg \
	electron-installer-app-zip \
	cli-installer-tar-gz
PUBLISH_AWS_S3 += \
	$(BUILD_DIRECTORY)/$(APPLICATION_NAME)-$(APPLICATION_VERSION)-$(TARGET_PLATFORM)-$(TARGET_ARCH).zip \
	$(BUILD_DIRECTORY)/$(APPLICATION_NAME)-$(APPLICATION_VERSION)-$(TARGET_PLATFORM)-$(TARGET_ARCH).dmg \
	$(BUILD_OUTPUT_DIRECTORY)/$(APPLICATION_NAME)-cli-$(APPLICATION_VERSION)-$(TARGET_PLATFORM)-$(TARGET_ARCH).tar.gz
endif

ifeq ($(TARGET_PLATFORM),linux)
electron-installer-appimage: $(BUILD_DIRECTORY)/$(APPLICATION_NAME_LOWERCASE)-$(APPLICATION_VERSION)-$(TARGET_PLATFORM)-$(TARGET_ARCH).zip
electron-installer-debian: $(BUILD_DIRECTORY)/$(APPLICATION_NAME_ELECTRON)_$(APPLICATION_VERSION_DEBIAN)_$(TARGET_ARCH_DEBIAN).deb
electron-installer-redhat: $(BUILD_DIRECTORY)/$(APPLICATION_NAME_ELECTRON)-$(APPLICATION_VERSION_REDHAT).$(TARGET_ARCH_REDHAT).rpm
cli-installer-tar-gz: $(BUILD_OUTPUT_DIRECTORY)/$(APPLICATION_NAME)-cli-$(APPLICATION_VERSION)-$(TARGET_PLATFORM)-$(TARGET_ARCH).tar.gz
TARGETS +=  \
	electron-installer-appimage \
	electron-installer-debian \
	electron-installer-redhat \
	cli-installer-tar-gz
PUBLISH_AWS_S3 += \
	$(BUILD_DIRECTORY)/$(APPLICATION_NAME_LOWERCASE)-$(APPLICATION_VERSION)-$(TARGET_PLATFORM)-$(TARGET_ARCH).zip \
	$(BUILD_OUTPUT_DIRECTORY)/$(APPLICATION_NAME)-cli-$(APPLICATION_VERSION)-$(TARGET_PLATFORM)-$(TARGET_ARCH).tar.gz
PUBLISH_BINTRAY_DEBIAN += \
		$(BUILD_DIRECTORY)/$(APPLICATION_NAME_ELECTRON)_$(APPLICATION_VERSION_DEBIAN)_$(TARGET_ARCH_DEBIAN).deb
PUBLISH_BINTRAY_REDHAT += \
		$(BUILD_DIRECTORY)/$(APPLICATION_NAME_ELECTRON)-$(APPLICATION_VERSION_REDHAT).$(TARGET_ARCH_REDHAT).rpm
endif

ifeq ($(TARGET_PLATFORM),win32)
electron-installer-portable: $(BUILD_DIRECTORY)/$(APPLICATION_NAME)-$(APPLICATION_VERSION)-$(TARGET_PLATFORM)-$(TARGET_ARCH)-portable.exe
electron-installer-nsis: $(BUILD_DIRECTORY)/$(APPLICATION_NAME)-$(APPLICATION_VERSION)-$(TARGET_PLATFORM)-$(TARGET_ARCH).exe
cli-installer-zip: $(BUILD_OUTPUT_DIRECTORY)/$(APPLICATION_NAME)-cli-$(APPLICATION_VERSION)-$(TARGET_PLATFORM)-$(TARGET_ARCH).zip
TARGETS += \
	electron-installer-portable \
	electron-installer-nsis \
	cli-installer-zip
PUBLISH_AWS_S3 += \
	$(BUILD_DIRECTORY)/$(APPLICATION_NAME)-$(APPLICATION_VERSION)-$(TARGET_PLATFORM)-$(TARGET_ARCH)-portable.exe \
	$(BUILD_DIRECTORY)/$(APPLICATION_NAME)-$(APPLICATION_VERSION)-$(TARGET_PLATFORM)-$(TARGET_ARCH).exe \
	$(BUILD_OUTPUT_DIRECTORY)/$(APPLICATION_NAME)-cli-$(APPLICATION_VERSION)-$(TARGET_PLATFORM)-$(TARGET_ARCH).zip
endif

installers-all: $(PUBLISH_AWS_S3) $(PUBLISH_BINTRAY_DEBIAN) $(PUBLISH_BINTRAY_REDHAT)

ifdef PUBLISH_AWS_S3
publish-aws-s3: $(PUBLISH_AWS_S3)
ifeq ($(RELEASE_TYPE),production)
	$(foreach publishable,$^,$(call execute-command,./scripts/publish/aws-s3.sh \
		-f $(publishable) \
		-b $(S3_BUCKET) \
		-v $(APPLICATION_VERSION) \
		-p $(PRODUCT_NAME)))
endif
ifeq ($(RELEASE_TYPE),snapshot)
	$(foreach publishable,$^,$(call execute-command,./scripts/publish/aws-s3.sh \
		-f $(publishable) \
		-b $(S3_BUCKET) \
		-v $(APPLICATION_VERSION) \
		-p $(PRODUCT_NAME) \
		-k $(shell date +"%Y-%m-%d")))
endif

TARGETS += publish-aws-s3
endif

ifdef PUBLISH_BINTRAY_DEBIAN
publish-bintray-debian: $(PUBLISH_BINTRAY_DEBIAN)
	$(foreach publishable,$^,$(call execute-command,./scripts/publish/bintray-debian.sh \
		-f $(publishable) \
		-v $(APPLICATION_VERSION_DEBIAN) \
		-r $(TARGET_ARCH) \
		-c $(APPLICATION_NAME_LOWERCASE) \
		-t $(RELEASE_TYPE)))

TARGETS += publish-bintray-debian
endif

ifdef PUBLISH_BINTRAY_REDHAT
publish-bintray-redhat: $(PUBLISH_BINTRAY_REDHAT)
# TODO: Update this after we've created ./scripts/publish/bintray-redhat.sh

TARGETS += publish-bintray-redhat
endif

.PHONY: $(TARGETS)

cli-develop:
	./scripts/build/dependencies-npm.sh \
		-r "$(TARGET_ARCH)" \
		-v "$(NODE_VERSION)" \
		-t node \
		-s "$(TARGET_PLATFORM)"

electron-develop:
	./scripts/build/dependencies-npm.sh \
		-r "$(TARGET_ARCH)" \
		-v "$(ELECTRON_VERSION)" \
		-t electron \
		-s "$(TARGET_PLATFORM)"

sass:
	$(NPX) node-sass lib/gui/scss/main.scss > lib/gui/css/main.css

lint-js:
	$(NPX) eslint lib tests scripts bin versionist.conf.js

lint-sass:
	$(NPX) sass-lint lib/gui/scss

lint-cpp:
	cpplint --recursive src

lint-html:
	node scripts/html-lint.js

lint-spell:
	codespell.py \
		--skip *.gz,*.bz2,*.xz,*.zip,*.img,*.dmg,*.iso,*.rpi-sdcard,.DS_Store \
		lib tests docs scripts Makefile *.md LICENSE

lint: lint-js lint-sass lint-cpp lint-html lint-spell

ELECTRON_MOCHA_OPTIONS=--recursive --reporter spec

test-gui:
	$(NPX) electron-mocha $(ELECTRON_MOCHA_OPTIONS) --renderer tests/gui

test-sdk:
	$(NPX) electron-mocha $(ELECTRON_MOCHA_OPTIONS) \
		tests/shared \
		tests/child-writer \
		tests/image-stream

test: test-gui test-sdk

help:
	@echo "Available targets: $(TARGETS)"

info:
	@echo "Application version : $(APPLICATION_VERSION)"
	@echo "Release type        : $(RELEASE_TYPE)"
	@echo "Host platform       : $(HOST_PLATFORM)"
	@echo "Host arch           : $(HOST_ARCH)"
	@echo "Target platform     : $(TARGET_PLATFORM)"
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

.DEFAULT_GOAL = help
