### macOS and GNU/Linux

- Extract the `.tar.gz` package by running:

```sh
tar fvx path/to/cli.tar.gz
```

- Move the resulting directory to `/opt/etcher-cli`

- Add `/opt/etcher-cli` to the `PATH`. For example, add the following to
  `.bashrc` or `.zshrc`:

```sh
export PATH="$PATH:/opt/etcher-cli"
```

### Windows

- Unzip the `.zip` package by right-clicking on it and selecting "Extract All"

- Move the resulting directory to `C:\etcher-cli`

- Add `C:\etcher-cli` to the `%PATH%`

  - On Windows 10 and Windows 8
    - Open *Control Panel*
    - Open *System
    - Click the *Advanced system settings* link
    - Click *Environment Variables*
    - Find the `PATH` environment variable, and click *Edit*
    - Append `;C:\etcher-cli` to the environment variable value
    - Click *OK*

  - On Windows 7
    - Right-click the *My Computer* icon
    - Open the *Properties* menu
    - Open the *Advanced* tab
    - Click *Environment Variables*
    - Find the `PATH` environment variable, and click *Edit*
    - Append `;C:\etcher-cli` to the environment variable value
    - Click *OK*

  - Re-open `cmd.exe`, or PowerShell

### Running

```sh
etcher -v
```

### Options

```
  --help, -h     show help
  --version, -v  show version number
  --drive, -d    drive
  --check, -c    validate write
  --yes, -y      confirm non-interactively
  --unmount, -u  unmount on success
```
