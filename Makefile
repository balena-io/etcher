# ---------------------------------------------------------------------
# Application configuration
# ---------------------------------------------------------------------

SIGN_IDENTITY_OSX = Developer ID Application: Rulemotion Ltd (66H43P8FRG)
ELECTRON_VERSION = $(shell node -e "console.log(require('./package.json').devDependencies['electron-prebuilt'])")
APPLICATION_NAME = $(shell node -e "console.log(require('./package.json').displayName)")
APPLICATION_DESCRIPTION=$(shell node -e "console.log(require('./package.json').description)")
APPLICATION_VERSION = $(shell node -e "console.log(require('./package.json').version)")
APPLICATION_COPYRIGHT = $(shell node -e "console.log(require('./package.json').copyright)")
APPLICATION_CATEGORY = public.app-category.developer-tools
APPLICATION_BUNDLE_ID = io.resin.etcher
APPLICATION_FILES = lib,build,assets

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

		ifeq ($(shell uname -p),x86_64)
			HOST_ARCH = x64
		endif
		ifneq ($(filter %86,$(shell uname -p)),)
			HOST_ARCH = x86
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
	$(error We couldn\'t detect your host platform)
endif
ifndef HOST_ARCH
	$(error We couldn\'t detect your host architecture)
endif

TARGET_PLATFORM = $(HOST_PLATFORM)

ifneq ($(TARGET_PLATFORM),$(HOST_PLATFORM))
	$(error We don\'t support cross-platform builds yet)
endif

# Default to host architecture. You can override by doing:
#
#   make <target> TARGET_ARCH=<arch>
#
TARGET_ARCH = $(HOST_ARCH)

# ---------------------------------------------------------------------
# Extra variables
# ---------------------------------------------------------------------

ifeq ($(TARGET_ARCH),x86)
	TARGET_ARCH_DEBIAN = i386
endif
ifeq ($(TARGET_ARCH),x64)
	TARGET_ARCH_DEBIAN = amd64
endif

TEMPORARY_DIRECTORY = release/.tmp
APPLICATION_NAME_LOWERCASE = $(shell echo $(APPLICATION_NAME) | tr A-Z a-z)
APPLICATION_VERSION_DEBIAN = $(shell echo $(APPLICATION_VERSION) | tr "-" "~")

# ---------------------------------------------------------------------
# Rules
# ---------------------------------------------------------------------

release/electron-$(TARGET_PLATFORM)-$(TARGET_ARCH)-dependencies/node_modules: package.json npm-shrinkwrap.json
	./scripts/unix/dependencies-npm.sh -p -r "$(TARGET_ARCH)" -v "$(ELECTRON_VERSION)" -x $(dir $@) -t electron

release/electron-$(TARGET_PLATFORM)-$(TARGET_ARCH)-dependencies/bower_components: bower.json
	./scripts/unix/dependencies-bower.sh -p -x $(dir $@)

release/electron-$(TARGET_PLATFORM)-$(TARGET_ARCH)-app: \
	release/electron-$(TARGET_PLATFORM)-$(TARGET_ARCH)-dependencies/node_modules \
	release/electron-$(TARGET_PLATFORM)-$(TARGET_ARCH)-dependencies/bower_components
	./scripts/unix/electron-create-resources-app.sh -s . -f "$(APPLICATION_FILES)" -o $@
	for prerequisite in $^; do \
		cp -rf $$prerequisite $@; \
	done

release/electron-$(TARGET_PLATFORM)-$(TARGET_ARCH)-app.asar: \
	release/electron-$(TARGET_PLATFORM)-$(TARGET_ARCH)-app
	./scripts/unix/electron-create-asar.sh -d $< -o $@

release/$(APPLICATION_NAME)-$(TARGET_PLATFORM)-$(TARGET_ARCH): \
	release/electron-$(TARGET_PLATFORM)-$(TARGET_ARCH)-app.asar
	./scripts/unix/electron-download-package.sh -r "$(TARGET_ARCH)" -v "$(ELECTRON_VERSION)" -s "$(TARGET_PLATFORM)" -o $@
ifeq ($(TARGET_PLATFORM),darwin)
	./scripts/darwin/electron-configure-package-darwin.sh -d $@ -a $< \
		-n "$(APPLICATION_NAME)" \
		-v "$(APPLICATION_VERSION)" \
		-b "$(APPLICATION_BUNDLE_ID)" \
		-c "$(APPLICATION_COPYRIGHT)" \
		-t "$(APPLICATION_CATEGORY)" \
		-i assets/icon.icns
endif
ifeq ($(TARGET_PLATFORM),linux)
	./scripts/linux/electron-configure-package-linux.sh -d $@ -a $< \
		-n "$(APPLICATION_NAME)" \
		-v "$(APPLICATION_VERSION)" \
		-l LICENSE
endif

release/out/$(APPLICATION_NAME)-$(APPLICATION_VERSION)-darwin-$(TARGET_ARCH).zip: \
	release/$(APPLICATION_NAME)-darwin-$(TARGET_ARCH)
	./scripts/darwin/electron-sign-app.sh -a $</$(APPLICATION_NAME).app -i "$(SIGN_IDENTITY_OSX)"
	./scripts/darwin/electron-installer-app-zip.sh -a $</$(APPLICATION_NAME).app -o $@

release/out/$(APPLICATION_NAME)-$(APPLICATION_VERSION)-darwin-$(TARGET_ARCH).dmg: \
	release/$(APPLICATION_NAME)-darwin-$(TARGET_ARCH)
	./scripts/darwin/electron-installer-dmg.sh -p $< -o $@ \
		-n "$(APPLICATION_NAME)" \
		-v "$(APPLICATION_VERSION)" \
		-d "$(SIGN_IDENTITY_OSX)" \
		-i assets/icon.icns \
		-b assets/osx/installer.png

release/out/$(APPLICATION_NAME)-$(APPLICATION_VERSION)-linux-$(TARGET_ARCH).zip: \
	release/$(APPLICATION_NAME)-linux-$(TARGET_ARCH)
	TMPDIR=$(TEMPORARY_DIRECTORY) ./scripts/linux/electron-installer-appimage.sh -p $< -o $@ \
		-n "$(APPLICATION_NAME)" \
		-d "$(APPLICATION_DESCRIPTION)" \
		-r "$(TARGET_ARCH)" \
		-b "$(APPLICATION_NAME_LOWERCASE)" \
		-i assets/icon.png

release/out/$(APPLICATION_NAME_LOWERCASE)-electron_$(APPLICATION_VERSION_DEBIAN)_$(TARGET_ARCH_DEBIAN).deb: \
	release/$(APPLICATION_NAME)-linux-$(TARGET_ARCH)
	./scripts/linux/electron-installer-debian.sh -p $< -r "$(TARGET_ARCH)" \
		-c scripts/build/debian/config.json \
		-o $(dir $@)

# ---------------------------------------------------------------------
# Phony targets
# ---------------------------------------------------------------------

.PHONY: \
	info \
	clean \
	electron-develop \
	electron-installer-dmg \
	electron-installer-app-zip \
	electron-installer-appimage \
	electron-installer-debian

electron-develop:
	# Since we use an `npm-shrinkwrap.json` file, if you pull changes
	# that update a dependency and try to `npm install` directly, npm
	# will complain that your `node_modules` tree is not equal to what
	# is defined by the `npm-shrinkwrap.json` file, and will thus
	# refuse to do anything but install from scratch.
	rm -rf node_modules
	./scripts/unix/dependencies-npm.sh -r "$(TARGET_ARCH)" -v "$(ELECTRON_VERSION)" -t electron
	./scripts/unix/dependencies-bower.sh

ifeq ($(TARGET_PLATFORM),darwin)
electron-installer-app-zip: release/out/$(APPLICATION_NAME)-$(APPLICATION_VERSION)-$(TARGET_PLATFORM)-$(TARGET_ARCH).zip
electron-installer-dmg: release/out/$(APPLICATION_NAME)-$(APPLICATION_VERSION)-$(TARGET_PLATFORM)-$(TARGET_ARCH).dmg
endif
ifeq ($(TARGET_PLATFORM),linux)
electron-installer-appimage: release/out/$(APPLICATION_NAME)-$(APPLICATION_VERSION)-$(TARGET_PLATFORM)-$(TARGET_ARCH).zip
electron-installer-debian: release/out/$(APPLICATION_NAME_LOWERCASE)-electron_$(APPLICATION_VERSION_DEBIAN)_$(TARGET_ARCH_DEBIAN).deb
endif

info:
	@echo "Host platform   : $(HOST_PLATFORM)"
	@echo "Host arch       : $(HOST_ARCH)"
	@echo "Target platform : $(TARGET_PLATFORM)"
	@echo "Target arch     : $(TARGET_ARCH)"

clean:
	rm -rf release
