# Testing Guidelines

This document defines testing practices for the repository.

Claude should follow these rules when writing or modifying tests.

---

## Testing Philosophy

Tests should prioritize:

- correctness
- clarity
- reliability
- fast feedback

Tests should validate behavior rather than implementation details.

---

## Test Types

Common test types include:

- unit tests
- integration tests
- end‑to‑end tests

Prefer unit tests for most logic and integration tests for system interactions.

---

## Unit Tests

Unit tests should:

- test a single logical unit
- remain fast
- avoid external dependencies
- isolate behavior using mocks when necessary

---

## Integration Tests

Integration tests should verify:

- module interactions
- database behavior
- service communication

Avoid making them unnecessarily slow.

---

## Test Naming

Tests should clearly describe behavior.

Prefer:

shouldCalculateInvoiceTotal()
shouldRejectInvalidEmail()

Avoid vague names such as:

test1()
testFunction()

---

## Test Data

Test data should:

- be minimal
- represent realistic scenarios
- avoid sensitive information

Use fixtures or factories when helpful.

---

## Deterministic Tests

Tests should produce the same result every run.

Avoid:

- time‑dependent logic
- random values without control
- reliance on external services

---

## Failing Tests

Never:

- ignore failing tests
- disable tests without explanation

If behavior changes intentionally, update tests accordingly.
