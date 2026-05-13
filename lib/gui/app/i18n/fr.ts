const translation = {
	translation: {
		continue: 'Continuer',
		ok: 'OK',
		cancel: 'Annuler',
		skip: 'Ignorer',
		sure: 'Oui, je suis sûr',
		warning: 'AVERTISSEMENT ! ',
		attention: 'Attention',
		failed: 'Échec',
		completed: 'Terminé',
		yesContinue: 'Oui, continuer',
		reallyExit: 'Êtes-vous sûr de vouloir fermer Etcher ?',
		yesExit: 'Oui, quitter',
		progress: {
			starting: 'Démarrage...',
			decompressing: 'Décompression...',
			flashing: 'Écriture...',
			finishing: 'Finalisation...',
			verifying: 'Vérification...',
			failing: 'Échec',
		},
		message: {
			sizeNotRecommended: 'Non recommandé',
			tooSmall: 'Trop petit',
			locked: 'Verrouillé',
			system: 'Disque système',
			containsImage: 'Disque source',
			largeDrive: 'Grand disque',
			sourceLarger:
				'La source sélectionnée est plus grande de {{byte}} que ce disque.',
			flashSucceed_one: 'Cible réussie',
			flashSucceed_other: 'Cibles réussies',
			flashFail_one: 'Cible échouée',
			flashFail_other: 'Cibles échouées',
			toDrive: 'vers {{description}} ({{name}})',
			toTarget_one: 'vers {{num}} cible',
			toTarget_other: 'vers {{num}} cibles',
			andFailTarget_one: 'et n’a pas pu être écrite sur {{num}} cible',
			andFailTarget_other: 'et n’a pas pu être écrite sur {{num}} cibles',
			succeedTo: '{{name}} a été correctement écrite {{target}}',
			exitWhileFlashing:
				'Une écriture est en cours. Fermer Etcher maintenant peut rendre votre disque inutilisable.',
			looksLikeWindowsImage:
				'Il semble que vous essayiez de graver une image Windows.\n\nContrairement à d’autres images, les images Windows nécessitent un traitement spécial pour être rendues amorçables. Nous vous recommandons d’utiliser un outil conçu pour cela, comme <a href="https://rufus.akeo.ie">Rufus</a> (Windows), <a href="https://github.com/slacka/WoeUSB">WoeUSB</a> (Linux) ou Assistant Boot Camp (macOS).',
			image: 'image',
			drive: 'disque',
			missingPartitionTable:
				'Il semble que ceci ne soit pas un {{type}} amorçable.\n\nLe {{type}} ne semble pas contenir de table de partition, et pourrait ne pas être reconnu ou amorçable par votre appareil.',
			largeDriveSize:
				'Ceci est un grand disque ! Assurez-vous qu’il ne contient pas de fichiers que vous souhaitez conserver.',
			systemDrive:
				'Sélectionner votre disque système est dangereux et effacera son contenu !',
			sourceDrive: 'Contient l’image que vous avez choisie d’écrire',
			noSpace:
				'Espace insuffisant sur le disque. Veuillez en insérer un plus grand et réessayer.',
			genericFlashError:
				'Une erreur est survenue. Si l’image est compressée, vérifiez que l’archive n’est pas corrompue.\n{{error}}',
			validation:
				'L’écriture s’est terminée avec succès, mais Etcher a détecté des problèmes potentiels de corruption en relisant l’image sur le disque. \n\nVeuillez envisager d’écrire l’image sur un autre disque.',
			openError:
				'Une erreur est survenue lors de l’ouverture de {{source}}.\n\nErreur : {{error}}',
			flashError:
				'Une erreur est survenue lors de l’écriture de {{image}} {{targets}}.',
			unplug:
				'Etcher semble avoir perdu l’accès au disque. A-t-il été débranché accidentellement ?\n\nParfois, cette erreur provient de lecteurs défectueux qui n’offrent pas un accès stable au disque.',
			cannotWrite:
				'Etcher ne peut pas écrire à cet emplacement du disque. Cette erreur est généralement due à un disque, un lecteur ou un port défectueux. \n\nVeuillez réessayer avec un autre disque, lecteur ou port.',
			childWriterDied:
				'Le processus d’écriture s’est arrêté de manière inattendue. Veuillez réessayer et contacter l’équipe Etcher si le problème persiste.',
			badProtocol: 'Seuls les liens http:// et https:// sont pris en charge.',
		},
		target: {
			selectTarget: 'Sélectionner une cible',
			plugTarget: 'Branchez un disque cible',
			targets: 'Cibles',
			change: 'Changer',
		},
		source: {
			useSourceURL: 'Utiliser une URL d’image',
			auth: 'Authentification',
			username: 'Entrer le nom d’utilisateur',
			password: 'Entrer le mot de passe',
			unsupportedProtocol: 'Protocole non pris en charge',
			windowsImage: 'Image Windows détectée',
			partitionTable: 'Table de partition manquante',
			errorOpen: 'Erreur lors de l’ouverture de la source',
			fromFile: 'Écrire à partir d’un fichier',
			fromURL: 'Écrire à partir d’une URL',
			clone: 'Cloner un disque',
			image: 'Image',
			name: 'Nom : ',
			path: 'Chemin : ',
			selectSource: 'Sélectionner une source',
			plugSource: 'Branchez un disque source',
			osImages: 'Images système',
			allFiles: 'Tous les fichiers',
			enterValidURL: 'Entrez une URL valide',
		},
		drives: {
			name: 'Nom',
			size: 'Taille',
			location: 'Emplacement',
			find: '{{length}} trouvé(s)',
			select: 'Sélectionner {{select}}',
			showHidden: 'Afficher {{num}} caché(s)',
			systemDriveDanger:
				'Sélectionner votre disque système est dangereux et effacera son contenu !',
			openInBrowser: '`Etcher ouvrira {{link}} dans votre navigateur`',
			changeTarget: 'Changer de cible',
			largeDriveWarning:
				'Vous êtes sur le point d’effacer un disque inhabituellement grand',
			largeDriveWarningMsg:
				'Êtes-vous sûr que le disque sélectionné n’est pas un disque de stockage ?',
			systemDriveWarning:
				'Vous êtes sur le point d’effacer les disques de votre ordinateur',
			systemDriveWarningMsg:
				'Êtes-vous sûr de vouloir écrire sur votre disque système ?',
		},
		flash: {
			another: 'Écrire un autre',
			target: 'Cible',
			location: 'Emplacement',
			error: 'Erreur',
			flash: 'Écrire',
			flashNow: 'Écrire maintenant !',
			skip: 'La vérification a été ignorée',
			moreInfo: 'plus d’infos',
			speedTip:
				'La vitesse est calculée en divisant la taille de l’image par le temps d’écriture.\nLes images disque avec des partitions ext s’écrivent plus rapidement car les parties inutilisées peuvent être ignorées.',
			speed: 'Vitesse effective : {{speed}} Mo/s',
			speedShort: '{{speed}} Mo/s',
			eta: 'Temps restant : {{eta}}',
			failedTarget: 'Cibles échouées',
			failedRetry: 'Réessayer les cibles échouées',
			flashFailed: 'Écriture échouée.',
			flashCompleted: 'Écriture terminée !',
		},
		settings: {
			errorReporting: 'Signaler anonymement les erreurs à balena.io',
			autoUpdate: 'Mises à jour automatiques activées',
			settings: 'Paramètres',
			systemInformation: 'Informations système',
			trimExtPartitions:
				'Espace libre supprimé sur les images brutes (dans les partitions de type ext)',
		},
		menu: {
			edit: 'Édition',
			view: 'Affichage',
			devTool: 'Afficher les outils de développement',
			window: 'Fenêtre',
			help: 'Aide',
			pro: 'Etcher Pro',
			website: 'Site web d’Etcher',
			issue: 'Signaler un problème',
			about: 'À propos d’Etcher',
			hide: 'Masquer Etcher',
			hideOthers: 'Masquer les autres',
			unhide: 'Tout afficher',
			quit: 'Quitter Etcher',
		},
	},
};

export default translation;
