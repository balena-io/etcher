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

import * as React from 'react';

const domParser = new window.DOMParser();

const DEFAULT_SIZE = '40px';

/**
 * @summary Try to parse SVG contents and return it data encoded
 *
 */
function tryParseSVGContents(contents?: string): string | undefined {
	if (contents === undefined) {
		return;
	}
	const doc = domParser.parseFromString(contents, 'image/svg+xml');
	const parserError = doc.querySelector('parsererror');
	const svg = doc.querySelector('svg');
	if (!parserError && svg) {
		return `data:image/svg+xml,${encodeURIComponent(svg.outerHTML)}`;
	}
}

interface SVGIconProps {
	// List of embedded SVG contents to be tried in succession if any fails
	contents: string;
	fallback: JSX.Element;
	// SVG image width unit
	width?: string;
	// SVG image height unit
	height?: string;
	// Should the element visually appear grayed out and disabled?
	disabled?: boolean;
}

/**
 * @summary SVG element that takes file contents
 */
export class SVGIcon extends React.PureComponent<SVGIconProps> {
	public render() {
		const svgData = tryParseSVGContents(this.props.contents);
		if (svgData !== undefined) {
			const width = this.props.width || DEFAULT_SIZE;
			const height = this.props.height || DEFAULT_SIZE;
			return (
				<img
					className={this.props.disabled ? 'disabled' : ''}
					style={{ width, height }}
					src={svgData}
				/>
			);
		}
		return this.props.fallback;
	}
}
