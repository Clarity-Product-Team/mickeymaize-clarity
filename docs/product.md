# Product Context

This document describes the product goals, users, and expected behavior.

Claude should consult this document when implementing features that affect product behavior.

---

## Product Mission

The purpose of this product is to deliver reliable functionality that solves a real user problem while maintaining high engineering quality.

All development decisions should align with the core product mission.

---

## Target Users

Typical users may include:

- end users interacting with the application
- administrators managing system configuration
- internal teams using operational tools

Each feature should consider the needs of its target audience.

---

## Product Principles

Features should follow these principles:

- simplicity for users
- predictable behavior
- consistent interaction patterns
- clear feedback and error handling

Avoid introducing complexity unless it clearly improves user outcomes.

---

## Feature Design

When implementing features:

- maintain consistent interaction patterns
- avoid unnecessary steps for users
- ensure error states are clear and recoverable

User experience should remain intuitive.

---

## Backward Compatibility

When modifying existing behavior:

- avoid breaking existing workflows
- maintain compatibility when possible
- communicate breaking changes clearly

---

## Performance Expectations

Product performance should meet user expectations.

Features should:

- load quickly
- respond predictably
- avoid blocking operations where possible

---

## Error Handling

User-facing errors should:

- explain what went wrong
- offer a clear next step
- avoid exposing internal system details

---

## Product Evolution

The product will evolve over time.

When implementing changes:

- respect existing workflows
- maintain compatibility where possible
- document behavior changes

---

## Product Documentation

Product behavior should be documented so both developers and AI systems understand expected outcomes.

When features change:

- update relevant documentation
- ensure this file reflects product intent
