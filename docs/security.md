# Security Guidelines

This document defines security expectations for this repository.

Claude must follow these rules whenever implementing or modifying code.

---

## Core Security Principles

All systems should follow:

- least privilege
- defense in depth
- secure defaults
- explicit validation
- minimal data exposure

---

## Secrets Management

Never:

- hardcode credentials
- commit secrets to the repository
- print tokens or passwords in logs

Secrets should be loaded from secure configuration such as:

- environment variables
- secret managers
- secure runtime configuration

---

## Authentication and Authorization

When modifying authentication or permission logic:

- preserve existing security checks
- avoid bypassing validation
- maintain least‑privilege design

Changes to authentication flows should be treated as high‑risk.

---

## Input Validation

All external input must be validated.

Sources include:

- user input
- API requests
- query parameters
- file uploads
- external services

Always:

- validate format
- validate length
- sanitize content when required

---

## Data Protection

Sensitive data should be protected.

Avoid:

- logging personal data
- exposing internal identifiers
- returning unnecessary fields in APIs

Prefer returning only required information.

---

## Dependency Security

When adding new dependencies:

- ensure they are widely used and maintained
- avoid abandoned packages
- prefer minimal dependency chains

---

## Secure Error Handling

Errors should:

- avoid leaking sensitive system information
- provide useful debugging data for developers
- remain safe for production logs
