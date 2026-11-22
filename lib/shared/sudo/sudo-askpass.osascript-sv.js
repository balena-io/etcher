#!/usr/bin/env osascript -l JavaScript

ObjC.import('stdlib');

const app = Application.currentApplication();
app.includeStandardAdditions = true;

const result = app.displayDialog(
	'balenaEtcher behöver administratörsbehörighet för att skriva till diskar.\n\nAnge ditt lösenord för att fortsätta.',
	{
		defaultAnswer: '',
		withIcon: 'caution',
		buttons: ['Avbryt', 'OK'],
		defaultButton: 'OK',
		hiddenAnswer: true,
	},
);

if (result.buttonReturned === 'OK') {
	result.textReturned;
} else {
	$.exit(255);
}
