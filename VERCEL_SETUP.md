# ⚙️ VERCEL DEPLOYMENT SETTINGS

## 🎯 EXACT SETTINGS TO USE ON VERCEL

When you create your Vercel project, use these EXACT settings:

---

## 📋 BUILD & OUTPUT SETTINGS

```
Framework Preset:    Vite
Root Directory:      web
Build Command:       npm run build
Output Directory:    dist
Install Command:     npm install
```

**⚠️ CRITICAL:** Set Root Directory to **`web`** - NOT root!

---

## 🔐 ENVIRONMENT VARIABLES

Add these in the "Environment Variables" section:

### Variable 1:
```
Name:  VITE_SUPABASE_URL
Value: https://nhrcvjggvbvhlqiqilxu.supabase.co
```

### Variable 2:
```
Name:  VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ocmN2amdndmJ2aGxxaXFpbHh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEzNDcxMzYsImV4cCI6MjA1NjkyMzEzNn0.AhRz8RQ9f5-nV6bw_V2N6XeJnFqLqXC89XPSPu8BSOY
```

**Apply to:** All environments (Production, Preview, Development)

---

## 📸 STEP-BY-STEP WITH SCREENSHOTS

### Step 1: Import Project
1. Go to [vercel.com/new](https://vercel.com/new)
2. Click "Import" next to your GitHub repository
3. If not showing, click "Import Git Repository" and paste your repo URL

### Step 2: Configure Project
```
Project Name:           espon-web (or your choice)
Framework Preset:       Vite
Root Directory:         web ← IMPORTANT!
```

Click "Edit" next to Root Directory and type: **web**

### Step 3: Build Settings (expand if needed)
```
Build Command:          npm run build
Output Directory:       dist
Install Command:        npm install
Development Command:    npm run dev
```

These should auto-fill when you select Vite and set root to "web"

### Step 4: Environment Variables
Click "Add" and enter:

**First Variable:**
- KEY: `VITE_SUPABASE_URL`
- VALUE: `https://nhrcvjggvbvhlqiqilxu.supabase.co`
- Check: ✅ Production ✅ Preview ✅ Development

**Second Variable:**
- KEY: `VITE_SUPABASE_ANON_KEY`
- VALUE: (paste the long token from above)
- Check: ✅ Production ✅ Preview ✅ Development

### Step 5: Deploy
Click the big blue **"Deploy"** button!

---

## ⏱️ DEPLOYMENT TIMELINE

```
1. Initializing         [▰▰▱▱▱▱▱▱▱▱] 10 seconds
2. Cloning repository   [▰▰▰▱▱▱▱▱▱▱] 20 seconds
3. Installing deps      [▰▰▰▰▰▰▱▱▱▱] 1 minute
4. Building            [▰▰▰▰▰▰▰▰▱▱] 1-2 minutes
5. Deploying           [▰▰▰▰▰▰▰▰▰▱] 2-3 minutes
6. Assigning domain    [▰▰▰▰▰▰▰▰▰▰] Complete!

Total Time: ~3 minutes
```

---

## ✅ SUCCESS INDICATORS

You'll know it worked when you see:

```
✓ Building...
✓ Compiled successfully
✓ Deployment ready
✓ Assigned domain: your-app.vercel.app
```

---

## 🎉 AFTER DEPLOYMENT

### Your URLs:
```
Production:  https://your-app.vercel.app
Preview:     https://your-app-git-main.vercel.app
```

### Test immediately:
1. Visit: `https://your-app.vercel.app/login`
2. Login as agent: `agent@espon.com` / `password123`
3. Login as admin: `admin@espon.com` / `password123`

---

## 🐛 COMMON ERRORS & FIXES

### Error: "Build failed"
**Cause:** Root Directory not set to "web"  
**Fix:** Edit project settings → Set Root Directory to **web**

### Error: "Missing environment variables"
**Cause:** Env vars not added or typo in name  
**Fix:** 
- Go to Project Settings → Environment Variables
- Make sure names are EXACTLY: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Redeploy

### Error: "Cannot find module"
**Cause:** Wrong build command or output directory  
**Fix:** 
- Build Command: `npm run build`
- Output Directory: `dist`

### Error: "Auth error" after deployment
**Cause:** Supabase environment variables not set correctly  
**Fix:**
- Double-check the values match EXACTLY
- No extra spaces or quotes
- Must have `VITE_` prefix

---

## 🔄 RE-DEPLOYING AFTER CHANGES

If you need to redeploy after making changes:

```bash
# Make your changes, then:
git add .
git commit -m "Your change description"
git push origin main

# Vercel will auto-deploy!
# Check deployment at: vercel.com/dashboard
```

---

## 🎛️ CUSTOM DOMAIN (Optional)

To add your own domain:

1. Go to Project → Settings → Domains
2. Enter your domain (e.g., espon.yourdomain.com)
3. Add the DNS records shown by Vercel
4. Wait 5-60 minutes for DNS propagation

---

## 📊 MONITORING YOUR APP

After deployment, monitor:
- **Deployments:** vercel.com/dashboard/deployments
- **Analytics:** vercel.com/dashboard/analytics
- **Logs:** Click on deployment → "Logs" tab

---

## 🎯 QUICK SETTINGS TEMPLATE

**Copy this and paste when creating project:**

```
Root Directory:        web
Framework:            Vite
Build Command:        npm run build
Output Directory:     dist

Environment Variables:
VITE_SUPABASE_URL=https://nhrcvjggvbvhlqiqilxu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ocmN2amdndmJ2aGxxaXFpbHh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEzNDcxMzYsImV4cCI6MjA1NjkyMzEzNn0.AhRz8RQ9f5-nV6bw_V2N6XeJnFqLqXC89XPSPu8BSOY
```

---

## 🆘 STILL HAVING ISSUES?

1. **Check build logs** on Vercel dashboard
2. **Verify GitHub repo** is pushed
3. **Check environment variables** have no typos
4. **Verify Supabase** project is active
5. **Try redeploying** from Vercel dashboard

---

## ✅ VERIFICATION CHECKLIST

After deployment, verify:

```
☐ Build completed successfully (green checkmark)
☐ Domain assigned (e.g., your-app.vercel.app)
☐ /login page loads
☐ Can login as agent
☐ Can login as admin
☐ Dashboard shows data
☐ Can add customer
☐ Can log call
☐ Can create order
☐ Mobile version works
```

---

## 🎉 YOU'RE DONE!

Once all checks pass, your ESPON platform is LIVE! 🚀

**Share the URL with your team and start managing sales!**

**Next steps:**
- Add real agents in Supabase
- Set monthly targets
- Upload customer data
- Train your team
- Start tracking sales!

---

**Need help?** Check `DEPLOYMENT_FIX.md` for detailed troubleshooting.
