ELECTRON_PACKAGER=./node_modules/.bin/electron-packager
ELECTRON_BUILDER=./node_modules/.bin/electron-builder
ELECTRON_OSX_SIGN=./node_modules/.bin/electron-osx-sign
ELECTRON_IGNORE=$(shell node -e "console.log(require('./package.json').packageIgnore.join('|'))")
ELECTRON_VERSION=0.36.8
ETCHER_VERSION=$(shell node -e "console.log(require('./package.json').version)")
APPLICATION_NAME=$(shell node -e "console.log(require('./package.json').displayName)")
APPLICATION_DESCRIPTION=$(shell node -e "console.log(require('./package.json').description)")
APPLICATION_COPYRIGHT=$(shell node -e "console.log(require('./package.json').copyright)")
COMPANY_NAME="Resinio Ltd"
SIGN_IDENTITY_OSX="Developer ID Application: Rulemotion Ltd (66H43P8FRG)"
S3_BUCKET="resin-production-downloads"

sign-win32 = osslsigncode sign \
	-certs certificate.crt.pem \
	-key certificate.key.pem \
	-h sha1 \
	-t http://timestamp.comodoca.com \
	-n "$(APPLICATION_NAME) - $(ETCHER_VERSION)"\
	-in $(1) \
	-out $(dir $(1))Signed.exe \
	&& mv $(dir $(1))Signed.exe $(1)

etcher-release/Etcher-darwin-x64: .
	$(ELECTRON_PACKAGER) . $(APPLICATION_NAME) \
		--platform=darwin \
		--arch=x64 \
		--version=$(ELECTRON_VERSION) \
		--ignore="$(ELECTRON_IGNORE)" \
		--asar \
		--app-copyright="$(APPLICATION_COPYRIGHT)" \
		--app-version="$(ETCHER_VERSION)" \
		--build-version="$(ETCHER_VERSION)" \
		--helper-bundle-id="io.resin.etcher-helper" \
		--app-bundle-id="io.resin.etcher" \
		--app-category-type="public.app-category.developer-tools" \
		--icon="assets/icon.icns" \
		--overwrite \
		--out=$(dir $@)
	rm $@/LICENSE
	rm $@/LICENSES.chromium.html
	rm $@/version

etcher-release/Etcher-linux-x86: .
	$(ELECTRON_PACKAGER) . $(APPLICATION_NAME) \
		--platform=linux \
		--arch=ia32 \
		--version=$(ELECTRON_VERSION) \
		--ignore="$(ELECTRON_IGNORE)" \
		--asar \
		--app-version="$(ETCHER_VERSION)" \
		--build-version="$(ETCHER_VERSION)" \
		--overwrite \
		--out=$(dir $@)
	mv $(dir $@)Etcher-linux-ia32 $@

etcher-release/Etcher-linux-x64: .
	$(ELECTRON_PACKAGER) . $(APPLICATION_NAME) \
		--platform=linux \
		--arch=x64 \
		--version=$(ELECTRON_VERSION) \
		--ignore="$(ELECTRON_IGNORE)" \
		--asar \
		--app-version="$(ETCHER_VERSION)" \
		--build-version="$(ETCHER_VERSION)" \
		--overwrite \
		--out=$(dir $@)

etcher-release/Etcher-win32-x86: .
	$(ELECTRON_PACKAGER) . $(APPLICATION_NAME) \
		--platform=win32 \
		--arch=ia32 \
		--version=$(ELECTRON_VERSION) \
		--ignore="$(ELECTRON_IGNORE)" \
		--icon="assets/icon.ico" \
		--asar \
		--app-copyright="$(APPLICATION_COPYRIGHT)" \
		--app-version="$(ETCHER_VERSION)" \
		--build-version="$(ETCHER_VERSION)" \
		--version-string.CompanyName=$(COMPANY_NAME) \
		--version-string.FileDescription="$(APPLICATION_NAME)" \
		--version-string.OriginalFilename=$(notdir $@) \
		--version-string.ProductName="$(APPLICATION_NAME) -- $(APPLICATION_DESCRIPTION)" \
		--version-string.InternalName="$(APPLICATION_NAME)" \
		--overwrite \
		--out=$(dir $@)
	mv $(dir $@)Etcher-win32-ia32 $@
	$(call sign-win32,$@/Etcher.exe)

