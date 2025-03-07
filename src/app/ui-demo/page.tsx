'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ResponsiveContainer from '@/components/ui/ResponsiveContainer';
import ResponsiveGrid from '@/components/ui/ResponsiveGrid';
import FormInput from '@/components/ui/FormInput';
import EnhancedButton from '@/components/ui/EnhancedButton';
import { useNotifications } from '@/components/ui/NotificationSystem';
import { useModal } from '@/components/ui/ModalManager';
import DataTable from '@/components/ui/DataTable';
import { 
  emailValidator, 
  phoneValidator, 
  nameValidator, 
  validateForm 
} from '@/utils/validation';
import {
  EnvelopeIcon,
  PhoneIcon,
  UserIcon,
  BriefcaseIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

// Mock data for the data table
const MOCK_USERS = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'Active' },
  { id: 3, name: 'Mike Johnson', email: 'mike@example.com', role: 'User', status: 'Inactive' },
  { id: 4, name: 'Sarah Williams', email: 'sarah@example.com', role: 'Editor', status: 'Active' },
  { id: 5, name: 'Alex Brown', email: 'alex@example.com', role: 'User', status: 'Active' },
  { id: 6, name: 'Emily Davis', email: 'emily@example.com', role: 'Admin', status: 'Active' },
  { id: 7, name: 'Chris Wilson', email: 'chris@example.com', role: 'User', status: 'Inactive' },
  { id: 8, name: 'Jessica Taylor', email: 'jessica@example.com', role: 'Editor', status: 'Active' },
  { id: 9, name: 'David Miller', email: 'david@example.com', role: 'User', status: 'Active' },
  { id: 10, name: 'Amanda Martinez', email: 'amanda@example.com', role: 'User', status: 'Active' },
  { id: 11, name: 'Ryan Thomas', email: 'ryan@example.com', role: 'Editor', status: 'Inactive' },
  { id: 12, name: 'Lauren Garcia', email: 'lauren@example.com', role: 'Admin', status: 'Active' },
];

