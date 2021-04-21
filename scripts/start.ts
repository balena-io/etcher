import { watch } from 'fs/promises';
import { spawn } from 'child_process';

const startElectron = () =>
	spawn('./node_modules/.bin/electron', ['.'], {
		stdio: 'inherit',
	});

(async () => {
	const watcher = watch('./generated', { recursive: true });
	let electronProcess = startElectron();
	for await (const _event of watcher) {
		electronProcess.kill();
		electronProcess = startElectron();
	}
})();
