import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

let lang = Intl.DateTimeFormat().resolvedOptions().locale;
lang = lang.substr(0, 2);

i18next.use(initReactI18next).init({
	lng: lang,
	fallbackLng: 'en',
	interpolation: {
		escapeValue: false,
	},
	resources: {
		zh: {
			translation: {
				ok: '好',
				cancel: '取消',
				continue: '继续',
				skip: '跳过',
				sure: '我确定',
				warning: '请注意！',
				attention: '请注意',
				failed: '失败',
				completed: '完毕',
				yesExit: '是的，可以退出',
				reallyExit: '真的要现在退出 Etcher 吗？',
				yesContinue: '是的，继续',
				progress: {
					starting: '正在启动……',
					decompressing: '正在解压……',
					flashing: '正在烧录……',
					finishing: '正在结束……',
					verifying: '正在验证……',
					failing: '失败……',
				},
				message: {
					sizeNotRecommended: '大小不推荐',
					tooSmall: '空间太小',
					locked: '被锁定',
					system: '系统盘',
					containsImage: '存放源镜像',
					largeDrive: '很大的磁盘',
					sourceLarger: '所选的镜像比目标盘大了 {{byte}} 比特。',
					flashSucceed_one: '烧录成功',
					flashSucceed_other: '烧录成功',
					flashFail_one: '烧录失败',
					flashFail_other: '烧录失败',
					to: '到 ',
					andFail: '并烧录失败了 ',
					target_one: ' 个目标',
					target_other: ' 个目标',
					succeedTo: '被成功烧录',
					exitWhileFlashing:
						'您当前正在刷机。 关闭 Etcher 可能会导致您的磁盘无法使用。',
					looksLikeWindowsImage:
						'看起来您正在尝试刻录 Windows 镜像。\n\n与其他镜像不同，Windows 镜像需要特殊处理才能使其可启动。 我们建议您使用专门为此目的设计的工具，例如 <a href="https://rufus.akeo.ie">Rufus</a> (Windows)、<a href="https://github. com/slacka/WoeUSB">WoeUSB</a> (Linux) 或 Boot Camp 助理 (macOS)。',
					missingPartitionTable:
						'看起来这不是一个可启动的镜像。\n\n这个镜像似乎不包含分区表，因此您的设备可能无法识别或无法正确启动。',
					driveMissingPartitionTable:
						'看起来这不是可引导磁盘。\n这个磁盘似乎不包含分区表，\n因此您的设备可能无法识别或无法正确启动。',
					largeDriveSize:
						'这是个很大的磁盘！请检查并确认它不包含对您很重要的信息',
					systemDrive: '选择系统盘很危险，因为这将会删除你的系统',
					sourceDrive: '源镜像位于这个分区中',
					noSpace: '磁盘空间不足。 请插入另一个较大的磁盘并重试。',
					genericFlashError:
						'出了点问题。如果源镜像曾被压缩过，请检查它是否已损坏。',
					validation:
						'写入已成功完成，但 Etcher 在从磁盘读取镜像时检测到潜在的损坏问题。 \n\n请考虑将镜像写入其他磁盘。',
					openError: '打开 {{source}} 时出错。\n\n错误信息： {{error}}',
					flashError: '烧录 {{image}} 到 {{target}} 失败。',
					unplug:
						'看起来 Etcher 失去了对磁盘的连接。 它是不是被意外拔掉了？\n\n有时这个错误是因为读卡器出了故障。',
					cannotWrite:
						'看起来 Etcher 无法写入磁盘的这个位置。 此错误通常是由故障的磁盘、读取器或端口引起的。 \n\n请使用其他磁盘、读卡器或端口重试。',
					childWriterDied:
						'写入进程意外崩溃。请再试一次，如果问题仍然存在，请联系 Etcher 团队。',
					badProtocol: '仅支持 http:// 和 https:// 开头的网址。',
				},
				target: {
					selectTarget: '选择目标磁盘',
					plugTarget: '请插入目标磁盘',
					targets: '个目标',
					change: '更改',
				},
				menu: {
					edit: '编辑',
					view: '视图',
					devTool: '打开开发者工具',
					window: '窗口',
					help: '帮助',
					pro: 'Etcher 专业版',
					website: 'Etcher 的官网',
					issue: '提交一个 issue',
					about: '关于 Etcher',
					hide: '隐藏 Etcher',
					hideOthers: '隐藏其它窗口',
					unhide: '取消隐藏',
					quit: '退出 Etcher',
				},
				source: {
					useSourceURL: '使用镜像网络地址',
					auth: '验证',
					username: '输入用户名',
					password: '输入密码',
					unsupportedProtocol: '不支持的协议',
					windowsImage: '这可能是 Windows 系统镜像',
					partitionTable: '找不到分区表',
					errorOpen: '打开源镜像时出错',
					fromFile: '从文件烧录',
					fromURL: '从在线地址烧录',
					clone: '克隆磁盘',
					image: '镜像信息',
					name: '名称：',
					path: '路径：',
					selectSource: '选择源',
					plugSource: '请插入源磁盘',
					osImages: '系统镜像格式',
					allFiles: '任何文件格式',
					enterValidURL: '请输入一个正确的地址',
				},
				drives: {
					name: '名称',
					size: '大小',
					location: '位置',
					find: '找到 {{length}} 个',
					select: '选定 {{select}}',
					showHidden: '显示 {{num}} 个隐藏的磁盘',
					systemDriveDanger: '选择系统盘很危险，因为这将会删除你的系统！',
					openInBrowser: 'Etcher 会在浏览器中打开 {{link}}',
					changeTarget: '改变目标',
					largeDriveWarning: '您即将擦除一个非常大的磁盘',
					largeDriveWarningMsg: '您确定所选磁盘不是存储磁盘吗？',
					systemDriveWarning: '您将要擦除系统盘',
					systemDriveWarningMsg: '您确定要烧录到系统盘吗？',
				},
				flash: {
					another: '烧录另一目标',
					target: '目标',
					location: '位置',
					error: '错误',
					flash: '烧录',
					flashNow: '现在烧录！',
					skip: '跳过了验证',
					moreInfo: '更多信息',
					speedTip:
						'通过将图像大小除以烧录时间来计算速度。\n由于我们能够跳过未使用的部分，因此具有EXT分区的磁盘镜像烧录速度更快。',
					speed: '速度：',
					failedTarget: '失败的烧录目标',
					failedRetry: '重试烧录失败目标',
				},
				settings: {
					errorReporting: '匿名地向 balena.io 报告运行错误和使用统计',
					autoUpdate: '自动更新',
					settings: '软件设置',
					systemInformation: '系统信息',
				},
			},
		},
		en: {
			translation: {
				continue: 'Continue',
				ok: 'OK',
				cancel: 'Cancel',
				skip: 'Skip',
				sure: "Yes, I'm sure",
				warning: 'WARNING! ',
				attention: 'Attention',
				failed: 'Failed',
				completed: 'Completed',
				yesContinue: 'Yes, continue',
				reallyExit: 'Are you sure you want to close Etcher?',
				yesExit: 'Yes, quit',
				progress: {
					starting: 'Starting...',
					decompressing: 'Decompressing...',
					flashing: 'Flashing...',
					finishing: 'Finishing...',
					verifying: 'Verifying...',
					failing: 'Failed',
				},
				message: {
					sizeNotRecommended: 'Not recommended',
					tooSmall: 'Too small',
					locked: 'Locked',
					system: 'System drive',
					containsImage: 'Source drive',
					largeDrive: 'Large drive',
					sourceLarger:
						'The selected source is {{byte}} larger than this drive.',
					flashSucceed_one: 'Successful target',
					flashSucceed_other: 'Successful targets',
					flashFail_one: 'Failed target',
					flashFail_other: 'Failed targets',
					to: 'to ',
					andFail: 'and failed to be flashed to ',
					target_one: ' target',
					target_other: ' targets',
					succeedTo: 'was successfully flashed',
					exitWhileFlashing:
						'You are currently flashing a drive. Closing Etcher may leave your drive in an unusable state.',
					looksLikeWindowsImage:
						'It looks like you are trying to burn a Windows image.\n\nUnlike other images, Windows images require special processing to be made bootable. We suggest you use a tool specially designed for this purpose, such as <a href="https://rufus.akeo.ie">Rufus</a> (Windows), <a href="https://github.com/slacka/WoeUSB">WoeUSB</a> (Linux), or Boot Camp Assistant (macOS).',
					missingPartitionTable:
						'It looks like this is not a bootable image.\n\nThe image does not appear to contain a partition table, and might not be recognized or bootable by your device.',
					driveMissingPartitionTable:
						'It looks like this is not a bootable drive.\nThe drive does not appear to contain a partition table,\nand might not be recognized or bootable by your device.',
					largeDriveSize:
						"This is a large drive! Make sure it doesn't contain files that you want to keep.",
					systemDrive:
						'Selecting your system drive is dangerous and will erase your drive!',
					sourceDrive: 'Contains the image you chose to flash',
					noSpace:
						'Not enough space on the drive. Please insert larger one and try again.',
					genericFlashError:
						'Something went wrong. If it is a compressed image, please check that the archive is not corrupted.',
					validation:
						'The write has been completed successfully but Etcher detected potential corruption issues when reading the image back from the drive. \n\nPlease consider writing the image to a different drive.',
					openError:
						'Something went wrong while opening {{source}}.\n\nError: {{error}}',
					flashError:
						'Something went wrong while writing {{image}} to {{target}}.',
					unplug:
						"Looks like Etcher lost access to the drive. Did it get unplugged accidentally?\n\nSometimes this error is caused by faulty readers that don't provide stable access to the drive.",
					cannotWrite:
						'Looks like Etcher is not able to write to this location of the drive. This error is usually caused by a faulty drive, reader, or port. \n\nPlease try again with another drive, reader, or port.',
					childWriterDied:
						'The writer process ended unexpectedly. Please try again, and contact the Etcher team if the problem persists.',
					badProtocol: 'Only http:// and https:// URLs are supported.',
				},
				target: {
					selectTarget: 'Select target',
					plugTarget: 'Plug a target drive',
					targets: 'Targets',
					change: 'Change',
				},
				source: {
					useSourceURL: 'Use Image URL',
					auth: 'Authentication',
					username: 'Enter username',
					password: 'Enter password',
					unsupportedProtocol: 'Unsupported protocol',
					windowsImage: 'Possible Windows image detected',
					partitionTable: 'Missing partition table',
					errorOpen: 'Error opening source',
					fromFile: 'Flash from file',
					fromURL: 'Flash from URL',
					clone: 'Clone drive',
					image: 'Image',
					name: 'Name: ',
					path: 'Path: ',
					selectSource: 'Select source',
					plugSource: 'Plug a source drive',
					osImages: 'OS Images',
					allFiles: 'All',
					enterValidURL: 'Enter a valid URL',
				},
				drives: {
					name: 'Name',
					size: 'Size',
					location: 'Location',
					find: '{{length}} found',
					select: 'Select {{select}}',
					showHidden: 'Show {{num}} hidden',
					systemDriveDanger:
						'Selecting your system drive is dangerous and will erase your drive!',
					openInBrowser: '`Etcher will open {{link}} in your browser`',
					changeTarget: 'Change target',
					largeDriveWarning: 'You are about to erase an unusually large drive',
					largeDriveWarningMsg:
						'Are you sure the selected drive is not a storage drive?',
					systemDriveWarning: "You are about to erase your computer's drives",
					systemDriveWarningMsg:
						'Are you sure you want to flash your system drive?',
				},
				flash: {
					another: 'Flash another',
					target: 'Target',
					location: 'Location',
					error: 'Error',
					flash: 'Flash',
					flashNow: 'Flash!',
					skip: 'Validation has been skipped',
					moreInfo: 'more info',
					speedTip:
						'The speed is calculated by dividing the image size by the flashing time.\nDisk images with ext partitions flash faster as we are able to skip unused parts.',
					speed: 'Effective speed: ',
					failedTarget: 'Failed targets',
					failedRetry: 'Retry failed targets',
				},
				settings: {
					errorReporting:
						'Anonymously report errors and usage statistics to balena.io',
					autoUpdate: 'Auto-updates enabled',
					settings: 'Settings',
					systemInformation: 'System Information',
				},
				menu: {
					edit: 'Edit',
					view: 'View',
					devTool: 'Toggle Developer Tools',
					window: 'Window',
					help: 'Help',
					pro: 'Etcher Pro',
					website: 'Etcher Website',
					issue: 'Report an issue',
					about: 'About Etcher',
					hide: 'Hide Etcher',
					hideOthers: 'Hide Others',
					unhide: 'Unhide All',
					quit: 'Quit Etcher',
				},
			},
		},
	},
});

export default i18next;
