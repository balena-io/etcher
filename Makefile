SHELL := /bin/bash

.PHONY: webpack electron-develop

webpack:
	PATH=/c/MinGW/msys/1.0/bin:$(PATH) ./node_modules/.bin/webpack

electron-develop:
	PATH=/c/MinGW/msys/1.0/bin:$(PATH) GYP_MSVS_VERSION=2015 npm_config_disturl=https://atom.io/download/electron npm_config_runtime=electron npm_config_target=1.7.11 npm_config_build_from_source=true npm_config_arch=x64 npm install
