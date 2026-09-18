#!/usr/bin/env osascript -l JavaScript

ObjC.import('stdlib')

const app = Application.currentApplication()
app.includeStandardAdditions = true

const result = app.displayDialog('balenaEtcher a besoin de privilèges pour écrire sur le disque.\n\nEntrez votre mot de passe pour l\'y autoriser', {
  defaultAnswer: '',
  withIcon: 'caution',
  buttons: ['Annuler', 'Ok'],
  defaultButton: 'Ok',
  hiddenAnswer: true,
})

if (result.buttonReturned === 'Ok') {
  result.textReturned
} else {
  $.exit(255)
}

