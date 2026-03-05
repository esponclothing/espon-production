-- ====================================
-- ESPON DATABASE SCHEMA
-- Complete schema for Sales & Agent Management Platform
-- ====================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================
-- 1. USERS TABLE
-- ====================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('agent', 'admin')),
  base_salary DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================
-- 2. AGENT MONTHLY TARGETS
-- ====================================
CREATE TABLE agent_targets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES users(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL, -- Format: '2026-02'
  target_amount DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(agent_id, month_year)
);

-- ====================================
-- 3. CUSTOMERS TABLE
-- ====================================
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by_agent_id UUID NOT NULL REFERENCES users(id),
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  shop_name TEXT,
  customer_type TEXT CHECK (customer_type IN ('Retailer', 'Wholesaler')),
  lead_source TEXT,
  status TEXT DEFAULT 'New' CHECK (status IN ('New', 'Matured', 'Old', 'Cold', 'Interested', 'Not Interested', 'Follow up')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster agent queries
CREATE INDEX idx_customers_agent ON customers(created_by_agent_id);
CREATE INDEX idx_customers_phone ON customers(phone);

-- ====================================
-- 4. CALL LOGS TABLE
-- ====================================
CREATE TABLE call_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES users(id),
  call_date DATE NOT NULL DEFAULT CURRENT_DATE,
  call_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  call_type TEXT NOT NULL CHECK (call_type IN ('Fresh', 'Follow-up')),
  stage TEXT NOT NULL CHECK (stage IN ('Interested', 'Not Interested', 'Matured', 'Follow up', 'Cold')),
  notes TEXT,
  next_followup_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_call_logs_customer ON call_logs(customer_id);
CREATE INDEX idx_call_logs_agent ON call_logs(agent_id);
CREATE INDEX idx_call_logs_date ON call_logs(call_date);
CREATE INDEX idx_call_logs_followup ON call_logs(next_followup_date);

-- ====================================
-- 5. ORDERS TABLE
-- ====================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES users(id),
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  order_type TEXT NOT NULL CHECK (order_type IN ('COD', 'Prepaid', 'Credit', 'Cod')),
  taxable_amount DECIMAL(12,2) NOT NULL,
  discount_category TEXT NOT NULL CHECK (discount_category IN ('0% Discount', '1-15% Discount', '15%+')),
  discount_amount DECIMAL(12,2) DEFAULT 0,
  total_sale DECIMAL(12,2) NOT NULL,
  incentive_amount DECIMAL(10,2) NOT NULL,
  awb_number TEXT,
  tracking_status TEXT,
  tracking_last_updated TIMESTAMP WITH TIME ZONE,
  customer_type_at_order TEXT, -- 'New' or 'Old' at time of order
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_agent ON orders(agent_id);
CREATE INDEX idx_orders_date ON orders(order_date);
CREATE INDEX idx_orders_awb ON orders(awb_number);

-- ====================================
-- 6. ATTENDANCE SESSIONS
-- ====================================
CREATE TABLE attendance_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES users(id),
  punch_in TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  punch_out TIMESTAMP WITH TIME ZONE,
  work_minutes INTEGER,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX idx_attendance_agent ON attendance_sessions(agent_id);
CREATE INDEX idx_attendance_date ON attendance_sessions(session_date);

-- ====================================
-- 7. BREAKS
-- ====================================
CREATE TABLE breaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  break_type TEXT NOT NULL CHECK (break_type IN ('Lunch Break', 'Tea Break', 'Other')),
  break_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  break_end TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX idx_breaks_session ON breaks(session_id);

-- ====================================
-- 8. LEAVE REQUESTS
-- ====================================
CREATE TABLE leave_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES users(id),
  leave_date DATE NOT NULL,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('Sick Leave', 'Casual Leave', 'Emergency Leave', 'Other')),
  reason TEXT,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Denied')),
  reviewed_by_admin_id UUID REFERENCES users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX idx_leave_agent ON leave_requests(agent_id);
CREATE INDEX idx_leave_status ON leave_requests(status);

