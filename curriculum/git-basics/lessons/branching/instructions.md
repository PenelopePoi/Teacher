# Creating & Switching Branches

## Why This Matters

Imagine rewriting your resume while someone else edits the same document.
Without branches, you'd overwrite each other's work. Branches let multiple
streams of work happen simultaneously — features, fixes, experiments — without
any of them interfering. This is how professional teams ship software.

## Prerequisites

Complete **staging-and-status**. You should have a `practice-repo` with
several commits on the main branch.

## Exercises

### 1. See Your Current Branch

```bash
git branch
```

The `*` marks your current branch. You should be on `main` (or `master`).

### 2. Create a Feature Branch

You want to add an online reservation system to the tool library.
Create a branch for this feature:

```bash
git switch -c feature/online-reservations
```

Verify you're on the new branch:

```bash
git branch
```

### 3. Work on the Feature Branch

Create a new file `reservations.md`:

```markdown
# Online Reservation System

## How It Works

1. Browse available tools at community-tools.org
2. Click "Reserve" on any available tool
3. Select pickup date (must be within 3 days)
4. Receive confirmation email with pickup instructions

## Rules

- Maximum 3 tools reserved at once
- 7-day loan period
- Late returns result in a 1-week cooldown
```

Stage and commit:

```bash
git add reservations.md
git commit -m "Add online reservation system specification"
```

### 4. Switch Back to Main

```bash
git switch main
ls
```

Notice `reservations.md` is gone! It only exists on the feature branch.
Your main branch is exactly as you left it. This is the power of branches.

### 5. Create Another Branch

Maybe you also want to work on updating the inventory. Create a second branch
from main:

```bash
git switch -c feature/inventory-update
```

Edit `inventory.md` — add three more tools to the table. Commit:

```bash
git add inventory.md
git commit -m "Add power washer, jigsaw, and tile cutter to inventory"
```

### 6. Visualize Your Branches

```bash
git log --oneline --graph --all
```

You'll see the history diverge — main at the center, with two feature
branches splitting off. This is a map of your project's parallel timelines.

### 7. Compare Branches

See what's different between your feature branch and main:

```bash
git diff main..feature/online-reservations
```

This shows every change that exists on the feature branch but not on main.

## Key Concepts

- **Branch**: A pointer to a commit. Creating a branch is instant and free.
- **HEAD**: Points to your current branch (which commit you're "on")
- **git switch -c name**: Create + switch in one command (modern replacement for git checkout -b)
- **Feature branches**: Work in isolation so main stays stable

## Self-Check

- [ ] `git branch` shows at least 3 branches (main + 2 features)
- [ ] Each feature branch has commits that don't exist on main
- [ ] Switching to main shows the original file state
- [ ] `git log --oneline --graph --all` shows the branch structure
