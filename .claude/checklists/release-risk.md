# Release Risk Checklist

Use this checklist when a change may affect production stability.

Check whether the task touches:

- authentication or authorization
- payments or billing
- production configuration
- database schema or migrations
- background jobs
- public APIs
- external integrations
- privacy-sensitive data
- destructive scripts

If any item applies, verify:

- rollback considerations were identified
- monitoring or verification was considered
- breaking impact was called out explicitly
- documentation or migration notes were updated
