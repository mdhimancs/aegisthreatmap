# GitHub Pages Deployment Guide

### ⚠️ Read Me First: Architecture & Limitations
This application is a **Full-Stack React/Node.js** app. Before deploying to GitHub Pages, you must understand the following limitations:
* **GitHub Pages only hosts STATIC files** (HTML, CSS, JavaScript). It **cannot** run the backend Node.js server (`server.ts`).
* **The AI Features Will Be Disabled:** Because the Gemini API calls and AI Analyst features require the backend server to securely hold the API keys, those specific buttons/features will fail on GitHub Pages. The interactive map, dashboards, and charts will load perfectly.
* **Do NOT overwrite `package.json` with Vue or static-only templates.** The `package.json` is heavily configured for React, Tailwind, Leaflet, and D3. Replacing it will break the app. 
* *Alternative:* If you want the AI features to work for free, you must host this repository on a full-stack platform like **Render.com**, **Google Cloud Run**, or **Vercel** instead of GitHub Pages.

---

This guide explains how to publish your website to GitHub Pages and continuously update it using the direct AI Studio Export method.

---

### Phase 1: The Initial Export (Creating the Repository)
First, we need to get your code out of AI Studio and into a brand new GitHub repository.

1. In the top right corner of this AI Studio window, click the **Settings / Menu** icon (it usually looks like three dots or a gear).
2. Click **Export to GitHub**.
3. Follow the prompts to connect your GitHub account (if you haven't already) and create a new repository. Give it a name like `aegis-threat-map`. (Note: I have already updated the `package.json` in this workspace so the `"name"` and `"description"` perfectly match this!).
4. Once the export is complete, click the link to open your new repository on GitHub.

### Phase 2: Setting up GitHub Pages (One-Time Setup)
Now we tell GitHub how to automatically build and host your website.

1. In your new GitHub repository, click the **Settings** tab.
2. On the left sidebar, scroll down and click **Pages**.
3. Under *Build and deployment*, click the **Source** dropdown and select **GitHub Actions**.
4. Scroll back up to the top of your repository and click the **Actions** tab.
5. Click **"set up a workflow yourself"** (or click "New workflow").
6. Name the file `.github/workflows/deploy.yml`.
7. Paste this exact code into the editor:

```yaml 
name: Deploy static content to Pages

on:
  push:
    branches: ['main']

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: true

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    env:
      FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install dependencies
        run: npm install
      - name: Build project
        run: npm run build
      - name: Setup Pages
        uses: actions/configure-pages@v4
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

8. Click the green **Commit changes...** button in the top right, and commit directly to the `main` branch. 
*(Within a few minutes, your site will be live at `https://<your-username>.github.io/<your-repo-name>/`!)*

---

### Phase 3: The Update Workflow (How to make future changes)
Whenever we make a change here in the chat and you want to push it to your live website, follow these exact steps:

1. **Export the Update:** In AI Studio, click the **Settings / Menu** icon again and click **Export to GitHub**.
2. **Select Existing Repo:** This time, instead of creating a new one, select your existing `aegis-threat-map` repository. AI Studio will send the updated code to GitHub as a **Pull Request** (this is a safety feature so it doesn't overwrite your live site without your permission).
3. **Go to GitHub:** Open your repository on the GitHub website.
4. **Approve the Changes:** Click on the **Pull requests** tab at the top. You will see a new automated request from AI Studio. Click on it.
5. **Merge:** Scroll down and click the green **Merge pull request** button, then click **Confirm merge**.
6. **Watch it Update:** As soon as you click merge, GitHub Actions will automatically detect the new code, rebuild your website, and publish it. 

You can click on your **Actions** tab in GitHub to watch the progress bar. Once the light turns green (usually takes about 2 minutes), simply refresh your live website URL and your newest changes will be there!

---

### Phase 4: Tracking Deployment & Accessing the Live Site
Once you have committed your `.github/workflows/deploy.yml` file, or merged a new update from AI Studio, you can track the deployment progress and find your live website link.

**1. How to Watch the Deployment Progress**
1. Open your repository on GitHub.
2. Click on the **Actions** tab at the top (next to "Pull requests").
3. In the list of workflows on the left, click **Deploy static content to Pages**.
4. You will see a list of recent workflow runs:
   - 🟡 A **Yellow Spinning Circle** means it is currently building and deploying (this usually takes 1–3 minutes).
   - 🟢 A **Green Checkmark** means the deployment was completely successful and your site is live!
   - 🔴 A **Red X** means the build failed (click on it to see what went wrong).

**2. How to Find Your Live Website URL**
Once you see the green checkmark, GitHub provides your live link in two convenient places:

**Location A: The Right Sidebar (Easiest)**
1. Go to the main homepage of your repository (the **Code** tab).
2. Look at the right-hand sidebar. Scroll down until you see a section called **Environments**.
3. You will see **`github-pages`** listed there. Click on it.
4. On the next page, click the **View deployment** button on the right side. This will open your live website in a new tab!

**Location B: Inside the Actions Tab**
1. Go to the **Actions** tab.
2. Click on the specific workflow run that just finished with a green checkmark.
3. Under the "Deploy to GitHub Pages" job block, you will see a link that looks like `https://<your-username>.github.io/<your-repo-name>/`. Click that link to open your live website!

*(Tip: To make it easy to find in the future, go to your repository's **Code** tab, click the **Gear Icon (⚙️)** next to the "About" section on the right, check the box that says **"Use your GitHub Pages website"**, and click **Save changes**. The link will now be permanently pinned to the top of your repository!)*
