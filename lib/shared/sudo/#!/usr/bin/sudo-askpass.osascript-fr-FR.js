#!/usr/bin/env osascript -l JavaScript

ObjC.import('stdlib')

const app = Application.currentApplication()
app.includeStandardAdditions = true

const result = app.displayDialog("balenaEtcher a besoin d'un accès privilégié pour flasher des disques.\n\nTapez votre mot de passe pour autoriser cela.", {
  defaultAnswer: "",
  withIcon: "caution",
  buttons: ["Annuler", "Valider"],
  defaultButton: "D'accord",
  hiddenAnswer: true,
})

if (result.buttonReturned === "Valider") {
  result.textReturned
} else {
  $.exit(255)
}
