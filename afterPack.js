"use strict";

const cp = require("child_process");
const fs = require("fs");
const outdent = require("outdent");
const path = require("path");
const builder = require("electron-builder");
const { flipFuses, FuseVersion, FuseV1Options } = require("@electron/fuses");

exports.default = async function (context) {
  if (context.packager.platform.name === "linux") {
    const scriptPath = path.join(
      context.appOutDir,
      context.packager.executableName
    );
    const binPath = scriptPath + ".bin";
    cp.execFileSync("mv", [scriptPath, binPath]);
    fs.writeFileSync(
      scriptPath,
      outdent({ trimTrailingNewline: false })`
      #!/bin/bash

      # Resolve symlinks. Warning, readlink -f doesn't work on MacOS/BSD
      script_dir="$(dirname "$(readlink -f "\${BASH_SOURCE[0]}")")"

      if [[ $EUID -ne 0 ]] || [[ $ELECTRON_RUN_AS_NODE ]]; then
        "\${script_dir}"/${context.packager.executableName}.bin "$@"
      else
        "\${script_dir}"/${context.packager.executableName}.bin "$@" --no-sandbox
      fi
    `
    );
    cp.execFileSync("chmod", ["+x", scriptPath]);
  }

  // Adapted from https://github.com/electron-userland/electron-builder/issues/6365#issue-1033809141
  const ext = {
    darwin: ".app",
    win32: ".exe",
    linux: ".bin",
  }[context.electronPlatformName];

  const IS_LINUX = context.electronPlatformName === "linux";
  const executableName = IS_LINUX
    ? context.packager.appInfo.productFilename.toLowerCase().replace("-dev", "")
    : context.packager.appInfo.productFilename; // .toLowerCase() to accomodate Linux file named `name` but productFileName is `Name` -- Replaces '-dev' because on Linux the executable name is `name` even for the DEV builds

  const IS_APPLE_SILICON =
    context.electronPlatformName === "darwin" &&
    context.arch === builder.Arch.arm64;

  const electronBinaryPath = path.join(
    context.appOutDir,
    `${executableName}${ext}`
  );

  console.log(electronBinaryPath);

  await flipFuses(electronBinaryPath, {
    version: FuseVersion.V1,
    resetAdHocDarwinSignature: IS_APPLE_SILICON, // necessary for building on Apple Silicon
    [FuseV1Options.RunAsNode]: false,
    [FuseV1Options.EnableCookieEncryption]: true,
    [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
    [FuseV1Options.EnableNodeCliInspectArguments]: false,
    // [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true, // Only affects macOS builds, but breaks them -- https://github.com/electron/fuses/issues/7
    [FuseV1Options.OnlyLoadAppFromAsar]: false,
  });
};
