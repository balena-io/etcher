Commit Guidelines
=================

We enforce certain rules on commits with the following goals in mind:

- Be able to reliably auto-generate the `CHANGELOG.md` *without* any human
intervention.
- Be able to automatically and correctly increment the semver version number
based on what was done since the last release.
- Be able to get a quick overview of what happened to the project by glancing
over the commit history.
- Be able to automatically reference relevant changes from a dependency
upgrade.

The guidelines are inspired by the [AngularJS git commit
guidelines][angular-commit-guidelines].

Commit structure
----------------

Each commit message consists of a header, a body and a footer. The header has a
special format that includes a type, a scope and a subject.

```
<type>(<scope>): <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

The subject should not contain more than 70 characters, including the type and
scope, and the body should be wrapped at 72 characters.

Type
----

Must be one of the following:

- `feat`: A new feature.
- `fix`: A bug fix.
- `minifix`: A minimal fix that doesn't warrant an entry in the CHANGELOG.
- `docs`: Documentation only changes.
- `style`: Changes that do not affect the meaning of the code (white-space,
formatting, missing semi-colons, JSDoc annotations, comments, etc).
- `refactor`: A code change that neither fixes a bug nor adds a feature.
- `perf`: A code change that improves performance.
- `test`: Adding missing tests.
- `chore`: Changes to the build process or auxiliary tools and libraries.
- `upgrade`: A version upgrade of a project dependency.

Scope
-----

The scope is required for types that make sense, such as `feat`, `fix`,
`test`, etc. Certain commit types, such as `chore` might not have a clearly
defined scope, in which case its better to omit it.

Subject
-------

The subject should contain a short description of the change:

- Use the imperative, present tense.
- Don't capitalize the first letter.
- No dot (.) at the end.

Footer
------

The footer contains extra information about the commit, such as tags.

**Breaking Changes** should start with the word BREAKING CHANGE: with a space
or two newlines. The rest of the commit message is then used for this.

Tags
----

### `See: <url>`/`Link: <url>`

This tag can be used to reference a resource that is relevant to the commit,
and can be repeated multiple times in the same commit.

Resource examples include:

- A link to pull requests.
- A link to a GitHub issue.
- A link to a website providing useful information.
- A commit hash.

Its recommended that you avoid relative URLs, and that you include the whole
commit hash to avoid any potential ambiguity issues in the future.

If the commit type equals `upgrade`, this tag should be present, and should
link to the CHANGELOG section of the dependency describing the changes
introduced from the previously used version.

Examples:

```
See: https://github.com/xxx/yyy/
See: 49d89b4acebd80838303b011d30517cd6229fdbe
Link: https://github.com/xxx/yyy/issues/zzz
```

### `Closes: <url>`/`Fixes: <url>`

This tag is used to make GitHub close the referenced issue automatically when
the commit is merged.

Its recommended that you provide the absolute URL to the GitHub issue rather
than simply writing the ID prefixed by a hash tag for convenience when browsing
the commit history outside the GitHub web interface.

A commit can include multiple instances of this tag.

Examples:

```
Closes: https://github.com/balena-io/etcher/issues/XXX
Fixes: https://github.com/balena-io/etcher/issues/XXX
```

### `Change-Type: <type>`

This tag is used to determine the change type that a commit introduces. The
following types are supported:

- `major`
- `minor`
- `patch`

This tag can be omitted for commits that don't change the application from the
user's point of view, such as for refactoring commits.

Examples:

```
Change-Type: major
Change-Type: minor
Change-Type: patch
```

See the [Semantic Versioning][semver] specification for a more detailed
explanation of the meaning of these types.

### `Changelog-Entry: <message>`

This tag is used to describe the changes introduced by the commit in a more
human style that would fit the `CHANGELOG.md` better.

If the commit type is either `fix` or `feat`, the commit will take part in the
CHANGELOG. If this tag is not defined, then the commit subject will be used
instead.

You explicitly can use this tag to make a commit whose type is not `fix` nor
`feat` appear in the `CHANGELOG.md`.

Since whatever your write here will be shown *as it is* in the `CHANGELOG.md`,
take some time to write a decent entry. Consider the following guidelines:

- Use the imperative, present tense.
- Capitalize the first letter.

There is no fixed length limit for the contents of this tag, but always strive
to make as short as possible without compromising its quality.

Examples:

```
Changelog-Entry: Fix EPERM errors when flashing to a GPT drive.
```

Complete examples
-----------------

```
fix(GUI): ignore extensions before the first non-compressed extension

Currently, we extract all the extensions from an image path and report back
that the image is invalid if *any* of the extensions is not valid , however
this can cause trouble with images including information between dots that are
not strictly extensions, for example:

    elementaryos-0.3.2-stable-i386.20151209.iso

Etcher will consider `20151209` to be an invalid extension and therefore
will prevent such image from being selected at all.

As a way to allow these corner cases but still make use of our enforced check
controls, the validation routine now only consider extensions starting from the
first non compressed extension.

Change-Type: patch
Changelog-Entry: Don't interpret image file name information between dots as image extensions.
Fixes: https://github.com/balena-io/etcher/issues/492
```

***

```
upgrade: etcher-image-write to v5.0.2

This version contains a fix to an `EPERM` issue happening to some Windows user,
triggered by the `write` system call during the first ~5% of a flash given that
the operating system still thinks the drive has a file system.

Change-Type: patch
Changelog-Entry: Upgrade `etcher-image-write` to v5.0.2.
Link: https://github.com/balena-io-modules/etcher-image-write/blob/master/CHANGELOG.md#502---2016-06-27
Fixes: https://github.com/balena-io/etcher/issues/531
```

***

```
feat(GUI): implement update notifier functionality

Auto-update functionality is not ready for usage. As a workaround to
prevent users staying with older versions, we now check for updates at
startup, and if the user is not running the latest version, we present a
modal informing the user of the availiblity of a new version, and
provide a call to action to open the Etcher website in his web browser.

Extra features:

- The user can skip the update, and tell the program to delay the
notification for 7 days.

Misc changes:

- Center modal with flexbox, to allow more flexibility on the modal height.
interacting with the S3 server.
- Implement `ManifestBindService`, which now serves as a backend for the
`manifest-bind` directive to allow the directive's functionality to be
re-used by other services.
- Namespace checkbox styles that are specific to the settings page.

Change-Type: minor
Changelog-Entry: Check for updates and show a modal prompting the user to download the latest version.
Closes: https://github.com/balena-io/etcher/issues/396
```

[angular-commit-guidelines]: https://github.com/angular/angular.js/blob/master/CONTRIBUTING.md#commit
[semver]: http://semver.org
