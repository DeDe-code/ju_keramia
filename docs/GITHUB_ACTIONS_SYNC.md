# GitHub Actions Auto-Sync to Owner Repository

## Overview

This document explains the automated sync workflow that pushes changes from your fork (`DeDe-code/ju_keramia`) to the owner repository (`jukeramia/ju_keramia`) when code is merged to the `main` branch. This triggers Vercel deployments automatically.

## How It Works

### Workflow Trigger

When you push to the `main` branch of your fork (`origin`), the GitHub Actions workflow:

1. ✅ Runs all quality checks (type-check, build, security audit, etc.)
2. ✅ If all checks pass, automatically pushes to the owner repository
3. 🚀 Vercel detects the push to `jukeramia/ju_keramia` and triggers deployment

### Workflow File

**Location**: `.github/workflows/ci.yml`

**Job**: `sync-to-owner`

```yaml
sync-to-owner:
  runs-on: ubuntu-latest
  name: 🚀 Sync to Owner Repository
  needs: [type-check, build, security-audit, design-system-check, contact-form-test]
  if: github.event_name == 'push' && github.ref == 'refs/heads/main'
```

**Key Features**:

- Only runs on push to `main` (not on pull requests)
- Requires all quality checks to pass first
- Uses `--force-with-lease` for safe force pushing
- Fetches full git history for proper sync

## Setup Instructions

### 1. Create Personal Access Token (PAT)

You need to create a GitHub Personal Access Token with write access to the `jukeramia/ju_keramia` repository:

#### Step-by-Step:

1. Go to GitHub Settings → Developer settings → Personal access tokens → **Tokens (classic)**
   - URL: https://github.com/settings/tokens

2. Click **Generate new token** → **Generate new token (classic)**

3. Configure the token:
   - **Note**: `GitHub Actions - Sync to jukeramia/ju_keramia`
   - **Expiration**: Choose `No expiration` or custom (90 days recommended)
   - **Scopes**: Select:
     - ✅ `repo` (Full control of private repositories)
       - This includes: `repo:status`, `repo_deployment`, `public_repo`, `repo:invite`, `security_events`

4. Click **Generate token**

5. **IMPORTANT**: Copy the token immediately (it won't be shown again)
   - Format: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 2. Add Token to Your Fork Repository

1. Go to your fork: https://github.com/DeDe-code/ju_keramia

2. Navigate to **Settings** → **Secrets and variables** → **Actions**

3. Click **New repository secret**

4. Configure the secret:
   - **Name**: `OWNER_REPO_TOKEN`
   - **Secret**: Paste the token you copied (starts with `ghp_`)

5. Click **Add secret**

### 3. Verify the Workflow

After setting up the secret, the workflow will automatically run on the next push to `main`:

```bash
# Example workflow:
git checkout main
git merge your-feature-branch
git push origin main  # This triggers the workflow
```

**GitHub Actions will**:

1. Run all quality checks
2. Automatically push to `jukeramia/ju_keramia`
3. Trigger Vercel deployment

## Monitoring

### View Workflow Runs

1. Go to your fork: https://github.com/DeDe-code/ju_keramia
2. Click **Actions** tab
3. Click on the latest workflow run
4. Check the **🚀 Sync to Owner Repository** job

### Success Indicators

✅ All jobs show green checkmarks
✅ Sync job logs show: `Successfully synced to owner repository!`
✅ Vercel deployment appears in Vercel dashboard

### Troubleshooting

#### Error: "Authentication failed"

- **Cause**: Token is invalid or expired
- **Fix**: Generate a new token and update the `OWNER_REPO_TOKEN` secret

#### Error: "Permission denied"

- **Cause**: Token doesn't have write access to `jukeramia/ju_keramia`
- **Fix**: Ensure the token has `repo` scope and you have write access to the repository

#### Error: "Protected branch"

- **Cause**: The `main` branch in `jukeramia/ju_keramia` has protection rules
- **Fix**: Update branch protection rules to allow force pushes from GitHub Actions

#### Workflow doesn't run

- **Cause**: Workflow only runs on push to `main`, not on pull requests
- **Fix**: Merge your PR to `main` to trigger the workflow

## Manual Sync (Fallback)

If the automated sync fails, you can manually sync:

```bash
# Ensure you're on main with latest changes
git checkout main
git pull origin main

# Push to owner repository
git push owner main

# Or push to both remotes at once
git push origin main && git push owner main
```

## Security Considerations

### Token Security

- ✅ Token is stored as an encrypted GitHub secret
- ✅ Token is never exposed in logs or output
- ✅ Token has minimal required permissions (`repo` scope only)
- ✅ Token can be revoked at any time from GitHub settings

### Force Push Safety

The workflow uses `--force-with-lease` instead of `--force`:

- Prevents overwriting work done directly on `jukeramia/ju_keramia`
- Only pushes if the remote matches expected state
- Safer than regular force push

### Workflow Permissions

The workflow:

- Only runs on push to `main` (controlled environment)
- Requires all quality checks to pass first
- Can be disabled by removing the `OWNER_REPO_TOKEN` secret

## Workflow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  Developer Workflow                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Create feature branch                                   │
│     git checkout -b feature/my-feature                      │
│                                                             │
│  2. Make changes & commit                                   │
│     git commit -m "feat: my feature"                        │
│                                                             │
│  3. Push to fork & create PR                                │
│     git push origin feature/my-feature                      │
│                                                             │
│  4. Review & merge PR to main                               │
│     (via GitHub UI)                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  GitHub Actions Workflow (Automated)                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Trigger: Push to main                                      │
│                                                             │
│  Jobs:                                                      │
│  ├─ type-check          ✅                                  │
│  ├─ build               ✅                                  │
│  ├─ security-audit      ✅                                  │
│  ├─ design-system-check ✅                                  │
│  └─ contact-form-test   ✅                                  │
│                                                             │
│  If all checks pass:                                        │
│  └─ sync-to-owner       🚀                                  │
│     └─ Push to jukeramia/ju_keramia                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Vercel Deployment (Automated)                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Trigger: Push to jukeramia/ju_keramia main branch          │
│                                                             │
│  Actions:                                                   │
│  ├─ Build Nuxt application                                  │
│  ├─ Run Vercel build checks                                 │
│  ├─ Deploy to production                                    │
│  └─ Update jukeramia.com                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Benefits

### Automated Deployment

- ✅ No manual sync needed
- ✅ Deployments happen automatically when code is merged
- ✅ Quality checks run before deployment

### Safety

- ✅ All tests must pass before sync
- ✅ Force-with-lease prevents accidental overwrites
- ✅ Full audit trail in GitHub Actions logs

### Efficiency

- ✅ Single push to `origin` handles everything
- ✅ No need to remember multiple remotes
- ✅ Consistent deployment process

## Alternative: Manual Workflow

If you prefer manual control over deployments:

1. **Disable the auto-sync**:
   - Remove the `OWNER_REPO_TOKEN` secret from repository settings
   - The workflow will skip the sync job

2. **Manual sync when ready**:
   ```bash
   git checkout main
   git pull origin main
   git push owner main  # Manual deployment trigger
   ```

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
- [Vercel Git Integration](https://vercel.com/docs/deployments/git)

## Conclusion

The automated sync workflow streamlines your deployment process by:

- Running quality checks on every push
- Automatically syncing to the production repository
- Triggering Vercel deployments seamlessly

Once set up with the `OWNER_REPO_TOKEN` secret, you can focus on development while the workflow handles the rest!
