# Backend Rules

Apply these rules when working on backend, server-side, API, service, or data-access code.

## Core Principles

- keep controllers and handlers thin
- keep business logic in services or domain modules
- keep persistence logic in repositories or data-access modules
- prefer explicit flow over magical abstractions
- preserve clear boundaries between transport, business logic, and storage

## Controllers and Handlers

Controllers or request handlers should:

- validate and normalize input
- call the correct service or use case
- translate domain errors into appropriate HTTP or transport responses
- avoid embedding business rules directly

Avoid:

- database queries in controllers
- large multi-step workflows in handlers
- hidden side effects

## Services

Services should:

- own business rules
- coordinate repositories, APIs, and domain operations
- remain framework-light when possible
- expose clear, focused methods

Avoid:

- bloated service classes with unrelated responsibilities
- moving view or transport formatting into service logic

## Repositories and Data Access

Repositories should:

- encapsulate persistence details
- expose small, stable interfaces
- keep SQL, ORM, or storage-specific logic localized

Avoid:

- leaking storage concerns into business logic
- duplicating the same query behavior across files

## Validation and Errors

Always:

- validate external input
- return safe and actionable errors
- preserve security and authorization checks

Avoid:

- trusting raw request data
- swallowing exceptions silently
- returning internal stack details to users

## Performance and Reliability

Prefer:

- batching work when appropriate
- avoiding repeated database or network calls
- preserving idempotency for retry-prone operations where relevant

## Before Finishing

Check that:

- module boundaries remain clean
- business rules are not in controllers
- persistence is not leaking across layers
- tests were added or updated when behavior changed