etcher-release/Etcher-win32-x64: .
	$(ELECTRON_PACKAGER) . $(APPLICATION_NAME) \
		--platform=win32 \
		--arch=x64 \
		--version=$(ELECTRON_VERSION) \
		--ignore="$(ELECTRON_IGNORE)" \
		--icon="assets/icon.ico" \
		--asar \
		--app-copyright="$(APPLICATION_COPYRIGHT)" \
		--app-version="$(ETCHER_VERSION)" \
		--build-version="$(ETCHER_VERSION)" \
		--version-string.CompanyName=$(COMPANY_NAME) \
		--version-string.FileDescription="$(APPLICATION_NAME)" \
		--version-string.OriginalFilename=$(notdir $@) \
		--version-string.ProductName="$(APPLICATION_NAME) -- $(APPLICATION_DESCRIPTION)" \
		--version-string.InternalName="$(APPLICATION_NAME)" \
		--overwrite \
		--out=$(dir $@)
	$(call sign-win32,$@/Etcher.exe)

etcher-release/installers/Etcher-darwin-x64.dmg: etcher-release/Etcher-darwin-x64 package.json
	# Create temporal read-write DMG image
	hdiutil create \
		-srcfolder $< \
		-volname "$(APPLICATION_NAME)" \
		-fs HFS+ \
		-fsargs "-c c=64,a=16,e=16" \
		-format UDRW \
		-size 600M $<.dmg
	# Mount temporal DMG image, so we can modify it
	hdiutil attach $<.dmg -readwrite -noverify
	# Wait for a bit to ensure the image is mounted
	sleep 2
	# Link to /Applications within the DMG
	pushd /Volumes/$(APPLICATION_NAME) && ln -s /Applications && popd
	# Symlink MacOS/Etcher to MacOS/Electron since for some reason, the Electron
	# binary tries to be ran in some systems.
	# See https://github.com/Microsoft/vscode/issues/92
	cp -p /Volumes/$(APPLICATION_NAME)/$(APPLICATION_NAME).app/Contents/MacOS/Etcher /Volumes/$(APPLICATION_NAME)/$(APPLICATION_NAME).app/Contents/MacOS/Electron
	# Set the DMG icon image
	# Writing this hexadecimal buffer to the com.apple.FinderInfo
	# extended attribute does the trick.
	# See https://github.com/LinusU/node-appdmg/issues/14#issuecomment-29080500
	cp assets/icon.icns /Volumes/$(APPLICATION_NAME)/.VolumeIcon.icns
	xattr -wx com.apple.FinderInfo "0000000000000000040000000000000000000000000000000000000000000000" /Volumes/$(APPLICATION_NAME)
	# Configure background image.
	# We use tiffutil to create a "Multirepresentation Tiff file".
	# This allows us to show the retina and non-retina image when appropriate.
	mkdir /Volumes/$(APPLICATION_NAME)/.background
	tiffutil -cathidpicheck assets/osx/installer.png assets/osx/installer@2x.png \
		-out /Volumes/$(APPLICATION_NAME)/.background/installer.tiff
	# This AppleScript performs the following tasks
	# - Set the window basic properties.
	# - Set the window size and position.
	# - Set the icon size.
	# - Arrange the icons.
	echo ' \
		 tell application "Finder" \n\
			 tell disk "$(APPLICATION_NAME)" \n\
				 open \n\
				 set current view of container window to icon view \n\
				 set toolbar visible of container window to false \n\
				 set statusbar visible of container window to false \n\
				 set the bounds of container window to {400, 100, 944, 530} \n\
				 set viewOptions to the icon view options of container window \n\
				 set arrangement of viewOptions to not arranged \n\
				 set icon size of viewOptions to 110 \n\
				 set background picture of viewOptions to file ".background:installer.tiff" \n\
				 set position of item "$(APPLICATION_NAME).app" of container window to {140, 225} \n\
				 set position of item "Applications" of container window to {415, 225} \n\
				 close \n\
				 open \n\
				 update without registering applications \n\
				 delay 2 \n\
				 close \n\
			 end tell \n\
		 end tell \n\
	' | osascript
	sync
	# Sign the *.app with `electron-osx-sign`
	# See https://github.com/electron-userland/electron-osx-sign
	$(ELECTRON_OSX_SIGN) /Volumes/$(APPLICATION_NAME)/$(APPLICATION_NAME).app \
		--platform darwin \
		--verbose \
		--identity $(SIGN_IDENTITY_OSX)
	# Light signature verification.
	# This might pass even if Gatekeeper pass.
	codesign --verify --deep --display --verbose=4 \
		"/Volumes/$(APPLICATION_NAME)/$(APPLICATION_NAME).app"
	# Hard signature check. This represents what users will see.
	spctl --ignore-cache --no-cache --assess --type execute --verbose=4 \
		"/Volumes/$(APPLICATION_NAME)/$(APPLICATION_NAME).app"
	# Unmount temporal DMG image.
	hdiutil detach /Volumes/$(APPLICATION_NAME)
	# Convert temporal DMG image into a production-ready
	# compressed and read-only DMG image.
	mkdir -p $(dir $@)
	hdiutil convert $<.dmg \
		-format UDZO \
		-imagekey zlib-level=9 \
		-o $@
	# Cleanup temporal DMG image.
	rm $<.dmg

