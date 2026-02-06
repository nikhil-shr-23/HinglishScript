# Deploying boltype to Vercel

## Quick Steps

### 1. Push to GitHub ✅

Already done - repo: `https://github.com/nikhil-shr-23/HinglishScript.git`

### 2. Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New Project"**
3. Import your GitHub repo: `nikhil-shr-23/HinglishScript`

### 3. Configure Build Settings

| Setting              | Value                              |
| -------------------- | ---------------------------------- |
| **Root Directory**   | `frontend`                         |
| **Framework Preset** | Next.js (auto-detected)            |
| **Build Command**    | `bun run build` or `npm run build` |
| **Install Command**  | `bun install` or `npm install`     |

### 4. Add Environment Variable

> [!IMPORTANT]
> Add your OpenAI API key in Vercel's Environment Variables:

| Key              | Value                    |
| ---------------- | ------------------------ |
| `OPENAI_API_KEY` | `sk-proj-...` (your key) |

### 5. Deploy

Click **"Deploy"** and wait for the build to complete.

---

## After Deployment

Your app will be live at: `https://your-project.vercel.app`

To redeploy after changes:

```bash
git add . && git commit -m "update" && git push origin main
```

Vercel auto-deploys on push.
