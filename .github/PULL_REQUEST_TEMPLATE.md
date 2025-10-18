<!-- Pull Request Template -->

## Summary

Describe the change and why it is needed. Keep this brief (1–3 sentences).

## Related issues

Link any related issues: `Fixes #123` or `Closes #456`.

## Type of change

- `feat` — new feature
- `fix` — bug fix
- `docs` — documentation only
- `chore` — maintenance tasks

## Checklist (required)

- [ ] I have run `npm run format:check` and `npm run type-check`.
- [ ] My code follows the repository's code style.
- [ ] I have added tests where applicable and they pass locally.
- [ ] I have added or updated documentation if needed.

## Breaking changes & migration

- Does this PR introduce breaking API changes or require migration steps? If yes, describe the changes and provide migration instructions.

Example:

```
BREAKING CHANGE: `GET /api/users` now returns a paginated response. Clients must update to handle `meta` + `data` structure.

Migration:
- Update client call to read `response.data` and `response.meta`.
```

## Release notes (optional)

Provide a short summary suitable for CHANGELOG or GitHub release. Keep to one paragraph.

## Impact & roll-out

- Runtime impact (low/medium/high):
- DB schema changes (yes/no):
- Config/env changes required:

## How to test

Provide clear steps to reproduce and verify the behavior locally.

## Notes

Any additional context for the reviewer. Include screenshots, logs, or sample requests when helpful.
