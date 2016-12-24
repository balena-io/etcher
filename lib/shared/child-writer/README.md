Etcher Child Writer
===================

This module is in charge of dealing with the gory details of elevating and
managing the child writer process. As a word of warning, it contains tons of
workarounds and "hacks" to deal with platform differences, packaging, and
inter-process communication. This empowers us to write this small guide to
explain how it works in a more high level manner, hoping to make it easier to
grok for contributors.

The problem
-----------

Elevating a forked process is an easy task. Thanks to the widely available NPM
modules to display nice GUI prompt dialogs, elevation is just a matter of
executing the process with one of those modules instead of with `child_process`
directly.

The main problems we faced are:

- The modules that implement elevation provide "execution" support, but don't
  allow us to fork/spawn the process and consume its `stdout` and `stderr` in a
  stream fashion. This also means that we can't use the nice `process.send` IPC
  communication channel directly that `child_process.fork` gives us to send
  messages back to the parent.

- Since we can't assume anything from the environment Etcher is running on, we
  must make use of the same application entry point to execute both the GUI and
  the CLI code, which starts to get messy once we throw `asar` packaging into
  the mix.

- Each elevation mechanism has its quirks, mainly on GNU/Linux. Making sure
  that the forked process was elevated correctly and could work without issues
  required various workarounds targeting `pkexec` or `kdesudo`.

How it works
------------

The Etcher binary runs in CLI or GUI mode depending on an environment variable
called `ELECTRON_RUN_AS_NODE`. When this variable is set, it instructs Electron
to run as a normal NodeJS process (without Chromium, etc), but still keep any
patches applied by Electron, like `asar` support.

When the Etcher GUI is ran, and the user presses the "Flash!" button, the GUI
creates an IPC server, and forks a process called the "writer proxy", passing
it all the required information to perform the flashing, such as the image
path, the device path, the current settings, etc.

The writer proxy then checks if its currently elevated, and if not, prompts the
user for elevation and re-spawns itself.

Once the writer proxy has enough permissions to directly access devices, it
spawns the Etcher CLI passing the `--robot` option along with all the
information gathered before. The `--robot` option basically tells the Etcher
CLI to output state information in a way that can be very easily parsed by the
parent process.

The output of the Etcher CLI is then sent to the IPC server that was opened by
the GUI, which nicely displays them in the progress bar the user sees.

Summary
-------

There are lots of details we're omitting for the sake of clarity. Feel free to
dive in inside the child writer code, which is heavily commented to explain the
reasons behind each decision or workaround.

Don't hesitate in getting in touch if you have any suggestion, or just want to
know more!
