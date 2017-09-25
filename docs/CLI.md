Etcher CLI
==========

The Etcher CLI is a command-line tool that aims to provide all the benefits of
the Etcher desktop application in a way that can be run from a terminal, or
even used from a script.

In fact, the Etcher desktop application is simply a wrapper around the CLI,
which is the place where the actual writing logic takes place.

Installing
----------

Head over to [etcher.io/cli][etcher-cli], download the package that corresponds to
your operating system, and then follow the installation instructions there.

Running
-------

```sh
etcher -v
```

Options
-------

```
  --help, -h     show help
  --version, -v  show version number
  --drive, -d    drive
  --check, -c    validate write
  --yes, -y      confirm non-interactively
  --unmount, -u  unmount on success
```

Debug mode
----------

You can set the `ETCHER_CLI_DEBUG` environment variable to make the Etcher CLI
print error stack traces.

[etcher-cli]: https://etcher.io/cli
