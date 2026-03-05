# 🚀 ESPON Deployment Guide

Complete step-by-step guide to deploy ESPON from zero to production.

---

## 📋 Prerequisites

- GitHub account
- Supabase account (free)
- Vercel account (free) or Cloudflare Pages
- 30 minutes of your time

---

## Part 1: Supabase Setup (Backend & Database)

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign in with GitHub
3. Click **"New Project"**
4. Fill in:
   - **Name**: espon-prod
   - **Database Password**: (generate strong password - save it!)
   - **Region**: Choose closest to your location
   - **Pricing Plan**: Free
5. Click **"Create new project"**
6. Wait 2-3 minutes for setup

### 1.2 Run Database Schema

1. In Supabase dashboard → **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Open `supabase/schema.sql` from this repository
4. **Copy entire contents** (all 500+ lines)
5. **Paste** into SQL Editor
6. Click **"Run"** (bottom right)
7. Wait for success message: "Success. No rows returned"

**✅ This creates**:
- 12 tables (users, customers, orders, etc.)
- Row Level Security policies (data isolation)
- Indexes (performance)
- Functions (incentive calculation)
- Triggers (auto-updates)
- Views (dashboard queries)

### 1.3 Create Test Users

1. Go to **Authentication → Users** (left sidebar)
2. Click **"Add user"**
3. Create **Admin user**:
   - Email: admin@espon.com
   - Password: password123
   - Auto Confirm User: ✅ Yes
4. Click **"Create user"**
5. **Copy the User UID** (long string like `123e4567-e89b-12d3-a456-426614174000`)
6. Repeat for **Agent user**:
   - Email: agent@espon.com
   - Password: password123

### 1.4 Configure User Profiles

1. Go to **Table Editor → users** (left sidebar)
2. Click **"Insert row"**
3. Fill in for **Admin**:
   - id: (paste admin User UID from step 1.3)
   - email: admin@espon.com
   - name: Admin User
   - role: admin
   - base_salary: 0
   - is_active: true
4. Click **"Save"**
5. Repeat for **Agent**:
   - id: (paste agent User UID)
   - email: agent@espon.com
   - name: Agent Demo
   - role: agent
   - base_salary: 15000
   - is_active: true

### 1.5 Set Agent Target (Optional)

1. Go to **Table Editor → agent_targets**
2. Click **"Insert row"**
3. Fill in:
   - agent_id: (paste agent User UID)
   - month_year: 2026-03
   - target_amount: 500000
4. Click **"Save"**

### 1.6 Get API Credentials

