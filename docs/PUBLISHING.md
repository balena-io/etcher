Publishing Etcher
=================

This fork builds and publishes its own releases from GitHub Actions
(`.github/workflows/build.yml`). Nothing is published to balena's channels.

Cutting a release
-----------------

1. Bump `version` in `package.json` and the two matching `version` fields at
   the top of `npm-shrinkwrap.json`.
2. Add a section to `CHANGELOG.md`.
3. Commit, then tag and push:

   ```sh
   git tag -a v2.1.7 -m v2.1.7
   git push origin v2.1.7
   ```

Pushing a `v*` tag builds all four targets and publishes them to a GitHub
release along with `SHA256SUMS.txt`. The release job only runs if every
platform built, so a release is never partially populated.

| Target       | Runner            | Artifacts                |
| ------------ | ----------------- | ------------------------ |
| Linux x64    | `ubuntu-22.04`    | `.deb`, `.rpm`, `.zip`   |
| Windows x64  | `windows-2022`    | `Setup.exe`, `.zip`      |
| macOS arm64  | `macos-15`        | `.dmg`, `.zip`           |
| macOS x64    | `macos-15-intel`  | `.dmg`, `.zip`           |

Building locally
----------------

```sh
npm ci
npm run install-win-deps   # Windows only; a no-op elsewhere
npm run make
```

Artifacts land in `out/make`.

**Node 24 is required — not merely recommended.** `forge.sidecar.ts` packages
the `etcher-util` sidecar with `pkg --target node24.18.1`, so the sidecar
embeds a Node 24 runtime. `mountutils` is the one bundled addon that is not
N-API, and it is rebuilt against whichever Node runs the build, so building on
Node 22 (ABI 127) produces an addon the Node 24 sidecar (ABI 137) cannot load.
The failure is silent at build time and only shows up as a sidecar that dies
the moment drive scanning starts. `engines` pins this. Patch releases share an
ABI, so any 24.x will do; changing major means changing the `pkg --target` to
match.

Two consequences of npm 11, which ships with Node 24:

- **`allowScripts` in `package.json`** is npm's record of which dependencies
  may run install scripts. Without it npm silently skips them — including
  Electron's own, which is what downloads the Electron binary, so nothing
  builds at all. Adding or upgrading a dependency with an install script means
  re-running `npm approve-scripts --all` and committing the result.
- **`@electron/node-gyp` is overridden** to the real `node-gyp`. It arrives via
  `@electron/rebuild`, declares `bin: node-gyp`, and so owns
  `node_modules/.bin/node-gyp` — which npm puts ahead of everything else on
  PATH for install scripts. Every native module then gets built with Electron's
  ClangCL toolchain instead of MSVC, which fails outright unless ClangCL
  happens to be installed. These addons are loaded by the pkg sidecar rather
  than by Electron (see `rebuildConfig.onlyModules: []`), so they must be built
  for Node, making the override the correct behaviour and not just a
  workaround.

`npm run install-win-deps` builds `winusb-driver-generator`, which npm skips on
Windows because its `engines` field caps out below the Node version in use.
Re-run it after **any** `npm install`, not just the first: npm prunes the
package whenever it reconciles the tree. Packaging refuses to continue without
it rather than shipping a sidecar that dies on its first drive scan.

Per-platform prerequisites:

- **Windows** — Visual Studio with the C++ workload. `winusb-driver-generator`
  compiles libwdi from source, and its `deps/embed.bat` invokes `embedder.exe`
  from the working directory, so the build fails with
  `'embedder.exe' is not recognized` if `NoDefaultCurrentDirectoryInExePath=1`
  is set in the environment. Unset it before building.
- **Linux** — `fakeroot`, `dpkg` and `rpm` for the packaging targets. Note that
  `rpmbuild` strips binaries by default, which corrupts the pkg-built sidecar;
  CI works around this with a `%__strip /usr/bin/true` macro in `~/.rpmmacros`.
- **macOS** — Xcode command line tools.

Signing
-------

Released builds are **unsigned**. `forge.config.ts` switches on
`NODE_ENV=production`:

- Unset (the default, and what CI uses) — macOS gets an ad-hoc signature, which
  is the minimum needed for a repackaged arm64 bundle to launch at all. Windows
  is not signed.
- `production` — signs with a Developer ID and notarizes via `notarytool`, and
  signs Windows with `signtool`. This requires `XCODE_APP_LOADER_EMAIL`,
  `XCODE_APP_LOADER_PASSWORD`, `XCODE_APP_LOADER_TEAM_ID`,
  `SM_CODE_SIGNING_CERT_SHA1_HASH` and `TIMESTAMP_SERVER`, plus the
  certificates themselves installed on the runner.

Because the published builds are unsigned, SmartScreen warns on Windows, and
macOS reports the app as damaged until the quarantine flag is cleared:

```sh
xattr -dr com.apple.quarantine /Applications/balenaEtcher.app
```

The release notes repeat this for anyone downloading a build.

Auto-updates
------------

Updates come from **this fork's own releases** — `UPDATE_REPOSITORY` in
`lib/shared/update-support.ts`. A build from here must never replace itself
with one from balena upstream, so that constant is the single place the
repository is named.

`update-electron-app` drives this against `update.electronjs.org`, which reads
the repository's GitHub releases. electron-updater, which the project used
before, cannot: it ships an `NsisUpdater` for Windows and electron-forge
produces Squirrel installers, so there was no configuration that would have
made it work.

What the service needs from a release is produced automatically:

- **Windows** — `RELEASES` and the `.nupkg` alongside `Setup.exe`. These are
  Squirrel's update feed; the workflow publishes them for exactly this reason.
- **macOS** — the `.zip` (Squirrel.Mac updates from a zip, not the `.dmg`).

Requirements and limits:

- The repository must be **public**, since update.electronjs.org will not serve
  a private one.
- **macOS updates require a real Developer ID signature.** Squirrel.Mac refuses
  to update an ad-hoc signed bundle, so unsigned builds check and fail. The
  error is logged and deliberately kept out of Sentry, because it would repeat
  on every interval. Signing the builds is all that is needed to enable it.
- **Windows updates only apply to an installed app.** Squirrel needs its
  `Update.exe`, which exists next to an app installed by `Setup.exe` and not in
  an extracted `.zip`; `isUpdateSupported()` checks for it.
- **Linux is not auto-updated.** `.deb` and `.rpm` are the package manager's
  business and the `.zip` has no updater.
- The `updatesEnabled` setting is read once at startup, since
  `update-electron-app` owns its own timer. Toggling it takes effect on the
  next launch.
