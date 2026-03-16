# Planning Rules

Apply these rules when a task is medium-sized, large, risky, or touches multiple files or systems.

## When a Plan Is Required

Create a plan before implementation when:

- the change spans multiple modules
- the task is a refactor
- architecture may be affected
- security-sensitive areas are involved
- the solution is not obvious from one small edit

## Plan Quality Standard

A good plan should:

- state the goal
- identify likely files or modules
- reuse existing repository patterns
- describe the smallest safe path
- include validation steps
- call out assumptions or risks

## Avoid

Do not create plans that:

- are vague
- propose redesign without need
- skip validation
- ignore repository context

## Suggested Plan Shape

1. Goal
2. Relevant files
3. Existing patterns to follow
4. Implementation steps
5. Validation
6. Risks or assumptions
