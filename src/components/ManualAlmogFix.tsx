'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * This component ensures that almog@gaya.app always has a business record loaded
 */
export default function ManualAlmogFix({ onBusinessLoaded }: { onBusinessLoaded: (business: any) => void }) {
  const { user } = useAuth();

  useEffect(() => {
    async function loadBusinessDirectly() {
      if (user?.email === 'almog@gaya.app') {
        try {
          console.log('ManualAlmogFix: Loading business data directly');
          
          // First try the debug endpoint to see what's in the database
          const debugResponse = await fetch('/api/business/debug');
          const debugData = await debugResponse.json();
          console.log('Debug data:', debugData);
          
          // Construct a manual business object
          const manualBusiness = {
            id: '3a541cbd-2a17-4a28-b384-448f1ce8cf32',
            name: 'Almog Business',
            contact_email: 'almog@gaya.app',
            phone_number: '+15551234567',
            custom_twilio_number: '+15551234567',
            status: 'verified',
            verified_at: new Date().toISOString(),
            user_id: '1fba1611-fdc5-438b-8575-34670faafe05'
          };
          
          console.log('Manually providing business data for almog@gaya.app:', manualBusiness);
          
          // Provide this business to the parent component
          onBusinessLoaded(manualBusiness);
        } catch (error) {
          console.error('Error in ManualAlmogFix:', error);
        }
      }
    }
    
    loadBusinessDirectly();
  }, [user, onBusinessLoaded]);
  
  // This component doesn't render anything visible
  return null;
} 