'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FormInput } from '@/components/ui/form-input';
import { FormSelect } from '@/components/ui/form-select';
import { FormCheckboxGroup } from '@/components/ui/form-checkbox-group';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { timezones } from '@/utils/timezones';

const businessTypes = [
  { value: 'cooperative', label: 'Co-operative'},
  { value: 'corporation', label: 'Corporation' },
  { value: 'llc_and_sole_proprietorship', label: 'LLC and Sole Proprietorship' },
  { value: 'non_profit', label: 'Non-profit corporation' },
  { value: 'partnership', label: 'Partnership' },
];

const jobPositions = [
  { value: 'director', label: 'Director' },
  { value: 'gm', label: 'General Manager' },
  { value: 'vp', label: 'Vice President' },
  { value: 'ceo', label: 'CEO' },
  { value: 'cfo', label: 'CFO' },
  { value: 'general_counsel', label: 'General Counsel' },
];

const regions = [
  { value: 'africa', label: 'Africa' },
  { value: 'asia', label: 'Asia' },
  { value: 'europe', label: 'Europe' },
  { value: 'latin_america', label: 'Latin America' },
  { value: 'usa_canada', label: 'USA and Canada' },
];

interface ValidationErrors {
  [key: string]: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [formData, setFormData] = useState({
    // General Information
    businessName: '',
    legalName: '',
    businessEmail: '',
    businessPhone: '',
    businessWebsite: '',
    businessNiche: '',
    
    // Business Information
    businessType: '',
    ein: '',
    regions: [] as string[],
    
    // Business Address
    streetAddress: '',
    city: '',
    state: '',
    country: '',
    timezone: '',
    
    // Authorized Representative
    firstName: '',
    representativeEmail: '',
    jobPosition: '',
    phoneNumber: '',
  });

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: ValidationErrors = {};

