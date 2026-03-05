# 🏛️ ESPON System Architecture

Visual overview of how all components work together.

---

## 🌐 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USERS                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  👤 Agents (4)                    👑 Admin (1)                  │
│  - Garima                         - Full access                  │
│  - Ikra                           - All data                     │
│  - Nancy                          - Reassignment                 │
│  - Tannu                          - Reports                      │
│                                                                   │
│  Mobile/Desktop Browser           Desktop Browser                │
│  └─> https://espon.vercel.app                                   │
│                                                                   │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ HTTPS
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Vercel)                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  React 18 + TypeScript + Tailwind CSS                           │
│  ├─ Agent Panel                                                  │
│  │  ├─ Dashboard (punch in/out, metrics)                        │
│  │  ├─ Customers (add, view, filter)                            │
│  │  ├─ Calls (log calls, follow-ups)                            │
│  │  ├─ Orders (create, track)                                   │
│  │  └─ Attendance & Leave                                       │
│  │                                                                │
│  └─ Admin Panel                                                  │
│     ├─ Dashboard (live status, leaderboard)                     │
│     ├─ Customers (all, reassign)                                │
│     ├─ Agents (manage, targets)                                 │
│     ├─ Reports (incentive, attendance)                          │
│     └─ Settings (slabs, dropdowns)                              │
│                                                                   │
│  Hosted: Vercel Free Tier                                       │
│  Cost: $0/month                                                  │
│                                                                   │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ REST API + WebSocket
                     │ (Authenticated with JWT)
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND (Supabase)                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │           Supabase Auth (Authentication)                  │   │
│  │  - Email/Password authentication                          │   │
│  │  - JWT token generation                                   │   │
│  │  - Session management                                     │   │
│  │  - Password reset                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                         │                                         │
│                         │ auth.uid()                              │
│                         ▼                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │      Auto-Generated REST API (PostgREST)                 │   │
│  │  - GET /users, /customers, /orders, etc.                 │   │
│  │  - POST /customers, /orders, etc.                        │   │
│  │  - PATCH /customers, /orders, etc.                       │   │
│  │  - DELETE /leave_requests, etc.                          │   │
│  │  - RPC /calculate_incentive                              │   │
│  │                                                            │   │
│  │  All routes automatically respect RLS policies           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                         │                                         │
│                         │                                         │
│                         ▼                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │         PostgreSQL 15 Database                           │   │
│  │                                                            │   │
│  │  📊 12 Core Tables:                                       │   │
│  │  ├─ users (agents + admin profiles)                      │   │
│  │  ├─ customers (owned by agents)                          │   │
│  │  ├─ call_logs (call history)                             │   │
│  │  ├─ orders (sales + incentives)                          │   │
│  │  ├─ attendance_sessions (punch in/out)                   │   │
│  │  ├─ breaks (lunch, tea breaks)                           │   │
│  │  ├─ leave_requests (leave applications)                  │   │
│  │  ├─ agent_targets (monthly targets)                      │   │
│  │  ├─ monthly_snapshots (payout summaries)                 │   │
│  │  ├─ incentive_settings (slab config)                     │   │
│  │  ├─ dropdown_options (customizable)                      │   │
│  │  └─ audit_log (admin actions)                            │   │
│  │                                                            │   │
│  │  🔒 Row Level Security (RLS):                            │   │
│  │  - Agents can only SELECT their own customers            │   │
│  │  - Admin can SELECT all                                  │   │
│  │  - All INSERT/UPDATE respect ownership                   │   │
│  │                                                            │   │
│  │  ⚡ Functions:                                            │   │
│  │  - calculate_incentive(agent, date, amount, type, disc)  │   │
│  │  - update_customer_status_on_order() [trigger]           │   │
│  │  - update_updated_at_column() [trigger]                  │   │
│  │                                                            │   │
│  │  📈 Views:                                                │   │
│  │  - agent_dashboard_current_month                         │   │
│  │                                                            │   │
│  │  🔍 Indexes:                                              │   │
│  │  - All foreign keys                                       │   │
│  │  - Date columns (for range queries)                      │   │
│  │  - Phone numbers (for search)                            │   │
│  │                                                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  Hosted: Supabase Free Tier                                     │
│  Storage: 500MB database                                        │
│  Cost: $0/month                                                  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Security Flow

```
1. User Login
   ↓
2. Supabase Auth validates credentials
   ↓
3. JWT token generated (includes user_id)
   ↓
4. Frontend stores token (local storage)
   ↓
5. All API calls include JWT in header
   ↓
6. RLS policies check auth.uid() against table rules
   ↓
7. Query executed only on authorized rows
   ↓
8. Result returned to frontend
```

