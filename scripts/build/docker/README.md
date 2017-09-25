Compile Etcher in Docker
========================

This is directory provides the utilities necessary to be able to run GNU/Linux
Etcher (headlessly), compile it, and package it, inside Docker containers.

This directory provides a set of Dockerfiles for each supported architecture
that are compiled from a base Dockerfile template. The Dockerfiles install
every needed dependency to be able to build and package Etcher for GNU/Linux
targets.

Running a command inside the Docker images
------------------------------------------

We provide a utility script called `run-command.sh` which allows you to run a
command in an environment where you have all the dependencies needed to build
and package Etcher, and in where the Etcher source code is available in the
current working directory.

For example:

```
./run-command.sh \
  -r x64 \
  -s path/to/etcher/repository \
  -c "make info" \
  -b "a/temporary/directory/for/docker/build"
```

The above command will build the corresponding Docker file (if needed), and
will run the command on it.

Architecture dependent Dockerfile steps
---------------------------------------

You can declare certain steps to be run for certain architectures by using the
following logic:

```
<% if (architecture == 'i686') { %>
  ...
<% } %>

<% if (architecture == 'x86_64') { %>
  ...
<% } %>
```

Compiling the Dockerfile.template
---------------------------------

If you modify the `Dockerfile.template` file, you will need to regenerate the
compiled Dockerfiles by running the `compile-template.js` utility script:

```sh
node compile-template.js
```
