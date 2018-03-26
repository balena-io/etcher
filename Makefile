.PHONY: webpack electron-develop

webpack:
	PATH="/c/MinGW/msys/1.0/bin:$(PATH)" node --max-old-space-size=64 --trace_track_allocation_sites --use_verbose_printer ./node_modules/webpack/bin/webpack.js --progress

electron-develop:
	PATH="/c/MinGW/msys/1.0/bin:$(PATH)" npm install
