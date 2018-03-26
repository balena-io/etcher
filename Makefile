SHELL := /bin/bash

.PHONY: webpack electron-develop

webpack:
	PATH="/c/MinGW/msys/1.0/bin:$(PATH)" ./node_modules/.bin/webpack --progress

electron-develop:
	PATH="/c/MinGW/msys/1.0/bin:$(PATH)" npm install
