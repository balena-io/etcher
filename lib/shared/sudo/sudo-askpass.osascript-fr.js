#!/usr/bin/env osascript -l JavaScript

ObjC.import('stdlib')

const app = Application.currentApplication()
app.includeStandardAdditions = true

const result = app.displayDialog('balenaEtcher nécessite un accès privilégié afin d\'écrire sur les disques.\n\nSaisissez votre mot de passe pour autoriser cette action.', {
  defaultAnswer: '',
  withIcon: 'caution',
  buttons: ['Annuler', 'OK'],
  defaultButton: 'OK',
  hiddenAnswer: true,
})

if (result.buttonReturned === 'OK') {
  result.textReturned
} else {
  $.exit(255)
}
