# Commit Message Convention

This project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages.

## Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

## Types

| Type | Description |
|------|-------------|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation only changes |
| `style` | Changes that do not affect the meaning of the code (white-space, formatting, etc) |
| `refactor` | A code change that neither fixes a bug nor adds a feature |
| `perf` | A code change that improves performance |
| `test` | Adding missing tests or correcting existing tests |
| `chore` | Changes to the build process or auxiliary tools |
| `revert` | Reverts a previous commit |

## Examples

### Feature
```
feat(bookmarks): add import from Edge browser

Implement HTML parsing for Edge bookmark exports
```

### Bug Fix
```
fix(display): resolve missing subdirectories issue

Bookmarks in nested folders were not displaying correctly
```

### Documentation
```
docs: update README with installation instructions
```

### Breaking Change
```
feat!: drop support for Node.js 14

BREAKING CHANGE: Node.js 16+ is now required
```

## Changelog Generation

Run the following command to generate/update the changelog:

```bash
pnpm run changelog
```

This will:
1. Read all commits since the last tag
2. Group them by type
3. Generate the CHANGELOG.md file
4. Automatically stage the changes
