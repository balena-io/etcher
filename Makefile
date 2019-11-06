# ---------------------------------------------------------------------
# Build configuration
# ---------------------------------------------------------------------

RESIN_SCRIPTS ?= ./scripts/resin
export NPM_VERSION ?= 6.7.0
S3_BUCKET = artifacts.ci.balena-cloud.com

# This directory will be completely deleted by the `clean` rule
BUILD_DIRECTORY ?= dist

# See http://stackoverflow.com/a/20763842/1641422
BUILD_DIRECTORY_PARENT = $(dir $(BUILD_DIRECTORY))
ifeq ($(wildcard $(BUILD_DIRECTORY_PARENT).),)
$(error $(BUILD_DIRECTORY_PARENT) does not exist)
endif

BUILD_TEMPORARY_DIRECTORY = $(BUILD_DIRECTORY)/.tmp

$(BUILD_DIRECTORY):
	mkdir $@

$(BUILD_TEMPORARY_DIRECTORY): | $(BUILD_DIRECTORY)
	mkdir $@

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
electron-develop: | $(BUILD_TEMPORARY_DIRECTORY)
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
		-n $(BUILD_TEMPORARY_DIRECTORY)/npm \
		-w $(BUILD_TEMPORARY_DIRECTORY)

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
	test \
	sanity-checks \
	clean \
	distclean \
	webpack \
	electron-develop \
	electron-test \
	electron-build

webpack:
	./node_modules/.bin/webpack

.PHONY: $(TARGETS)

sass:
	npm rebuild node-sass
	node-sass lib/gui/app/scss/main.scss > lib/gui/css/main.css

lint-ts:
	resin-lint --typescript lib

lint-js:
	eslint --ignore-pattern scripts/resin/**/*.js lib tests scripts bin webpack.config.js

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
		--skip *.svg *.gz,*.bz2,*.xz,*.zip,*.img,*.dmg,*.iso,*.rpi-sdcard,*.wic,.DS_Store,*.dtb,*.dtbo,*.dat,*.elf,*.bin,*.foo,xz-without-extension \
		lib tests docs Makefile *.md LICENSE

lint: lint-ts lint-js lint-sass lint-cpp lint-html lint-spell

MOCHA_OPTIONS=--recursive --reporter spec --require ts-node/register

# See https://github.com/electron/spectron/issues/127
ETCHER_SPECTRON_ENTRYPOINT ?= $(shell node -e 'console.log(require("electron"))')
test-spectron:
	ETCHER_SPECTRON_ENTRYPOINT="$(ETCHER_SPECTRON_ENTRYPOINT)" mocha $(MOCHA_OPTIONS) tests/spectron

test-gui:
	electron-mocha $(MOCHA_OPTIONS) --renderer tests/gui

test-sdk:
	electron-mocha $(MOCHA_OPTIONS) \
		tests/shared

test: test-gui test-sdk test-spectron

help:
	@echo "Available targets: $(TARGETS)"

info:
	@echo "Platform            : $(PLATFORM)"
	@echo "Host arch           : $(HOST_ARCH)"
	@echo "Target arch         : $(TARGET_ARCH)"

sanity-checks:
	./scripts/ci/ensure-staged-sass.sh
	./scripts/ci/ensure-npm-dependencies-compatibility.sh
	./scripts/ci/ensure-all-file-extensions-in-gitattributes.sh

clean:
	rm -rf $(BUILD_DIRECTORY)

distclean: clean
	rm -rf node_modules
	rm -rf build
	rm -rf dist
	rm -rf generated
	rm -rf $(BUILD_TEMPORARY_DIRECTORY)

.DEFAULT_GOAL = help
