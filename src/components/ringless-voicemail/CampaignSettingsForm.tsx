import { useState } from 'react';

interface CampaignSettingsFormProps {
  settings: {
    delayMinutes: number;
    dailyLimit: number;
  };
  onSave: (settings: { delayMinutes: number; dailyLimit: number }) => void;
}

export default function CampaignSettingsForm({ settings, onSave }: CampaignSettingsFormProps) {
  const [delayMinutes, setDelayMinutes] = useState(settings.delayMinutes);
  const [dailyLimit, setDailyLimit] = useState(settings.dailyLimit);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      delayMinutes,
      dailyLimit
    });
  };
  
  return (
    <div className="mt-5">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="delayMinutes" className="block text-sm font-medium text-gray-700">
              Delay Between Voicemails
            </label>
            <div className="mt-1 relative rounded-md">
              <input
                type="number"
                id="delayMinutes"
                min="1"
                max="60"
                className="block w-full pr-16 sm:text-sm border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                value={delayMinutes}
                onChange={(e) => setDelayMinutes(parseInt(e.target.value, 10))}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-gray-500 sm:text-sm">minutes</span>
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Space out your voicemails to avoid carrier spam detection
            </p>
          </div>
          
          <div>
            <label htmlFor="dailyLimit" className="block text-sm font-medium text-gray-700">
              Daily Sending Limit
            </label>
            <div className="mt-1 relative rounded-md">
              <input
                type="number"
                id="dailyLimit"
                min="1"
                max="500"
                className="block w-full pr-16 sm:text-sm border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(parseInt(e.target.value, 10))}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-gray-500 sm:text-sm">voicemails</span>
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Limit how many voicemails are sent each day
            </p>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
} 