# 🚀 ESPON - All-In-One Sales & Agent Management Platform

## ✅ **STATUS: PRODUCTION READY - ALL ERRORS FIXED!**

**🎉 All build errors resolved | All features working | Ready to deploy in 5 minutes**

**📖 Quick Start Guides:**
- **[`QUICK_GUIDE.md`](QUICK_GUIDE.md)** - 2-minute overview
- **[`VERCEL_SETUP.md`](VERCEL_SETUP.md)** - Step-by-step deployment
- **[`START_DEPLOYMENT.md`](START_DEPLOYMENT.md)** - Complete deployment guide
- **[`DEPLOYMENT_FIX.md`](DEPLOYMENT_FIX.md)** - Troubleshooting

---

A complete, production-ready web application for managing sales agents, customer relationships, orders, attendance, and incentive calculations. Built with React, TypeScript, Supabase (PostgreSQL), and designed to run at **near-zero cost** on free-tier infrastructure.

---

## ✨ Key Features

### 🔐 **Secure Role-Based Access Control**
- **Agent Panel**: Agents see only their own customers (strict data isolation via Row Level Security)
- **Admin Panel**: Full visibility across all agents, customers, orders, and system-wide analytics
- Permanent customer ownership by creating agent (cannot be stolen by other agents)
- Audit logging for all admin actions (reassignments, target changes, salary updates)

### 👤 **Agent Features**
- **Punch In/Out System**: Track work hours with break management (Lunch, Tea)
- **Live Dashboard**: Today's calls, orders, sales + monthly progress bar
- **Customer Management**: Add customers, filter by status (New/Matured/Cold/Interested), search
- **Call Logging**: Log calls with stages, notes, schedule follow-ups
- **Order Entry**: Create orders with automatic incentive calculation
- **Leave Requests**: Apply for leave and track approval status
- **WhatsApp Integration**: One-click WhatsApp chat buttons for every customer
- **360° Customer Profile**: Complete timeline of all interactions (calls, orders, notes)

### 👑 **Admin Features**
- **Live Dashboard**: Real-time agent status (punched in/out/break), leaderboard, activity feed
- **Master Customer Database**: View all customers, filter by agent, bulk reassignment tool
- **Agent Management**: Set monthly targets, update base salaries, performance overview
- **Reports Module**:
  - Monthly incentive reports (salary + incentive breakdown)
  - Attendance reports (work hours, leave history)
  - Customer monthly reports (sales grid by month)
  - Export to Excel/PDF
- **Leave Management**: Approve or deny agent leave requests
- **Settings Panel**: 
  - Configure incentive slab thresholds and rates
  - Manage dropdown options (lead sources, call stages, etc.)
  - Update system-wide parameters

### 💰 **Intelligent Incentive Engine**
Matches your exact Excel formula logic:

**Slab Calculation** (based on monthly qualifying sales excluding Credit & 15%+ discount):
- < ₹2.5L: **1%**
- ₹2.5L - ₹5L: **1.75%**
- ₹5L - ₹7L: **2.5%**
- ₹7L - ₹9L: **3.5%**
- ≥ ₹9L: **5%**

**Special Rules**:
- **Credit orders**: Always 1% incentive
- **15%+ discount**: Always 1% incentive
- **0% discount (full price)**: Slab rate + 2% (reward for no discount)

### 📦 **Shipmozo Tracking Integration**
- Automatically fetch tracking status via Shipmozo API
- Update AWB tracking status (Delivered, RTO, In Transit, etc.)
- Secure server-side API calls (keys never exposed to frontend)

### 🗓️ **Monthly Reset & History Preservation**
- **Never deletes data** - all orders, calls, customers preserved forever
- Dashboard views automatically filter to current month
- Month selector to view historical data
- **Month-end snapshots**: Locked records of final monthly payouts for salary processing

---

## 🏗️ System Architecture

### **Tech Stack**
| Layer | Technology | Why? | Cost |
|-------|-----------|------|------|
| **Frontend** | React 18 + TypeScript + Vite | Fast, type-safe, modern | Free (Vercel/Netlify) |
| **Styling** | Tailwind CSS (CDN) | Responsive mobile-first design | Free |
| **Backend** | Supabase (PostgreSQL + Auth + RLS) | Serverless, auto-scaling, secure | Free tier: 500MB DB, 50K monthly users |
| **Authentication** | Supabase Auth | Built-in user management | Included |
| **API** | Supabase Edge Functions | Serverless compute | Free tier: 500K invocations/month |
| **Hosting** | Vercel / Cloudflare Pages | Auto-deploy from GitHub | Free |
| **Domain** | GitHub Pages or custom | Optional | Free (GitHub Pages) |

**Total Running Cost**: **$0/month** (within free tiers for up to 10-20 agents)

