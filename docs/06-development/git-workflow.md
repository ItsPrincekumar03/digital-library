# Git Workflow

## 1. Purpose

This document defines the Git workflow for the Digital Library project. It establishes how contributors inspect repository state, create branches, make changes, review code, commit work, integrate contributions, and verify remote synchronization.

The goal is to protect existing work, reduce integration conflicts, and maintain a reliable history of project development.

These instructions describe the recommended workflow. They do not establish the current branch, commit history, or remote synchronization status of the repository.

## 2. Project Repository

- **Project:** Digital Library
- **Repository directory:** `D:\Projects\digital-library`
- **GitHub repository:** `https://github.com/ItsPrincekumar03/digital-library.git`
- **Approved stack:** HTML, CSS, Vanilla JavaScript, Node.js, Express.js, and MySQL
- **Architecture:** Monolithic application

Confirm the actual repository location and remote configuration before executing Git commands.

## 3. Core Rules

1. Inspect the working tree before changing files.
2. Never overwrite another contributor's uncommitted work.
3. Work on the agreed task or feature.
4. Use descriptive branch names.
5. Keep commits focused on related changes.
6. Review the diff before committing.
7. Never commit passwords, API keys, tokens, or real environment secrets.
8. Run relevant tests before declaring a change complete.
9. Coordinate shared database, API, and configuration changes with the team.
10. Confirm the destination branch before merging or pushing.
11. Never use destructive Git commands without understanding their impact.
12. Treat local commits and remote pushes as separate operations.

## 4. Repository Setup

If the project repository has already been cloned, navigate to the existing directory:

```powershell
Set-Location "D:\Projects\digital-library"
```

Inspect the current repository:

```powershell
git rev-parse --show-toplevel
git remote -v
git branch --show-current
git status --short
```

These commands help confirm the repository root, configured remotes, current branch, and uncommitted changes.

If cloning is required and the directory does not already contain the project:

```powershell
git clone https://github.com/ItsPrincekumar03/digital-library.git
Set-Location ".\digital-library"
```

Do not clone into an existing project directory without checking its contents first.

## 5. Inspect Before Making Changes

Before starting any task, run:

```powershell
git status --short
git branch --show-current
git log -5 --oneline
```

Review the output.

- Confirm the intended branch.
- Identify modified and untracked files.
- Check whether local work must be preserved.
- Review recent commits to understand the current project history.

If the working tree contains changes from earlier tasks, do not automatically discard, reset, or overwrite them.

## 6. Branching Strategy

Use the repository's established branch policy. If the team has not established one, the following lightweight approach is recommended.

- `main`: stable, reviewed project history.
- `feature/<name>`: new functionality.
- `fix/<name>`: defect corrections.
- `docs/<name>`: documentation-only changes.
- `test/<name>`: testing-focused changes.

Example branch names:

```text
feature/book-search
fix/chapter-validation
docs/api-documentation
test/authentication
```

Create a branch from the intended base branch:

```powershell
git switch main
git pull --ff-only origin main
git switch -c feature/book-search
```

Run these commands only when the local working tree is in a suitable state and the intended base is `main`. Preserve or safely commit existing work before switching branches.

If the team requires direct work on `main`, follow the agreed policy instead of creating conflicting workflows.

## 7. Updating a Branch

Before starting new work, determine whether the branch needs updates.

For a local `main` branch:

```powershell
git switch main
git pull --ff-only origin main
```

The `--ff-only` option prevents Git from creating an unexpected merge commit during this pull.

If Git reports that the branches have diverged, stop and review the situation. Do not force the update or reset the branch without understanding the local commits and uncommitted changes.

For an existing feature branch, integrate updates from the approved base branch according to the team's merge or rebase policy.

## 8. Making Changes

Keep each task focused.

Recommended process:

1. Read the relevant requirements and technical documentation.
2. Inspect the existing implementation.
3. Identify affected files and dependencies.
4. Make the required changes.
5. Add or update tests.
6. Update documentation where behavior or interfaces change.
7. Review the complete diff.
8. Run relevant validation commands.

For this project, pay particular attention to API contracts, database relationships, authentication, authorization, and ownership checks.

Avoid mixing unrelated features and formatting-only changes into the same commit unless they are necessary for the task.

## 9. Review Changes

Check repository status:

```powershell
git status --short
```

Review tracked changes:

```powershell
git diff
```

