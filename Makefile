# ---------------------------------------------------------------------
# Build configuration
# ---------------------------------------------------------------------

NODE_MODULES_BIN=./node_modules/.bin

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
APPLICATION_NAME = $(shell jq -r '.build.productName' package.json)
APPLICATION_DESCRIPTION = $(shell jq -r '.description' package.json)
APPLICATION_COPYRIGHT = $(shell jq -r '.build.copyright' package.json)
APPLICATION_CATEGORY = $(shell jq -r '.build.mac.category' package.json)
APPLICATION_BUNDLE_ID = $(shell jq -r '.build.appId' package.json)
APPLICATION_FILES = lib,assets

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
ifndef CODE_SIGN_IDENTITY
$(warning No code-sign identity found (CODE_SIGN_IDENTITY is not set))
endif
endif

ifeq ($(TARGET_PLATFORM),win32)
ifndef CODE_SIGN_CERTIFICATE
$(warning No code-sign certificate found (CODE_SIGN_CERTIFICATE is not set))
ifndef CODE_SIGN_CERTIFICATE_PASSWORD
$(warning No code-sign certificate password found (CODE_SIGN_CERTIFICATE_PASSWORD is not set))
endif
endif
endif

# ---------------------------------------------------------------------
# Analytics
# ---------------------------------------------------------------------

ifndef ANALYTICS_SENTRY_TOKEN
$(warning No Sentry token found (ANALYTICS_SENTRY_TOKEN is not set))
endif

ifndef ANALYTICS_MIXPANEL_TOKEN
$(warning No Mixpanel token found (ANALYTICS_MIXPANEL_TOKEN is not set))
endif

# ---------------------------------------------------------------------
# Extra variables
# ---------------------------------------------------------------------

TARGET_ARCH_DEBIAN = $(shell ./scripts/build/architecture-convert.sh -r $(TARGET_ARCH) -t debian)

PRODUCT_NAME = etcher
APPLICATION_NAME_LOWERCASE = $(shell echo $(APPLICATION_NAME) | tr A-Z a-z)
APPLICATION_VERSION_DEBIAN = $(shell echo $(APPLICATION_VERSION) | tr "-" "~")

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
	$(NODE_MODULES_BIN)/versionist

$(BUILD_DIRECTORY):
	mkdir $@

$(BUILD_TEMPORARY_DIRECTORY): | $(BUILD_DIRECTORY)
	mkdir $@

$(BUILD_OUTPUT_DIRECTORY): | $(BUILD_DIRECTORY)
	mkdir $@

$(BUILD_DIRECTORY)/electron-$(TARGET_PLATFORM)-$(TARGET_ARCH)-dependencies: package.json npm-shrinkwrap.json \
	| $(BUILD_DIRECTORY)
	mkdir $@
	./scripts/build/dependencies-npm.sh -p \
		-r "$(TARGET_ARCH)" \
		-v "$(ELECTRON_VERSION)" \
		-x $@ \
		-t electron \
		-s "$(TARGET_PLATFORM)"

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