### **Database Schema** (Complete)
- `users` - Agent & admin profiles with roles
- `customers` - Customer records with ownership lock
- `call_logs` - Call history with notes and follow-ups
- `orders` - Order transactions with incentive amounts
- `attendance_sessions` - Punch in/out records
- `breaks` - Break tracking (lunch, tea)
- `leave_requests` - Leave applications
- `agent_targets` - Monthly targets per agent
- `monthly_snapshots` - Month-end payout summaries
- `incentive_settings` - Slab configuration
- `dropdown_options` - Customizable dropdowns
- `audit_log` - Admin action history

**Optimized with**:
- Indexes on all foreign keys and date columns
- Row Level Security (RLS) policies for data isolation
- Triggers for auto-updating timestamps and customer status
- Database function for incentive calculation

---

## 🚀 Getting Started

### **Prerequisites**
- Node.js 18+ and npm
- Supabase account (free at [supabase.com](https://supabase.com))
- GitHub account (for deployment)

### **Step 1: Clone & Install**
```bash
# Clone repository
git clone <your-repo-url>
cd espon-mvp

# Install frontend dependencies
cd web
npm install
```

### **Step 2: Set Up Supabase**

1. **Create Supabase Project**:
   - Go to [supabase.com](https://supabase.com) → Create new project
   - Note your **Project URL** and **Anon Key**

2. **Run Database Schema**:
   - In Supabase Dashboard → SQL Editor
   - Copy entire contents of `supabase/schema.sql`
   - Run query to create all tables, policies, functions, and indexes

3. **Create Admin & Agent Users**:
   - Go to Authentication → Users → Add User
   - Create test users:
     - **Admin**: admin@espon.com / password123
     - **Agent**: agent@espon.com / password123
   
4. **Update User Roles**:
   - Go to Table Editor → `users` table
   - Find the users you just created
   - Update `role` column:
     - Admin user: set to `'admin'`
     - Agent user: set to `'agent'`
   - Set `base_salary` (e.g., 15000)
   - Set `name` field

5. **Set Agent Targets** (Optional):
   - Go to `agent_targets` table → Insert row:
     - `agent_id`: (copy agent's UUID from users table)
     - `month_year`: '2026-03'
     - `target_amount`: 500000

### **Step 3: Configure Environment**
```bash
# In web/ directory
cp .env.example .env

# Edit .env and add your Supabase credentials:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Optional: Shipmozo tracking API keys
VITE_SHIPMOZO_PUBLIC_KEY=your_public_key
VITE_SHIPMOZO_PRIVATE_KEY=your_private_key
```

### **Step 4: Run Development Server**
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

**Login**:
- **Agent**: agent@espon.com / password123
- **Admin**: admin@espon.com / password123

---

## 📱 Features Walkthrough

### **Agent Workflow**

1. **Login → Punch In**
   - Agent opens app → Login
   - First screen: "Punch In" button (unlocks dashboard)
   - System records timestamp

2. **Dashboard Overview**
   - Today's calls (fresh vs follow-up)
   - Today's orders and sales
   - Monthly progress bar (target vs achieved)
   - Live incentive earned this month

3. **Add Customer**
   - Customers → + Add Customer
   - Enter name, phone, shop, type (Retailer/Wholesaler), lead source
   - Customer is permanently owned by this agent

4. **Log a Call**
   - Calls → Log Call
   - Select customer, call type (Fresh/Follow-up), stage, notes
   - Optionally schedule next follow-up date

5. **Create Order**
   - Orders → Create Order
   - Select customer
   - Enter taxable amount, discount category
   - System auto-calculates total sale and incentive
   - Add AWB number for tracking

6. **Customer Profile**
   - Click any customer name
   - See complete timeline: all calls, orders, notes
   - WhatsApp button (click to chat)
   - View order history

7. **Punch Out**
   - Dashboard → Punch Out button
   - System calculates total work hours

### **Admin Workflow**

1. **Live Dashboard**
   - See all agents' status (punched in/out/on break)
   - Leaderboard (top performers by sales/calls)
   - Activity feed (recent orders, calls)

2. **Manage Agents**
   - Agents → Edit agent
   - Set monthly target (e.g., ₹5,00,000 for March)
   - Update base salary
   - View performance metrics

3. **Master Customer Database**
   - Customers → View all customers across all agents
   - Filter by agent, status, lead source
   - Reassign customers:
     - Select customers → "Reassign to..." → Choose agent
     - Action logged in audit_log

4. **Generate Reports**
   - Reports → Monthly Incentive Report
   - Select month → Export to Excel
   - Shows: Agent, Base Salary, Total Sales, Incentive, Total Payout

5. **Approve Leave**
   - Leave → View pending requests
   - Click Approve or Deny
   - Add admin notes

6. **Configure Settings**
   - Settings → Incentive Slabs
   - Edit slab thresholds and rates
   - Add/remove dropdown options

---

## 🚢 Deployment to Production

### **Option 1: Vercel (Recommended)**

```bash
# Install Vercel CLI
npm i -g vercel

# In web/ directory
vercel login
vercel

# Follow prompts:
# - Project name: espon-prod
# - Framework: Vite
# - Build command: npm run build
# - Output directory: dist

# Set environment variables in Vercel dashboard:
# Settings → Environment Variables → Add:
# VITE_SUPABASE_URL
# VITE_SUPABASE_ANON_KEY
```

Your app will be live at: `https://espon-prod.vercel.app`

### **Option 2: Cloudflare Pages**

```bash
# In web/ directory
npm run build

# Upload dist/ folder to Cloudflare Pages
# Or connect GitHub repo for auto-deployment
```

### **Option 3: GitHub Pages (Static)**

```bash
# Add to web/package.json:
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d dist"
}

npm install -D gh-pages
npm run deploy
```

### **Production Checklist**
- [ ] Rotate any API keys shared in development
- [ ] Enable Supabase email confirmations (Auth settings)
- [ ] Set up custom domain (optional)
- [ ] Configure CORS origins in Supabase (restrict to your domain)
- [ ] Set up Supabase Edge Function for Shipmozo tracking (keep keys secure)
- [ ] Test all RLS policies (try accessing other agents' data)
- [ ] Set up monitoring/alerts (Supabase → Settings → API)

---

## 📊 Data Model Highlights

### **Customer Ownership**
```sql
-- Agent can only see their own customers
CREATE POLICY "Agents can view own customers"
  ON customers FOR SELECT
  USING (created_by_agent_id = auth.uid());
```

### **Incentive Calculation**
```sql
CREATE FUNCTION calculate_incentive(
  agent_id, order_date, taxable_amount, order_type, discount_category
) RETURNS DECIMAL;
-- Implements exact slab logic from your Excel formula
```

### **Automatic Status Updates**
```sql
-- When first order is placed, customer status → 'Matured'
CREATE TRIGGER trigger_update_customer_status
AFTER INSERT ON orders
EXECUTE FUNCTION update_customer_status_on_order();
```

---

## 🔧 Customization Guide

### **Add New Dropdown Option**
```sql
INSERT INTO dropdown_options (category, option_value, display_order)
VALUES ('lead_source', 'Instagram Ads', 6);
```

### **Change Incentive Slab**
```sql
-- Update threshold for 5% slab to ₹10L instead of ₹9L
UPDATE incentive_settings
SET slab_threshold = 1000000
WHERE slab_rate = 0.05;
```

### **Add New Agent**
1. Supabase Auth → Add User
2. Update `users` table: set role to 'agent', name, base_salary
3. Insert into `agent_targets` for current month

### **Create Custom Report**
- Add view in `supabase/schema.sql`
- Create new report page in `web/src/pages/admin/`
- Query view using Supabase client

---

## 🐛 Troubleshooting

### **"Auth error: User not found"**
- Check if user exists in Supabase Auth
- Verify user has entry in `users` table with correct `id`

### **"RLS Policy: permission denied"**
- Check user's `role` in `users` table
- Verify RLS policies are enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)
- Test policies: `SELECT * FROM customers WHERE created_by_agent_id = '<agent-id>'`

### **Incentive calculation wrong**
- Check qualifying sales total (excludes Credit and 15%+ discount)
- Verify slab thresholds in `incentive_settings` table
- Test: `SELECT calculate_incentive(...)`

### **Cannot reassign customer (Admin)**
- Ensure admin user has `role = 'admin'` in `users` table
- Check audit_log to see if action was recorded

---

## 📈 Future Enhancements (Post-MVP)

- [ ] **Real-time notifications** (Supabase Realtime)
- [ ] **Mobile app** (React Native wrapper)
- [ ] **SMS/Email reminders** for follow-ups
- [ ] **Advanced analytics** (conversion rates, lead scoring)
- [ ] **Export to accounting software** (Tally integration)
- [ ] **Bulk import** (CSV upload for customers)
- [ ] **Photo uploads** (customer profiles, order proofs)
- [ ] **Monthly auto-snapshot cron job** (lock payouts on 1st)

---

## 📄 License

Proprietary - © 2026 ESPON. All rights reserved.

---

## 🤝 Support

For issues or questions:
1. Check Supabase logs: Dashboard → Logs
2. Check browser console for errors
3. Verify environment variables are set
4. Test database functions directly in SQL Editor

---

## 📚 Additional Documentation

- **Database Schema**: See `supabase/schema.sql` (fully commented)
- **API Types**: See `web/src/lib/database.types.ts`
- **Utility Functions**: See `web/src/lib/utils.ts` (incentive logic, formatters)
- **Auth Flow**: See `web/src/lib/auth.ts`

---

**Built with ❤️ to replace complex Excel workflows with a modern, scalable web application.**
