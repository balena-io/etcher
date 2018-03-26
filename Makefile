.PHONY: webpack electron-develop

webpack:
	PATH="/c/MinGW/msys/1.0/bin:$(PATH)" node --max-old-space-size=16 --use_verbose_printer --trace_track_allocation_sites --print_code --print_code_verbose ./node_modules/webpack/bin/webpack.js --progress

electron-develop:
	PATH="/c/MinGW/msys/1.0/bin:$(PATH)" npm install
