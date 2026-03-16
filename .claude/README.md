# .claude Package

This package contains operational support files for Claude Code agents.

It is designed to work alongside the repository's root `CLAUDE.md` file and the `docs/` knowledge files.

## Structure

- `rules/` — domain-specific rules for editing code safely and consistently
- `templates/` — reusable planning templates for common task types
- `checklists/` — final review checklists before finishing work

## How to Use

1. Keep `CLAUDE.md` at the repository root.
2. Place this `.claude/` directory at the repository root.
3. Keep detailed project knowledge in `docs/`.
4. Let `CLAUDE.md` route Claude to the relevant files based on the task.

## Recommended Repository Layout

```text
CLAUDE.md
docs/
  architecture.md
  product.md
  engineering.md
  security.md
  testing.md
  brand/
    BRAND.md
    BRAND_GUIDELINES.md
.claude/
  README.md
  rules/
  templates/
  checklists/
```
