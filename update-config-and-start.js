const { spawn } = require('child_process');
const { promises: fs } = require('fs');
const http = require('http');
const { env } = require('process');

const {
	BALENA_SUPERVISOR_ADDRESS,
	BALENA_SUPERVISOR_API_KEY,
	ETCHER_PRO_VERSION,  // TODO: get etcher pro version from somewhere else
} = env;

const CONFIG_FILE_PATH = '/root/.config/balena-etcher/config.json';

const db = {
	default: {
		autoSelectAllDrives: true,
		desktopNotifications: false,
		disableExternalLinks: true,
		driveBlacklist: [
			'/dev/mmcblk0rpmb',
			'/dev/mmcblk0',
			'/dev/mmcblk0boot0',
			'/dev/mmcblk0boot1',
		],
		featuredProjectEndpoint: 'nothing://',
		successBannerURL: '',
		fullscreen: true,
		ledsOrder: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
	},
	'2.2.2': {
		default: {
			drivesOrder: [
				'platform-xhci-hcd.1.auto-usb-0:1.1.1:1.0-scsi-0:0:0:0',
				'platform-xhci-hcd.1.auto-usb-0:1.1.2:1.0-scsi-0:0:0:0',
				'platform-xhci-hcd.1.auto-usb-0:1.1.3:1.0-scsi-0:0:0:0',
				'platform-xhci-hcd.1.auto-usb-0:1.1.4:1.0-scsi-0:0:0:0',
				'platform-xhci-hcd.1.auto-usb-0:1.2.1:1.0-scsi-0:0:0:0',
				'platform-xhci-hcd.1.auto-usb-0:1.2.2:1.0-scsi-0:0:0:0',
				'platform-xhci-hcd.1.auto-usb-0:1.2.3:1.0-scsi-0:0:0:0',
				'platform-xhci-hcd.1.auto-usb-0:1.2.4:1.0-scsi-0:0:0:0',
				'platform-xhci-hcd.0.auto-usb-0:1.1.1:1.0-scsi-0:0:0:0',
				'platform-xhci-hcd.0.auto-usb-0:1.1.2:1.0-scsi-0:0:0:0',
				'platform-xhci-hcd.0.auto-usb-0:1.1.3:1.0-scsi-0:0:0:0',
				'platform-xhci-hcd.0.auto-usb-0:1.1.4:1.0-scsi-0:0:0:0',
				'platform-xhci-hcd.0.auto-usb-0:1.2.1:1.0-scsi-0:0:0:0',
				'platform-xhci-hcd.0.auto-usb-0:1.2.2:1.0-scsi-0:0:0:0',
				'platform-xhci-hcd.0.auto-usb-0:1.2.3:1.0-scsi-0:0:0:0',
				'platform-xhci-hcd.0.auto-usb-0:1.2.4:1.0-scsi-0:0:0:0',
			],
		},
		'2.58.3+rev3': {
			xrandrArgs: '-o inverted -x',
		},
		'2.58.3+rev4': {
			xrandrArgs: '-o inverted -x',
		},
		'2.62.0+rev1': {
			xrandrArgs: '-o inverted -x',
		},
	},
	'2.3.1': {
		default: {
			drivesOrder: [
				'platform-33800000.pcie-pci-0000:01:00.0-usb-0:2:1.0-scsi-0:0:0:0',
				'platform-xhci-hcd.1.auto-usb-0:1.7:1.0-scsi-0:0:0:0',
				'platform-xhci-hcd.0.auto-usb-0:1.7:1.0-scsi-0:0:0:0',
				'platform-xhci-hcd.1.auto-usb-0:1.5:1.0-scsi-0:0:0:0',
				'platform-xhci-hcd.0.auto-usb-0:1.5:1.0-scsi-0:0:0:0',
				'platform-xhci-hcd.1.auto-usb-0:1.4:1.0-scsi-0:0:0:0',
				'platform-xhci-hcd.0.auto-usb-0:1.4:1.0-scsi-0:0:0:0',
				'platform-xhci-hcd.1.auto-usb-0:1.3:1.0-scsi-0:0:0:0',
				'platform-xhci-hcd.0.auto-usb-0:1.3:1.0-scsi-0:0:0:0',
				'platform-xhci-hcd.1.auto-usb-0:1.2:1.0-scsi-0:0:0:0',
				'platform-xhci-hcd.0.auto-usb-0:1.2:1.0-scsi-0:0:0:0',
				'platform-xhci-hcd.1.auto-usb-0:1.1:1.0-scsi-0:0:0:0',
				'platform-xhci-hcd.0.auto-usb-0:1.1:1.0-scsi-0:0:0:0',
				'platform-33800000.pcie-pci-0000:01:00.0-usb-0:1:1.0-scsi-0:0:0:0',
				'platform-33800000.pcie-pci-0000:01:00.0-usb-0:4:1.0-scsi-0:0:0:0',
				'platform-33800000.pcie-pci-0000:01:00.0-usb-0:3:1.0-scsi-0:0:0:0',
			],
		},
	},
}

