#!/usr/bin/env osascript -l JavaScript

ObjC.import('stdlib')

const app = Application.currentApplication()
app.includeStandardAdditions = true

const result = app.displayDialog('Per eseguire la scrittura dei dischi balenaEtcher necessita di accesso privilegiato .\n\nDigita la password per consentirlo.', {
  defaultAnswer: '',
  withIcon: 'caution',
  buttons: ['Annulla', 'OK'],
  defaultButton: 'OK',
  hiddenAnswer: true,
})

if (result.buttonReturned === 'OK') {
  result.textReturned
} else {
  $.exit(255)
}

