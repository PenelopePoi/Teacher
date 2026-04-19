# Merging Branches & Resolving Conflicts

## Why This Matters

Branches are only useful if you can bring them back together. Merging is
how features become products, how fixes reach users, how a team's parallel
work converges into one coherent codebase. And sometimes that convergence
creates conflicts — two people editing the same line. Knowing how to resolve
conflicts calmly and correctly is what separates working developers from
frustrated ones.

## Prerequisites

Complete **branching**. You should have `main` and at least two feature branches.

## Exercises

### 1. Merge a Feature Branch (Fast-Forward)

Switch to main and merge the online reservations feature:

```bash
git switch main
git merge feature/online-reservations
```

If main hasn't changed since you branched, Git does a "fast-forward" — it
just moves the main pointer forward. No merge commit needed.

Check that `reservations.md` now exists on main:

```bash
ls
git log --oneline
```

### 2. Merge a Second Branch (Three-Way Merge)

Now merge the inventory update branch:

```bash
git merge feature/inventory-update
```

Since main has moved forward (from the first merge), Git creates a merge
commit that ties both histories together. You may be prompted to write
a merge commit message.

### 3. Create a Conflict on Purpose

To learn conflict resolution, you need a conflict. Let's create one deliberately.

Create two branches that edit the same file:

```bash
git switch -c branch-a
```

Edit `README.md` — change the "Mission" section to:

```markdown
## Mission

Empower neighbors to build, repair, and create by sharing tools
and knowledge. No purchase necessary.
```

Commit:

```bash
git add README.md
git commit -m "Update mission statement with empowerment focus"
```

Switch back to main and create another branch:

```bash
git switch main
git switch -c branch-b
```

Edit the SAME "Mission" section in `README.md` differently:

```markdown
## Mission

Build a sustainable sharing economy starting with tools.
Reduce consumption, strengthen community bonds, save money.
```

Commit:

```bash
git add README.md
git commit -m "Update mission with sustainability focus"
```

### 4. Trigger the Conflict

Merge branch-a into main first (this will be clean):

```bash
git switch main
git merge branch-a
```

Now merge branch-b — this will conflict:

```bash
git merge branch-b
```

Git will tell you there's a conflict in `README.md`.

### 5. Resolve the Conflict

Open `README.md`. You'll see conflict markers:

```
<<<<<<< HEAD
Empower neighbors to build, repair, and create by sharing tools
and knowledge. No purchase necessary.
=======
Build a sustainable sharing economy starting with tools.
Reduce consumption, strengthen community bonds, save money.
>>>>>>> branch-b
```

Your job: combine the best of both versions. Delete the conflict markers
(`<<<<<<<`, `=======`, `>>>>>>>`) and write the merged version:

```markdown
## Mission

Empower neighbors to build, repair, and create through a sustainable
tool-sharing program. Reduce consumption, strengthen community bonds,
and make DIY accessible — no purchase necessary.
```

### 6. Complete the Merge

Stage the resolved file and commit:

```bash
git add README.md
git commit -m "Merge mission statement: combine empowerment and sustainability"
```

### 7. Clean Up

Delete the merged branches — they've served their purpose:

```bash
git branch -d feature/online-reservations
git branch -d feature/inventory-update
git branch -d branch-a
git branch -d branch-b
```

View the final history:

```bash
git log --oneline --graph --all
```

## Key Concepts

- **Fast-Forward Merge**: Main hasn't diverged, so Git just moves the pointer forward
- **Three-Way Merge**: Both branches have new commits; Git creates a merge commit
- **Conflict**: Two branches edited the same line; Git can't auto-resolve
- **Conflict Markers**: `<<<<<<<`, `=======`, `>>>>>>>` — the boundaries of the conflict
- **Resolution**: Edit the file, remove markers, keep what you want, then commit

## Self-Check

- [ ] You performed both a fast-forward and a three-way merge
- [ ] You created, encountered, and resolved a merge conflict
- [ ] `README.md` contains the merged mission statement with no conflict markers
- [ ] `git log --oneline --graph` shows a clean history with merge points
- [ ] Old feature branches are deleted after merging
