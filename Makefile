ELECTRON_PACKAGER=./node_modules/.bin/electron-packager
ELECTRON_BUILDER=./node_modules/.bin/electron-builder
ELECTRON_IGNORE=$(shell cat package.ignore | tr "\\n" "|" | sed "s/.$$//")
ELECTRON_VERSION=0.36.0
APPLICATION_NAME="Etcher"

release/Etcher-darwin-x64: .
	$(ELECTRON_PACKAGER) . $(APPLICATION_NAME) \
		--platform=darwin \
		--arch=x64 \
		--version=$(ELECTRON_VERSION) \
		--ignore="$(ELECTRON_IGNORE)" \
		--asar \
		--icon="assets/icon.icns" \
		--overwrite \
		--out=release/

release/Etcher-linux-ia32: .
	$(ELECTRON_PACKAGER) . $(APPLICATION_NAME) \
		--platform=linux \
		--arch=ia32 \
		--version=$(ELECTRON_VERSION) \
		--ignore="$(ELECTRON_IGNORE)" \
		--asar \
		--overwrite \
		--out=release/

release/Etcher-linux-x64: .
	$(ELECTRON_PACKAGER) . $(APPLICATION_NAME) \
		--platform=linux \
		--arch=x64 \
		--version=$(ELECTRON_VERSION) \
		--ignore="$(ELECTRON_IGNORE)" \
		--asar \
		--overwrite \
		--out=release/

release/Etcher-win32-ia32: .
	$(ELECTRON_PACKAGER) . $(APPLICATION_NAME) \
		--platform=win32 \
		--arch=ia32 \
		--version=$(ELECTRON_VERSION) \
		--ignore="$(ELECTRON_IGNORE)" \
		--icon="assets/icon.ico" \
		--asar \
		--overwrite \
		--out=release/

release/Etcher-win32-x64: .
	$(ELECTRON_PACKAGER) . $(APPLICATION_NAME) \
		--platform=win32 \
		--arch=x64 \
		--version=$(ELECTRON_VERSION) \
		--ignore="$(ELECTRON_IGNORE)" \
		--icon="assets/icon.ico" \
		--asar \
		--overwrite \
		--out=release/

release/installers/Etcher.dmg: release/Etcher-darwin-x64 package.json
	$(ELECTRON_BUILDER) "$</$(APPLICATION_NAME).app" \
		--platform=osx \
		--out=release/installers

release/installers/Etcher-linux-x64.tar.gz: release/Etcher-linux-x64
	mkdir -p $(dir $@)
	tar -zcf $@ $<

release/installers/Etcher-linux-ia32.tar.gz: release/Etcher-linux-ia32
	mkdir -p $(dir $@)
	tar -zcf $@ $<

release/installers/Etcher-x64.exe: release/Etcher-win32-x64 package.json
	$(ELECTRON_BUILDER) $< \
		--platform=win \
		--out=release/installers/win-x64
	mv release/installers/win-x64/Etcher\ Setup.exe $@
	rmdir release/installers/win-x64

release/installers/Etcher.exe: release/Etcher-win32-ia32 package.json
	$(ELECTRON_BUILDER) $< \
		--platform=win \
		--out=release/installers/win-ia32
	mv release/installers/win-ia32/Etcher\ Setup.exe $@
	rmdir release/installers/win-ia32

package-osx: release/Etcher-darwin-x64
package-linux: release/Etcher-linux-ia32 release/Etcher-linux-x64
package-win32: release/Etcher-win32-ia32 release/Etcher-win32-x64
package-all: package-osx package-linux package-win32

installer-osx: release/installers/Etcher.dmg
installer-linux: release/installers/Etcher-linux-x64.tar.gz release/installers/Etcher-linux-ia32.tar.gz
installer-win32: release/installers/Etcher-x64.exe release/installers/Etcher.exe
installer-all: installer-osx installer-linux installer-win32

clean:
	rm -rf release/
