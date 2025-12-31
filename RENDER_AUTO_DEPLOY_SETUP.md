# Render Auto-Deploy Setup

## Issue
Deployments are not automatically triggered when you commit and push to GitHub.

## Solution Steps

### 1. Verify Service is Connected to GitHub
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click on your service (e.g., `allymind`)
3. Go to **Settings** tab
4. Scroll to **GitHub** section
5. Verify that:
   - Repository is connected (should show your repo: `ovidon83/mindnestapp`)
   - Branch is set to `main` (or your default branch)

### 2. Enable Auto-Deploy
1. In the same **Settings** page
2. Scroll to **Auto-Deploy** section
3. Ensure **Auto-Deploy** is set to:
   - ✅ **"On Commit"** - Deploys automatically on every push
   - OR
   - ✅ **"After CI Checks Pass"** - Deploys after CI passes (if you have CI)

### 3. Check Branch Configuration
1. In **Settings** → **GitHub** section
2. Verify **Branch** is set to `main`
3. If it's set to a different branch, change it to `main`

### 4. Reconnect Repository (if needed)
If the repository isn't connected properly:
1. Go to **Settings** → **GitHub**
2. Click **Disconnect** (if connected)
3. Click **Connect GitHub**
4. Select your repository: `ovidon83/mindnestapp`
5. Select branch: `main`
6. Click **Connect**

### 5. Verify Webhook is Active
1. Go to your GitHub repository: `https://github.com/ovidon83/mindnestapp`
2. Click **Settings** → **Webhooks**
3. Look for a webhook from `render.com`
4. If it exists, verify it's **Active** (green checkmark)
5. If it doesn't exist, Render should create it automatically when you reconnect

### 6. Test the Connection
1. Make a small change (e.g., update a comment)
2. Commit and push:
   ```bash
   git add .
   git commit -m "Test auto-deploy"
   git push
   ```
3. Go to Render Dashboard → Your Service → **Events** tab
4. You should see a new deploy starting within seconds

### 7. Manual Deploy (Temporary Workaround)
If auto-deploy still doesn't work:
1. Go to Render Dashboard → Your Service
2. Click **Manual Deploy** → **Deploy latest commit**

## Common Issues

### Issue: "Public Git Repository" instead of GitHub Integration
- **Problem**: Service was created using "Public Git Repository" option
- **Solution**: You need to reconnect using "GitHub" option instead

### Issue: Wrong Branch
- **Problem**: Service is watching `master` but you're pushing to `main`
- **Solution**: Update branch in Settings → GitHub → Branch

### Issue: Webhook Not Created
- **Problem**: GitHub webhook is missing or inactive
- **Solution**: Disconnect and reconnect the repository in Render

## Verification Checklist
- [ ] Service is connected to GitHub repository
- [ ] Branch is set to `main`
- [ ] Auto-Deploy is enabled ("On Commit")
- [ ] GitHub webhook exists and is active
- [ ] Test push triggers a deployment

## Still Not Working?
1. Check Render Dashboard → **Events** tab for any errors
2. Check GitHub → **Settings** → **Webhooks** for failed deliveries
3. Contact Render support with your service URL and issue description

