"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    companyId: 'c19vX1spjlLJWQKMUWVD',
    address: '',
    city: '',
    state: '',
    country: 'US',
    postalCode: '',
    website: '',
    timezone: 'US/Central',
    prospectInfo: {
      firstName: '',
      lastName: '',
      email: ''
    }
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' });
  const router = useRouter();
 
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name) newErrors.name = 'Sub-account name is required';
    if (!formData.companyId) newErrors.companyId = 'Company ID is required';
    if (!formData.prospectInfo.firstName) newErrors.firstName = 'First name is required';
    if (!formData.prospectInfo.lastName) newErrors.lastName = 'Last name is required';
    if (!formData.prospectInfo.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.prospectInfo.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (formData.phone && !/^\+\d{10,15}$/.test(formData.phone)) {
      newErrors.phone = 'Phone must be in format +1234567890';
    }
    if (formData.website && !/^https?:\/\/[^\s/$.?#].[^\s]*$/.test(formData.website)) {
      newErrors.website = 'Invalid URL format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('prospectInfo.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        prospectInfo: { ...prev.prospectInfo, [field]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    // Clear error when user starts typing
    if (errors[name.split('.')[1] || name]) {
      setErrors(prev => ({ ...prev, [name.split('.')[1] || name]: '' }));
    }
  };
  const getCookieValue = (name: string): string | null => {
    if (typeof window === 'undefined') {
      console.log(`getCookieValue: Cannot access cookies, running on server`);
      return null;
    }
  
    const cookies = document.cookie.split(';').map(c => c.trim());
    console.log(`getCookieValue: Looking for ${name} in cookies:`, cookies);
    
    const cookie = cookies.find(c => c.startsWith(`${name}=`));
    if (cookie) {
      const value = cookie.split('=')[1];
      console.log(`getCookieValue: Found ${name}=${value}`);
      return value;
    }
    
    console.log(`getCookieValue: ${name} not found`);
    return null;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitStatus({ type: '', message: '' });

    try {
      const token = await getCookieValue('ghl_access_token');
      console.log(`JWT: ${token}`)
      const response = await fetch('https://services.leadconnectorhq.com/locations/', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token!,
          'Version': '2021-07-28',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create sub-account');
      }

      setSubmitStatus({ 
        type: 'success', 
        message: 'Sub-account created successfully! Redirecting...' 
      });
      
      setTimeout(() => {
        router.push('/');
      }, 1500);

    } catch (err) {
      setSubmitStatus({ 
        type: 'error', 
        message: err.message || 'An error occurred while creating the sub-account' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8 transform transition-all hover:shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Create New Sub-Account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Set up your new location |{' '}
            <Link href="/auth/login" className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
              Sign in instead
            </Link>
          </p>
        </div>

        {submitStatus.message && (
          <div className={`p-4 rounded-lg mb-6 ${
            submitStatus.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {submitStatus.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Business Details */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Business Details</h3>
              <InputField
                label="Sub-Account Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
                required
              />
              <InputField
                label="Phone Number"
                name="phone"
                type="tel"
                placeholder="+1410039940"
                value={formData.phone}
                onChange={handleChange}
                error={errors.phone}
              />
              <InputField
                label="Company ID"
                name="companyId"
                value={formData.companyId}
                onChange={handleChange}
                error={errors.companyId}
                required
              />
            </div>

            {/* Prospect Details */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Prospect Details</h3>
              <InputField
                label="First Name"
                name="prospectInfo.firstName"
                value={formData.prospectInfo.firstName}
                onChange={handleChange}
                error={errors.firstName}
                required
              />
              <InputField
                label="Last Name"
                name="prospectInfo.lastName"
                value={formData.prospectInfo.lastName}
                onChange={handleChange}
                error={errors.lastName}
                required
              />
              <InputField
                label="Email"
                name="prospectInfo.email"
                type="email"
                value={formData.prospectInfo.email}
                onChange={handleChange}
                error={errors.email}
                required
              />
            </div>
          </div>

          {/* Location Details */}
          <div className="space-y-6 pt-6 border-t border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Location Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleChange}
              />
              <InputField
                label="City"
                name="city"
                value={formData.city}
                onChange={handleChange}
              />
              <InputField
                label="State"
                name="state"
                value={formData.state}
                onChange={handleChange}
              />
              <SelectField
                label="Country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                options={[
                  { value: 'US', label: 'United States' },
                  { value: 'CA', label: 'Canada' },
                  // Add more countries as needed
                ]}
              />
              <InputField
                label="Postal Code"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
              />
              <InputField
                label="Website"
                name="website"
                type="url"
                placeholder="https://example.com"
                value={formData.website}
                onChange={handleChange}
                error={errors.website}
              />
              <SelectField
                label="Timezone"
                name="timezone"
                value={formData.timezone}
                onChange={handleChange}
                options={[
                  { value: 'US/Central', label: 'US/Central' },
                  { value: 'US/Eastern', label: 'US/Eastern' },
                  { value: 'US/Pacific', label: 'US/Pacific' },
                  // Add more timezones as needed
                ]}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
          >
            {isSubmitting && (
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            <span>{isSubmitting ? 'Creating...' : 'Create Sub-Account'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

// Reusable Input Component
const InputField = ({ label, name, type = 'text', value, onChange, error, required, placeholder }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      id={name}
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className={`w-full px-4 py-2 border ${
        error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
      } rounded-lg focus:outline-none focus:ring-2 transition-colors`}
    />
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
);

// Reusable Select Component
const SelectField = ({ label, name, value, onChange, options }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <select
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
    >
      {options.map(option => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  </div>
);