# ✅ ESPON Deployment Verification Checklist

Use this checklist after deployment to ensure everything works correctly.

---

## 🎯 Pre-Deployment Checklist

Before going live, verify:

### Supabase Setup
- [ ] Project created on Supabase
- [ ] `schema.sql` executed successfully
- [ ] All 12 tables created (check Table Editor)
- [ ] RLS policies enabled on all tables
- [ ] Test users created in Authentication
- [ ] User profiles added to `users` table
- [ ] Roles set correctly ('agent' / 'admin')
- [ ] Base salaries configured
- [ ] Monthly targets set in `agent_targets`
- [ ] API URL and anon key copied

### GitHub Setup
- [ ] Repository created
- [ ] Code pushed to `main` branch
- [ ] `.gitignore` present (excludes `.env`, `node_modules`)
- [ ] README.md committed
- [ ] All documentation files committed

### Vercel Setup
- [ ] Account created/linked to GitHub
- [ ] Repository imported
- [ ] Root directory set to `web` ⚠️ CRITICAL
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist`
- [ ] Environment variables added:
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_ANON_KEY`
- [ ] Deployment successful
- [ ] Production URL accessible

---

## 🔐 Security Verification

### Authentication Tests
- [ ] **Test 1: Agent Login**
  - Navigate to app URL
  - Login with agent credentials
  - Verify redirect to `/dashboard`
  - Verify agent name displays in header
  - Verify "Agent" role badge visible

- [ ] **Test 2: Admin Login**
  - Logout
  - Login with admin credentials
  - Verify redirect to `/admin/dashboard`
  - Verify admin name displays
  - Verify "Admin" role badge visible

- [ ] **Test 3: Invalid Credentials**
  - Try wrong password
  - Verify error message displays
  - Verify no login occurs

- [ ] **Test 4: Session Persistence**
  - Login as agent
  - Refresh page
  - Verify still logged in
  - Verify dashboard loads

### Row Level Security Tests
- [ ] **Test 5: Agent Data Isolation**
  - Login as Agent A
  - Go to Customers page
  - Add a test customer
  - Logout
  - Login as Agent B
  - Go to Customers page
  - **Verify**: Agent B does NOT see Agent A's customer ✅

- [ ] **Test 6: Admin Full Access**
  - Login as Admin
  - Go to Customers page
  - **Verify**: Admin sees ALL customers from all agents ✅

- [ ] **Test 7: Direct Database Query**
  - Open browser DevTools (F12)
  - Console tab
  - Run:
    ```javascript
    await window.supabase.from('customers').select('*')
    ```
  - **If agent**: Should only see own customers
  - **If admin**: Should see all customers

---

## 👤 Agent Features Verification

### Dashboard Tests
- [ ] **Test 8: Punch In/Out**
  - Login as agent
  - Verify "Punch In Now" button visible
  - Click "Punch In"
  - Verify success message
  - Verify button changes to "Punch Out"
  - Verify punch-in time displays
  - Click "Punch Out"
  - Verify success message

- [ ] **Test 9: Today's Metrics**
  - Verify "Today's Activity" card shows:
    - [ ] Total Calls: 0 (initially)
    - [ ] Fresh Calls: 0
    - [ ] Follow-ups: 0
    - [ ] Orders: 0
    - [ ] Today's Sales: ₹0

- [ ] **Test 10: Monthly Progress**
  - Verify "Monthly Target Progress" shows:
    - [ ] Target amount (from agent_targets table)
    - [ ] Achieved amount (should be 0 initially)
    - [ ] Progress bar (0%)
    - [ ] Incentive earned: ₹0

### Customer Management Tests
- [ ] **Test 11: View Customers**
  - Go to "Customers" page
  - Verify customer list loads (may be empty)
  - Verify filters visible (All, New, Interested, etc.)
  - Verify search box present

- [ ] **Test 12: Add Customer**
  - Click "+ Add Customer" button
  - Verify form appears
  - Fill in:
    - [ ] Customer Name: Test Customer 1
    - [ ] Phone: 9876543210
    - [ ] Shop Name: Test Shop
    - [ ] Type: Retailer
    - [ ] Lead Source: Facebook
  - Click "Save"
  - Verify success message
  - Verify customer appears in list

- [ ] **Test 13: Filter Customers**
  - Click "New" filter
  - Verify only "New" status customers show
  - Click "All" filter
  - Verify all customers show again

