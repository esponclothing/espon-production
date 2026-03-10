# 📡 ESPON API Reference

Complete reference for working with the ESPON database through Supabase.

---

## 🔐 Authentication

All API calls require authentication. The Supabase client automatically includes the user's JWT token.

```typescript
import { supabase } from './lib/supabase';

// Current user is automatically set from auth session
const { data, error } = await supabase.from('customers').select('*');
```

---

## 📊 Core Entities

### **Customers**

#### Get all customers (for current agent)
```typescript
const { data, error } = await supabase
  .from('customers')
  .select('*')
  .order('created_at', { ascending: false });
// RLS automatically filters to created_by_agent_id = current_user
```

#### Get customers with filter
```typescript
// By status
const { data } = await supabase
  .from('customers')
  .select('*')
  .eq('status', 'Matured');

// By type
const { data } = await supabase
  .from('customers')
  .select('*')
  .eq('customer_type', 'Wholesaler');

// Search by name or phone
const { data } = await supabase
  .from('customers')
  .select('*')
  .or(`customer_name.ilike.%${search}%,phone.ilike.%${search}%`);
```

#### Create customer
```typescript
const { data, error } = await supabase
  .from('customers')
  .insert({
    customer_name: 'ABC Sports',
    phone: '9876543210',
    shop_name: 'ABC Retail Store',
    customer_type: 'Retailer',
    lead_source: 'Facebook',
    created_by_agent_id: user.id, // Required
  })
  .select()
  .single();
```

#### Update customer
```typescript
const { error } = await supabase
  .from('customers')
  .update({ status: 'Interested' })
  .eq('id', customerId);
```

---

### **Call Logs**

#### Create call log
```typescript
const { data, error } = await supabase
  .from('call_logs')
  .insert({
    customer_id: 'customer-uuid',
    agent_id: user.id,
    call_type: 'Fresh', // or 'Follow-up'
    stage: 'Interested', // or 'Not Interested', 'Matured', 'Follow up', 'Cold'
    notes: 'Customer wants catalog',
    next_followup_date: '2026-03-10',
  })
  .select()
  .single();
```

#### Get calls for a customer
```typescript
const { data } = await supabase
  .from('call_logs')
  .select('*')
  .eq('customer_id', customerId)
  .order('call_time', { ascending: false });
```

#### Get today's follow-ups
```typescript
const today = new Date().toISOString().split('T')[0];

const { data } = await supabase
  .from('call_logs')
  .select(`
    *,
    customers (
      customer_name,
      phone,
      shop_name
    )
  `)
  .eq('agent_id', user.id)
  .eq('next_followup_date', today);
```

---

### **Orders**

#### Create order with incentive calculation
```typescript
// Step 1: Calculate incentive
const { data: incentive, error: calcError } = await supabase.rpc(
  'calculate_incentive',
  {
    p_agent_id: user.id,
    p_order_date: '2026-03-05',
    p_taxable_amount: 15000,
    p_order_type: 'COD',
    p_discount_category: '0% Discount',
  }
);

// Step 2: Create order
const { data, error } = await supabase
  .from('orders')
  .insert({
    customer_id: 'customer-uuid',
    agent_id: user.id,
    order_date: '2026-03-05',
    order_type: 'COD',
    taxable_amount: 15000,
    discount_category: '0% Discount',
    discount_amount: 0,
    total_sale: 17340, // including GST
    incentive_amount: incentive, // from step 1
    awb_number: 'AWB123456', // optional
  })
  .select()
  .single();
```

#### Get orders for customer
```typescript
const { data } = await supabase
  .from('orders')
  .select('*')
  .eq('customer_id', customerId)
  .order('order_date', { ascending: false });
```

#### Update tracking status
```typescript
const { error } = await supabase
  .from('orders')
  .update({
    tracking_status: 'Delivered',
    tracking_last_updated: new Date().toISOString(),
  })
  .eq('id', orderId);
```

---

### **Attendance**

#### Punch in
```typescript
const { data, error } = await supabase
  .from('attendance_sessions')
  .insert({
    agent_id: user.id,
    punch_in: new Date().toISOString(),
    session_date: new Date().toISOString().split('T')[0],
  })
  .select()
  .single();
```

#### Punch out
```typescript
const punchOutTime = new Date();
const punchInTime = new Date(session.punch_in);
const workMinutes = Math.floor(
  (punchOutTime.getTime() - punchInTime.getTime()) / 60000
);

const { error } = await supabase
  .from('attendance_sessions')
  .update({
    punch_out: punchOutTime.toISOString(),
    work_minutes: workMinutes,
  })
  .eq('id', sessionId);
```

