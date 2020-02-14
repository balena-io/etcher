/*
 * Copyright 2018 balena.io
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as fs from 'fs';
import * as _ from 'lodash';
import * as path from 'path';
import * as React from 'react';

import * as analytics from '../../modules/analytics';

const domParser = new window.DOMParser();

const DEFAULT_SIZE = '40px';

/**
 * @summary Try to parse SVG contents and return it data encoded
 *
 * @param {String} contents - SVG XML contents
 * @returns {String|null}
 *
 * @example
 * const encodedSVG = tryParseSVGContents('<svg><path></path></svg>')
 *
 * img.src = encodedSVG
 */
function tryParseSVGContents(contents: string) {
	const doc = domParser.parseFromString(contents, 'image/svg+xml');
	const parserError = doc.querySelector('parsererror');
	const svg = doc.querySelector('svg');

	if (!parserError && svg) {
		return `data:image/svg+xml,${encodeURIComponent(svg.outerHTML)}`;
	}

	return null;
}

interface SVGIconProps {
	// Paths to SVG files to be tried in succession if any fails
	paths: string[];
	// List of embedded SVG contents to be tried in succession if any fails
	contents?: string[];
	// SVG image width unit
	width?: string;
	// SVG image height unit
	height?: string;
	// Should the element visually appear grayed out and disabled?
	disabled?: boolean;
}

/**
 * @summary SVG element that takes both filepaths and file contents
 */
export class SVGIcon extends React.Component<SVGIconProps> {
	public render() {
		// __dirname behaves strangely inside a Webpack bundle,
		// so we need to provide different base directories
		// depending on whether __dirname is absolute or not,
		// which helps detecting a Webpack bundle.
		// We use global.__dirname inside a Webpack bundle since
		// that's the only way to get the "real" __dirname.
		let baseDirectory: string;
		if (path.isAbsolute(__dirname)) {
			baseDirectory = path.join(__dirname, '..');
		} else {
			// @ts-ignore
			baseDirectory = global.__dirname;
		}

		let svgData = '';

		_.find(this.props.contents, content => {
			const attempt = tryParseSVGContents(content);

			if (attempt) {
				svgData = attempt;
				return true;
			}

			return false;
		});

		if (!svgData) {
			_.find(this.props.paths, relativePath => {
				// This means the path to the icon should be
				// relative to *this directory*.
				// TODO: There might be a way to compute the path
				// relatively to the `index.html`.
				const imagePath = path.join(baseDirectory, 'assets', relativePath);

				const contents = _.attempt(() => {
					return fs.readFileSync(imagePath, {
						encoding: 'utf8',
					});
				});

				if (_.isError(contents)) {
					analytics.logException(contents);
					return false;
				}

				const parsed = tryParseSVGContents(contents);

				if (parsed) {
					svgData = parsed;
					return true;
				}

				return false;
			});
		}

		const width = this.props.width || DEFAULT_SIZE;
		const height = this.props.height || DEFAULT_SIZE;

		return (
			<img
				className="svg-icon"
				style={{
					width,
					height,
				}}
				src={svgData}
				// @ts-ignore
				disabled={this.props.disabled}
			></img>
		);
	}
}