-- ====================================
-- 9. INCENTIVE SETTINGS
-- ====================================
CREATE TABLE incentive_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slab_threshold DECIMAL(12,2) NOT NULL, -- 250000, 500000, etc.
  slab_rate DECIMAL(5,4) NOT NULL, -- 0.0100, 0.0175, etc.
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default slabs
INSERT INTO incentive_settings (slab_threshold, slab_rate) VALUES
  (0, 0.0100),        -- < 250k: 1%
  (250000, 0.0175),   -- 250k-500k: 1.75%
  (500000, 0.0250),   -- 500k-700k: 2.5%
  (700000, 0.0350),   -- 700k-900k: 3.5%
  (900000, 0.0500);   -- 900k+: 5%

-- ====================================
-- 10. DROPDOWN OPTIONS
-- ====================================
CREATE TABLE dropdown_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL, -- 'lead_source', 'call_stage', 'order_type', etc.
  option_value TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category, option_value)
);

-- Insert default options
INSERT INTO dropdown_options (category, option_value, display_order) VALUES
  ('lead_source', 'Facebook', 1),
  ('lead_source', 'Google', 2),
  ('lead_source', 'Refrence', 3),
  ('lead_source', 'Instagram', 4),
  ('lead_source', 'Direct', 5),
  ('call_stage', 'Interested', 1),
  ('call_stage', 'Not Interested', 2),
  ('call_stage', 'Matured', 3),
  ('call_stage', 'Follow up', 4),
  ('call_stage', 'Cold', 5),
  ('customer_type', 'Retailer', 1),
  ('customer_type', 'Wholesaler', 2);

-- ====================================
-- 11. AUDIT LOG
-- ====================================
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES users(id),
  action_type TEXT NOT NULL, -- 'reassign_customer', 'update_target', 'approve_leave', etc.
  target_entity TEXT, -- 'customer', 'user', 'leave', etc.
  target_id UUID,
  old_value JSONB,
  new_value JSONB,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX idx_audit_admin ON audit_log(admin_id);
CREATE INDEX idx_audit_created ON audit_log(created_at);

-- ====================================
-- 12. MONTHLY SNAPSHOTS (for payout lock)
-- ====================================
CREATE TABLE monthly_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES users(id),
  month_year TEXT NOT NULL, -- '2026-02'
  total_calls INTEGER DEFAULT 0,
  fresh_calls INTEGER DEFAULT 0,
  followup_calls INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_sales DECIMAL(12,2) DEFAULT 0,
  qualifying_sales DECIMAL(12,2) DEFAULT 0, -- Sales used for slab calculation
  total_incentive DECIMAL(10,2) DEFAULT 0,
  base_salary DECIMAL(10,2) DEFAULT 0,
  total_payout DECIMAL(10,2) DEFAULT 0,
  target_amount DECIMAL(12,2) DEFAULT 0,
  is_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(agent_id, month_year)
);

-- Index
CREATE INDEX idx_snapshots_agent ON monthly_snapshots(agent_id);
CREATE INDEX idx_snapshots_month ON monthly_snapshots(month_year);

-- ====================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE breaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- ====================================
-- USERS TABLE POLICIES
-- ====================================
-- Agents can read their own profile
CREATE POLICY "Agents can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Admins can view all users
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Admins can update users
CREATE POLICY "Admins can update users"
  ON users FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- ====================================
