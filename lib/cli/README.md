Etcher CLI
==========

The Etcher CLI is a command line interface to the Etcher writer backend, and
currently the only module in the "Etcher" umbrella that makes use of this
backend directly.

This module also has the task of unmounting the drives before and after
flashing.

Notice the Etcher CLI is not worried about elevation, and assumes it has enough
permissions to continue, throwing an error otherwise.

Exit codes
----------

The Etcher CLI uses certain exit codes to signal the result of the operation.
These are documented in [`lib/shared/exit-codes.js`][exit-codes] and are also
printed on the Etcher CLI help page.

[exit-codes]: https://github.com/resin-io/etcher/blob/master/lib/shared/exit-codes.js
