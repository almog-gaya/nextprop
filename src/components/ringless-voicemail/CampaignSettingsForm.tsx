import { useState } from 'react';

interface CampaignSettings {
  delayMinutes: number;
  dailyLimit: number;
  startTime: string;
  endTime: string;
  timezone: string;
  maxPerHour: number;
  daysOfWeek: string[];
}

interface CampaignSettingsFormProps {
  settings: CampaignSettings;
  onSave: (settings: CampaignSettings) => void;
}

export default function CampaignSettingsForm({ settings, onSave }: CampaignSettingsFormProps) {
  const [delayMinutes, setDelayMinutes] = useState(settings.delayMinutes);
  const [dailyLimit, setDailyLimit] = useState(settings.dailyLimit);
  const [startTime, setStartTime] = useState(settings.startTime);
  const [endTime, setEndTime] = useState(settings.endTime);
  const [timezone, setTimezone] = useState(settings.timezone);
  const [maxPerHour, setMaxPerHour] = useState(settings.maxPerHour);
  const [daysOfWeek, setDaysOfWeek] = useState<string[]>(settings.daysOfWeek);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      delayMinutes,
      dailyLimit,
      startTime,
      endTime,
      timezone,
      maxPerHour,
      daysOfWeek
    });
  };
  
  const toggleDay = (day: string) => {
    setDaysOfWeek(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day) 
        : [...prev, day]
    );
  };
  
  const timeOptions = [
    '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', 
    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'
  ];
  
  const timezones = [
    'EST (New York)', 'CST (Chicago)', 'MST (Denver)', 
    'PST (Los Angeles)', 'AKST (Alaska)', 'HST (Hawaii)'
  ];
  
  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Delivery Timing Section */}
        <div className="bg-gray-50 rounded-md p-4 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-800 mb-3 border-b pb-2">Delivery Timing</h3>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                Start Time
              </label>
              <select
                id="startTime"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              >
                {timeOptions.map(time => (
                  <option key={`start-${time}`} value={time}>{time}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
                End Time
              </label>
              <select
                id="endTime"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              >
                {timeOptions.map(time => (
                  <option key={`end-${time}`} value={time}>{time}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
                Timezone
              </label>
              <select
                id="timezone"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              >
                {timezones.map(tz => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
           
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Days of Week
              </label>
              <div className="grid grid-cols-7 gap-1">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`py-1 px-1 text-xs font-medium rounded-md ${
                      daysOfWeek.includes(day)
                        ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Rate Limiting Section */}
        <div className="bg-gray-50 rounded-md p-4 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-800 mb-3 border-b pb-2">
            Rate Limiting 
            <span className="text-xs font-normal text-gray-500 ml-2">
              (Prevents spam detection)
            </span>
          </h3>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <label htmlFor="delayMinutes" className="block text-sm font-medium text-gray-700">
                Delay Between Calls
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
            </div>
            
            <div>
              <label htmlFor="dailyLimit" className="block text-sm font-medium text-gray-700">
                Daily Limit
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
                  <span className="text-gray-500 sm:text-sm">per day</span>
                </div>
              </div>
            </div>
        
            <div>
              <label htmlFor="maxPerHour" className="block text-sm font-medium text-gray-700">
                Hourly Maximum
              </label>
              <div className="mt-1 relative rounded-md">
                <input
                  type="number"
                  id="maxPerHour"
                  min="10"
                  max="500"
                  className="block w-full pr-16 sm:text-sm border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                  value={maxPerHour}
                  onChange={(e) => setMaxPerHour(parseInt(e.target.value, 10))}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">per hour</span>
                </div>
              </div>
            </div>
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