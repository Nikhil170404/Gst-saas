// src/pages/settings/SettingsPage.js
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useForm } from 'react-hook-form';
import { AuthService } from '../../services/authService';
import { GSTService } from '../../services/gstService';
import toast from 'react-hot-toast';

const SettingsPage = () => {
  const { user, userData, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      displayName: user?.displayName || '',
      businessName: userData?.businessName || '',
      gstNumber: userData?.settings?.gstNumber || '',
      address: userData?.settings?.address || '',
      phone: userData?.settings?.phone || '',
      currency: userData?.settings?.currency || 'INR'
    }
  });

  const onProfileSubmit = async (data) => {
    setLoading(true);
    try {
      await AuthService.updateUserProfile(user.uid, {
        displayName: data.displayName,
        businessName: data.businessName,
        settings: {
          gstNumber: data.gstNumber,
          address: data.address,
          phone: data.phone,
          currency: data.currency
        }
      });
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const validateGSTNumber = (gstin) => {
    if (!gstin) return true; // Optional field
    const validation = GSTService.validateGSTIN(gstin);
    return validation.valid ? true : validation.error;
  };

  const plans = [
    {
      name: 'Free',
      price: '₹0',
      period: '/month',
      current: userData?.plan === 'free',
      features: [
        '10 invoices per month',
        'Basic GST calculations',
        'PDF export',
        'Email support',
        'Mobile responsive'
      ],
      limitations: [
        'No AI features',
        'Basic reports only',
        'Single user account'
      ]
    },
    {
      name: 'Professional',
      price: '₹499',
      period: '/month',
      current: userData?.plan === 'professional',
      popular: true,
      features: [
        'Unlimited invoices',
        'AI receipt scanning',
        'Advanced reports',
        'GST return assistance',
        'Multi-user access (up to 3)',
        'Priority email support',
        'Data export (Excel/PDF)',
        'Custom invoice templates'
      ]
    },
    {
      name: 'Business',
      price: '₹999',
      period: '/month',
      current: userData?.plan === 'business',
      features: [
        'Everything in Professional',
        'Unlimited users',
        'API access',
        'Custom integrations',
        'Dedicated account manager',
        'Phone support',
        'Advanced analytics',
        'White-label options'
      ]
    }
  ];

  const TabButton = ({ id, label, isActive, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        isActive
          ? 'bg-primary-100 text-primary-700'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account and preferences</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <TabButton
            id="profile"
            label="Profile"
            isActive={activeTab === 'profile'}
            onClick={setActiveTab}
          />
          <TabButton
            id="billing"
            label="Billing & Plans"
            isActive={activeTab === 'billing'}
            onClick={setActiveTab}
          />
          <TabButton
            id="notifications"
            label="Notifications"
            isActive={activeTab === 'notifications'}
            onClick={setActiveTab}
          />
          <TabButton
            id="security"
            label="Security"
            isActive={activeTab === 'security'}
            onClick={setActiveTab}
          />
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold">Profile Information</h2>
            <p className="text-gray-600">Update your personal and business details</p>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md-grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    {...register('displayName', { required: 'Name is required' })}
                    className={`form-input ${errors.displayName ? 'error' : ''}`}
                  />
                  {errors.displayName && <div className="form-error">{errors.displayName.message}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="form-input bg-gray-50"
                  />
                  <div className="form-help">Email cannot be changed</div>
                </div>

                <div className="form-group">
                  <label className="form-label">Business Name</label>
                  <input
                    {...register('businessName', { required: 'Business name is required' })}
                    className={`form-input ${errors.businessName ? 'error' : ''}`}
                  />
                  {errors.businessName && <div className="form-error">{errors.businessName.message}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label">GST Number</label>
                  <input
                    {...register('gstNumber', { validate: validateGSTNumber })}
                    className={`form-input ${errors.gstNumber ? 'error' : ''}`}
                    placeholder="22AAAAA0000A1Z5"
                  />
                  {errors.gstNumber && <div className="form-error">{errors.gstNumber.message}</div>}
                  <div className="form-help">Optional - Leave blank if not GST registered</div>
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    {...register('phone')}
                    type="tel"
                    className="form-input"
                    placeholder="+91 9876543210"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Currency</label>
                  <select {...register('currency')} className="form-select">
                    <option value="INR">Indian Rupee (₹)</option>
                    <option value="USD">US Dollar ($)</option>
                    <option value="EUR">Euro (€)</option>
                  </select>
                </div>

                <div className="form-group md-col-span-2">
                  <label className="form-label">Business Address</label>
                  <textarea
                    {...register('address')}
                    rows="3"
                    className="form-textarea"
                    placeholder="Enter your complete business address"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'billing' && (
        <div className="space-y-6">
          {/* Current Plan */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold">Current Plan</h2>
            </div>
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold capitalize">
                    {userData?.plan || 'Free'} Plan
                  </div>
                  {userData?.plan === 'free' && (
                    <div className="text-sm text-gray-600">
                      {10 - (userData?.usage?.invoicesThisMonth || 0)} invoices remaining this month
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {userData?.plan === 'free' ? '₹0' : userData?.plan === 'professional' ? '₹499' : '₹999'}
                  </div>
                  <div className="text-sm text-gray-600">/month</div>
                </div>
              </div>
            </div>
          </div>

          {/* Available Plans */}
          <div className="grid grid-cols-1 lg-grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`card ${
                  plan.popular
                    ? 'ring-2 ring-primary-500 relative'
                    : plan.current
                    ? 'ring-2 ring-success-500'
                    : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="card-body">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold">{plan.name}</h3>
                    <div className="mt-2">
                      <span className="text-3xl font-bold">{plan.price}</span>
                      <span className="text-gray-600">{plan.period}</span>
                    </div>
                  </div>

                  <ul className="mt-6 space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start text-sm">
                        <svg className="w-4 h-4 text-success-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {plan.limitations && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="text-xs text-gray-500 mb-2">Limitations:</div>
                      <ul className="space-y-1">
                        {plan.limitations.map((limitation, index) => (
                          <li key={index} className="text-xs text-gray-400 flex items-start">
                            <svg className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            {limitation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-6">
                    {plan.current ? (
                      <button disabled className="w-full btn btn-secondary">
                        Current Plan
                      </button>
                    ) : (
                      <button
                        onClick={() => toast.success('Redirecting to payment...')}
                        className="w-full btn btn-primary"
                      >
                        {plan.name === 'Free' ? 'Downgrade' : 'Upgrade'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold">Notification Preferences</h2>
            <p className="text-gray-600">Choose how you want to be notified</p>
          </div>
          <div className="card-body space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Invoice Reminders</div>
                  <div className="text-sm text-gray-600">Get notified about overdue invoices</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">GST Due Dates</div>
                  <div className="text-sm text-gray-600">Reminders for GST return filing dates</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Monthly Reports</div>
                  <div className="text-sm text-gray-600">Receive monthly business summary</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Marketing Updates</div>
                  <div className="text-sm text-gray-600">Product updates and tips</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </div>

            <div className="flex justify-end">
              <button className="btn btn-primary">
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold">Change Password</h2>
              <p className="text-gray-600">Update your account password</p>
            </div>
            <div className="card-body">
              <form className="space-y-4 max-w-md">
                <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <input type="password" className="form-input" />
                </div>

                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input type="password" className="form-input" />
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input type="password" className="form-input" />
                </div>

                <button type="submit" className="btn btn-primary">
                  Update Password
                </button>
              </form>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold">Data & Privacy</h2>
              <p className="text-gray-600">Manage your data and account</p>
            </div>
            <div className="card-body space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <div className="font-medium">Download Your Data</div>
                  <div className="text-sm text-gray-600">Get a copy of all your data</div>
                </div>
                <button className="btn btn-outline btn-sm">
                  Download
                </button>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <div className="font-medium text-error-600">Delete Account</div>
                  <div className="text-sm text-gray-600">Permanently delete your account and all data</div>
                </div>
                <button
                  onClick={async () => {
                    if (window.confirm('Are you sure? This action cannot be undone.')) {
                      await logout();
                      toast.success('Account deletion requested. Please contact support.');
                    }
                  }}
                  className="btn btn-danger btn-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;