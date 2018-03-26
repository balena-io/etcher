.PHONY: webpack electron-develop

webpack:
	PATH="/c/MinGW/msys/1.0/bin:$(PATH)" node --inspect ./node_modules/webpack/bin/webpack.js

electron-develop:
	PATH="/c/MinGW/msys/1.0/bin:$(PATH)" npm install
