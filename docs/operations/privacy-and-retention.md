# Privacy and retention notice

Guitar Mastering stores the username and password verifier needed to authenticate
an account, optional profile names/avatar choice, revocable session records, and
the learner's approved lesson-progress fields. Passwords and usable session
tokens are never stored. Email, phone, uploaded avatars, analytics, scores, and
private lesson reflections are not collected.

Account deletion removes the account's active database rows. Device-local guest
or account caches remain on that browser until the learner explicitly clears
them. Deleted data can remain temporarily in Railway PostgreSQL PITR archives
until the provider-managed archive expires. The current pet-project policy does
not retain scheduled volume backups or logical dumps. An explicitly approved
logical export may temporarily contain account data in a permission-restricted
artifact; it is used only for portability or recovery verification and securely
deleted after that operation. Backups and temporary exports are not searched or
modified to selectively recreate a deleted account.

Operational logs retain request/application IDs, route templates, methods,
statuses, durations, deployment versions, and coarse outcomes. They exclude
passwords, cookies, raw tokens, password hashes/salts, profile names, database
URLs, full request bodies, and raw IP addresses. Provider access is limited to
the project owner and Railway's platform controls.