#### Get active session
```typescript
const today = new Date().toISOString().split('T')[0];

const { data } = await supabase
  .from('attendance_sessions')
  .select('*')
  .eq('agent_id', user.id)
  .eq('session_date', today)
  .is('punch_out', null)
  .order('punch_in', { ascending: false })
  .limit(1)
  .single();
```

#### Start break
```typescript
const { data, error } = await supabase
  .from('breaks')
  .insert({
    session_id: 'session-uuid',
    break_type: 'Lunch Break', // or 'Tea Break', 'Other'
    break_start: new Date().toISOString(),
  })
  .select()
  .single();
```

#### End break
```typescript
const breakEndTime = new Date();
const breakStartTime = new Date(activeBreak.break_start);
const durationMinutes = Math.floor(
  (breakEndTime.getTime() - breakStartTime.getTime()) / 60000
);

const { error } = await supabase
  .from('breaks')
  .update({
    break_end: breakEndTime.toISOString(),
    duration_minutes: durationMinutes,
  })
  .eq('id', breakId);
```

---

### **Leave Requests**

#### Create leave request
```typescript
const { data, error } = await supabase
  .from('leave_requests')
  .insert({
    agent_id: user.id,
    leave_date: '2026-03-15',
    leave_type: 'Sick Leave', // or 'Casual Leave', 'Emergency Leave', 'Other'
    reason: 'Doctor appointment',
  })
  .select()
  .single();
```

#### Get agent's leave requests
```typescript
const { data } = await supabase
  .from('leave_requests')
  .select('*')
  .eq('agent_id', user.id)
  .order('created_at', { ascending: false });
```

---

## 👑 Admin-Only APIs

### **Dashboard Stats**

#### Get all agents with current month performance
```typescript
const { data } = await supabase
  .from('agent_dashboard_current_month')
  .select('*')
  .order('total_sales', { ascending: false });
```

#### Get live agent status
```typescript
const today = new Date().toISOString().split('T')[0];

const { data } = await supabase
  .from('attendance_sessions')
  .select(`
    *,
    users (
      id,
      name,
      email
    )
  `)
  .eq('session_date', today)
  .is('punch_out', null);
```

### **Customer Management**

#### Get all customers (all agents)
```typescript
const { data } = await supabase
  .from('customers')
  .select(`
    *,
    users!customers_created_by_agent_id_fkey (
      name,
      email
    )
  `)
  .order('created_at', { ascending: false });
```

#### Reassign customer to different agent
```typescript
// Log audit entry first
const { error: auditError } = await supabase
  .from('audit_log')
  .insert({
    admin_id: adminUser.id,
    action_type: 'reassign_customer',
    target_entity: 'customer',
    target_id: customerId,
    old_value: { agent_id: oldAgentId },
    new_value: { agent_id: newAgentId },
    description: `Reassigned from ${oldAgentName} to ${newAgentName}`,
  });

// Then update customer
const { error } = await supabase
  .from('customers')
  .update({ created_by_agent_id: newAgentId })
  .eq('id', customerId);
```

### **Agent Targets**

#### Set monthly target for agent
```typescript
const { data, error } = await supabase
  .from('agent_targets')
  .upsert({
    agent_id: 'agent-uuid',
    month_year: '2026-03',
    target_amount: 500000,
  })
  .select()
  .single();
```

#### Get all targets for a month
```typescript
const { data } = await supabase
  .from('agent_targets')
  .select(`
    *,
    users (
      name,
      email
    )
  `)
  .eq('month_year', '2026-03');
```

### **Leave Management**

#### Get pending leave requests
```typescript
const { data } = await supabase
  .from('leave_requests')
  .select(`
    *,
    users!leave_requests_agent_id_fkey (
      name,
      email
    )
  `)
  .eq('status', 'Pending')
  .order('created_at', { ascending: false });
```

#### Approve/deny leave
```typescript
const { error } = await supabase
  .from('leave_requests')
  .update({
    status: 'Approved', // or 'Denied'
    reviewed_by_admin_id: adminUser.id,
    reviewed_at: new Date().toISOString(),
    admin_notes: 'Approved as requested',
  })
  .eq('id', leaveRequestId);
```

### **Settings Management**

#### Get incentive settings
```typescript
const { data } = await supabase
  .from('incentive_settings')
  .select('*')
  .eq('is_active', true)
  .order('slab_threshold', { ascending: true });
```

#### Update slab rate
```typescript
const { error } = await supabase
  .from('incentive_settings')
  .update({ slab_rate: 0.06 }) // 6%
  .eq('slab_threshold', 900000);
```

#### Get dropdown options
```typescript
const { data } = await supabase
  .from('dropdown_options')
  .select('*')
  .eq('category', 'lead_source')
  .eq('is_active', true)
  .order('display_order', { ascending: true });
```

