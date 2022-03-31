import configs from './webpack.config';
import { WebpackOptionsNormalized } from 'webpack';
import * as fs from 'fs';

const [
	guiConfig,
	etcherConfig,
	childWriterConfig,
] = (configs as unknown) as WebpackOptionsNormalized[];

configs.forEach((config) => {
	config.mode = 'development';
	// @ts-ignore
	config.devtool = 'source-map';
});

guiConfig.devServer = {
	hot: true,
	port: 3030,
};

fs.copyFileSync('./lib/gui/app/index.dev.html', './generated/index.html');

export default [guiConfig, etcherConfig, childWriterConfig];
