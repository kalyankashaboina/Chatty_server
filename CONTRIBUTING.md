## Contributing to Chatty Server

Thank you for improving Chatty Server! This document explains how to report issues, create changes, and submit pull requests in a way that speeds up review and increases the chance of a quick merge.

### Quick start checklist

1. Fork the repository and create a branch from `master`.
2. Run formatting and type checks locally before pushing.
3. Open a concise PR with the motivation and testing steps.

### How to file a good issue

Good issues make it fast for maintainers to reproduce and triage. Include:

- A short, descriptive title
- The expected and actual behavior
- Steps to reproduce (minimum reproducible example if possible)
- Environment details (Node.js, OS, relevant env vars)
- Relevant logs or stack traces

### Development setup

```powershell
git clone https://github.com/<your-username>/Chatty_server.git
cd Chatty_server
git checkout -b feat/short-description
npm ci
npm run dev
```

Work in `src/`, run `npm run build` to produce `dist/` files when needed.

### Branching and commits

- Use branches with clear prefixes: `feat/`, `fix/`, `chore/`, `docs/`.
- Make small, logical commits and write messages in imperative form:
  - `Add input validation for message payload`
- Squash or rebase locally before opening a PR to keep history tidy.

### Code style & linting

- Prettier and ESLint are used. Run:

```powershell
npm run format
npm run format:check
npm run type-check
npx eslint "src/**/*.{ts,js}" --fix
```

- Ensure no type errors and no format changes remain before committing.

### Tests

- Tests are not present yet. If you add tests, prefer Jest or Vitest for unit tests and supertest for HTTP/integration tests.
- Add test commands to `package.json` and extend CI to run them.

### Pull request process

1. Open a PR against `master` with a clear title and description.
2. Include testing steps and any environment configuration required.
3. Ensure the CI passes (formatting and type-check are run in CI).
4. Address review comments in a timely manner.

### Security reports

Report security issues privately by emailing `kalyankashaboina07@gmail.com`. Do not disclose vulnerabilities in public issues.

### Code of Conduct

By participating you agree to follow the project's `CODE_OF_CONDUCT.md`.

Thanks for contributing — your help makes this project better!