etcher-release/installers/Etcher-linux-x64.tar.gz: etcher-release/Etcher-linux-x64
	mkdir -p $(dir $@)
	tar -zcf $@ $<

etcher-release/installers/Etcher-linux-x86.tar.gz: etcher-release/Etcher-linux-x86
	mkdir -p $(dir $@)
	tar -zcf $@ $<

etcher-release/installers/Etcher-win32-x64.exe: etcher-release/Etcher-win32-x64 package.json
	$(ELECTRON_BUILDER) $< \
		--platform=win \
		--out=$(dir $@)win32-x64
	mv $(dir $@)win32-x64/Etcher\ Setup.exe $@
	rmdir $(dir $@)win32-x64
	$(call sign-win32,$@)

etcher-release/installers/Etcher-win32-x86.exe: etcher-release/Etcher-win32-x86 package.json
	$(ELECTRON_BUILDER) $< \
		--platform=win \
		--out=$(dir $@)win32-x86
	mv $(dir $@)win32-x86/Etcher\ Setup.exe $@
	rmdir $(dir $@)win32-x86
	$(call sign-win32,$@)

package-osx: etcher-release/Etcher-darwin-x64
package-linux: etcher-release/Etcher-linux-x86 etcher-release/Etcher-linux-x64
package-win32: etcher-release/Etcher-win32-x86 etcher-release/Etcher-win32-x64
package-all: package-osx package-linux package-win32

installer-osx: etcher-release/installers/Etcher-darwin-x64.dmg
installer-linux: etcher-release/installers/Etcher-linux-x64.tar.gz etcher-release/installers/Etcher-linux-x86.tar.gz
installer-win32: etcher-release/installers/Etcher-win32-x64.exe etcher-release/installers/Etcher-win32-x86.exe
installer-all: installer-osx installer-linux installer-win32

S3_UPLOAD=aws s3api put-object \
	--bucket $(S3_BUCKET) \
	--acl public-read \
	--key etcher/$(ETCHER_VERSION)/$(notdir $<) \
	--body $<

upload-linux-x64: etcher-release/installers/Etcher-linux-x64.tar.gz ; $(S3_UPLOAD)
upload-linux-x86: etcher-release/installers/Etcher-linux-x86.tar.gz ; $(S3_UPLOAD)
upload-win32-x64: etcher-release/installers/Etcher-win32-x64.exe ; $(S3_UPLOAD)
upload-win32-x86: etcher-release/installers/Etcher-win32-x86.exe ; $(S3_UPLOAD)

upload-osx: etcher-release/installers/Etcher-darwin-x64.dmg ; $(S3_UPLOAD)
upload-linux: upload-linux-x64 upload-linux-x86
upload-win32: upload-win32-x64 upload-win32-x86
upload-all: upload-osx upload-linux upload-win32

release:
	rm -rf node_modules/
	npm install --force
	make upload-all

clean:
	rm -rf etcher-release/
