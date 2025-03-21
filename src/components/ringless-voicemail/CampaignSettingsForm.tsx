import { useEffect, useState } from 'react';

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
  const [formSettings, setFormSettings] = useState<CampaignSettings>({
    ...settings,
    daysOfWeek: [...settings.daysOfWeek]
  });

  const timeOptions = [
    '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM',
    '7:00 PM', '8:00 PM', '9:00 PM'
  ];

  const timezoneOptions = [
    { value: "America/New_York", label: "EST (New York)" },
    { value: "America/Chicago", label: "CST (Chicago)" },
    { value: "America/Denver", label: "MST (Denver)" },
    { value: "America/Los_Angeles", label: "PST (Los Angeles)" },
    { value: "America/Anchorage", label: "AKST (Alaska)" },
    { value: "Pacific/Honolulu", label: "HST (Hawaii)" }
  ];

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // useEffect(()=>{
  //   console.log(`formSettings: ${JSON.stringify(formSettings)}`)
  // })
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formSettings);
  };

  const handleInputChange = (field: keyof CampaignSettings, value: string | number | string[]) => {
    setFormSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleDay = (day: string) => {
    setFormSettings(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day]
    }));
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="px-4 py-5 sm:p-6">
          <div className="bg-white p-4 rounded-md border border-gray-200">
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="w-full sm:w-auto">
                <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                <select
                  className="block w-full sm:text-sm border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                  value={formSettings.startTime}
                  onChange={(e) => handleInputChange('startTime', e.target.value)}
                >
                  {timeOptions.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>

              <div className="w-full sm:w-auto">
                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                <select
                  className="block w-full sm:text-sm border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                  value={formSettings.endTime}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                >
                  {timeOptions.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>

              <div className="w-full sm:w-auto">
                <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                <select
                  className="block w-full sm:text-sm border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                  value={formSettings.timezone}
                  onChange={(e) => handleInputChange('timezone', e.target.value)}
                >
                  {timezoneOptions.map(tz => (
                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Max voicemails per hour slider */}
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Max ringless voicemails per hour</h4>
              <div className="relative">
                <input
                  type="range"
                  min="10"
                  max="500"
                  step="10"
                  value={formSettings.maxPerHour}
                  onChange={(e) => handleInputChange('maxPerHour', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <div className="flex justify-between text-sm text-gray-600 mt-2">
                  <span>100</span>
                  <span>200</span>
                  <span>300</span>
                  <span>400</span>
                  <span>500</span>
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <input
                  type="number"
                  min="10"
                  max="1000"
                  value={formSettings.maxPerHour}
                  onChange={(e) => handleInputChange('maxPerHour', parseInt(e.target.value) || 10)}
                  className="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-32 sm:text-sm border-gray-300 rounded-md"
                />
                <span className="ml-3 text-sm text-purple-500 font-medium">MAX</span>
                <span className="ml-auto text-sm text-gray-600">RVMs per hour</span>
              </div>
            </div>

            {/* Days of Week Selection */}
            <div className="mb-6">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Select Schedule</h5>
              <div className="flex flex-wrap gap-2">
                {days.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`py-2 px-4 rounded-md ${
                      formSettings.daysOfWeek.includes(day)
                        ? "bg-purple-100 text-purple-700 border border-purple-200"
                        : "bg-white text-gray-700 border border-gray-300"
                    }`}
                  >
                    {day}
                  </button>
                ))}
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