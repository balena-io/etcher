# ---------------------------------------------------------------------
# Build configuration
# ---------------------------------------------------------------------

RESIN_SCRIPTS ?= ./scripts/resin
export NPM_VERSION ?= 6.14.8
S3_BUCKET = artifacts.ci.balena-cloud.com

# This directory will be completely deleted by the `clean` rule
BUILD_DIRECTORY ?= dist

BUILD_TEMPORARY_DIRECTORY = $(BUILD_DIRECTORY)/.tmp

$(BUILD_DIRECTORY):
	mkdir $@

$(BUILD_TEMPORARY_DIRECTORY): | $(BUILD_DIRECTORY)
	mkdir $@

SHELL := /bin/bash

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
		ifeq ($(shell uname -m),aarch64)
			HOST_ARCH = aarch64
		endif
		ifeq ($(shell uname -m),armv8)
			HOST_ARCH = aarch64
		endif
		ifeq ($(shell uname -m),arm64)
			HOST_ARCH = aarch64
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
$(error We could not detect your host platform)
endif
ifndef HOST_ARCH
$(error We could not detect your host architecture)
endif

# Default to host architecture. You can override by doing:
#
#   make <target> TARGET_ARCH=<arch>
#
TARGET_ARCH ?= $(HOST_ARCH)

# ---------------------------------------------------------------------
# Electron
# ---------------------------------------------------------------------
electron-develop:
	git submodule update --init && \
	$(RESIN_SCRIPTS)/electron/install.sh \
		-b $(shell pwd) \
		-r $(TARGET_ARCH) \
		-s $(PLATFORM) \
		-m $(NPM_VERSION)

electron-test:
	$(RESIN_SCRIPTS)/electron/test.sh \
		-b $(shell pwd) \
		-s $(PLATFORM)

assets/dmg/background.tiff: assets/dmg/background.png assets/dmg/background@2x.png
	tiffutil -cathidpicheck $^ -out $@

electron-build: assets/dmg/background.tiff | $(BUILD_TEMPORARY_DIRECTORY)
	$(RESIN_SCRIPTS)/electron/build.sh \
		-b $(shell pwd) \
		-r $(TARGET_ARCH) \
		-s $(PLATFORM) \
		-v production \
		-n $(BUILD_TEMPORARY_DIRECTORY)/npm

# ---------------------------------------------------------------------
# Phony targets
# ---------------------------------------------------------------------

TARGETS = \
	help \
	info \
	lint \
	test \
	clean \
	distclean \
	electron-develop \
	electron-test \
	electron-build

.PHONY: $(TARGETS)

lint:
	npm run lint

test:
	npm run test

help:
	@echo "Available targets: $(TARGETS)"

info:
	@echo "Platform            : $(PLATFORM)"
	@echo "Host arch           : $(HOST_ARCH)"
	@echo "Target arch         : $(TARGET_ARCH)"

clean:
	rm -rf $(BUILD_DIRECTORY)

distclean: clean
	rm -rf node_modules
	rm -rf dist
	rm -rf generated
	rm -rf $(BUILD_TEMPORARY_DIRECTORY)

.DEFAULT_GOAL = help
