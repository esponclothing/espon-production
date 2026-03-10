import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';

interface IncentiveSlab {
  id: string;
  slab_threshold: number;
  slab_rate: number;
  is_active: boolean;
}

interface DropdownOption {
  id: string;
  category: string;
  option_value: string;
  is_active: boolean;
  display_order: number;
}

export default function Settings() {
  const [slabs, setSlabs] = useState<IncentiveSlab[]>([]);
  const [dropdownOptions, setDropdownOptions] = useState<DropdownOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'slabs' | 'dropdowns'>('slabs');
  const [editingSlab, setEditingSlab] = useState<IncentiveSlab | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('lead_source');
  const [newOption, setNewOption] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (activeTab === 'dropdowns') {
      loadDropdownOptions(selectedCategory);
    }
  }, [selectedCategory, activeTab]);

  const loadSettings = async () => {
    try {
      const { data: slabsData } = await supabase
        .from('incentive_settings')
        .select('*')
        .order('slab_threshold');

      setSlabs(slabsData || []);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDropdownOptions = async (category: string) => {
    try {
      const { data } = await supabase
        .from('dropdown_options')
        .select('*')
        .eq('category', category)
        .order('display_order');

      setDropdownOptions(data || []);
    } catch (error) {
      console.error('Error loading dropdown options:', error);
    }
  };

  const handleUpdateSlab = async (slab: IncentiveSlab) => {
    try {
      const { error } = await supabase
        .from('incentive_settings')
        .update({
          slab_rate: slab.slab_rate,
          is_active: slab.is_active,
        })
        .eq('id', slab.id);

      if (error) throw error;

      alert('Slab updated successfully!');
      setEditingSlab(null);
      loadSettings();
    } catch (error: any) {
      alert('Error updating slab: ' + error.message);
    }
  };

  const handleAddDropdownOption = async () => {
    if (!newOption.trim()) {
      alert('Please enter an option value');
      return;
    }

    try {
      const maxOrder = Math.max(...dropdownOptions.map((o) => o.display_order), 0);
      
      const { error } = await supabase.from('dropdown_options').insert({
        category: selectedCategory,
        option_value: newOption.trim(),
        display_order: maxOrder + 1,
        is_active: true,
      });

      if (error) throw error;

      alert('Option added successfully!');
      setNewOption('');
      loadDropdownOptions(selectedCategory);
    } catch (error: any) {
      alert('Error adding option: ' + error.message);
    }
  };

  const handleToggleOption = async (optionId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('dropdown_options')
        .update({ is_active })
        .eq('id', optionId);

      if (error) throw error;

      loadDropdownOptions(selectedCategory);
    } catch (error: any) {
      alert('Error updating option: ' + error.message);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 pb-20 lg:pb-6">
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow p-2">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('slabs')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium ${
                activeTab === 'slabs'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              💰 Incentive Slabs
            </button>
            <button
              onClick={() => setActiveTab('dropdowns')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium ${
                activeTab === 'dropdowns'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              📋 Dropdown Options
            </button>
          </div>
        </div>

        {/* Incentive Slabs Tab */}
        {activeTab === 'slabs' && (
          <div className="space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-purple-900 mb-2">Incentive Calculation Logic</h3>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• Qualifying sales = Sales excluding Credit orders and 15%+ discount</li>
                <li>• Slab determined by monthly qualifying sales total</li>
                <li>• Special rules: Credit = 1%, 15%+ = 1%, 0% discount = slab + 2%</li>
              </ul>
            </div>

            <div className="grid gap-4">
              {slabs.map((slab) => (
                <div key={slab.id} className="bg-white rounded-lg shadow p-6">
                  {editingSlab?.id === slab.id ? (
                    // Edit Mode
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Threshold (₹)
                        </label>
                        <input
                          type="number"
                          value={editingSlab.slab_threshold}
                          disabled
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                        />
                        <p className="text-xs text-gray-500 mt-1">Threshold cannot be changed</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Rate (%)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={editingSlab.slab_rate * 100}
                          onChange={(e) =>
                            setEditingSlab({
                              ...editingSlab,
                              slab_rate: Number(e.target.value) / 100,
                            })
                          }
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={editingSlab.is_active}
                          onChange={(e) =>
                            setEditingSlab({ ...editingSlab, is_active: e.target.checked })
                          }
                          className="mr-2"
                        />
                        <label className="text-sm text-gray-700">Active</label>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateSlab(editingSlab)}
                          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingSlab(null)}
                          className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-600">
                          {slab.slab_threshold === 0
                            ? 'Below ₹2,50,000'
                            : `₹${(slab.slab_threshold / 1000).toFixed(0)}K+`}
                        </p>
                        <p className="text-2xl font-bold text-purple-900">
                          {(slab.slab_rate * 100).toFixed(2)}%
                        </p>
                        <span
                          className={`inline-block mt-2 px-2 py-1 text-xs rounded-full ${
                            slab.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {slab.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <button
                        onClick={() => setEditingSlab(slab)}
                        className="text-purple-600 hover:text-purple-800"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dropdown Options Tab */}
        {activeTab === 'dropdowns' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="lead_source">Lead Sources</option>
                <option value="call_stage">Call Stages</option>
                <option value="customer_type">Customer Types</option>
              </select>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Add New Option</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  placeholder="Enter new option..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                />
                <button
                  onClick={handleAddDropdownOption}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Current Options</h3>
              <div className="space-y-2">
                {dropdownOptions.map((option) => (
                  <div
                    key={option.id}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="text-gray-900">{option.option_value}</span>
                    <button
                      onClick={() => handleToggleOption(option.id, !option.is_active)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        option.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {option.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                ))}
                {dropdownOptions.length === 0 && (
                  <p className="text-center text-gray-500 py-4">No options found</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
