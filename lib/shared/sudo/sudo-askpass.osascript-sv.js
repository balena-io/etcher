#!/usr/bin/env osascript -l JavaScript

ObjC.import('stdlib')

const app = Application.currentApplication()
app.includeStandardAdditions = true

const result = app.displayDialog('balenaEtcher behöver privilegierad åtkomst för att flasha diskar.\n\nAnge ditt lösenord för att fortsätta.', {
  defaultAnswer: '',
  withIcon: 'caution',
  buttons: ['Avbryt', 'Ok'],
  defaultButton: 'Ok',
  hiddenAnswer: true,
})

if (result.buttonReturned === 'Ok') {
  result.textReturned
} else {
  $.exit(255)
}
