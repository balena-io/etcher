Etcher CLI
==========

The Etcher CLI is a command line interface to the Etcher writer backend, and
currently the only module in the "Etcher" umbrella that makes use of this
backend directly.

This module also has the task of unmounting the drives before and after
flashing.

Notice the Etcher CLI is not worried about elevation, and assumes it has enough
permissions to continue, throwing an error otherwise. Consult the
[`lib/child-writer`][child-writer] module to understand how elevation works on
Etcher.

The robot option
----------------

Setting the `ETCHER_CLI_ROBOT` environment variable allows other applications
to easily consume the output of the Etcher CLI in real-time. When using the
`ETCHER_CLI_ROBOT` option, the `--yes` option is implicit, therefore you need
to manually specify `--drive`.

When `ETCHER_CLI_ROBOT` is used, the program will output JSON lines containing
the progress state and other useful information. For example:

```
$ sudo ETCHER_CLI_ROBOT=1 etcher image.iso --drive /dev/disk2
{"command":"progress","data":{"type":"write","percentage":1,"eta":130,"speed":1703936}}
...
{"command":"progress","data":{"type":"check","percentage":100,"eta":0,"speed":17180514}}
{"command":"done","data":{"sourceChecksum":"27c39a5d"}}
```

See documentation about the robot mode at [`lib/shared/robot`][robot].

Exit codes
----------

The Etcher CLI uses certain exit codes to signal the result of the operation.
These are documented in [`lib/shared/exit-codes.js`][exit-codes] and are also
printed on the Etcher CLI help page.

[exit-codes]: https://github.com/resin-io/etcher/blob/master/lib/shared/exit-codes.js
[robot]: https://github.com/resin-io/etcher/tree/master/lib/shared/robot
[child-writer]: https://github.com/resin-io/etcher/tree/master/lib/child-writer