export default function UIDemo() {
  // Form state
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: ''
  });
  
  const [formValidation, setFormValidation] = useState({
    name: true,
    email: true,
    phone: true,
    company: true,
    message: true
  });
  
  // Demo state
  const [isLoading, setIsLoading] = useState(false);
  
  // Notification system
  const notifications = useNotifications();
  
  // Modal system
  const modal = useModal();
  
  // Handle form input change
  const handleInputChange = (value: string, name: string, isValid: boolean) => {
    setFormState(prev => ({ ...prev, [name]: value }));
    setFormValidation(prev => ({ ...prev, [name]: isValid }));
  };
  
  // Submit the form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const validationRules = {
      name: nameValidator,
      email: emailValidator,
      phone: phoneValidator
    };
    
    const { isValid, errors } = validateForm(formState, validationRules);
    
    if (!isValid) {
      notifications.error('Please fix the form errors before submitting.');
      return;
    }
    
    // Simulate loading
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      notifications.success('Demo form submitted successfully!');
      
      // Reset form
      setFormState({
        name: '',
        email: '',
        phone: '',
        company: '',
        message: ''
      });
    }, 1500);
  };
  
  // Show a confirmation modal
  const showConfirmationModal = () => {
    modal.openModal('confirm-action', {
      title: 'Confirm Action',
      children: (
        <div>
          <p className="mb-4">Are you sure you want to perform this action? This cannot be undone.</p>
        </div>
      ),
      footer: (
        <div className="flex justify-end space-x-3">
          <EnhancedButton 
            variant="ghost" 
            onClick={() => modal.closeModal('confirm-action')}
          >
            Cancel
          </EnhancedButton>
          <EnhancedButton 
            variant="danger" 
            onClick={() => {
              modal.closeModal('confirm-action');
              notifications.success('Action confirmed!');
            }}
          >
            Confirm
          </EnhancedButton>
        </div>
      ),
      size: 'md',
    });
  };
  
  // Show a form modal
  const showFormModal = () => {
    modal.openModal('form-modal', {
      title: 'Add New User',
      children: (
        <div className="space-y-4">
          <FormInput
            label="Full Name"
            name="modal-name"
            type="text"
            value={formState.name}
            onChange={handleInputChange}
            placeholder="John Doe"
            required
            validator={nameValidator}
          />
          
          <FormInput
            label="Email Address"
            name="modal-email"
            type="email"
            value={formState.email}
            onChange={handleInputChange}
            placeholder="john@example.com"
            required
            validator={emailValidator}
          />
          
          <FormInput
            label="Phone Number"
            name="modal-phone"
            type="tel"
            value={formState.phone}
            onChange={handleInputChange}
            placeholder="(123) 456-7890"
            validator={phoneValidator}
          />
        </div>
      ),
      footer: (
        <div className="flex justify-end space-x-3">
          <EnhancedButton 
            variant="ghost" 
            onClick={() => modal.closeModal('form-modal')}
          >
            Cancel
          </EnhancedButton>
          <EnhancedButton 
            variant="primary" 
            onClick={() => {
              modal.closeModal('form-modal');
              notifications.success('User added successfully!');
            }}
          >
            Save User
          </EnhancedButton>
        </div>
      ),
      size: 'lg',
    });
  };
  
  // Show a custom modal
  const showCustomModal = () => {
    modal.openModal('custom-modal', {
      children: (
        <div className="p-6 text-center">
          <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center rounded-full bg-primary-100">
            <CheckCircleIcon className="h-12 w-12 text-primary-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Operation Successful!</h3>
          <p className="text-gray-600 mb-6">
            Your operation has been completed successfully. You can now continue working with the system.
          </p>
          <EnhancedButton 
            onClick={() => modal.closeModal('custom-modal')}
            fullWidth
          >
            Got it, thanks!
          </EnhancedButton>
        </div>
      ),
      showCloseButton: false,
      size: 'sm',
      contentClassName: 'rounded-xl',
    });
  };
  
  // Data table columns
  const tableColumns = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (user: any) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          user.status === 'Active' 
            ? 'bg-success-100 text-success-800' 
            : 'bg-neutral-100 text-neutral-800'
        }`}>
          {user.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right' as const,
      render: (user: any) => (
        <div className="flex justify-end space-x-2">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              notifications.info(`Editing user: ${user.name}`);
            }}
            className="text-neutral-500 hover:text-neutral-700"
            aria-label="Edit"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              showConfirmationModal();
            }}
            className="text-error-500 hover:text-error-700"
            aria-label="Delete"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      ),
    },
  ];
  
  return (
    <DashboardLayout title="UI Components Demo">
      <ResponsiveContainer maxWidth="2xl" className="mx-auto">
        {/* Header */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <h1 className="text-2xl font-bold mb-2">UI Components Demo</h1>
          <p className="text-gray-600">
            This page showcases the new UI components created for NextProp.
          </p>
        </div>
        
        {/* Buttons Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <h2 className="text-xl font-semibold mb-4">Button Variants</h2>
          <ResponsiveGrid
            columns={{ default: 1, sm: 2, md: 3, lg: 4 }}
            gap="md"
            className="mb-8"
          >
            <div className="flex flex-col space-y-2">
              <p className="text-sm font-medium mb-2">Primary</p>
              <EnhancedButton variant="primary">Primary Button</EnhancedButton>
            </div>
            
            <div className="flex flex-col space-y-2">
              <p className="text-sm font-medium mb-2">Secondary</p>
              <EnhancedButton variant="secondary">Secondary Button</EnhancedButton>
            </div>
            
            <div className="flex flex-col space-y-2">
              <p className="text-sm font-medium mb-2">Outline</p>
              <EnhancedButton variant="outline">Outline Button</EnhancedButton>
            </div>
            
            <div className="flex flex-col space-y-2">
              <p className="text-sm font-medium mb-2">Ghost</p>
              <EnhancedButton variant="ghost">Ghost Button</EnhancedButton>
            </div>
            
            <div className="flex flex-col space-y-2">
              <p className="text-sm font-medium mb-2">Warning</p>
              <EnhancedButton variant="warning">Warning Button</EnhancedButton>
            </div>
            
            <div className="flex flex-col space-y-2">
              <p className="text-sm font-medium mb-2">Danger</p>
              <EnhancedButton variant="danger">Danger Button</EnhancedButton>
            </div>
            
            <div className="flex flex-col space-y-2">
              <p className="text-sm font-medium mb-2">Success</p>
              <EnhancedButton variant="success">Success Button</EnhancedButton>
            </div>
            
            <div className="flex flex-col space-y-2">
              <p className="text-sm font-medium mb-2">Link</p>
              <EnhancedButton variant="link">Link Button</EnhancedButton>
            </div>
          </ResponsiveGrid>
          
          <h2 className="text-xl font-semibold mb-4">Button Sizes</h2>
          <div className="flex flex-wrap items-center gap-4 mb-8">
            <EnhancedButton size="xs">XSmall</EnhancedButton>
            <EnhancedButton size="sm">Small</EnhancedButton>
            <EnhancedButton size="md">Medium</EnhancedButton>
            <EnhancedButton size="lg">Large</EnhancedButton>
            <EnhancedButton size="xl">XLarge</EnhancedButton>
          </div>
          
          <h2 className="text-xl font-semibold mb-4">Button Features</h2>
          <ResponsiveGrid
            columns={{ default: 1, sm: 2, md: 3 }}
            gap="md"
          >
            <EnhancedButton loading>Loading Button</EnhancedButton>
            <EnhancedButton disabled>Disabled Button</EnhancedButton>
            <EnhancedButton fullWidth>Full Width Button</EnhancedButton>
            <EnhancedButton leftIcon={<CheckCircleIcon className="h-5 w-5" />}>
              With Left Icon
            </EnhancedButton>
            <EnhancedButton rightIcon={<ArrowRightIcon className="h-5 w-5" />}>
              With Right Icon
            </EnhancedButton>
            <EnhancedButton 
              leftIcon={<CheckCircleIcon className="h-5 w-5" />}
              rightIcon={<ArrowRightIcon className="h-5 w-5" />}
            >
              Both Icons
            </EnhancedButton>
          </ResponsiveGrid>
        </div>
        
        {/* Modal Demo Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <h2 className="text-xl font-semibold mb-4">Modal System</h2>
          
          <ResponsiveGrid
            columns={{ default: 1, sm: 3 }}
            gap="md"
          >
            <EnhancedButton
              variant="primary"
              leftIcon={<InformationCircleIcon className="h-5 w-5" />}
              onClick={showConfirmationModal}
              fullWidth
            >
              Confirmation Modal
            </EnhancedButton>
            
            <EnhancedButton
              variant="secondary"
              leftIcon={<UserIcon className="h-5 w-5" />}
              onClick={showFormModal}
              fullWidth
            >
              Form Modal
            </EnhancedButton>
            
            <EnhancedButton
              variant="outline"
              leftIcon={<CheckCircleIcon className="h-5 w-5" />}
              onClick={showCustomModal}
              fullWidth
            >
              Custom Modal
            </EnhancedButton>
          </ResponsiveGrid>
        </div>
        
        {/* Data Table Demo */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <h2 className="text-xl font-semibold mb-4">Data Table</h2>
          
          <DataTable
            data={MOCK_USERS}
            columns={tableColumns}
            keyField="id"
            title="Users"
            subtitle="Manage system users"
            onRowClick={(user) => {
              notifications.info(`Selected user: ${user.name}`);
            }}
            pagination={true}
            pageSize={5}
            actions={
              <EnhancedButton
                variant="primary"
                size="sm"
                leftIcon={<UserIcon className="h-4 w-4" />}
                onClick={showFormModal}
              >
                Add User
              </EnhancedButton>
            }
          />
        </div>
        
        {/* Form Inputs Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <h2 className="text-xl font-semibold mb-4">Form Inputs</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <ResponsiveGrid
              columns={{ default: 1, md: 2 }}
              gap="md"
            >
              <FormInput
                label="Full Name"
                name="name"
                type="text"
                value={formState.name}
                onChange={handleInputChange}
                placeholder="John Doe"
                required
                validator={nameValidator}
                iconLeft={<UserIcon className="h-5 w-5 text-gray-400" />}
              />
              
              <FormInput
                label="Email Address"
                name="email"
                type="email"
                value={formState.email}
                onChange={handleInputChange}
                placeholder="john@example.com"
                required
                validator={emailValidator}
                iconLeft={<EnvelopeIcon className="h-5 w-5 text-gray-400" />}
              />
              
              <FormInput
                label="Phone Number"
                name="phone"
                type="tel"
                value={formState.phone}
                onChange={handleInputChange}
                placeholder="(123) 456-7890"
                validator={phoneValidator}
                iconLeft={<PhoneIcon className="h-5 w-5 text-gray-400" />}
              />
              
              <FormInput
                label="Company"
                name="company"
                type="text"
                value={formState.company}
                onChange={handleInputChange}
                placeholder="Acme Inc."
                helperText="Optional: Enter your company name"
                iconLeft={<BriefcaseIcon className="h-5 w-5 text-gray-400" />}
              />
            </ResponsiveGrid>
            
            <FormInput
              label="Message"
              name="message"
              type="textarea"
              value={formState.message}
              onChange={handleInputChange}
              placeholder="Enter your message here..."
              rows={4}
              maxLength={500}
            />
            
            <div className="flex justify-end space-x-3 pt-4">
              <EnhancedButton variant="ghost" type="button">
                Cancel
              </EnhancedButton>
              <EnhancedButton
                variant="primary"
                type="submit"
                loading={isLoading}
              >
                Submit Form
              </EnhancedButton>
            </div>
          </form>
        </div>
        
        {/* Notification Demo Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <h2 className="text-xl font-semibold mb-4">Notification System</h2>
          
          <ResponsiveGrid
            columns={{ default: 1, sm: 2, md: 4 }}
            gap="md"
          >
            <EnhancedButton 
              variant="success"
              leftIcon={<CheckCircleIcon className="h-5 w-5" />}
              onClick={() => notifications.success('This is a success notification!')}
              fullWidth
            >
              Success
            </EnhancedButton>
            
            <EnhancedButton
              variant="danger"
              leftIcon={<XCircleIcon className="h-5 w-5" />}
              onClick={() => notifications.error('This is an error notification!')}
              fullWidth
            >
              Error
            </EnhancedButton>
            
            <EnhancedButton
              variant="warning"
              leftIcon={<ExclamationTriangleIcon className="h-5 w-5" />}
              onClick={() => notifications.warning('This is a warning notification!')}
              fullWidth
            >
              Warning
            </EnhancedButton>
            
            <EnhancedButton
              variant="outline"
              leftIcon={<InformationCircleIcon className="h-5 w-5" />}
              onClick={() => notifications.info('This is an info notification!')}
              fullWidth
            >
              Info
            </EnhancedButton>
            
            <EnhancedButton
              variant="primary"
              onClick={() => notifications.success('This notification will stay until dismissed.', { 
                duration: 0,
                dismissible: true 
              })}
              fullWidth
            >
              Persistent Notification
            </EnhancedButton>
            
            <EnhancedButton
              variant="secondary"
              onClick={() => notifications.info('This notification will auto-dismiss in 10 seconds.', { 
                duration: 10000 
              })}
              fullWidth
            >
              Long Duration (10s)
            </EnhancedButton>
          </ResponsiveGrid>
        </div>
      </ResponsiveContainer>
    </DashboardLayout>
  );
} 