### Example: Agent Fetching Customers

```
Agent (Garima, id=abc-123) → GET /customers
                               ↓
                         [JWT: user_id=abc-123]
                               ↓
                         RLS Policy Check:
                         WHERE created_by_agent_id = auth.uid()
                               ↓
                         SQL: SELECT * FROM customers
                              WHERE created_by_agent_id = 'abc-123'
                               ↓
                         Returns only Garima's customers
                               ↓
Agent sees 50 customers (only hers)
```

### Example: Admin Fetching Customers

```
Admin (id=xyz-789, role=admin) → GET /customers
                                  ↓
                            [JWT: user_id=xyz-789]
                                  ↓
                            RLS Policy Check:
                            Admin role → bypass agent filter
                                  ↓
                            SQL: SELECT * FROM customers
                                 (all rows)
                                  ↓
                            Returns ALL customers
                                  ↓
Admin sees 200 customers (from all agents)
```

---

## 💰 Incentive Calculation Flow

```
1. Agent enters order details
   - Customer: ABC Sports
   - Taxable Amount: ₹15,000
   - Order Type: COD
   - Discount: 0%
   ↓
2. Frontend calls server function
   POST /rpc/calculate_incentive
   {
     agent_id: "abc-123",
     order_date: "2026-03-05",
     taxable_amount: 15000,
     order_type: "COD",
     discount_category: "0% Discount"
   }
   ↓
3. Database function executes
   ├─ Query month-to-date sales (qualifying)
   │  SELECT SUM(taxable_amount)
   │  WHERE agent_id = abc-123
   │    AND order_type != 'Credit'
   │    AND discount_category != '15%+'
   │    AND order_date >= '2026-03-01'
   │  Result: ₹450,000
   │
   ├─ Determine slab rate
   │  ₹450,000 falls in ₹250k-₹500k slab
   │  Slab rate: 1.75%
   │
   ├─ Apply special rules
   │  Discount category = "0% Discount"
   │  Final rate = 1.75% + 2% = 3.75%
   │
   └─ Calculate incentive
      ₹15,000 × 3.75% = ₹562.50
   ↓
4. Return incentive amount
   Response: 562.50
   ↓
5. Frontend displays preview
   "Estimated Incentive: ₹562.50"
   ↓
6. Agent confirms → Order inserted
   INSERT INTO orders (
     ...,
     incentive_amount: 562.50
   )
```

---

## 📊 Data Flow Examples

### Creating a Customer

```
Agent UI                 Frontend                Database
   │                        │                        │
   ├─ Fill form            │                        │
   │  (name, phone)        │                        │
   ├─ Click "Save" ───────>│                        │
   │                        ├─ Validate input       │
   │                        ├─ Add agent_id         │
   │                        ├─ POST /customers ────>│
   │                        │                        ├─ Check RLS
   │                        │                        │  (agent_id matches?)
   │                        │                        ├─ INSERT row
   │                        │                        ├─ Return new customer
   │                        │<───────────────────────┤
   │                        ├─ Update UI            │
   │<───────────────────────┤                        │
   ├─ Show success         │                        │
```

### Admin Reassigning Customer

```
Admin UI                 Frontend                Database               Audit
   │                        │                        │                     │
   ├─ Select customer      │                        │                     │
   ├─ Choose new agent     │                        │                     │
   ├─ Click "Reassign" ───>│                        │                     │
   │                        ├─ Confirm action       │                     │
   │                        ├─ POST /audit_log ─────┼────────────────────>│
   │                        │                        │                     ├─ Log action
   │                        ├─ PATCH /customers ───>│                     │
   │                        │  {created_by_agent_id} ├─ Check admin role  │
   │                        │                        ├─ UPDATE row        │
   │                        │                        ├─ Return updated    │
   │                        │<───────────────────────┤                     │
   │                        ├─ Refresh UI           │                     │
   │<───────────────────────┤                        │                     │
   ├─ Show success         │                        │                     │
```

---

## 🔄 Real-Time Updates (Optional Future Feature)

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│  Agent A     │         │  Supabase    │         │  Admin       │
│  Browser     │         │  Realtime    │         │  Dashboard   │
└──────┬───────┘         └──────┬───────┘         └──────┬───────┘
       │                        │                        │
       │ 1. Place order         │                        │
       ├──────────────────────> │                        │
       │                        │                        │
       │                        │ 2. Broadcast event     │
       │                        ├───────────────────────>│
       │                        │                        │
       │                        │                        │ 3. Update UI
       │                        │                        │ "Agent A just
       │                        │                        │  closed ₹15K"
