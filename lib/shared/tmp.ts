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

export async function withTmpFile<T>(
	options: tmp.FileOptions,
	fn: (path: string) => Promise<T>,
): Promise<T> {
	const { path, cleanup } = await tmpFileAsync(options);
	try {
		return await fn(path);
	} finally {
		cleanup();
	}
}
