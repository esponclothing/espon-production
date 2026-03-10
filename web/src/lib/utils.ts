import { supabase } from './supabase';

/**
 * Calculate incentive for an order using the server-side function
 */
export async function calculateIncentive(
  agentId: string,
  orderDate: string,
  taxableAmount: number,
  orderType: string,
  discountCategory: string
): Promise<number> {
  const { data, error } = await supabase.rpc('calculate_incentive', {
    p_agent_id: agentId,
    p_order_date: orderDate,
    p_taxable_amount: taxableAmount,
    p_order_type: orderType,
    p_discount_category: discountCategory,
  });

  if (error) {
    console.error('Error calculating incentive:', error);
    throw error;
  }

  return data || 0;
}

/**
 * Client-side incentive calculation (for preview/validation)
 * Matches the database function logic
 */
export function calculateIncentiveClient(
  qualifyingTotal: number,
  taxableAmount: number,
  orderType: string,
  discountCategory: string
): number {
  // Slab thresholds and rates
  const slabs = [
    { threshold: 900000, rate: 0.05 },    // >= 900k: 5%
    { threshold: 700000, rate: 0.035 },   // 700k-900k: 3.5%
    { threshold: 500000, rate: 0.025 },   // 500k-700k: 2.5%
    { threshold: 250000, rate: 0.0175 },  // 250k-500k: 1.75%
    { threshold: 0, rate: 0.01 },         // < 250k: 1%
  ];

  // Find applicable slab rate
  let slabRate = 0.01; // default 1%
  for (const slab of slabs) {
    if (qualifyingTotal >= slab.threshold) {
      slabRate = slab.rate;
      break;
    }
  }

  // Apply special rules
  let finalRate: number;
  
  if (orderType === 'Credit' || discountCategory === '15%+') {
    finalRate = 0.01; // 1% for Credit or 15%+ discount
  } else if (discountCategory === '0% Discount') {
    finalRate = slabRate + 0.02; // slab + 2% for no discount
  } else {
    finalRate = slabRate; // normal slab rate
  }

  const incentive = taxableAmount * finalRate;
  return Math.round(incentive * 100) / 100; // Round to 2 decimals
}

/**
 * Get current month in YYYY-MM format
 */
export function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Get date range for current month
 */
export function getCurrentMonthRange(): { start: string; end: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

/**
 * Format currency in INR
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date to DD-MM-YYYY
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Format date to relative time (e.g., "2 days ago", "Today")
 */
export function formatRelativeDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

/**
 * Calculate work hours from minutes
 */
export function formatWorkTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

/**
 * Check if a date is today
 */
export function isToday(date: string | Date): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

/**
 * Get WhatsApp chat URL
 */
export function getWhatsAppUrl(phone: string, message?: string): string {
  // Remove any non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Add country code if not present (assuming India +91)
  const phoneWithCode = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
  
  let url = `https://wa.me/${phoneWithCode}`;
  
  if (message) {
    url += `?text=${encodeURIComponent(message)}`;
  }
  
  return url;
}

/**
 * Validate phone number (Indian format)
 */
export function validatePhone(phone: string): boolean {
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length === 10 || cleanPhone.length === 12;
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.length === 10) {
    return cleanPhone.replace(/(\d{5})(\d{5})/, '$1 $2');
  }
  
  return phone;
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

/**
 * Get progress color based on percentage
 */
export function getProgressColor(percentage: number): string {
  if (percentage >= 100) return 'bg-green-500';
  if (percentage >= 75) return 'bg-blue-500';
  if (percentage >= 50) return 'bg-yellow-500';
  if (percentage >= 25) return 'bg-orange-500';
  return 'bg-red-500';
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Generate a list of months for dropdowns
 */
export function getMonthsList(count: number = 12): Array<{ value: string; label: string }> {
  const months: Array<{ value: string; label: string }> = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const monthName = date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    
    months.push({
      value: `${year}-${month}`,
      label: monthName,
    });
  }
  
  return months;
}
