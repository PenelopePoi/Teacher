# Initialize a Repository & Make Your First Commit

## Why This Matters

Every line of code you've ever lost — the feature that worked until you "fixed" it,
the config file you overwrote, the project you deleted by accident — version control
prevents all of that. Git is the safety net under every professional developer.

## Setup

Run the setup script to create a practice directory:

```bash
bash setup.sh
cd practice-repo
```

## Exercises

### 1. Initialize Your Repository

Inside the `practice-repo` directory, initialize a new Git repository:

```bash
git init
```

Check that it worked:

```bash
git status
```

You should see "No commits yet" and a list of untracked files.

### 2. Stage Your First File

The setup script created a `README.md` file. Stage it:

```bash
git add README.md
```

Run `git status` again. Notice the file moved from "Untracked" to "Changes to be committed."

### 3. Make Your First Commit

Commit the staged file with a meaningful message:

```bash
git commit -m "Add project README with mission statement"
```

### 4. Add More Files and Commit

Create a new file called `plan.md` with at least 3 lines describing a project you care about.
Then stage and commit it:

```bash
git add plan.md
git commit -m "Add initial project plan"
```

### 5. View Your History

See the commits you've made:

```bash
git log
```

You should see two commits, each with a unique hash, your name, and the message.

## Key Concepts

- **Working Directory**: The files on your disk right now
- **Staging Area (Index)**: Files marked for the next commit
- **Repository (.git)**: The complete history of all commits
- **Commit**: A snapshot of your staged changes, frozen in time

## Self-Check

- [ ] `git log` shows at least 2 commits
- [ ] Each commit has a descriptive message (not just "update" or "fix")
- [ ] `git status` shows "nothing to commit, working tree clean"
