import axios from 'axios';
import { CallData } from '@/components/AutomatedCallForm';
import { CallLog } from '@/components/CallLogsList';
import { v4 as uuidv4 } from 'uuid';

// In-memory storage for call logs - in a real app, this would be a database
const callLogs: CallLog[] = [];

/**
 * Make an automated call using the VoiceDrop API via our server-side API route
 * 
 * This function sends a request to our internal API route which then:
 * 1. Makes a request to the VoiceDrop API
 * 2. Includes a webhook URL to receive status updates
 * 3. View webhook responses at /webhooks
 */
export async function makeAutomatedCall(callData: CallData): Promise<CallLog> {
  try {
    console.log('Making automated call using VoiceDrop API');
    
    // Create a new call log entry with pending status
    const callId = uuidv4();
    const newCallLog: CallLog = {
      id: callId,
      timestamp: new Date().toISOString(),
      recipient: {
        name: callData.first_name,
        company: 'Not Specified', 
        phone: callData.phone,
        address: callData.street_name
      },
      status: 'pending'
    };
    
    // Add to call logs
    callLogs.unshift(newCallLog);
    
    // Use the user-provided script
    const message = callData.script;
    
    // Request payload for our server-side API
    const payload = {
      message,
      phone: callData.phone,
      first_name: callData.first_name,
      street_name: callData.street_name
    };
    
    console.log('Sending request to server-side API:', payload);
    
    // Send request to our server-side API route which will handle the VoiceDrop call
    const response = await axios.post('/api/voicemail', payload);
    
    console.log('Server API response:', response.data);
    
    // Check for success response
    if (response.data.status === 'success') {
      // Update call log with completed status
      const updatedCallLog: CallLog = {
        ...newCallLog,
        status: 'completed',
        callSid: `VD-${callId}`, // Create a placeholder ID since VoiceDrop doesn't return an ID in the immediate response
        message: `${response.data.message} View updates at /webhooks`
      };
      
      // Update the call log in our "database"
      const index = callLogs.findIndex(log => log.id === callId);
      if (index !== -1) {
        callLogs[index] = updatedCallLog;
      }
      
      return updatedCallLog;
    } else {
      // Handle non-success response
      throw new Error(response.data.message || 'Failed to send voicemail');
    }
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
        address: callData.street_name
      },
      status: 'failed',
      message: error instanceof Error ? error.message : 'Unknown error'
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
        address: 'Main Street'
      },
      status: 'completed' as const,
      duration: 125, // 2:05
      callSid: 'VD123456789012345678901234567890'
    },
    {
      id: uuidv4(),
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      recipient: {
        name: 'Sarah Johnson',
        company: 'Sunshine Properties',
        phone: '+10987654321',
        address: 'Oak Avenue'
      },
      status: 'completed' as const,
      duration: 90, // 1:30
      callSid: 'VD098765432109876543210987654321'
    },
    {
      id: uuidv4(),
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      recipient: {
        name: 'Michael Brown',
        company: 'Brown Investments',
        phone: '+15551234567',
        address: 'Pine Boulevard'
      },
      status: 'failed' as const
    }
  ];
  
  sampleData.forEach(call => callLogs.push(call));
} 