1. Go to **Settings → API** (left sidebar)
2. Copy these values (you'll need them later):
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (long string)

---

## Part 2: GitHub Repository Setup

### 2.1 Create Repository

1. Go to [github.com](https://github.com)
2. Click **"New repository"**
3. Name: `espon-production`
4. Visibility: Private (recommended) or Public
5. Click **"Create repository"**

### 2.2 Push Code

```bash
# In your local espon-mvp directory
git init
git add .
git commit -m "Initial ESPON setup"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/espon-production.git
git push -u origin main
```

---

## Part 3: Vercel Deployment (Frontend)

### 3.1 Connect Vercel to GitHub

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click **"Add New... → Project"**
4. **Import Git Repository**:
   - Find `espon-production`
   - Click **"Import"**

### 3.2 Configure Build Settings

1. **Framework Preset**: Vite
2. **Root Directory**: `web` ⚠️ IMPORTANT
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`
5. **Install Command**: `npm install`

### 3.3 Add Environment Variables

Click **"Environment Variables"** → Add these:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | (paste from Supabase Settings → API) |
| `VITE_SUPABASE_ANON_KEY` | (paste from Supabase Settings → API) |

Optional (if using Shipmozo):
| Name | Value |
|------|-------|
| `VITE_SHIPMOZO_PUBLIC_KEY` | your_public_key |
| `VITE_SHIPMOZO_PRIVATE_KEY` | your_private_key |

### 3.4 Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes
3. You'll get a URL like: `https://espon-production.vercel.app`

**🎉 Your app is now LIVE!**

---

## Part 4: Testing Deployment

### 4.1 Test Agent Login

1. Open `https://your-app.vercel.app`
2. Login:
   - Email: agent@espon.com
   - Password: password123
3. **Expected**: See agent dashboard
4. **Test Punch In**: Click "Punch In Now" button
5. **Test Customer Creation**: 
   - Go to Customers → + Add Customer
   - Fill form → Save
   - Verify customer appears in list

### 4.2 Test Admin Login

1. **Sign out** (or open incognito window)
2. Login:
   - Email: admin@espon.com
   - Password: password123
3. **Expected**: See admin dashboard
4. **Test Customer View**:
   - Go to Customers
   - Should see customer created by agent
5. **Test Agent Management**:
   - Go to Agents
   - Should see agent profile

### 4.3 Test RLS (Security)

**This is CRITICAL to verify data isolation**:

1. Login as Agent
2. Open browser DevTools → Console
3. Run:
```javascript
await window.supabase.from('customers').select('*')
```
4. **Expected**: Only see customers created by this agent
5. Try to access another agent's customer (if you have one):
```javascript
await window.supabase.from('customers')
  .select('*')
  .eq('created_by_agent_id', 'different-agent-id')
```
6. **Expected**: Empty array (RLS blocked it)

---

## Part 5: Post-Deployment Configuration

### 5.1 Configure Supabase Auth Settings

1. Go to Supabase → **Authentication → URL Configuration**
2. Add Vercel URL:
   - **Site URL**: `https://your-app.vercel.app`
   - **Redirect URLs**: `https://your-app.vercel.app/**`

### 5.2 Set Up Custom Domain (Optional)

**In Vercel**:
1. Settings → Domains
2. Add domain: `espon.yourdomain.com`
3. Follow DNS instructions

**In Supabase**:
1. Update Site URL to your custom domain

### 5.3 Enable Email Confirmations (Production)

1. Supabase → **Authentication → Providers → Email**
2. Toggle **"Confirm email"**: ON
3. Configure SMTP (or use Supabase's built-in email)

### 5.4 Set Up Monitoring

**Supabase**:
1. Settings → API
2. Set up usage alerts (email when approaching limits)

**Vercel**:
1. Analytics (built-in)
2. Set up deployment notifications (Slack/Discord)

---

## Part 6: Production User Setup

### 6.1 Create Real Agent Accounts

For each agent (Garima, Ikra, Nancy, Tannu):

1. **Supabase → Authentication → Add user**:
   - Email: garima@yourcompany.com
   - Password: (temporary - they'll change it)
   - Auto Confirm: Yes

2. **Table Editor → users → Insert**:
   - id: (copy User UID)
   - email: garima@yourcompany.com
   - name: Garima
   - role: agent
   - base_salary: 15000 (or their actual salary)
   - is_active: true

3. **Table Editor → agent_targets → Insert**:
   - agent_id: (copy User UID)
   - month_year: 2026-03
   - target_amount: 300000 (Garima's target)

4. **Send credentials**:
   - Email: garima@yourcompany.com
   - Temporary password: password123
   - App URL: https://your-app.vercel.app
   - **Ask them to change password immediately**

Repeat for all agents with their respective targets:
- Garima: ₹3,00,000
- Ikra: ₹5,00,000
- Nancy: ₹4,00,000
- Tannu: ₹11,00,000

### 6.2 Import Existing Customers (Optional)

If you have existing customers from Excel:

1. Export Excel customers to CSV (columns: customer_name, phone, shop_name, customer_type, lead_source)
2. In Supabase SQL Editor, run:
```sql
-- For Garima's customers
INSERT INTO customers (created_by_agent_id, customer_name, phone, shop_name, customer_type, lead_source)
SELECT 
  'garima-user-id-here'::uuid,
  customer_name,
  phone,
  shop_name,
  customer_type::text,
  lead_source
FROM (
  VALUES
    ('Customer 1', '9876543210', 'Shop 1', 'Retailer', 'Facebook'),
    ('Customer 2', '9876543211', 'Shop 2', 'Wholesaler', 'Google')
    -- ... add more rows
) AS t(customer_name, phone, shop_name, customer_type, lead_source);
```

---

## Part 7: Ongoing Maintenance

### 7.1 Monthly Target Updates

**First day of every month**:

1. Supabase → SQL Editor
2. Run:
```sql
INSERT INTO agent_targets (agent_id, month_year, target_amount)
VALUES
  ('garima-id', '2026-04', 300000),
  ('ikra-id', '2026-04', 500000),
  ('nancy-id', '2026-04', 400000),
  ('tannu-id', '2026-04', 1100000);
```

Or set up automatic target copying:
```sql
-- Copy last month's targets to new month
INSERT INTO agent_targets (agent_id, month_year, target_amount)
SELECT agent_id, '2026-04', target_amount
FROM agent_targets
WHERE month_year = '2026-03';
```

### 7.2 Monthly Snapshots (Salary Processing)

**End of every month** (for permanent payout records):

1. Supabase → SQL Editor
2. Run:
```sql
INSERT INTO monthly_snapshots (
  agent_id, month_year, total_calls, fresh_calls, followup_calls,
  total_orders, total_sales, qualifying_sales, total_incentive,
  base_salary, total_payout, target_amount, is_locked
)
SELECT 
  u.id,
  '2026-03',
  COUNT(DISTINCT cl.id),
  COUNT(DISTINCT CASE WHEN cl.call_type = 'Fresh' THEN cl.id END),
  COUNT(DISTINCT CASE WHEN cl.call_type = 'Follow-up' THEN cl.id END),
  COUNT(DISTINCT o.id),
  COALESCE(SUM(o.total_sale), 0),
  COALESCE(SUM(CASE WHEN o.order_type != 'Credit' AND o.discount_category != '15%+' THEN o.taxable_amount ELSE 0 END), 0),
  COALESCE(SUM(o.incentive_amount), 0),
  u.base_salary,
  u.base_salary + COALESCE(SUM(o.incentive_amount), 0),
  COALESCE(t.target_amount, 0),
  true
FROM users u
LEFT JOIN call_logs cl ON u.id = cl.agent_id AND TO_CHAR(cl.call_date, 'YYYY-MM') = '2026-03'
LEFT JOIN orders o ON u.id = o.agent_id AND TO_CHAR(o.order_date, 'YYYY-MM') = '2026-03'
LEFT JOIN agent_targets t ON u.id = t.agent_id AND t.month_year = '2026-03'
WHERE u.role = 'agent' AND u.is_active = true
GROUP BY u.id, u.base_salary, t.target_amount;
```

3. Export for salary processing:
```sql
SELECT 
  u.name,
  ms.base_salary,
  ms.total_sales,
  ms.total_incentive,
  ms.total_payout
FROM monthly_snapshots ms
JOIN users u ON ms.agent_id = u.id
WHERE ms.month_year = '2026-03'
ORDER BY u.name;
```

### 7.3 Backup Strategy

**Automated (Supabase)**:
- Daily automatic backups (included in free tier)
- Point-in-time recovery

**Manual Monthly Backup**:
1. Supabase → Database → Backups
2. Click "Download backup"
3. Store securely (Google Drive, external hard drive)

---

## 🔒 Security Checklist

Before going live with real data:

- [ ] Changed default passwords (admin@espon.com, agent@espon.com)
- [ ] Deleted test customers/orders
- [ ] Verified RLS policies (agents can't see others' data)
- [ ] Enabled email confirmation (Supabase Auth)
- [ ] Set up HTTPS (automatic with Vercel)
- [ ] Configured CORS (restrict to your domain in Supabase)
- [ ] Rotated any API keys shared during development
- [ ] Set up usage alerts (Supabase Settings)
- [ ] Reviewed audit_log table (admin actions)
- [ ] Tested all user roles (agent, admin)

---

## 💡 Tips for Success

1. **Start small**: Deploy with 1-2 test agents first
2. **Train users**: Walk agents through punch in, customer creation, call logging
3. **Monitor usage**: Check Supabase dashboard daily for first week
4. **Backup often**: Download monthly exports to Excel as backup
5. **Stay within free tier**: 
   - Supabase: 500MB DB, 2GB egress/month
   - Vercel: 100GB bandwidth/month
   - Should handle 10-20 agents easily

---

## 🆘 Emergency Contacts

**If something breaks**:

1. Check Supabase Logs: Dashboard → Logs
2. Check Vercel Deployment Logs: Deployments → [latest] → Function Logs
3. Check browser console: F12 → Console tab
4. Rollback deployment: Vercel → Deployments → [previous working version] → Promote to Production

**Database restore**:
1. Supabase → Database → Backups
2. Click "Restore" on latest backup

---

**Deployment complete! 🎉**

Next steps:
1. Onboard agents (show them punch in, customer creation)
2. Monitor first week closely
3. Collect feedback
4. Iterate and improve

Good luck! 🚀
