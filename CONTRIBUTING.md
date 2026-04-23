# Contributing to Teacher IDE

Teacher IDE is built on Eclipse Theia. All Teacher-specific code lives in `packages/teacher-core/`, `packages/teacher-ui/`, `curriculum/`, `teacher-plugins/`, and `guardian/`. No upstream Theia files are modified.

## Licensing

Teacher-specific contributions are licensed under **Apache-2.0**. Upstream Theia files remain under **EPL-2.0 OR GPL-2.0-only WITH Classpath-exception-2.0**. See `LICENSE`, `NOTICE`, and `FORKING.md` for the full picture. Every new `.ts`/`.tsx` file under `packages/teacher-*`, `guardian/`, or `teacher-plugins/` MUST carry the SPDX header:

```ts
// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2024-2026 David and contributors.
```

## CellAI and PII — mandatory scrub-before-commit

If your contribution touches content derived from CellAI, patient records, research subjects, or any identifiable source material, you MUST run the Forgetful Agent before committing:

```
npx @guardian/forgetful scrub --in <source-dir> --out <scrubbed-dir>
```

The tool emits a signed manifest listing what types of identifiers were removed from which files (never the values themselves). Include the manifest in your PR. The pre-push hook (`scripts/pre-push-scrub-gate.sh`) will refuse to push any CellAI-derived file to the public remote without a matching manifest entry.

The raw CellAI corpus is never committed. It lives on David's machine and in the private sister's-repo staging area (`<SISTER_REMOTE>`). Contributors without access to that corpus cannot add to CellAI-derived content directly; instead, file an issue describing the desired change and a maintainer will coordinate the scrub cycle.

See `docs/ingest.md` for the full runbook and `docs/forgetful-threat-model.md` for what the scrubber protects against and what it does not.



## Teacher-Specific Contributions

### How to Add a New Widget (5 steps)

1. Create `packages/teacher-core/src/browser/widgets/{name}-widget.tsx` with a class extending `ReactWidget`. Set a `static readonly ID = 'teacher-{name}'`.
2. Create `packages/teacher-core/src/browser/widgets/{name}-contribution.ts` extending `AbstractViewContribution`.
3. Register in `packages/teacher-core/src/browser/teacher-frontend-module.ts`: bind the widget, its `WidgetFactory`, and the contribution as `FrontendApplicationContribution`.
4. Add CSS in `packages/teacher-core/src/browser/style/` using Teacher design tokens (`--surface-*`, `--accent-amber`, `--text-*`).
5. Update `CLAUDE.md` widget table and `docs/WIDGETS.md`.

### How to Add a New Agent (4 steps)

1. Create `packages/teacher-core/src/browser/agents/{name}-agent.ts`. Export an `AgentId` constant (`teacher-{role}`). Define system prompt constant(s) with beginner/advanced variants.
2. Extend `AbstractStreamParsingChatAgent` from `@theia/ai-chat`. Set `tags: ['teacher', '{role}', 'education']`.
3. Register in `teacher-frontend-module.ts`: `bind(ChatAgent).to(YourAgent).inSingletonScope()`.
4. Update `AGENTS.md` and `docs/AGENTS.md`.

### How to Add a Skill

1. Create a `SKILL.md` file in the skills library (`~/.claude/skills/`).
2. Include YAML frontmatter: `name`, `description`, `intent`, `domain`, `lifecycle`, `version`.
3. The skill engine auto-discovers it on the next `scanSkills()` call.

### Coding Guidelines Summary

- 4 spaces, single quotes, `undefined` over `null`
- PascalCase types, camelCase functions, kebab-case files
- Property injection over constructor injection, `@postConstruct()` for init
- JSDoc on all public methods
- `nls.localize()` for user-facing strings
- No upstream file modifications

## How Can I Contribute?

In the following some of the typical ways of contribution are described.

### Asking Questions

It's totally fine to ask questions by opening an issue in the Theia GitHub
repository. We will close it once it's answered and tag it with the 'question'
label. Please check if the question has been asked before there or on [Stack
Overflow](https://stackoverflow.com).

### Reporting Bugs

If you have found a bug, you should first check if it has already been filed
and maybe even fixed. If you find an existing unresolved issue, please add your
case. If you could not find an existing bug report, please file a new one. In
any case, please add all information you can share and that will help to
reproduce and solve the problem.

### Reporting Feature Requests

You may want to see a feature or have an idea. You can file a request and we
can discuss it.  If such a feature request already exists, please add a comment
or some other form of feedback to indicate you are interested too. Also in this
case any concrete use case scenario is appreciated to understand the motivation
behind it.

### Pull Requests

Before you get started investing significant time in something you want to get
merged and maintained as part of Theia, you should talk with the team through
an issue. Simply choose the issue you would want to work on, and tell everyone
that you are willing to do so and how you would approach it. The team will be
happy to guide you and give feedback.

We follow the contributing and reviewing pull request guidelines described
[here](https://github.com/eclipse-theia/theia/blob/master/doc/pull-requests.md).

## Coding Guidelines

We follow the coding guidelines described
[here](doc/coding-guidelines.md).

## Eclipse Contributor Agreement

Before your contribution can be accepted by the project team contributors must
electronically sign the Eclipse Contributor Agreement (ECA).

* <https://www.eclipse.org/legal/ECA.php>

Commits that are provided by non-committers must have a Signed-off-by field in
the footer indicating that the author is aware of the terms by which the
contribution has been provided to the project. The non-committer must
additionally have an Eclipse Foundation account and must have a signed Eclipse
Contributor Agreement (ECA) on file.

For more information, please see the Eclipse Committer Handbook:
<https://www.eclipse.org/projects/handbook/#resources-commit>

## Sign your work

The sign-off is a simple line at the end of the explanation for the patch. Your
signature certifies that you wrote the patch or otherwise have the right to
pass it on as an open-source patch. The rules are pretty simple: if you can
certify the below (from
[developercertificate.org](https://developercertificate.org/)):

```
Developer Certificate of Origin
Version 1.1

Copyright (C) 2004, 2006 The Linux Foundation and its contributors.
1 Letterman Drive
Suite D4700
San Francisco, CA, 94129

Everyone is permitted to copy and distribute verbatim copies of this
license document, but changing it is not allowed.

Developer's Certificate of Origin 1.1

By making a contribution to this project, I certify that:

(a) The contribution was created in whole or in part by me and I
    have the right to submit it under the open source license
    indicated in the file; or

(b) The contribution is based upon previous work that, to the best
    of my knowledge, is covered under an appropriate open source
    license and I have the right under that license to submit that
    work with modifications, whether created in whole or in part
    by me, under the same open source license (unless I am
    permitted to submit under a different license), as indicated
    in the file; or

(c) The contribution was provided directly to me by some other
    person who certified (a), (b) or (c) and I have not modified
    it.

(d) I understand and agree that this project and the contribution
    are public and that a record of the contribution (including all
    personal information I submit with it, including my sign-off) is
    maintained indefinitely and may be redistributed consistent with
    this project or the open source license(s) involved.
```

Then you just add a line to every git commit message:

    Signed-off-by: Joe Smith <joe.smith@email.com>

Use your real name (sorry, no pseudonyms or anonymous contributions.)

If you set your `user.name` and `user.email` git configs, you can sign your
commit automatically with `git commit -s`.
