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


Commit structure
----------------

Each commit message needs to specify the semver-type. Which can be `patch|minor|major`.
See the [Semantic Versioning][semver] specification for a more detailed explanation of the meaning of these types.
See balena commit guidelines for more info about the whole commit structure.

```
<semver-type>: <subject>
```
or
```
<subject>
<BLANK LINE>
<details>
<BLANK LINE>
Change-Type: <semver-type>
```

The subject should not contain more than 70 characters, including the type and
scope, and the body should be wrapped at 72 characters.

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

[semver]: http://semver.org
