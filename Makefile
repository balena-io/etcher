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

package-osx: release/Etcher-darwin-x64
package-linux: release/Etcher-linux-ia32 release/Etcher-linux-x64
package-win32: release/Etcher-win32-ia32 release/Etcher-win32-x64
package-all: package-osx package-linux package-win32

release/installers/Etcher.dmg: release/Etcher-darwin-x64 package.json
	$(ELECTRON_BUILDER) "$</$(APPLICATION_NAME).app" \
		--platform=osx \
		--out=release/installers

installer-osx: release/installers/Etcher.dmg

clean:
	rm -rf release/
