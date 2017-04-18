The "robot" mechanism
=====================

As discussed in [`lib/child-writer`][child-writer], communication between the
main Etcher application and its elevated writer process happens through an IPC
(Inter Process Communication) channel. In a nutshell, we emit every single line
that the writer process prints to the parent as a "message". Since these
"lines" need to convey non-trivial information such as progress information,
speed, final computer checksums, etc we are in need of a basic form of a
"protocol".

The "robot" module is the entity that implements this protocol, and provides
utility functions to read/send messages using the protocol targeted at both
parties (the client and the writer processes).

The contents and structure of these messages is what the "robot" module is
mainly concerned with. Each "message" consists of a type (a "command" in robot
parlance) and an arbitrary data object:

- `String command`: the message command name
- `Object data`: the message data

For example:

*Child process:*

```js
robot.printMessage('my-message-type', {
  my: {
    message: 'data'
  }
});
```

*Parent process:*

```js
const message = robot.parseMessage(line);

console.log(robot.getCommand(message));
> 'my-message-type'

console.log(robot.getData(message));
> {
>   my: {
>     message: 'data'
>   }
> }
```

**Logging debug data to the console:**

*Child process:*

```js
// This will log the passed data to parent's console,
// as `console.log()`ing in the child will cause errors
robot.log({ debugging: 'things' })
```

The codename "robot" is inspired by [xz][xz-man], which provides a `--robot`
option that makes the tool print machine-parseable output:

```
--robot
    Print messages in	a machine-parsable format.  This  is  intended
    to  ease	writing	 frontends  that  want	to  use	 xz instead of
    liblzma, which may be the	case with various scripts.  The	output
    with  this  option  enabled  is  meant  to  be  stable across xz
    releases.	 See the section ROBOT MODE for	details.
```

To enable the "robot" option, we standardised the presence of an
`ETCHER_CLI_ROBOT` environment variable. You can check if the mode is enabled
by using the `.isEnabled()` static function that the robot module provides:

```js
if (robot.isEnabled()) {
  console.log('The robot option is enabled');
}
```

The current protocol that we use is based on JSON. The writer process
stringifies a JSON object, and prints it. The client then gets the line, parses
it as JSON, and accesses the object.

For example, the writer process may have a fictitious internal object that
looks like this:

```js
{
  percentage: 50,
  stage: 'validation'
}
```

That object can be stringified as `{"percentage":50,"stage":"validation"}` and
printed to `stdout`.

This is what a valid robot message looks like:

```json
{
  "command": "progress",
  "data": {
    "percentage": 50
  }
}
```

The command content and the data associated with it are application specific,
however the robot module defines a single command called "error", which is used
to transmit a JavaScript Error object, along with its metadata (stacktrace,
code, description, etc) as a string.

You don't have to worry about the internal details of how an Error object is
encoded/decoded, given that the robot module exposes two high level utility
functions: `.printError()` and `.recomposeErrorMessage()`.

Here's an example of these functions in action:

```javascript
const error = errors.createError({
  title: 'This is an error',
  description: 'My description'
});

robot.printError(error);
```

The client can then fetch the line, and recompose it back:

```javascript
const error = robot.recomposeErrorMessage(line);
```

The resulting `error` inherits the stacktrace and other metadata from the
original error, even if this was created in another process. This is how the
writer process propagates informational errors to the GUI.

[xz-man]: https://www.freebsd.org/cgi/man.cgi?query=xz&sektion=1&manpath=FreeBSD+8.3-RELEASE
[child-writer]: https://github.com/resin-io/etcher/tree/master/lib/child-writer
