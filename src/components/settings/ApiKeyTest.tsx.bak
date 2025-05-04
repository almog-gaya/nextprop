"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface ApiKeyTestProps {
  apiKey: string;
}

export default function ApiKeyTest({ apiKey }: ApiKeyTestProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testApiKey = async () => {
    if (!apiKey) {
      setError("Please enter an API key first");
      return;
    }

    setIsLoading(true);
    setError(null);
    setTestResults(null);

    try {
      // Call our test API endpoint
      const response = await fetch(`/api/test-ghl?apiKey=${encodeURIComponent(apiKey)}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to test API key');
      }
      
      setTestResults(data.results);
    } catch (err) {
      console.error('Error testing API key:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while testing the API key');
    } finally {
      setIsLoading(false);
    }
  };

  const getSuccessCount = () => {
    if (!testResults) return 0;
    return Object.values(testResults).filter((result: any) => result.success).length;
  };

  return (
    <div className="space-y-4">
      <Button 
        onClick={testApiKey} 
        disabled={isLoading || !apiKey}
        variant="secondary"
      >
        {isLoading ? 'Testing...' : 'Test API Connection'}
      </Button>

      {error && (
        <div className="flex items-start gap-2 text-red-500 bg-red-50 p-2 rounded-md">
          <AlertCircle className="h-5 w-5 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {testResults && (
        <div className="rounded-md border p-4">
          <h4 className="font-medium mb-2">API Test Results</h4>
          <p className="mb-3">
            {getSuccessCount()} of {Object.keys(testResults).length} endpoints successful
          </p>
          <div className="space-y-2">
            {Object.entries(testResults).map(([endpoint, result]: [string, any]) => (
              <div key={endpoint} className="text-sm">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${result.success ? 'bg-green-500' : 'bg-red-500'}`} />
                  <strong>{endpoint}</strong>
                  <span className={`text-xs ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                    {result.status || 'N/A'}
                  </span>
                </div>
                {!result.success && (
                  <div className="ml-4 text-xs text-red-500">
                    {result.error || 'Unknown error'}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 