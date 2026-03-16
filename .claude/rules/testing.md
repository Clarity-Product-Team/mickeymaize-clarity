# Testing Rules

Apply these rules when adding tests, updating tests, or changing behavior that should be covered by tests.

## Core Principles

- test behavior, not trivia
- prefer focused tests
- keep tests readable
- maintain determinism
- preserve fast feedback when possible

## What to Test

Prioritize:

- changed behavior
- critical paths
- edge cases with meaningful risk
- failure scenarios when they matter

Avoid adding tests that only mirror implementation without validating behavior.

## Test Structure

Prefer tests that are:

- clearly named
- easy to read
- minimal in setup
- explicit about expected outcomes

## Mocks and Fixtures

Use mocks carefully:

- mock boundaries, not everything
- avoid over-mocking internal behavior
- keep fixtures realistic but minimal

## Regression Testing

If fixing a bug:

- add or update a test that would have caught it

## Verification Strategy

Use the smallest useful validation first:

1. focused unit tests
2. integration coverage when needed
3. broader suites if risk is larger

## Required Reference

Consult when relevant:

```text
docs/testing.md
```

## Before Finishing

Check that:

- tests reflect intended behavior
- new behavior has coverage when appropriate
- failing tests were not ignored or silently weakened
