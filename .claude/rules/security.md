# Security Rules

Apply these rules whenever code touches authentication, authorization, secrets, privacy, validation, external integrations, or sensitive data.

## Mandatory Security Principles

- preserve least privilege
- preserve existing security checks
- validate all untrusted input
- minimize data exposure
- never weaken auth or permission flows casually

## Secrets

Never:

- hardcode secrets
- print credentials or tokens
- commit sensitive values
- copy sensitive runtime values into tests or docs

## Authentication and Authorization

When changing auth-related logic:

- preserve all existing checks unless a change is explicitly intended
- verify role and permission boundaries
- treat bypass paths as high risk
- make the smallest safe change

## Input Validation

Always validate:

- request bodies
- query parameters
- headers
- uploaded content
- webhook or external payloads

Prefer explicit validation close to the boundary.

## Data Exposure

Avoid:

- returning more fields than needed
- logging personal or sensitive data
- exposing internal implementation details in errors

## External Integrations

When touching third-party integrations:

- validate incoming data
- verify failure handling
- preserve retry and timeout expectations
- avoid leaking secrets in logs or traces

## Required Reference

Consult before making sensitive changes:

```text
docs/security.md
```

## Before Finishing

Check that:

- auth flows were not weakened
- validation still exists at the boundaries
- secrets are not exposed
- logs do not contain sensitive data
