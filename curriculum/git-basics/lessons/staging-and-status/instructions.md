# The Staging Area & Reading Status

## Why This Matters

The staging area is Git's most misunderstood feature — and its most powerful.
It lets you craft your commits deliberately, telling a clear story of what
changed and why. Sloppy commits with "fixed stuff" messages make debugging
a nightmare. Clean commits save future-you hours of pain.

## Prerequisites

Complete the **init-and-commit** lesson first. You should have a `practice-repo`
with at least two commits.

## Exercises

### 1. Modify an Existing File

Open `README.md` in your editor and add a "Contact" section at the bottom:

```markdown
## Contact

Email us at tools@community.org or visit the community center.
```

Now check the status:

```bash
git status
```

Notice it says "modified" — Git knows the file changed but you haven't staged it yet.

### 2. See What Changed

Before staging, review your changes:

```bash
git diff
```

You'll see added lines prefixed with `+` and removed lines with `-`.
This is your chance to catch mistakes before they become permanent.

### 3. Create Multiple New Files

Create two new files:

**inventory.md:**
```markdown
# Tool Inventory

| Tool | Condition | Available |
|------|-----------|-----------|
| Circular Saw | Good | Yes |
| Drill Press | Fair | No |
| Hand Sander | Excellent | Yes |
```

**volunteers.md:**
```markdown
# Volunteer List

- Maria — Tool Maintenance Lead
- James — Saturday Shift
- Priya — Catalog Manager
```

### 4. Selective Staging

Check status — you should see three changes (one modified, two untracked):

```bash
git status
```

Stage only the README change and commit it:

```bash
git add README.md
git commit -m "Add contact information to README"
```

Now stage and commit `inventory.md` separately:

```bash
git add inventory.md
git commit -m "Add initial tool inventory catalog"
```

### 5. Practice Unstaging

Stage `volunteers.md`, then change your mind:

```bash
git add volunteers.md
git status
# See it's staged? Now unstage it:
git restore --staged volunteers.md
git status
# Back to untracked. Your file is safe — just not staged.
```

When you're ready, stage and commit it:

```bash
git add volunteers.md
git commit -m "Add volunteer roster"
```

### 6. Review the Full Diff of Staged Changes

Make two more edits to `README.md` — add a "License" section and fix a typo.
Stage both changes and review what's about to be committed:

```bash
git diff --staged
```

This shows exactly what the next commit will contain. Get in the habit of
checking this before every commit.

## Key Concepts

- **Untracked**: Git has never seen this file before
- **Modified**: File exists in the last commit but has been changed
- **Staged**: Marked to be included in the next commit
- **git diff**: Shows unstaged changes (what you haven't added yet)
- **git diff --staged**: Shows staged changes (what you're about to commit)

## Self-Check

- [ ] You made at least 3 separate commits, each with a single logical change
- [ ] You used `git diff` at least once before staging
- [ ] You practiced unstaging a file with `git restore --staged`
- [ ] `git log --oneline` shows a clean, readable history