```

---

## 📱 Device Compatibility

```
┌─────────────────────────────────────────────────────────────┐
│                        ESPON Web App                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  📱 Mobile (Portrait)        💻 Desktop (Landscape)          │
│  ┌───────────────────┐      ┌─────────┬───────────────────┐│
│  │  Header           │      │ Sidebar │  Main Content     ││
│  ├───────────────────┤      │         │                   ││
│  │                   │      │ - Home  │  Dashboard        ││
│  │  Main Content     │      │ - Cust  │  ┌─────┬─────┐   ││
│  │                   │      │ - Calls │  │Card │Card │   ││
│  │  (Scrollable)     │      │ - Orders│  └─────┴─────┘   ││
│  │                   │      │ - Att   │                   ││
│  │                   │      │ - Leave │  Chart            ││
│  ├───────────────────┤      │         │                   ││
│  │ Bottom Nav        │      │ Logout  │                   ││
│  │ [Home][Cust][...]│      └─────────┴───────────────────┘│
│  └───────────────────┘                                      │
│                                                               │
│  Tailwind Breakpoint: lg:pl-64 (shifts content on desktop)  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    DEVELOPMENT                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Local Machine                                               │
│  ├─ npm run dev                                              │
│  └─ localhost:5173 ──────> Supabase (dev project)           │
│                                                               │
└─────────────────────────────────────────────────────────────┘

                         git push
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                       PRODUCTION                             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  GitHub Repository                                           │
│  └─ main branch                                              │
│          │                                                    │
│          │ Auto-deploy (webhook)                             │
│          ▼                                                    │
│  ┌─────────────────────────────────┐                        │
│  │        Vercel                    │                        │
│  │  ┌───────────────────────────┐  │                        │
│  │  │  1. Pull from GitHub      │  │                        │
│  │  │  2. npm install           │  │                        │
│  │  │  3. npm run build         │  │                        │
│  │  │  4. Deploy to CDN         │  │                        │
│  │  └───────────────────────────┘  │                        │
│  │                                  │                        │
│  │  Domain: espon.vercel.app       │                        │
│  │  SSL: Auto (Let's Encrypt)      │                        │
│  │  CDN: Global edge network       │                        │
│  └─────────────────────────────────┘                        │
│          │                                                    │
│          │ API calls                                          │
│          ▼                                                    │
│  ┌─────────────────────────────────┐                        │
│  │        Supabase                  │                        │
│  │  ┌───────────────────────────┐  │                        │
│  │  │  PostgreSQL Database      │  │                        │
│  │  │  - 500MB storage          │  │                        │
│  │  │  - Auto backups           │  │                        │
│  │  │  - Point-in-time recovery │  │                        │
│  │  └───────────────────────────┘  │                        │
│  │                                  │                        │
│  │  Region: Closest to users       │                        │
│  │  Monitoring: Built-in           │                        │
│  └─────────────────────────────────┘                        │
│                                                               │
│  Total Cost: $0/month (free tiers)                          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📈 Scalability Path

```
Current (Free Tier)          Growth (Paid Tier)         Enterprise
   $0/month                    ~$50/month                ~$200/month
      │                            │                          │
      ├─ 20 agents                ├─ 50 agents               ├─ 200 agents
      ├─ 10K customers            ├─ 50K customers           ├─ 500K customers
      ├─ 100K orders              ├─ 1M orders               ├─ 10M orders
      ├─ 500MB DB                 ├─ 8GB DB                  ├─ 100GB DB
      └─ 2GB bandwidth/mo         └─ 250GB bandwidth/mo      └─ 2TB bandwidth/mo
```

---

## 🔄 Monthly Workflow

```
Day 1 (1st of month)
  ↓
Admin sets new targets for all agents
  ↓
Agents start fresh (dashboard resets to current month view)
  ↓
Daily work (throughout month)
  - Punch in/out
  - Log calls
  - Create orders
  - Track progress
  ↓
Last day of month
  ↓
Admin generates monthly snapshot (locks data for payroll)
  ↓
Admin exports incentive report
  ↓
Process salaries (base + incentive)
  ↓
Repeat for next month
```

---

**This architecture enables**:
- ✅ Zero-cost operation
- ✅ Instant scalability
- ✅ Automatic backups
- ✅ Global availability
- ✅ Strong security
- ✅ Real-time potential
- ✅ Easy maintenance

---

**Built for simplicity, designed for scale! 🚀**