Review staged changes:

```powershell
git diff --cached
```

Check whitespace errors:

```powershell
git diff --check
```

Inspect untracked files separately because they do not appear in the ordinary tracked-file diff until staged.

Before staging, verify that the changes do not contain:

- Real `.env` files or secret values.
- Passwords, tokens, or API keys.
- Database dumps containing private information.
- Unrelated generated files.
- Accidental deletions or unrelated modifications.

Do not stage the entire repository blindly when it contains unrelated work.

## 10. Stage Files Carefully

Stage specific files when possible:

```powershell
git add "backend/src/services/book.service.js"
git add "docs/06-development/git-workflow.md"
```

Replace example paths with the files actually changed by the task.

Review the staged changes:

```powershell
git status --short
git diff --cached
git diff --cached --check
```

If an unintended file is staged, unstage it without deleting its working-tree contents:

```powershell
git restore --staged -- "path/to/file"
```

Replace the example path with the actual file.

Do not use `git restore` without `--staged` unless you intentionally want to discard working-tree changes and have confirmed they are safe to remove.

## 11. Commit Changes

Use a concise commit message that describes the change.

Examples:

```powershell
git commit -m "feat: add book search"
git commit -m "fix: validate chapter ownership"
git commit -m "docs: update Git workflow"
git commit -m "test: cover authentication failures"
```

The prefixes are recommended examples, not a requirement to introduce a new commit convention if the team already uses another one.

A commit should contain one coherent change. Avoid vague messages such as `update`, `changes`, or `final`.

If Git requests identity configuration, configure the appropriate name and email after confirming the intended identity. Do not change repository or global settings unnecessarily.

## 12. Push Changes

Push the current branch only after reviewing the commit and confirming the target remote.

For a newly created feature branch:

```powershell
git push -u origin feature/book-search
```

Replace the branch name with the actual branch.

For an existing branch:

```powershell
git push
```

Do not push directly to `main` unless the project workflow explicitly permits it.

Never use `git push --force` as a routine solution to a rejected push. If rewriting history is genuinely necessary, review the impact with the team and follow the repository's approved recovery procedure.

## 13. Pull Requests and Integration

When the team uses pull requests:

1. Push the task branch.
2. Open a pull request against the agreed base branch.
3. Explain the purpose and scope of the changes.
4. List relevant tests and their actual results.
5. Identify database, API, configuration, or security changes.
6. Request review from the appropriate team member.
7. Resolve review comments.
8. Confirm required checks pass.
9. Merge using the repository's approved method.
10. Verify the resulting branch and commit.

If the team does not use pull requests, perform an equivalent review before integrating changes into the shared branch.

## 14. Database and API Coordination

Database and API changes can affect multiple contributors.

Before changing a schema:

- Inspect the current schema.
- Identify dependent repositories, services, routes, tests, and documentation.
- Agree on the change with affected contributors.
- Provide a reproducible schema update or migration when the project uses one.
- Review data-integrity and rollback implications.

Before changing an API contract:

- Identify affected frontend and backend modules.
- Update the API specification.
- Coordinate changes with contributors using the endpoint.
- Test both successful and unsuccessful request paths.

Do not commit incompatible changes without documenting their dependencies and integration plan.

## 15. Handling Merge Conflicts

If a merge or pull operation reports conflicts:

1. Read the conflict message.
2. Run `git status`.
3. Identify each conflicted file.
4. Inspect both versions and understand the intended behavior.
5. Resolve the conflict without removing valid work.
6. Remove conflict markers from the final file.
7. Run relevant tests.
8. Review the resulting diff.
9. Complete the merge or rebase using the operation's appropriate continuation command.

Useful inspection command:

```powershell
git status
```

During a merge, `git merge --abort` may return the repository to its pre-merge state when Git can safely do so. During a rebase, the corresponding command is `git rebase --abort`.

Use abort commands only after understanding which operation is active and preserving any work that must remain.

## 16. Recovering from Common Problems

### 16.1 Push rejected

A rejected push can indicate that the remote branch contains commits not present locally.

Inspect:

```powershell
git status
git fetch origin
git log --oneline --graph --decorate --all -15
```

Determine why the push was rejected before integrating remote changes. Do not force-push merely to bypass the rejection.

### 16.2 Accidentally staged a file

Unstage the file while keeping its local contents:

```powershell
git restore --staged -- "path/to/file"
```

