.PHONY: webpack electron-develop

webpack:
	PATH="/c/MinGW/msys/1.0/bin:$(PATH)" node --trace_gc --trace_gc_verbose --max-old-space-size=8192 ./node_modules/webpack/bin/webpack.js --progress

electron-develop:
	PATH="/c/MinGW/msys/1.0/bin:$(PATH)" npm install
