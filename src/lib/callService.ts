import axios from 'axios';
import { CallData } from '@/components/AutomatedCallForm';
import { CallLog } from '@/components/CallLogsList';
import { v4 as uuidv4 } from 'uuid';

const WEBHOOK_URL = 'https://hook.us1.make.com/583um32gf4oqi41n0jxc6k29re7x9d33';

// In-memory storage for call logs - in a real app, this would be a database
const callLogs: CallLog[] = [];

/**
 * Make an automated call using the Make.com webhook
 */
export async function makeAutomatedCall(callData: CallData): Promise<CallLog> {
  try {
    // Create a new call log entry with pending status
    const callId = uuidv4();
    const newCallLog: CallLog = {
      id: callId,
      timestamp: new Date().toISOString(),
      recipient: {
        name: callData.first_name,
        company: 'Not Specified', // Default value since we removed company_name
        phone: callData.phone,
        address: callData.full_address
      },
      status: 'pending'
    };
    
    // Add to call logs
    callLogs.unshift(newCallLog);
    
    // Make the webhook call
    const response = await axios.post(WEBHOOK_URL, {
      first_name: callData.first_name,
      // We're still sending company_name to the webhook, but with a default value
      company_name: 'Not Specified',
      phone: callData.phone,
      full_address: callData.full_address
    });
    
    // Update call log based on response
    const updatedCallLog: CallLog = {
      ...newCallLog,
      status: response.status === 200 ? 'completed' : 'failed',
      callSid: response.data?.callSid || undefined,
      duration: response.data?.duration || undefined
    };
    
    // Update the call log in our "database"
    const index = callLogs.findIndex(log => log.id === callId);
    if (index !== -1) {
      callLogs[index] = updatedCallLog;
    }
    
    return updatedCallLog;
  } catch (error) {
    console.error('Error making automated call:', error);
    
    // Create a failed call log
    const failedCallLog: CallLog = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      recipient: {
        name: callData.first_name,
        company: 'Not Specified',
        phone: callData.phone,
        address: callData.full_address
      },
      status: 'failed'
    };
    
    // Add to call logs
    callLogs.unshift(failedCallLog);
    
    return failedCallLog;
  }
}

/**
 * Get call logs with pagination
 */
export function getCallLogs(page = 1, limit = 10): { calls: CallLog[], total: number } {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedLogs = callLogs.slice(startIndex, endIndex);
  
  return {
    calls: paginatedLogs,
    total: callLogs.length
  };
}

/**
 * Get recent call logs
 */
export function getRecentCallLogs(limit = 5): CallLog[] {
  return callLogs.slice(0, limit);
}

// Sample data for development
if (process.env.NODE_ENV === 'development') {
  // Add some sample calls for development purposes
  const sampleData = [
    {
      id: uuidv4(),
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
      recipient: {
        name: 'John Smith',
        company: 'Acme Real Estate',
        phone: '+11234567890',
        address: '123 Main St, San Francisco, CA 94105'
      },
      status: 'completed' as const,
      duration: 125, // 2:05
      callSid: 'CA123456789012345678901234567890'
    },
    {
      id: uuidv4(),
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      recipient: {
        name: 'Sarah Johnson',
        company: 'Sunshine Properties',
        phone: '+10987654321',
        address: '456 Oak Ave, Los Angeles, CA 90001'
      },
      status: 'completed' as const,
      duration: 90, // 1:30
      callSid: 'CA098765432109876543210987654321'
    },
    {
      id: uuidv4(),
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      recipient: {
        name: 'Michael Brown',
        company: 'Brown Investments',
        phone: '+15551234567',
        address: '789 Pine Blvd, New York, NY 10001'
      },
      status: 'failed' as const
    }
  ];
  
  sampleData.forEach(call => callLogs.push(call));
} 