### 16.3 Need to inspect the last commit

```powershell
git show --stat --oneline HEAD
git show --format=fuller --no-ext-diff HEAD
```

### 16.4 Uncommitted changes need protection

Review the working tree first:

```powershell
git status --short
git diff
```

If a temporary commit or stash is appropriate, use the team's approved process. Do not assume a stash is safe without checking untracked files and the intended restoration process.

### 16.5 Need to undo a shared commit

For a commit already shared with others, `git revert` is generally safer than rewriting shared history:

```powershell
git revert <commit-hash>
```

Replace the placeholder with the actual commit hash after reviewing the change. Resolve any conflicts and test the resulting code.

### 16.6 A file was deleted unexpectedly

Inspect the working tree and history before recovery:

```powershell
git status --short
git log --oneline -- "path/to/file"
```

Choose a recovery method based on whether the deletion is staged, committed, or part of a merge. Avoid commands that could overwrite unrelated changes.

## 17. Keeping Secrets Out of Git

Before every commit:

- Check staged and untracked files.
- Ensure real environment files are excluded where appropriate.
- Keep only placeholder values in example configuration files.
- Do not commit private keys, tokens, or production credentials.
- Avoid committing sensitive database exports or user data.

If a secret is committed, removing it in a later commit does not guarantee that it is no longer exposed in Git history. Revoke or rotate the exposed credential and follow the repository's incident-response process.

## 18. Completion Verification

After committing, inspect the local state:

```powershell
git status --short
git log -1 --oneline
```

After pushing, verify the remote tracking state:

```powershell
git fetch origin
git status -sb
git log -1 --oneline HEAD
git log -1 --oneline origin/<branch-name>
```

Replace `<branch-name>` with the actual branch name.

A clean working tree does not prove that changes have been pushed. A successful local commit does not prove that the remote branch contains it.

Record the commit hash and remote verification result when a task requires confirmation of integration.

## 19. Recommended Daily Workflow

For a typical feature:

```powershell
# 1. Inspect repository state
git status --short
git branch --show-current

# 2. Update the approved base branch when appropriate
git switch main
git pull --ff-only origin main

# 3. Create a task branch
git switch -c feature/short-description

# 4. Implement the task and run relevant tests

# 5. Review the changes
git status --short
git diff
git diff --check

# 6. Stage intended files
git add "path/to/changed-file"

# 7. Review staged changes
git diff --cached

# 8. Commit
git commit -m "feat: describe the change"

# 9. Push the branch
git push -u origin feature/short-description

# 10. Verify the resulting state
git status -sb
```

Treat this as a template, not a command sequence to run blindly. Adjust it when the repository contains uncommitted changes, the task is documentation-only, or the team uses a different branch policy.

## 20. Team Coordination

For the four-student Digital Library project:

- Agree on task ownership before parallel work.
- Coordinate shared API and database changes.
- Keep each contributor's changes focused.
- Communicate when a shared file must change.
- Review integration conflicts before resolving them.
- Do not assume another contributor's work has been pushed.
- Use commit hashes or pull-request references when discussing specific changes.
- Maintain a shared understanding of the current stable branch.

The team should confirm its actual branch protections, review requirements, and merge policy rather than assuming that GitHub enforces them automatically.

## 21. Git Workflow Checklist

### Before development

- [ ] Confirm the repository root.
- [ ] Check the current branch.
- [ ] Inspect uncommitted and untracked files.
- [ ] Confirm the task scope and dependencies.
- [ ] Preserve existing work.

### Before committing

- [ ] Review the diff.
- [ ] Check for accidental changes.
- [ ] Check for secrets.
- [ ] Run relevant tests.
- [ ] Review staged files.
- [ ] Use a descriptive commit message.

### Before integration

- [ ] Confirm the target branch.
- [ ] Resolve conflicts carefully.
- [ ] Review API and database compatibility.
- [ ] Confirm relevant tests and checks.
- [ ] Follow the approved merge process.

### After integration

- [ ] Confirm the resulting commit.
- [ ] Confirm remote synchronization when required.
- [ ] Verify the working tree.
- [ ] Update task status based on evidence.
- [ ] Record known limitations.

## 22. Maintenance

Review this workflow when the team's collaboration process, branch protections, or repository configuration changes.

All contributors should prioritize preserving work, reviewing changes, testing behavior, protecting secrets, and accurately reporting repository state.