$(BUILD_DIRECTORY)/electron-$(TARGET_PLATFORM)-$(APPLICATION_VERSION)-$(TARGET_ARCH)-app: \
	$(BUILD_DIRECTORY)/electron-$(TARGET_PLATFORM)-$(TARGET_ARCH)-dependencies \
	| $(BUILD_DIRECTORY) $(BUILD_TEMPORARY_DIRECTORY)
	./scripts/build/electron-create-resources-app.sh -s . -o $@ \
		-v $(APPLICATION_VERSION) \
		-f "$(APPLICATION_FILES)"
	$(CPRF) $</* $@

ifdef ANALYTICS_SENTRY_TOKEN
	./scripts/build/jq-insert.sh \
		-p "analytics.sentry.token" \
		-v "$(ANALYTICS_SENTRY_TOKEN)" \
		-f $@/package.json \
		-t $(BUILD_TEMPORARY_DIRECTORY)
endif

ifdef ANALYTICS_MIXPANEL_TOKEN
	./scripts/build/jq-insert.sh \
		-p "analytics.mixpanel.token" \
		-v "$(ANALYTICS_MIXPANEL_TOKEN)" \
		-f $@/package.json \
		-t $(BUILD_TEMPORARY_DIRECTORY)
endif

$(BUILD_DIRECTORY)/electron-$(TARGET_PLATFORM)-$(APPLICATION_VERSION)-$(TARGET_ARCH)-app.asar: \
	$(BUILD_DIRECTORY)/electron-$(TARGET_PLATFORM)-$(APPLICATION_VERSION)-$(TARGET_ARCH)-app \
	| $(BUILD_DIRECTORY)
	./scripts/build/electron-create-asar.sh -d $< -o $@

$(BUILD_DIRECTORY)/electron-$(ELECTRON_VERSION)-$(TARGET_PLATFORM)-$(TARGET_ARCH).zip: \
	| $(BUILD_DIRECTORY)
	./scripts/build/electron-download-package.sh \
		-r "$(TARGET_ARCH)" \
		-v "$(ELECTRON_VERSION)" \
		-s "$(TARGET_PLATFORM)" \
		-o $@

$(BUILD_DIRECTORY)/$(APPLICATION_NAME)-cli-$(TARGET_PLATFORM)-$(APPLICATION_VERSION)-$(TARGET_ARCH)-app: \
	package.json lib \
	$(BUILD_DIRECTORY)/node-$(TARGET_PLATFORM)-$(TARGET_ARCH)-dependencies \
	| $(BUILD_DIRECTORY)
	mkdir $@
	cp $(word 1,$^) $@
	$(CPRF) $(word 2,$^) $@
	$(CPRF) $(word 3,$^)/* $@

$(BUILD_DIRECTORY)/$(APPLICATION_NAME)-cli-$(TARGET_PLATFORM)-$(APPLICATION_VERSION)-$(TARGET_ARCH).js: \
	$(BUILD_DIRECTORY)/$(APPLICATION_NAME)-cli-$(TARGET_PLATFORM)-$(APPLICATION_VERSION)-$(TARGET_ARCH)-app \
	| $(BUILD_DIRECTORY)
	./scripts/build/concatenate-javascript.sh -e lib/cli/etcher.js -b $< -o $@ -m

$(BUILD_DIRECTORY)/$(APPLICATION_NAME)-cli-$(APPLICATION_VERSION)-$(TARGET_PLATFORM)-$(TARGET_ARCH): \
	$(BUILD_DIRECTORY)/node-$(TARGET_PLATFORM)-$(TARGET_ARCH)-dependencies \
	$(BUILD_DIRECTORY)/$(APPLICATION_NAME)-cli-$(TARGET_PLATFORM)-$(APPLICATION_VERSION)-$(TARGET_ARCH).js \
	| $(BUILD_DIRECTORY) $(BUILD_TEMPORARY_DIRECTORY)
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
ifdef CODE_SIGN_IDENTITY
	./scripts/build/electron-sign-file-darwin.sh -f $@/etcher -i "$(CODE_SIGN_IDENTITY)"
endif
endif

ifeq ($(TARGET_PLATFORM),win32)
ifdef CODE_SIGN_CERTIFICATE
ifdef CODE_SIGN_CERTIFICATE_PASSWORD
	./scripts/build/electron-sign-exe-win32.sh -f $@/etcher.exe \
		-d "$(APPLICATION_NAME) - $(APPLICATION_VERSION)" \
		-c $(CODE_SIGN_CERTIFICATE) \
		-p $(CODE_SIGN_CERTIFICATE_PASSWORD)
endif
endif
endif

$(BUILD_DIRECTORY)/$(APPLICATION_NAME)-$(APPLICATION_VERSION)-$(TARGET_PLATFORM)-$(TARGET_ARCH): \
	$(BUILD_DIRECTORY)/electron-$(TARGET_PLATFORM)-$(APPLICATION_VERSION)-$(TARGET_ARCH)-app.asar \
	$(BUILD_DIRECTORY)/electron-$(ELECTRON_VERSION)-$(TARGET_PLATFORM)-$(TARGET_ARCH).zip \
	| $(BUILD_DIRECTORY) $(BUILD_TEMPORARY_DIRECTORY)
ifeq ($(TARGET_PLATFORM),darwin)
	./scripts/build/electron-configure-package-darwin.sh -p $(word 2,$^) -a $< \
		-n "$(APPLICATION_NAME)" \
		-v "$(APPLICATION_VERSION)" \
		-b "$(APPLICATION_BUNDLE_ID)" \
		-c "$(APPLICATION_COPYRIGHT)" \
		-t "$(APPLICATION_CATEGORY)" \
		-i assets/icon.icns \
		-o $@
endif

ifeq ($(TARGET_PLATFORM),linux)
	./scripts/build/electron-configure-package-linux.sh -p $(word 2,$^) -a $< \
		-n "$(APPLICATION_NAME)" \
		-v "$(APPLICATION_VERSION)" \
		-l LICENSE \
		-o $@
endif

ifeq ($(TARGET_PLATFORM),win32)
	./scripts/build/electron-configure-package-win32.sh -p $(word 2,$^) -a $< \
		-n "$(APPLICATION_NAME)" \
		-d "$(APPLICATION_DESCRIPTION)" \
		-v "$(APPLICATION_VERSION)" \
		-l LICENSE \
		-c "$(APPLICATION_COPYRIGHT)" \
		-m "$(COMPANY_NAME)" \
		-i assets/icon.ico \
		-w $(BUILD_TEMPORARY_DIRECTORY) \
		-o $@
ifdef CODE_SIGN_CERTIFICATE
ifdef CODE_SIGN_CERTIFICATE_PASSWORD
	./scripts/build/electron-sign-exe-win32.sh -f $@/$(APPLICATION_NAME).exe \
		-d "$(APPLICATION_NAME) - $(APPLICATION_VERSION)" \
		-c $(CODE_SIGN_CERTIFICATE) \
		-p $(CODE_SIGN_CERTIFICATE_PASSWORD)
endif
endif
endif

$(BUILD_DIRECTORY)/$(APPLICATION_NAME)-$(APPLICATION_VERSION)-$(TARGET_PLATFORM)-$(TARGET_ARCH)-rw.dmg: \
	$(BUILD_DIRECTORY)/$(APPLICATION_NAME)-$(APPLICATION_VERSION)-darwin-$(TARGET_ARCH) \
	| $(BUILD_DIRECTORY)
	./scripts/build/electron-create-readwrite-dmg-darwin.sh -p $< -o $@ \
		-n "$(APPLICATION_NAME)" \
		-i assets/icon.icns \
		-b assets/osx/installer.png

$(BUILD_OUTPUT_DIRECTORY)/$(APPLICATION_NAME)-$(APPLICATION_VERSION)-darwin-$(TARGET_ARCH).zip: \
	$(BUILD_DIRECTORY)/$(APPLICATION_NAME)-$(APPLICATION_VERSION)-darwin-$(TARGET_ARCH) \
	| $(BUILD_OUTPUT_DIRECTORY)
ifdef CODE_SIGN_IDENTITY
	./scripts/build/electron-sign-app-darwin.sh -a $</$(APPLICATION_NAME).app -i "$(CODE_SIGN_IDENTITY)"
endif
	./scripts/build/zip-file.sh -f $</$(APPLICATION_NAME).app -s $(TARGET_PLATFORM) -o $@

$(BUILD_OUTPUT_DIRECTORY)/$(APPLICATION_NAME)-$(APPLICATION_VERSION)-darwin-$(TARGET_ARCH).dmg: \
	$(BUILD_DIRECTORY)/$(APPLICATION_NAME)-$(APPLICATION_VERSION)-$(TARGET_PLATFORM)-$(TARGET_ARCH)-rw.dmg \
	| $(BUILD_OUTPUT_DIRECTORY)
ifdef CODE_SIGN_IDENTITY
	./scripts/build/electron-sign-dmg-darwin.sh \
		-n "$(APPLICATION_NAME)" \
		-d $< \
		-i "$(CODE_SIGN_IDENTITY)"
endif
	./scripts/build/electron-create-readonly-dmg-darwin.sh -d $< -o $@

$(BUILD_DIRECTORY)/$(APPLICATION_NAME)-$(APPLICATION_VERSION)-linux-$(TARGET_ARCH).AppDir: \
	$(BUILD_DIRECTORY)/$(APPLICATION_NAME)-$(APPLICATION_VERSION)-linux-$(TARGET_ARCH) \
	| $(BUILD_DIRECTORY)
	./scripts/build/electron-create-appdir.sh -p $< -o $@ \
		-n "$(APPLICATION_NAME)" \
		-d "$(APPLICATION_DESCRIPTION)" \
		-r "$(TARGET_ARCH)" \
		-b "$(APPLICATION_NAME_LOWERCASE)" \
		-i assets/icon.png

$(BUILD_DIRECTORY)/$(APPLICATION_NAME)-$(APPLICATION_VERSION)-linux-$(TARGET_ARCH).AppImage: \
	$(BUILD_DIRECTORY)/$(APPLICATION_NAME)-$(APPLICATION_VERSION)-linux-$(TARGET_ARCH).AppDir \
	| $(BUILD_DIRECTORY) $(BUILD_TEMPORARY_DIRECTORY)
	./scripts/build/electron-create-appimage-linux.sh -d $< -o $@ \
		-r "$(TARGET_ARCH)" \
		-w "$(BUILD_TEMPORARY_DIRECTORY)"

$(BUILD_OUTPUT_DIRECTORY)/$(APPLICATION_NAME)-$(APPLICATION_VERSION)-linux-$(TARGET_ARCH).zip: \
	$(BUILD_DIRECTORY)/$(APPLICATION_NAME)-$(APPLICATION_VERSION)-linux-$(TARGET_ARCH).AppImage \
	| $(BUILD_OUTPUT_DIRECTORY)
	./scripts/build/zip-file.sh -f $< -s $(TARGET_PLATFORM) -o $@

$(BUILD_OUTPUT_DIRECTORY)/$(APPLICATION_NAME_LOWERCASE)-electron_$(APPLICATION_VERSION_DEBIAN)_$(TARGET_ARCH_DEBIAN).deb: \
	$(BUILD_DIRECTORY)/$(APPLICATION_NAME)-$(APPLICATION_VERSION)-linux-$(TARGET_ARCH) \
	| $(BUILD_OUTPUT_DIRECTORY)
	./scripts/build/electron-installer-debian-linux.sh -p $< -r "$(TARGET_ARCH)" -o $| \
		-c scripts/build/debian/config.json

$(BUILD_OUTPUT_DIRECTORY)/$(APPLICATION_NAME)-$(APPLICATION_VERSION)-win32-$(TARGET_ARCH).zip: \
	$(BUILD_DIRECTORY)/$(APPLICATION_NAME)-$(APPLICATION_VERSION)-win32-$(TARGET_ARCH) \
	| $(BUILD_OUTPUT_DIRECTORY)
	./scripts/build/zip-file.sh -f $< -s $(TARGET_PLATFORM) -o $@

$(BUILD_OUTPUT_DIRECTORY)/$(APPLICATION_NAME)-$(APPLICATION_VERSION)-win32-$(TARGET_ARCH).exe: \
	$(BUILD_DIRECTORY)/$(APPLICATION_NAME)-$(APPLICATION_VERSION)-win32-$(TARGET_ARCH) \
	| $(BUILD_OUTPUT_DIRECTORY) $(BUILD_TEMPORARY_DIRECTORY)
	./scripts/build/electron-installer-nsis-win32.sh -n $(APPLICATION_NAME) -a $< -t $(BUILD_TEMPORARY_DIRECTORY) -o $@

ifdef CODE_SIGN_CERTIFICATE
ifdef CODE_SIGN_CERTIFICATE_PASSWORD
	./scripts/build/electron-sign-exe-win32.sh -f $@ \
		-d "$(APPLICATION_NAME) - $(APPLICATION_VERSION)" \
		-c $(CODE_SIGN_CERTIFICATE) \
		-p $(CODE_SIGN_CERTIFICATE_PASSWORD)
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

package-electron: $(BUILD_DIRECTORY)/$(APPLICATION_NAME)-$(APPLICATION_VERSION)-$(TARGET_PLATFORM)-$(TARGET_ARCH)
package-cli: $(BUILD_DIRECTORY)/$(APPLICATION_NAME)-cli-$(APPLICATION_VERSION)-$(TARGET_PLATFORM)-$(TARGET_ARCH)

ifeq ($(TARGET_PLATFORM),darwin)
electron-installer-app-zip: $(BUILD_OUTPUT_DIRECTORY)/$(APPLICATION_NAME)-$(APPLICATION_VERSION)-$(TARGET_PLATFORM)-$(TARGET_ARCH).zip
electron-installer-dmg: $(BUILD_OUTPUT_DIRECTORY)/$(APPLICATION_NAME)-$(APPLICATION_VERSION)-$(TARGET_PLATFORM)-$(TARGET_ARCH).dmg
cli-installer-tar-gz: $(BUILD_OUTPUT_DIRECTORY)/$(APPLICATION_NAME)-cli-$(APPLICATION_VERSION)-$(TARGET_PLATFORM)-$(TARGET_ARCH).tar.gz
TARGETS += \
	electron-installer-dmg \
	electron-installer-app-zip \
	cli-installer-tar-gz
PUBLISH_AWS_S3 += \
	$(BUILD_OUTPUT_DIRECTORY)/$(APPLICATION_NAME)-$(APPLICATION_VERSION)-$(TARGET_PLATFORM)-$(TARGET_ARCH).zip \
	$(BUILD_OUTPUT_DIRECTORY)/$(APPLICATION_NAME)-$(APPLICATION_VERSION)-$(TARGET_PLATFORM)-$(TARGET_ARCH).dmg \
	$(BUILD_OUTPUT_DIRECTORY)/$(APPLICATION_NAME)-cli-$(APPLICATION_VERSION)-$(TARGET_PLATFORM)-$(TARGET_ARCH).tar.gz
endif

ifeq ($(TARGET_PLATFORM),linux)
electron-installer-appimage: $(BUILD_OUTPUT_DIRECTORY)/$(APPLICATION_NAME)-$(APPLICATION_VERSION)-$(TARGET_PLATFORM)-$(TARGET_ARCH).zip
electron-installer-debian: $(BUILD_OUTPUT_DIRECTORY)/$(APPLICATION_NAME_LOWERCASE)-electron_$(APPLICATION_VERSION_DEBIAN)_$(TARGET_ARCH_DEBIAN).deb
cli-installer-tar-gz: $(BUILD_OUTPUT_DIRECTORY)/$(APPLICATION_NAME)-cli-$(APPLICATION_VERSION)-$(TARGET_PLATFORM)-$(TARGET_ARCH).tar.gz
TARGETS +=  \
	electron-installer-appimage \
	electron-installer-debian \
	cli-installer-tar-gz
PUBLISH_AWS_S3 += \
	$(BUILD_OUTPUT_DIRECTORY)/$(APPLICATION_NAME)-$(APPLICATION_VERSION)-$(TARGET_PLATFORM)-$(TARGET_ARCH).zip \
	$(BUILD_OUTPUT_DIRECTORY)/$(APPLICATION_NAME)-cli-$(APPLICATION_VERSION)-$(TARGET_PLATFORM)-$(TARGET_ARCH).tar.gz
PUBLISH_BINTRAY_DEBIAN += \
	$(BUILD_OUTPUT_DIRECTORY)/$(APPLICATION_NAME_LOWERCASE)-electron_$(APPLICATION_VERSION_DEBIAN)_$(TARGET_ARCH_DEBIAN).deb
endif

ifeq ($(TARGET_PLATFORM),win32)
electron-installer-zip: $(BUILD_OUTPUT_DIRECTORY)/$(APPLICATION_NAME)-$(APPLICATION_VERSION)-$(TARGET_PLATFORM)-$(TARGET_ARCH).zip
electron-installer-nsis: $(BUILD_OUTPUT_DIRECTORY)/$(APPLICATION_NAME)-$(APPLICATION_VERSION)-win32-$(TARGET_ARCH).exe
cli-installer-zip: $(BUILD_OUTPUT_DIRECTORY)/$(APPLICATION_NAME)-cli-$(APPLICATION_VERSION)-$(TARGET_PLATFORM)-$(TARGET_ARCH).zip
TARGETS += \
	electron-installer-zip \
	electron-installer-nsis \
	cli-installer-zip
PUBLISH_AWS_S3 += \
	$(BUILD_OUTPUT_DIRECTORY)/$(APPLICATION_NAME)-$(APPLICATION_VERSION)-$(TARGET_PLATFORM)-$(TARGET_ARCH).zip \
	$(BUILD_OUTPUT_DIRECTORY)/$(APPLICATION_NAME)-$(APPLICATION_VERSION)-win32-$(TARGET_ARCH).exe \
	$(BUILD_OUTPUT_DIRECTORY)/$(APPLICATION_NAME)-cli-$(APPLICATION_VERSION)-$(TARGET_PLATFORM)-$(TARGET_ARCH).zip
endif

installers-all: $(PUBLISH_AWS_S3) $(PUBLISH_BINTRAY_DEBIAN)

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
	$(NODE_MODULES_BIN)/node-sass ./lib/gui/scss/main.scss > ./lib/gui/css/main.css

lint-js:
	$(NODE_MODULES_BIN)/eslint lib tests scripts bin versionist.conf.js

lint-sass:
	$(NODE_MODULES_BIN)/sass-lint lib/gui/scss

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
	$(NODE_MODULES_BIN)/electron-mocha $(ELECTRON_MOCHA_OPTIONS) --renderer tests/gui

test-sdk:
	$(NODE_MODULES_BIN)/electron-mocha $(ELECTRON_MOCHA_OPTIONS) \
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
