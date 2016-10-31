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
  --robot, -r    parse-able output without interactivity
  --yes, -y      confirm non-interactively
  --unmount, -u  unmount on success
```

The robot option
----------------

The `--robot` option is very particular since it allows other applications to
easily consume the output of the Etcher CLI in real-time. When using the
`--robot` option, the `--yes` option is implicit, therefore you need to
manually specify `--drive`.

When `--robot` is used, the program will output JSON lines containing the
progress state and other useful information. For example:

```
$ sudo etcher image.iso --robot --drive /dev/disk2
{"command":"progress","data":{"type":"write","percentage":1,"eta":130,"speed":1703936}}
...
{"command":"progress","data":{"type":"check","percentage":100,"eta":0,"speed":17180514}}
{"command":"done","data":{"sourceChecksum":"27c39a5d"}}
```

The `command` property can be used to determine the action taking place, while
the `data` property contains extra information related to the command.

Exit codes
----------

The Etcher CLI uses certain exit codes to signal the result of the operation.
These are documented in [`lib/src/exit-codes.js`][exit-codes] and are also
printed on the Etcher CLI help page.

[exit-codes]: https://github.com/resin-io/etcher/blob/master/lib/src/exit-codes.js