function streamToString(stream) {
	return new Promise((resolve, reject) => {
		const chunks = [];
		stream.on('error', reject);
		stream.on('data', (chunk) => {
			chunks.push(chunk);
		});
		stream.on('end', () => {
			resolve(chunks.join(''));
		});
	});
}

function get(url, options) {
	return new Promise((resolve, reject) => {
		http.get(url, options, resolve).on('error', reject);
	});
}

async function getOsVersion() {
	const url = `${BALENA_SUPERVISOR_ADDRESS}/v1/device`;
	const headers = { Authorization: `Bearer ${BALENA_SUPERVISOR_API_KEY}` };
	const response = await get(url, { headers });
	return JSON.parse(await streamToString(response)).os_version.split(' ')[1];
}

async function writeConfigFile(config) {
	let currentConfig = {};
	try {
		currentConfig = JSON.parse(await fs.readFile(CONFIG_FILE_PATH, { encoding: 'utf8' }));
	} catch (error) {
	}
	const newConfig = { ...currentConfig, ...config };
	await fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(newConfig, null, 2));
}

function zip(...arrays) {
	return arrays[0].map((_, i) => arrays.map(array => array[i]));
}

async function updateScreenPWMDutyCycle() {
	const dutyCycle = parseInt(env.SCREEN_PWM_DUTY_CYCLE);
	if (dutyCycle !== undefined) {
		try {
			await fs.writeFile('/sys/class/pwm/pwmchip2/pwm0/duty_cycle', dutyCycle.toString());
		} catch (error) {
			console.error('Could not update screen PWM duty cycle', error);
		}
	}
}

async function main() {
	await updateScreenPWMDutyCycle();
	const osVersion = await getOsVersion();
	const defaultConfig = db.default;
	const hw = db[ETCHER_PRO_VERSION] || {};
	const hwDefaultConfig = hw.default || {};
	const hwOsConfig = hw[osVersion] || {};
	const config = { ...defaultConfig, ...hwDefaultConfig, ...hwOsConfig };
	let drivesOrder;
	let ledsOrder;
	let xrandrArgs;
	let rest = {};
	({ drivesOrder, ledsOrder, xrandrArgs, ...rest } = config);
	let automountOnFileSelect;
	let ledsMapping;
	if (drivesOrder !== undefined) {
		automountOnFileSelect = drivesOrder[0];
		ledsMapping = Object.fromEntries(zip(drivesOrder, ledsOrder).map(([drive, ledNumber]) => {
			return [drive, ['r', 'g', 'b'].map(color => `led${ledNumber}_${color}`)];
		}));
	}
	await writeConfigFile({ ...rest, ledsMapping, automountOnFileSelect, drivesOrder });
	const xinit = spawn('xinit', [], { stdio: 'inherit', env: { XRANDR_ARGS: xrandrArgs, ...env } });
	xinit.on('close', (code) => {
		process.exitCode = code;
	});
}

main();