-- CUSTOMERS TABLE POLICIES
-- ====================================
-- Agents can only see their own customers
CREATE POLICY "Agents can view own customers"
  ON customers FOR SELECT
  USING (
    created_by_agent_id = auth.uid()
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Agents can insert their own customers
CREATE POLICY "Agents can create customers"
  ON customers FOR INSERT
  WITH CHECK (created_by_agent_id = auth.uid());

-- Agents can update their own customers
CREATE POLICY "Agents can update own customers"
  ON customers FOR UPDATE
  USING (
    created_by_agent_id = auth.uid()
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can update any customer (for reassignment)
CREATE POLICY "Admins can update any customer"
  ON customers FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- ====================================
-- CALL LOGS POLICIES
-- ====================================
CREATE POLICY "Agents can view own call logs"
  ON call_logs FOR SELECT
  USING (
    agent_id = auth.uid()
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Agents can create call logs"
  ON call_logs FOR INSERT
  WITH CHECK (agent_id = auth.uid());

-- ====================================
-- ORDERS POLICIES
-- ====================================
CREATE POLICY "Agents can view own orders"
  ON orders FOR SELECT
  USING (
    agent_id = auth.uid()
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Agents can create orders"
  ON orders FOR INSERT
  WITH CHECK (agent_id = auth.uid());

CREATE POLICY "Agents can update own orders"
  ON orders FOR UPDATE
  USING (
    agent_id = auth.uid()
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ====================================
-- ATTENDANCE POLICIES
-- ====================================
CREATE POLICY "Agents can view own attendance"
  ON attendance_sessions FOR SELECT
  USING (
    agent_id = auth.uid()
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Agents can create attendance"
  ON attendance_sessions FOR INSERT
  WITH CHECK (agent_id = auth.uid());

CREATE POLICY "Agents can update own attendance"
  ON attendance_sessions FOR UPDATE
  USING (agent_id = auth.uid());

-- ====================================
-- BREAKS POLICIES
-- ====================================
CREATE POLICY "Agents can manage own breaks"
  ON breaks FOR ALL
  USING (EXISTS (
    SELECT 1 FROM attendance_sessions 
    WHERE id = breaks.session_id AND agent_id = auth.uid()
  ));

-- ====================================
-- LEAVE REQUESTS POLICIES
-- ====================================
CREATE POLICY "Agents can view own leaves"
  ON leave_requests FOR SELECT
  USING (
    agent_id = auth.uid()
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Agents can create leave requests"
  ON leave_requests FOR INSERT
  WITH CHECK (agent_id = auth.uid());

CREATE POLICY "Admins can update leave requests"
  ON leave_requests FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- ====================================
-- AGENT TARGETS POLICIES
-- ====================================
CREATE POLICY "Agents can view own targets"
  ON agent_targets FOR SELECT
  USING (
    agent_id = auth.uid()
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can manage targets"
  ON agent_targets FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- ====================================
-- MONTHLY SNAPSHOTS POLICIES
-- ====================================
CREATE POLICY "Agents can view own snapshots"
  ON monthly_snapshots FOR SELECT
  USING (
    agent_id = auth.uid()
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can manage snapshots"
  ON monthly_snapshots FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- ====================================
-- AUDIT LOG POLICIES (Admin only)
-- ====================================
CREATE POLICY "Admins can view audit log"
  ON audit_log FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can create audit entries"
  ON audit_log FOR INSERT
  WITH CHECK (admin_id = auth.uid());

-- ====================================
-- FUNCTIONS & TRIGGERS
-- ====================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leave_updated_at BEFORE UPDATE ON leave_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ====================================
-- INCENTIVE CALCULATION FUNCTION
-- ====================================
CREATE OR REPLACE FUNCTION calculate_incentive(
  p_agent_id UUID,
  p_order_date DATE,
  p_taxable_amount DECIMAL,
  p_order_type TEXT,
  p_discount_category TEXT
)
RETURNS DECIMAL AS $$
DECLARE
  v_month_year TEXT;
  v_qualifying_total DECIMAL;
  v_slab_rate DECIMAL;
  v_final_rate DECIMAL;
  v_incentive DECIMAL;
BEGIN
  -- Get month_year
  v_month_year := TO_CHAR(p_order_date, 'YYYY-MM');
  
  -- Calculate qualifying total for the month (exclude Credit and 15%+)
  SELECT COALESCE(SUM(taxable_amount), 0)
  INTO v_qualifying_total
  FROM orders
  WHERE agent_id = p_agent_id
    AND TO_CHAR(order_date, 'YYYY-MM') = v_month_year
    AND order_type NOT IN ('Credit')
    AND discount_category != '15%+';
  
  -- Determine slab rate based on qualifying total
  SELECT slab_rate INTO v_slab_rate
  FROM incentive_settings
  WHERE slab_threshold <= v_qualifying_total
    AND is_active = TRUE
  ORDER BY slab_threshold DESC
  LIMIT 1;
  
  -- Default to 1% if no slab found
  IF v_slab_rate IS NULL THEN
    v_slab_rate := 0.0100;
  END IF;
  
  -- Apply special rules
  IF p_order_type = 'Credit' OR p_discount_category = '15%+' THEN
    v_final_rate := 0.0100; -- 1%
  ELSIF p_discount_category = '0% Discount' THEN
    v_final_rate := v_slab_rate + 0.0200; -- slab + 2%
  ELSE
    v_final_rate := v_slab_rate; -- normal slab rate
  END IF;
  
  -- Calculate incentive
  v_incentive := p_taxable_amount * v_final_rate;
  
  RETURN ROUND(v_incentive, 2);
END;
$$ LANGUAGE plpgsql;

-- ====================================
-- AUTO-UPDATE CUSTOMER STATUS ON FIRST ORDER
-- ====================================
CREATE OR REPLACE FUNCTION update_customer_status_on_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is the customer's first order
  IF NOT EXISTS (
    SELECT 1 FROM orders 
    WHERE customer_id = NEW.customer_id 
    AND id != NEW.id
  ) THEN
    -- Update customer status to 'Matured'
    UPDATE customers 
    SET status = 'Matured'
    WHERE id = NEW.customer_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_customer_status
AFTER INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION update_customer_status_on_order();

-- ====================================
-- VIEWS FOR REPORTING
-- ====================================

-- Agent Dashboard Summary View
CREATE OR REPLACE VIEW agent_dashboard_current_month AS
SELECT 
  u.id as agent_id,
  u.name as agent_name,
  u.email,
  TO_CHAR(CURRENT_DATE, 'YYYY-MM') as month_year,
  COALESCE(t.target_amount, 0) as target_amount,
  COALESCE(stats.total_calls, 0) as total_calls,
  COALESCE(stats.fresh_calls, 0) as fresh_calls,
  COALESCE(stats.followup_calls, 0) as followup_calls,
  COALESCE(stats.total_orders, 0) as total_orders,
  COALESCE(stats.total_sales, 0) as total_sales,
  COALESCE(stats.total_incentive, 0) as total_incentive,
  COALESCE(t.target_amount, 0) - COALESCE(stats.total_sales, 0) as target_left
FROM users u
LEFT JOIN agent_targets t ON u.id = t.agent_id 
  AND t.month_year = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
LEFT JOIN LATERAL (
  SELECT 
    COUNT(DISTINCT cl.id) as total_calls,
    COUNT(DISTINCT CASE WHEN cl.call_type = 'Fresh' THEN cl.id END) as fresh_calls,
    COUNT(DISTINCT CASE WHEN cl.call_type = 'Follow-up' THEN cl.id END) as followup_calls,
    COUNT(DISTINCT o.id) as total_orders,
    COALESCE(SUM(o.total_sale), 0) as total_sales,
    COALESCE(SUM(o.incentive_amount), 0) as total_incentive
  FROM call_logs cl
  FULL OUTER JOIN orders o ON DATE_TRUNC('month', o.order_date) = DATE_TRUNC('month', CURRENT_DATE)
    AND o.agent_id = u.id
  WHERE (cl.agent_id = u.id AND DATE_TRUNC('month', cl.call_date) = DATE_TRUNC('month', CURRENT_DATE))
     OR o.agent_id = u.id
) stats ON TRUE
WHERE u.role = 'agent' AND u.is_active = TRUE;

-- ====================================
-- SEED DATA (for testing)
-- ====================================
-- Note: This will be populated via Supabase Auth
-- You'll need to create users through Supabase dashboard first
-- Then update their role in the users table

-- ====================================
-- INDEXES FOR PERFORMANCE
-- ====================================
-- Additional composite indexes for common queries
CREATE INDEX idx_call_logs_agent_date ON call_logs(agent_id, call_date);
CREATE INDEX idx_orders_agent_date ON orders(agent_id, order_date);
CREATE INDEX idx_customers_agent_status ON customers(created_by_agent_id, status);

-- ====================================
-- END OF SCHEMA
-- ====================================
