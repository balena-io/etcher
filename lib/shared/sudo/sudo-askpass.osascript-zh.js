#!/usr/bin/env osascript -l JavaScript

ObjC.import('stdlib')

const app = Application.currentApplication()
app.includeStandardAdditions = true

const result = app.displayDialog('balenaEtcher 需要来自管理员的权限才能烧录镜像到磁盘。\n\n输入您的密码以允许此操作。', {
  defaultAnswer: '',
  withIcon: 'caution',
  buttons: ['取消', '好'],
  defaultButton: '好',
  hiddenAnswer: true,
})

if (result.buttonReturned === '好') {
  result.textReturned
} else {
  $.exit(255)
}