- [ ] **Test 14: Search Customers**
  - Type customer name in search box
  - Verify filtered results show
  - Clear search
  - Verify all customers show again

- [ ] **Test 15: WhatsApp Integration**
  - Find a customer in list
  - Locate WhatsApp icon (green)
  - Click icon
  - Verify WhatsApp Web opens with correct number
  - Close WhatsApp tab

### Navigation Tests
- [ ] **Test 16: Mobile Navigation**
  - Resize browser to mobile width (< 768px)
  - Verify bottom navigation bar appears
  - Verify 5 icons visible
  - Click each icon
  - Verify navigation works

- [ ] **Test 17: Desktop Navigation**
  - Resize browser to desktop width (> 1024px)
  - Verify left sidebar appears
  - Verify 6 menu items visible
  - Click each menu item
  - Verify navigation works

---

## 👑 Admin Features Verification

### Admin Dashboard Tests
- [ ] **Test 18: Admin Access**
  - Login as admin
  - Verify different UI theme (purple accent vs blue)
  - Verify "Admin" badge visible
  - Verify admin navigation items

### Customer Management Tests
- [ ] **Test 19: View All Customers**
  - Go to "Customers" page (admin panel)
  - Verify customers from ALL agents visible
  - Verify agent name shown for each customer

- [ ] **Test 20: Filter by Agent**
  - Select an agent from filter dropdown
  - Verify only that agent's customers show
  - Clear filter
  - Verify all customers show again

---

## 💰 Incentive Calculation Tests

### Database Function Test
- [ ] **Test 21: Direct Function Call**
  - Supabase → SQL Editor
  - Run:
    ```sql
    SELECT calculate_incentive(
      'agent-uuid-here'::uuid,
      CURRENT_DATE,
      15000,
      'COD',
      '0% Discount'
    );
    ```
  - Verify result is reasonable (should be ~450 for 15000 * 3%)

### Slab Configuration Test
- [ ] **Test 22: Check Slabs**
  - Supabase → Table Editor → incentive_settings
  - Verify 5 rows exist:
    - [ ] 0 → 0.0100 (1%)
    - [ ] 250000 → 0.0175 (1.75%)
    - [ ] 500000 → 0.0250 (2.5%)
    - [ ] 700000 → 0.0350 (3.5%)
    - [ ] 900000 → 0.0500 (5%)

---

## 📊 Data Integrity Tests

### Attendance Tests
- [ ] **Test 23: Attendance Session Creation**
  - Login as agent
  - Punch in
  - Supabase → Table Editor → attendance_sessions
  - Verify new row created with:
    - [ ] agent_id matches
    - [ ] punch_in timestamp set
    - [ ] punch_out is NULL
    - [ ] session_date is today

- [ ] **Test 24: Attendance Session Completion**
  - Punch out
  - Refresh Supabase table
  - Verify row updated with:
    - [ ] punch_out timestamp set
    - [ ] work_minutes calculated

### Customer Tests
- [ ] **Test 25: Customer Ownership**
  - Supabase → Table Editor → customers
  - Find customer created in Test 12
  - Verify `created_by_agent_id` matches logged-in agent's ID
  - Verify `created_at` timestamp is recent

### Audit Log Tests (Admin)
- [ ] **Test 26: Check Audit Table**
  - Supabase → Table Editor → audit_log
  - If admin has made changes (like reassignments), verify:
    - [ ] Rows exist
    - [ ] admin_id is set
    - [ ] action_type describes action
    - [ ] old_value and new_value have JSON data

---

## 🌐 Production Environment Tests

### Performance Tests
- [ ] **Test 27: Load Time**
  - Clear browser cache
  - Navigate to app URL
  - Verify page loads in < 3 seconds
  - Check Network tab (F12 → Network)
  - Verify no failed requests

- [ ] **Test 28: API Response Time**
  - Login as agent
  - Go to Customers page
  - Open Network tab
  - Refresh page
  - Check API calls to Supabase
  - Verify response times < 500ms

### Mobile Responsiveness Tests
- [ ] **Test 29: Mobile Layout**
  - Open app on actual mobile device (or use DevTools device emulation)
  - Verify:
    - [ ] All text readable (not cut off)
    - [ ] Buttons easily tappable
    - [ ] Bottom navigation works
    - [ ] Forms scrollable
    - [ ] No horizontal overflow

