# Engineering Guidelines

This document defines engineering standards and development conventions for this repository.
Claude must follow these guidelines when generating or modifying code.

---

## Core Engineering Principles

All code should prioritize:

- simplicity
- clarity
- maintainability
- consistency
- minimal complexity

Prefer straightforward solutions over clever or overly abstract implementations.

---

## Repository Conventions

Claude should inspect existing patterns before introducing new ones.

Follow:

- existing module structure
- established naming conventions
- current import patterns
- architectural boundaries

Do not introduce new patterns if a clear pattern already exists.

---

## File Organization

General expectations:

- group related logic together
- avoid large monolithic files
- keep modules cohesive
- keep responsibilities clearly separated

Example:

feature/
  service.ts
  repository.ts
  types.ts

---

## Function Design

Functions should:

- do one thing
- remain small and focused
- use clear naming
- avoid hidden side effects

Prefer:

calculateInvoiceTotal()
validateUserInput()
fetchCustomerOrders()

Avoid vague names such as:

handleData()
processThing()
runLogic()

---

## Naming Conventions

Use descriptive names.

Prefer:

userRepository
invoiceService
calculateDiscount

Avoid:

data
helper
utils
temp

---

## Dependencies

When introducing dependencies:

- prefer libraries already used in the repository
- avoid adding new dependencies for trivial tasks
- justify large dependencies

Avoid introducing heavy frameworks without strong need.

---

## Code Style

Unless overridden by repository tooling:

- use consistent indentation
- follow local formatting conventions
- prefer readability over compact syntax

If formatters exist (Prettier, ESLint, etc.), follow their output.

---

## Refactoring Guidelines

When refactoring:

- keep behavior identical
- ensure references remain valid
- keep changes scoped
- avoid mixing refactoring with new features

---

## Documentation

Complex logic should include explanatory comments.

However:

- do not comment obvious code
- prefer self‑explanatory function and variable names
