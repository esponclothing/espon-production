# ⚡ ESPON Quick Start Guide

Get ESPON running in **5 minutes** (local development) or **30 minutes** (production deployment).

---

## 🚀 Option 1: Local Development (5 minutes)

Perfect for testing and development.

### Step 1: Clone & Install (2 min)
```bash
cd web
npm install
```

### Step 2: Set Up Supabase (2 min)
1. Go to [supabase.com](https://supabase.com) → Create project (free)
2. Copy `supabase/schema.sql` → Paste in SQL Editor → Run
3. Authentication → Add users:
   - admin@espon.com / password123
   - agent@espon.com / password123
4. Table Editor → `users` → Insert rows for both users (set roles)
5. Settings → API → Copy URL and anon key

### Step 3: Configure Environment (30 sec)
```bash
cd web
cp .env.example .env
# Edit .env - paste your Supabase URL and key
```

### Step 4: Run! (30 sec)
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

Login:
- **Agent**: agent@espon.com / password123
- **Admin**: admin@espon.com / password123

✅ **Done!** You can now test all features locally.

---

## 🌐 Option 2: Production Deployment (30 minutes)

Deploy to the internet for real use.

### Prerequisites
- GitHub account
- Vercel account (sign up with GitHub at [vercel.com](https://vercel.com))
- Supabase account (from Option 1 above)

### Step 1: Supabase Setup (10 min)
Follow Option 1, Step 2 above. Then:
1. Create 4 real agent users (Garima, Ikra, Nancy, Tannu)
2. Set their monthly targets in `agent_targets` table
3. Note down your Supabase URL and anon key

### Step 2: Push to GitHub (5 min)
```bash
# In project root
git init
git add .
git commit -m "Initial ESPON deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/espon-prod.git
git push -u origin main
```

### Step 3: Deploy on Vercel (10 min)
1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repository
3. **IMPORTANT**: Set Root Directory to `web`
4. Add environment variables:
   - `VITE_SUPABASE_URL` = your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
5. Click Deploy

### Step 4: Configure & Test (5 min)
1. Wait for deployment (2-3 minutes)
2. Open your Vercel URL: `https://your-app.vercel.app`
3. Login with agent@espon.com
4. Test: Punch in → Add customer → View dashboard
5. Login with admin@espon.com
6. Test: View customers → Check agent status

✅ **Live!** Share the URL with your team.

---

## 📱 What to Do Next

### For Agents
1. **Punch in** when starting work
2. **Add customers** from your existing contacts
3. **Log calls** after every customer interaction
4. **Create orders** when customers purchase
5. **Punch out** when ending work

### For Admin
1. **Set monthly targets** for each agent
2. **Monitor live dashboard** throughout the day
3. **Review customer data** from all agents
4. **Approve leave requests** as they come
5. **Generate monthly reports** at month-end

---

## 🔧 Common First-Time Issues

### "Cannot login"
- Check if user exists in Supabase Authentication
- Verify user has entry in `users` table
- Confirm role is set correctly ('agent' or 'admin')

### "Cannot see customers"
- Verify RLS policies are enabled (they are by default)
- Check if customer's `created_by_agent_id` matches agent's user ID
- Admins should see all customers (check role)

### "Incentive calculation wrong"
- Verify slab thresholds in `incentive_settings` table
- Check if order is Credit or 15%+ (these get 1%)
- Test calculation: `SELECT calculate_incentive(...)`

### "Environment variables not working"
- In Vercel: Settings → Environment Variables → Check values
- Redeploy after changing env vars
- In local: Restart dev server after editing .env

---

## 📚 Full Documentation

- **README.md** - Complete feature list and setup
- **DEPLOYMENT.md** - Detailed deployment walkthrough
- **API.md** - Database query examples
- **PROJECT_SUMMARY.md** - What's built and what's not

---

## 💡 Pro Tips

1. **Start small**: Test with 1-2 agents first
2. **Import existing customers**: Use SQL INSERT to bulk add
3. **Backup monthly**: Download Supabase backup on 1st of month
4. **Monitor usage**: Check Supabase dashboard for API usage
5. **Mobile first**: Agents will primarily use phones - design for that

---

## 🎯 Success Checklist

After deployment, verify:

- [ ] Agents can login
- [ ] Agents can punch in/out
- [ ] Agents can see only their customers
- [ ] Agents can add customers
- [ ] Admin can see all customers
- [ ] Admin can view all agents
- [ ] Incentive calculation works
- [ ] Mobile layout looks good
- [ ] Dashboard shows correct metrics

---

## 🆘 Need Help?

1. **Setup issues**: Read DEPLOYMENT.md
2. **Database issues**: Check Supabase Logs
3. **Frontend issues**: Check browser console (F12)
4. **API issues**: Read API.md for query examples

---

## 📈 After Initial Setup

**Week 1**: Train agents on basic features (punch, customers, calls)  
**Week 2**: Introduce order entry and tracking  
**Week 3**: Review admin reports and optimize workflows  
**Month 1**: Gather feedback and add requested features  

---

**You're ready to replace your Excel sheets! 🚀**

Questions? Check the full docs in README.md

---

**Time investment**:
- Local dev: 5 minutes
- Production: 30 minutes
- Agent training: 15 minutes per agent
- ROI: Immediate (no more Excel juggling!)