#### Add new dropdown option
```typescript
const { data, error } = await supabase
  .from('dropdown_options')
  .insert({
    category: 'lead_source',
    option_value: 'Instagram Ads',
    display_order: 10,
  })
  .select()
  .single();
```

---

## 📈 Complex Queries

### Get customer with full timeline
```typescript
const { data: customer } = await supabase
  .from('customers')
  .select(`
    *,
    call_logs (
      id,
      call_date,
      call_time,
      call_type,
      stage,
      notes,
      next_followup_date
    ),
    orders (
      id,
      order_date,
      order_type,
      total_sale,
      incentive_amount,
      awb_number,
      tracking_status
    )
  `)
  .eq('id', customerId)
  .single();

// Merge and sort timeline
const timeline = [
  ...customer.call_logs.map(c => ({ type: 'call', date: c.call_time, ...c })),
  ...customer.orders.map(o => ({ type: 'order', date: o.order_date, ...o })),
].sort((a, b) => new Date(b.date) - new Date(a.date));
```

### Get agent performance summary
```typescript
const monthYear = '2026-03';
const monthStart = `${monthYear}-01`;
const monthEnd = `${monthYear}-31`;

const { data: calls } = await supabase
  .from('call_logs')
  .select('call_type')
  .eq('agent_id', agentId)
  .gte('call_date', monthStart)
  .lte('call_date', monthEnd);

const { data: orders } = await supabase
  .from('orders')
  .select('total_sale, incentive_amount')
  .eq('agent_id', agentId)
  .gte('order_date', monthStart)
  .lte('order_date', monthEnd);

const summary = {
  totalCalls: calls.length,
  freshCalls: calls.filter(c => c.call_type === 'Fresh').length,
  followupCalls: calls.filter(c => c.call_type === 'Follow-up').length,
  totalOrders: orders.length,
  totalSales: orders.reduce((sum, o) => sum + Number(o.total_sale), 0),
  totalIncentive: orders.reduce((sum, o) => sum + Number(o.incentive_amount), 0),
};
```

---

## 🔄 Real-time Subscriptions

### Subscribe to new orders
```typescript
const subscription = supabase
  .channel('orders')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'orders',
    },
    (payload) => {
      console.log('New order:', payload.new);
      // Update UI
    }
  )
  .subscribe();

// Cleanup
return () => {
  subscription.unsubscribe();
};
```

### Subscribe to customer changes
```typescript
const subscription = supabase
  .channel('customers')
  .on(
    'postgres_changes',
    {
      event: '*', // INSERT, UPDATE, DELETE
      schema: 'public',
      table: 'customers',
      filter: `created_by_agent_id=eq.${user.id}`,
    },
    (payload) => {
      console.log('Customer changed:', payload);
    }
  )
  .subscribe();
```

---

## 🧮 Utility Functions

### Calculate incentive client-side (for preview)
```typescript
import { calculateIncentiveClient } from './lib/utils';

// Assuming current month qualifying sales = 450000
const incentive = calculateIncentiveClient(
  450000,      // qualifying total
  15000,       // taxable amount for this order
  'COD',       // order type
  '0% Discount' // discount category
);
// Returns: 562.50 (15000 * 3.75%, where 3.75% = 1.75% slab + 2% bonus)
```

### Format currency
```typescript
import { formatCurrency } from './lib/utils';

formatCurrency(15000); // "₹15,000"
formatCurrency(15000.50); // "₹15,001" (rounded)
```

### Get WhatsApp URL
```typescript
import { getWhatsAppUrl } from './lib/utils';

const url = getWhatsAppUrl('9876543210', 'Hello! This is a test message');
// Returns: https://wa.me/919876543210?text=Hello!%20This%20is%20a%20test%20message
```

---

## ⚠️ Common Pitfalls

1. **RLS Policies**: Always check if query returns empty due to RLS, not missing data
2. **UUID vs String**: Agent IDs are UUIDs, not strings. Use `user.id` directly
3. **Date Formats**: Use ISO strings (`2026-03-05`), not localized formats
4. **Incentive Calculation**: Always use server-side `calculate_incentive` function for orders
5. **Pagination**: For large datasets, use `.range(start, end)` instead of loading all

---

## 🔍 Debugging

### Check RLS policies
```typescript
// In browser console
const { data, error } = await supabase.from('customers').select('*');
console.log('Data:', data);
console.log('Error:', error);
// If error.code === 'PGRST116', it's an RLS issue
```

### Test database function
```typescript
// In Supabase SQL Editor
SELECT calculate_incentive(
  'agent-uuid-here'::uuid,
  '2026-03-05'::date,
  15000,
  'COD',
  '0% Discount'
);
```

### View audit log
```typescript
const { data } = await supabase
  .from('audit_log')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(50);
```

---

**Happy coding! 🚀**
