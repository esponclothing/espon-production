import { useState, useEffect } from 'react';
import AgentLayout from '../../components/AgentLayout';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../lib/utils';
import { format } from 'date-fns';

interface OrderForm {
  customer_id: string;
  order_date: string;
  product_category: string;
  quantity: number;
  unit_price: number;
  discount_percentage: number;
  is_credit: boolean;
  notes: string;
}

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<OrderForm>({
    customer_id: '',
    order_date: new Date().toISOString().split('T')[0],
    product_category: 'T-Shirts',
    quantity: 1,
    unit_price: 0,
    discount_percentage: 0,
    is_credit: false,
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Calculated values
  const totalAmount = formData.quantity * formData.unit_price;
  const discountAmount = (totalAmount * formData.discount_percentage) / 100;
  const totalSale = totalAmount - discountAmount;

  useEffect(() => {
    loadOrders();
    loadCustomers();
  }, []);

  const loadOrders = async () => {
    try {
      const { data } = await supabase
        .from('orders')
        .select(`
          *,
          customers (
            id,
            customer_name,
            phone,
            shop_name
          )
        `)
        .eq('agent_id', user!.id)
        .order('order_date', { ascending: false })
        .order('created_at', { ascending: false });

      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const { data } = await supabase
        .from('customers')
        .select('id, customer_name, phone, shop_name')
        .eq('created_by_agent_id', user!.id)
        .order('customer_name');

      setCustomers(data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const totalAmount = formData.quantity * formData.unit_price;
      const discountAmount = (totalAmount * formData.discount_percentage) / 100;
      const totalSale = totalAmount - discountAmount;

      const { error } = await supabase.from('orders').insert({
        agent_id: user!.id,
        customer_id: formData.customer_id,
        order_date: formData.order_date,
        product_category: formData.product_category,
        quantity: formData.quantity,
        unit_price: formData.unit_price,
        total_amount: totalAmount,
        discount_percentage: formData.discount_percentage,
        discount_amount: discountAmount,
        total_sale: totalSale,
        is_credit: formData.is_credit,
        notes: formData.notes,
      });

      if (error) throw error;

      alert('Order created successfully!');
      setShowAddForm(false);
      setFormData({
        customer_id: '',
        order_date: new Date().toISOString().split('T')[0],
        product_category: 'T-Shirts',
        quantity: 1,
        unit_price: 0,
        discount_percentage: 0,
        is_credit: false,
        notes: '',
      });
      loadOrders();
    } catch (error: any) {
      alert('Error creating order: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AgentLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </AgentLayout>
    );
  }

  return (
    <AgentLayout>
      <div className="space-y-6 pb-20 lg:pb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            + Create Order
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-600 font-medium">Total Orders</p>
            <p className="text-2xl font-bold text-blue-900">{orders.length}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-600 font-medium">Total Sales</p>
            <p className="text-2xl font-bold text-green-900">
              {formatCurrency(orders.reduce((sum, o) => sum + Number(o.total_sale), 0))}
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-purple-600 font-medium">Credit Orders</p>
            <p className="text-2xl font-bold text-purple-900">
              {orders.filter((o) => o.is_credit).length}
            </p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <p className="text-sm text-orange-600 font-medium">Incentive Earned</p>
            <p className="text-2xl font-bold text-orange-900">
              {formatCurrency(orders.reduce((sum, o) => sum + Number(o.incentive_amount || 0), 0))}
            </p>
          </div>
        </div>

        {/* Add Order Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Create New Order</h2>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer *
                    </label>
                    <select
                      required
                      value={formData.customer_id}
                      onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a customer</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.customer_name} {c.shop_name && `(${c.shop_name})`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Order Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.order_date}
                        onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Product Category *
                      </label>
                      <select
                        value={formData.product_category}
                        onChange={(e) => setFormData({ ...formData, product_category: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option>T-Shirts</option>
                        <option>Shirts</option>
                        <option>Jackets</option>
                        <option>Trousers</option>
                        <option>Accessories</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit Price (₹) *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={formData.unit_price}
                        onChange={(e) => setFormData({ ...formData, unit_price: Number(e.target.value) })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discount (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.discount_percentage}
                      onChange={(e) => setFormData({ ...formData, discount_percentage: Number(e.target.value) })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Calculation Summary */}
                  <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Total Amount:</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(totalAmount)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700">Discount:</span>
                        <span className="font-semibold text-red-600">- {formatCurrency(discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg border-t pt-2">
                      <span className="font-bold text-gray-900">Final Sale:</span>
                      <span className="font-bold text-green-600">{formatCurrency(totalSale)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_credit"
                      checked={formData.is_credit}
                      onChange={(e) => setFormData({ ...formData, is_credit: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <label htmlFor="is_credit" className="text-sm font-medium text-gray-700">
                      Credit Order (Incentive: 1% only)
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      placeholder="Add any notes..."
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
                    >
                      {submitting ? 'Creating...' : 'Create Order'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Orders List */}
        <div className="grid gap-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {order.customers?.customer_name}
                  </h3>
                  {order.customers?.shop_name && (
                    <p className="text-sm text-gray-500">{order.customers.shop_name}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(order.total_sale)}
                  </p>
                  {order.incentive_amount > 0 && (
                    <p className="text-xs text-blue-600">
                      Incentive: {formatCurrency(order.incentive_amount)}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                <div>
                  <p className="text-gray-600">Product:</p>
                  <p className="font-medium text-gray-900">{order.product_category}</p>
                </div>
                <div>
                  <p className="text-gray-600">Quantity:</p>
                  <p className="font-medium text-gray-900">{order.quantity} units @ {formatCurrency(order.unit_price)}</p>
                </div>
              </div>

              {order.discount_percentage > 0 && (
                <div className="text-sm mb-2">
                  <span className="text-orange-600">
                    🏷️ {order.discount_percentage}% discount applied ({formatCurrency(order.discount_amount)})
                  </span>
                </div>
              )}

              <div className="flex flex-wrap gap-2 mb-2">
                <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                  Order #{order.id.slice(0, 8)}
                </span>
                {order.is_credit && (
                  <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                    Credit
                  </span>
                )}
              </div>

              {order.notes && (
                <p className="text-sm text-gray-600 mb-2">📝 {order.notes}</p>
              )}

              <p className="text-xs text-gray-500">
                📅 {format(new Date(order.order_date), 'MMM dd, yyyy')}
              </p>
            </div>
          ))}

          {orders.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-500">No orders yet</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-4 text-blue-600 hover:underline"
              >
                Create your first order
              </button>
            </div>
          )}
        </div>
      </div>
    </AgentLayout>
  );
}
