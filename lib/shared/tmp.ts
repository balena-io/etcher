import * as Bluebird from 'bluebird';
import * as tmp from 'tmp';

function tmpFileAsync(
	options: tmp.FileOptions,
): Promise<{ path: string; cleanup: () => void }> {
	return new Promise((resolve, reject) => {
		tmp.file(options, (error, path, _fd, cleanup) => {
			if (error) {
				reject(error);
			} else {
				resolve({ path, cleanup });
			}
		});
	});
}

export function tmpFileDisposer(
	options: tmp.FileOptions,
): Bluebird.Disposer<{ path: string; cleanup: () => void }> {
	return Bluebird.resolve(tmpFileAsync(options)).disposer(({ cleanup }) => {
		cleanup();
	});
}
