# Frontend Rules

Apply these rules when working on UI, frontend, client-side code, demos, landing pages, or presentation surfaces.

## Core Principles

- favor clarity, consistency, and usability
- preserve existing design patterns
- keep components focused and composable
- avoid UI churn unrelated to the task
- follow brand guidance for visual work

## Component Design

Components should:

- have a clear responsibility
- keep logic manageable
- accept explicit props
- avoid hidden coupling with distant modules

Prefer:

- small reusable components
- local state when sufficient
- shared state only when it solves a clear need

Avoid:

- giant components with mixed concerns
- deeply nested conditional rendering without extraction
- unnecessary custom abstractions

## Styling

When styling:

- follow existing design system patterns
- preserve spacing, hierarchy, and readability
- use brand files for colors, typography, and logos when relevant

Consult:

```text
docs/brand/BRAND.md
docs/brand/BRAND_GUIDELINES.md
```

Avoid:

- inventing brand colors
- introducing inconsistent UI patterns
- changing layout broadly unless required

## User Experience

Always aim for:

- predictable behavior
- clear feedback states
- recoverable errors
- accessible interactions where possible

Check that:

- loading, empty, error, and success states are reasonable
- labels and copy are clear
- user flows remain intuitive

## Data Flow

Prefer:

- explicit data flow
- well-named props and handlers
- keeping business logic outside presentational components when practical

## Before Finishing

Check that:

- the UI change matches surrounding patterns
- brand rules were applied when relevant
- unnecessary visual churn was avoided
- behavior was verified manually or with tests where appropriate