- [ ] **Test 30: Cross-Browser Compatibility**
  - Test on Chrome/Edge
  - Test on Firefox
  - Test on Safari (if available)
  - Verify all features work

---

## 🔄 Monthly Workflow Tests

### Target Setting Test
- [ ] **Test 31: Set Agent Target**
  - Supabase → Table Editor → agent_targets
  - Insert row:
    - agent_id: (an agent's UUID)
    - month_year: current month (YYYY-MM)
    - target_amount: 500000
  - Login as that agent
  - Verify dashboard shows target: ₹5,00,000

### Month-End Test
- [ ] **Test 32: Month Filter**
  - Create test orders with past dates
  - Go to dashboard
  - Verify only current month's data shows
  - (Historical data preserved but not in current view)

---

## 📱 Integration Tests

### WhatsApp Integration
- [ ] **Test 33: WhatsApp Link Format**
  - Open customer profile
  - Right-click WhatsApp button
  - Copy link address
  - Verify format: `https://wa.me/91XXXXXXXXXX`
  - Verify phone number correct

---

## 🚨 Error Handling Tests

### Network Error Test
- [ ] **Test 34: Offline Behavior**
  - Turn off internet
  - Try to load a page
  - Verify error message displays
  - Turn on internet
  - Verify app recovers

### Invalid Input Test
- [ ] **Test 35: Form Validation**
  - Try to add customer with empty name
  - Verify validation error
  - Try to add customer with invalid phone
  - Verify validation error

---

## ✅ Final Production Checklist

Before announcing to team:

- [ ] All above tests passed
- [ ] Demo accounts work (agent & admin)
- [ ] Real agent accounts created
- [ ] Monthly targets set for all agents
- [ ] Environment variables verified in Vercel
- [ ] Supabase Auth configured (Site URL set)
- [ ] SSL certificate active (HTTPS)
- [ ] No errors in browser console
- [ ] No errors in Supabase logs
- [ ] Performance acceptable (< 3s load)
- [ ] Mobile layout tested
- [ ] Desktop layout tested
- [ ] Documentation shared with team
- [ ] Training session scheduled

---

## 🎉 Launch Day Checklist

Day 1 of production use:

- [ ] **Morning**: All agents punch in successfully
- [ ] **Throughout day**: Monitor Supabase logs for errors
- [ ] **Throughout day**: Check agent dashboards update correctly
- [ ] **End of day**: All agents punch out successfully
- [ ] **Review**: Check audit_log for any anomalies
- [ ] **Backup**: Download Supabase backup (Settings → Backups)

---

## 📊 Week 1 Monitoring

Track these metrics:

- [ ] **Day 1**: Agent adoption rate (how many used it?)
- [ ] **Day 2**: Customer creation count
- [ ] **Day 3**: Call logging usage
- [ ] **Day 4**: Order entry usage
- [ ] **Day 5**: Any bugs reported?
- [ ] **Day 7**: User feedback collected

---

## 🐛 Known Issues to Watch For

Common first-week issues:

1. **Agents forget to punch in**
   - Solution: Daily reminder
   
2. **Confusion about discount categories**
   - Solution: Training on incentive rules
   
3. **Mobile browser compatibility**
   - Solution: Test on agent's actual devices
   
4. **Forgot password requests**
   - Solution: Set up password reset flow
   
5. **Data entry errors**
   - Solution: Add more validation

---

## 📞 Support Plan

If issues arise:

1. **Check Supabase Logs**: Dashboard → Logs → View recent errors
2. **Check Browser Console**: F12 → Console → Look for red errors
3. **Verify RLS**: Test queries in SQL Editor
4. **Check Environment Variables**: Vercel → Settings → Env Vars
5. **Review Documentation**: README.md, API.md, DEPLOYMENT.md

---

## 🎊 Success Criteria

You've successfully deployed when:

- [x] All agents can login
- [x] All agents can punch in/out
- [x] All agents can add customers
- [x] Admin can see all data
- [x] Incentives calculate correctly
- [x] No security issues (RLS working)
- [x] No performance issues (< 3s load)
- [x] Mobile and desktop both work
- [x] Team is trained and confident

---

**Congratulations! You've replaced Excel with a modern web app! 🎉**

---

**Pro Tip**: Print this checklist and check off items as you go. It ensures nothing is missed during deployment.

**Next Steps After Launch**:
1. Monitor for 1 week
2. Collect feedback
3. Add requested features
4. Optimize based on usage patterns
5. Celebrate success! 🎊
