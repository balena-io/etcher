Etcher CLI
==========

The Etcher CLI is a command-line tool that aims to provide all the benefits of
the Etcher desktop application in a way that can be run from a terminal, or
even used from a script.

In fact, the Etcher desktop application is simply a wrapper around the CLI,
which is the place where the actual writing logic takes place.

Running
-------

We are not oficially releasing the Etcher CLI as a separate package yet, but
you can run it locally with the following steps:

- Clone the Etcher repository.

```
git clone https://github.com/resin-io/etcher
```

- Install the dependencies by running:

```sh
npm install
```

- Run the Etcher CLI from `bin/etcher`.

```
./bin/etcher --help
```

Options
-------

```
  --help, -h     show help
  --version, -v  show version number
  --drive, -d    drive
  --check, -c    validate write
  --yes, -y      confirm non-interactively
  --eject, -e    eject on success
```

Debug mode
----------

You can set the `ETCHER_CLI_DEBUG` environment variable to make the Etcher CLI
print error stack traces.
