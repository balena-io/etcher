/*
 * Copyright 2018 balena.io
 *
 * Licensed under the Apache License, Version 2.0 (the "License"),
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

import * as _ from 'lodash';
import { Theme } from 'rendition';

export const colors = {
	dark: {
		foreground: '#fff',
		background: '#4d5057',
		soft: {
			foreground: '#ddd',
			background: '#64686a',
		},
		disabled: {
			foreground: '#787c7f',
			background: '#3a3c41',
		},
	},
	light: {
		foreground: '#666',
		background: '#fff',
		soft: {
			foreground: '#b3b3b3',
		},
		disabled: {
			foreground: '#787c7f',
			background: '#d5d5d5',
		},
	},
	default: {
		foreground: '#b3b3b3',
		background: '#ececec',
	},
	primary: {
		foreground: '#fff',
		background: '#00aeef',
	},
	secondary: {
		foreground: '#000',
		background: '#ddd',
		main: '#fff',
	},
	warning: {
		foreground: '#fff',
		background: '#fca321',
	},
	danger: {
		foreground: '#fff',
		background: '#d9534f',
	},
	success: {
		foreground: '#fff',
		background: '#5fb835',
	},
};

const font = 'SourceSansPro';

export const theme = _.merge({}, Theme, {
	colors,
	font,
	header: {
		height: '40px',
	},
	global: {
		font: {
			family: font,
			size: 16,
		},
		text: {
			medium: {
				size: 16,
			},
		},
	},
	button: {
		border: {
			width: '0',
			radius: '24px',
		},
		disabled: {
			opacity: 1,
		},
		extend: () => `
			width: 200px;
			font-size: 16px;

			&& {
				height: 48px;
			}

			:disabled {
				background-color: ${colors.dark.disabled.background};
				color: ${colors.dark.disabled.foreground};
				opacity: 1;

				:hover {
					background-color: ${colors.dark.disabled.background};
					color: ${colors.dark.disabled.foreground};
				}
			}
		`,
	},
	layer: {
		extend: () => `
			> div:first-child {
				background-color: transparent;
			}
		`,
	},
});
