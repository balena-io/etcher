# i18n

## How it was done

Using the open-source lib [i18next](https://www.i18next.com/).

## How to add your own language

1. Go to `lib/gui/app/i18n` and add a file named `xx.ts` (use the codes mentioned
   in [the link](https://www.science.co.il/language/Locale-codes.php), and we support styles as `fr`, `de`, `es-ES`
   and `pt-BR`)
   .
2. Copy the content from an existing translation and start to translate.
3. Once done, go to `lib/gui/app/i18n.ts` and add a line of `import xx_translation from './i18n/xx'` after the
   already-added imports and add `xx: xx_translation` in the `resources` section of `i18next.init()` function.
4. Now go to `lib/shared/catalina-sudo/` and copy the `sudo-askpass.osascript-en.js`, change it to
   be `sudo-askpass.osascript-xx.js` and edit
   the `'balenaEtcher needs privileged access in order to flash disks.\n\nType your password to allow this.'` line and
   those `Ok`s and `Cancel`s to your own language.
5. If, your language has several variations when they are used in several countries/regions, such as `zh-CN` and `zh-TW`
   , or `pt-BR` and `pt-PT`, edit
   the `langParser()` in the `lib/gui/app/i18n.ts` file to meet your need.
6. Make a commit, and then a pull request on GitHub.