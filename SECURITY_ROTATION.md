# SMTP and Database Secret Rotation and History Scrub

Use this checklist if any SMTP or database values were ever real in local files, CI variables, or git history.

## 1. Rotate Provider Secrets Immediately

1. Log in to your SMTP provider dashboard.
2. Revoke the old SMTP password/API key.
3. Create a new SMTP credential.
4. Update deployment secrets (CI/CD, hosting platform, container runtime).
5. Update local `.env` with the new value only on trusted machines.

For database credentials (for example Neon `DATABASE_URL`):

1. Rotate the database user password in the provider dashboard or SQL console.
2. Update `DATABASE_URL` in local `.env` and all deployment environments (for example Vercel).
3. Re-run connectivity checks (`psql`, Prisma `db push`, and API health endpoint).

## 2. Verify Repository Is Sanitized

Run these checks from the repository root:

```bash
# Working tree + tracked files
rg -n -i "(email_password|email_user|smtp|app password|mailgun|sendgrid)" .

# Full git history (patch text)
git --no-pager log -p --all -- . ':!node_modules' | rg -n -i "(email_password|smtp|app password|sendgrid|mailgun)"
```

If any real secret appears, continue to history rewrite.

## 3. Rewrite Git History (Before Public Sharing)

Install `git-filter-repo` and remove/replace leaked values:

```bash
# Example replacement file format:
# literal-old-secret==>REDACTED_SMTP_SECRET
printf 'old-secret-value==>REDACTED_SMTP_SECRET\n' > replacements.txt

# Rewrite history in-place
git filter-repo --replace-text replacements.txt
```

Then force-push rewritten branches/tags:

```bash
git push --force --all
git push --force --tags
```

## 4. Post-Rewrite Safety Steps

1. Invalidate all previously exposed credentials again.
2. Notify collaborators to re-clone (old clones still contain old history).
3. Re-run the scan commands above to confirm no residual secrets remain.

## 5. Ongoing Guardrails

- Keep `.env` git-ignored.
- Commit only `.env.example` placeholders.
- Prefer secret managers for production.
- Add pre-commit secret scanning in CI when possible.
