export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: 'agent' | 'admin'
          base_salary: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          role: 'agent' | 'admin'
          base_salary?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'agent' | 'admin'
          base_salary?: number
          is_active?: boolean
          updated_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          created_by_agent_id: string
          customer_name: string
          phone: string
          shop_name: string | null
          customer_type: 'Retailer' | 'Wholesaler' | null
          lead_source: string | null
          status: 'New' | 'Matured' | 'Old' | 'Cold' | 'Interested' | 'Not Interested' | 'Follow up'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          created_by_agent_id: string
          customer_name: string
          phone: string
          shop_name?: string | null
          customer_type?: 'Retailer' | 'Wholesaler' | null
          lead_source?: string | null
          status?: 'New' | 'Matured' | 'Old' | 'Cold' | 'Interested' | 'Not Interested' | 'Follow up'
          created_at?: string
          updated_at?: string
        }
        Update: {
          customer_name?: string
          phone?: string
          shop_name?: string | null
          customer_type?: 'Retailer' | 'Wholesaler' | null
          lead_source?: string | null
          status?: 'New' | 'Matured' | 'Old' | 'Cold' | 'Interested' | 'Not Interested' | 'Follow up'
          updated_at?: string
        }
      }
      call_logs: {
        Row: {
          id: string
          customer_id: string
          agent_id: string
          call_date: string
          call_time: string
          call_type: 'Fresh' | 'Follow-up'
          stage: 'Interested' | 'Not Interested' | 'Matured' | 'Follow up' | 'Cold'
          notes: string | null
          next_followup_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          agent_id: string
          call_date?: string
          call_time?: string
          call_type: 'Fresh' | 'Follow-up'
          stage: 'Interested' | 'Not Interested' | 'Matured' | 'Follow up' | 'Cold'
          notes?: string | null
          next_followup_date?: string | null
          created_at?: string
        }
        Update: {
          notes?: string | null
          next_followup_date?: string | null
        }
      }
      orders: {
        Row: {
          id: string
          customer_id: string
          agent_id: string
          order_date: string
          order_type: 'COD' | 'Prepaid' | 'Credit' | 'Cod'
          taxable_amount: number
          discount_category: '0% Discount' | '1-15% Discount' | '15%+'
          discount_amount: number
          total_sale: number
          incentive_amount: number
          awb_number: string | null
          tracking_status: string | null
          tracking_last_updated: string | null
          customer_type_at_order: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          agent_id: string
          order_date?: string
          order_type: 'COD' | 'Prepaid' | 'Credit' | 'Cod'
          taxable_amount: number
          discount_category: '0% Discount' | '1-15% Discount' | '15%+'
          discount_amount?: number
          total_sale: number
          incentive_amount: number
          awb_number?: string | null
          tracking_status?: string | null
          tracking_last_updated?: string | null
          customer_type_at_order?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          awb_number?: string | null
          tracking_status?: string | null
          tracking_last_updated?: string | null
          updated_at?: string
        }
      }
      attendance_sessions: {
        Row: {
          id: string
          agent_id: string
          punch_in: string
          punch_out: string | null
          work_minutes: number | null
          session_date: string
          created_at: string
        }
        Insert: {
          id?: string
          agent_id: string
          punch_in?: string
          punch_out?: string | null
          work_minutes?: number | null
          session_date?: string
          created_at?: string
        }
        Update: {
          punch_out?: string | null
          work_minutes?: number | null
        }
      }
      breaks: {
        Row: {
          id: string
          session_id: string
          break_type: 'Lunch Break' | 'Tea Break' | 'Other'
          break_start: string
          break_end: string | null
          duration_minutes: number | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          break_type: 'Lunch Break' | 'Tea Break' | 'Other'
          break_start?: string
          break_end?: string | null
          duration_minutes?: number | null
          created_at?: string
        }
        Update: {
          break_end?: string | null
          duration_minutes?: number | null
        }
      }
      leave_requests: {
        Row: {
          id: string
          agent_id: string
          leave_date: string
          leave_type: 'Sick Leave' | 'Casual Leave' | 'Emergency Leave' | 'Other'
          reason: string | null
          status: 'Pending' | 'Approved' | 'Denied'
          reviewed_by_admin_id: string | null
          reviewed_at: string | null
          admin_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          agent_id: string
          leave_date: string
          leave_type: 'Sick Leave' | 'Casual Leave' | 'Emergency Leave' | 'Other'
          reason?: string | null
          status?: 'Pending' | 'Approved' | 'Denied'
          reviewed_by_admin_id?: string | null
          reviewed_at?: string | null
          admin_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: 'Pending' | 'Approved' | 'Denied'
          reviewed_by_admin_id?: string | null
          reviewed_at?: string | null
          admin_notes?: string | null
          updated_at?: string
        }
      }
      agent_targets: {
        Row: {
          id: string
          agent_id: string
          month_year: string
          target_amount: number
          created_at: string
        }
        Insert: {
          id?: string
          agent_id: string
          month_year: string
          target_amount: number
          created_at?: string
        }
        Update: {
          target_amount?: number
        }
      }
      monthly_snapshots: {
        Row: {
          id: string
          agent_id: string
          month_year: string
          total_calls: number
          fresh_calls: number
          followup_calls: number
          total_orders: number
          total_sales: number
          qualifying_sales: number
          total_incentive: number
          base_salary: number
          total_payout: number
          target_amount: number
          is_locked: boolean
          created_at: string
        }
        Insert: {
          id?: string
          agent_id: string
          month_year: string
          total_calls?: number
          fresh_calls?: number
          followup_calls?: number
          total_orders?: number
          total_sales?: number
          qualifying_sales?: number
          total_incentive?: number
          base_salary?: number
          total_payout?: number
          target_amount?: number
          is_locked?: boolean
          created_at?: string
        }
        Update: {
          total_calls?: number
          fresh_calls?: number
          followup_calls?: number
          total_orders?: number
          total_sales?: number
          qualifying_sales?: number
          total_incentive?: number
          base_salary?: number
          total_payout?: number
          target_amount?: number
          is_locked?: boolean
        }
      }
      incentive_settings: {
        Row: {
          id: string
          slab_threshold: number
          slab_rate: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slab_threshold: number
          slab_rate: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          slab_threshold?: number
          slab_rate?: number
          is_active?: boolean
          updated_at?: string
        }
      }
      dropdown_options: {
        Row: {
          id: string
          category: string
          option_value: string
          is_active: boolean
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          category: string
          option_value: string
          is_active?: boolean
          display_order?: number
          created_at?: string
        }
        Update: {
          option_value?: string
          is_active?: boolean
          display_order?: number
        }
      }
      audit_log: {
        Row: {
          id: string
          admin_id: string | null
          action_type: string
          target_entity: string | null
          target_id: string | null
          old_value: Json | null
          new_value: Json | null
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          admin_id?: string | null
          action_type: string
          target_entity?: string | null
          target_id?: string | null
          old_value?: Json | null
          new_value?: Json | null
          description?: string | null
          created_at?: string
        }
        Update: {}
      }
    }
    Views: {
      agent_dashboard_current_month: {
        Row: {
          agent_id: string
          agent_name: string
          email: string
          month_year: string
          target_amount: number
          total_calls: number
          fresh_calls: number
          followup_calls: number
          total_orders: number
          total_sales: number
          total_incentive: number
          target_left: number
        }
      }
    }
    Functions: {
      calculate_incentive: {
        Args: {
          p_agent_id: string
          p_order_date: string
          p_taxable_amount: number
          p_order_type: string
          p_discount_category: string
        }
        Returns: number
      }
    }
  }
}