    switch (step) {
      case 1:
        if (!formData.businessName.trim()) {
          newErrors.businessName = 'Business name is required';
        }
        if (!formData.legalName.trim()) {
          newErrors.legalName = 'Legal business name is required';
        }
        if (!formData.businessEmail.trim()) {
          newErrors.businessEmail = 'Business email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.businessEmail)) {
          newErrors.businessEmail = 'Please enter a valid email address';
        }
        if (!formData.businessPhone.trim()) {
          newErrors.businessPhone = 'Business phone is required';
        } else if (!/^\+?[\d\s-]{10,}$/.test(formData.businessPhone)) {
          newErrors.businessPhone = 'Please enter a valid phone number';
        }
        if (formData.businessWebsite && !/^https?:\/\/.+/.test(formData.businessWebsite)) {
          newErrors.businessWebsite = 'Please enter a valid website URL';
        }
        if (!formData.businessNiche.trim()) {
          newErrors.businessNiche = 'Business niche is required';
        }
        break;

      case 2:
        if (!formData.businessType) {
          newErrors.businessType = 'Business type is required';
        }
        if (!formData.ein.trim()) {
          newErrors.ein = 'EIN is required';
        } else if (!/^\d{2}-\d{7}$/.test(formData.ein)) {
          newErrors.ein = 'Please enter a valid EIN (format: XX-XXXXXXX)';
        }
        if (formData.regions.length === 0) {
          newErrors.regions = 'Please select at least one region';
        }
        break;

      case 3:
        if (!formData.streetAddress.trim()) {
          newErrors.streetAddress = 'Street address is required';
        }
        if (!formData.city.trim()) {
          newErrors.city = 'City is required';
        }
        if (!formData.state.trim()) {
          newErrors.state = 'State/Province/Region is required';
        }
        if (!formData.country.trim()) {
          newErrors.country = 'Country is required';
        }
        if (!formData.timezone) {
          newErrors.timezone = 'Timezone is required';
        }
        break;

      case 4:
        if (!formData.firstName.trim()) {
          newErrors.firstName = 'First name is required';
        }
        if (!formData.representativeEmail.trim()) {
          newErrors.representativeEmail = 'Representative email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.representativeEmail)) {
          newErrors.representativeEmail = 'Please enter a valid email address';
        }
        if (!formData.jobPosition) {
          newErrors.jobPosition = 'Job position is required';
        }
        if (!formData.phoneNumber.trim()) {
          newErrors.phoneNumber = 'Phone number is required';
        } else if (!/^\+?[\d\s-]{10,}$/.test(formData.phoneNumber)) {
          newErrors.phoneNumber = 'Please enter a valid phone number';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (validateStep(currentStep)) {
      try {
        setIsLoading(true);
        const response = await fetch('/api/stripe/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.businessEmail,
            isOnboarding: true,
            data: formData
          }),
        });

        const { url } = await response.json();
        
        if (url) {
          window.location.href = url;
        }
      } catch (error) {
        console.error('Error:', error);
        setErrors({ submit: 'Failed to process registration. Please try again.' });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">General Information</h2>
            <FormInput
              label="Friendly Business Name"
              value={formData.businessName}
              onChange={(e) => handleInputChange('businessName', e.target.value)}
              error={errors.businessName}
            />
            <FormInput
              label="Legal Business Name"
              value={formData.legalName}
              onChange={(e) => handleInputChange('legalName', e.target.value)}
              hint="Enter the exact legal business name, as registered with the EIN"
              showHint
              error={errors.legalName}
            />
            <FormInput
              label="Business Email"
              type="email"
              value={formData.businessEmail}
              onChange={(e) => handleInputChange('businessEmail', e.target.value)}
              error={errors.businessEmail}
            />
            <FormInput
              label="Business Phone"
              type="tel"
              value={formData.businessPhone}
              onChange={(e) => handleInputChange('businessPhone', e.target.value)}
              error={errors.businessPhone}
            />
            <FormInput
              label="Business Website"
              type="url"
              value={formData.businessWebsite}
              onChange={(e) => handleInputChange('businessWebsite', e.target.value)}
              error={errors.businessWebsite}
            />
            <FormInput
              label="Business Niche"
              value={formData.businessNiche}
              onChange={(e) => handleInputChange('businessNiche', e.target.value)}
              error={errors.businessNiche}
            />
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">Business Information</h2>
            <FormSelect
              label="Business Type"
              options={businessTypes}
              value={formData.businessType}
              onChange={(e) => handleInputChange('businessType', e.target.value)}
            />
            <FormInput
              label="Business Registration Number (EIN)"
              value={formData.ein}
              onChange={(e) => handleInputChange('ein', e.target.value)}
            />
            <FormCheckboxGroup
              label="Regions"
              options={regions}
              value={formData.regions}
              onChange={(value) => handleInputChange('regions', value)}
            />
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">Business Physical Address</h2>
            <FormInput
              label="Street Address"
              value={formData.streetAddress}
              onChange={(e) => handleInputChange('streetAddress', e.target.value)}
              hint="Enter the exact business address as it appears in the EIN listing"
              showHint
            />
            <FormInput
              label="City"
              value={formData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
            />
            <FormInput
              label="State/Prov/Region"
              value={formData.state}
              onChange={(e) => handleInputChange('state', e.target.value)}
            />
            <FormInput
              label="Country"
              value={formData.country}
              onChange={(e) => handleInputChange('country', e.target.value)}
            />
            <FormSelect
              label="Timezone"
              options={timezones}
              value={formData.timezone}
              onChange={(e) => handleInputChange('timezone', e.target.value)}
            />
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">Authorized Representative</h2>
            <FormInput
              label="First Name"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
            />
            <FormInput
              label="Representative Email"
              type="email"
              value={formData.representativeEmail}
              onChange={(e) => handleInputChange('representativeEmail', e.target.value)}
            />
            <FormSelect
              label="Job Position"
              options={jobPositions}
              value={formData.jobPosition}
              onChange={(e) => handleInputChange('jobPosition', e.target.value)}
            />
            <FormInput
              label="Phone Number (With Country Code)"
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <Card className="p-8">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`flex items-center ${
                      step !== 4 ? 'flex-1' : ''
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        currentStep >= step
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {step}
                    </div>
                    {step !== 4 && (
                      <div
                        className={`flex-1 h-1 mx-2 ${
                          currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {renderStep()}

            <div className="mt-8 flex justify-between">
              {currentStep > 1 && (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={isLoading}
                >
                  Back
                </Button>
              )}
              {currentStep < 4 ? (
                <Button
                  onClick={handleNext}
                  disabled={isLoading}
                  className="ml-auto"
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="ml-auto"
                >
                  {isLoading ? 'Processing...' : 'Complete Registration'}
                </Button>
              )}
            </div>
            {errors.submit && (
              <p className="mt-4 text-sm text-red-600 text-center">{errors.submit}</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
} 