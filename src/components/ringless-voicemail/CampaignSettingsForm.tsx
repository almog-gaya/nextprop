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
  isVoiceMailModule: boolean;
  isAutomationsModule: boolean;
  onSave: (settings: CampaignSettings) => void;
}

export default function CampaignSettingsForm({ settings, isVoiceMailModule, isAutomationsModule, onSave }: CampaignSettingsFormProps) {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formSettings);
  };

  const handleInputChange = (field: keyof CampaignSettings, value: string | number | string[]) => {
    setFormSettings(prev => ({ ...prev, [field]: value }));
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
    <div className="max-w-2xl mx-auto p-6">
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Campaign Schedule Settings</h3>

          {/* Time Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
            <div className='border border-gray-300 rounded-md'>
            <select
                className="w-full p-2 rounded-md focus:ring-purple-500 focus:border-purple-500"
                value={formSettings.startTime}
                onChange={(e) => handleInputChange('startTime', e.target.value)}
              >
                {timeOptions.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
              <div className='border border-gray-300 rounded-md'>
              <select
                className="w-full p-2 rounded-md focus:ring-purple-500 focus:border-purple-500"
                value={formSettings.endTime}
                onChange={(e) => handleInputChange('endTime', e.target.value)}
              >
                {timeOptions.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
             <div className='border border-gray-300 rounded-md '>
             <select
                className="w-full p-2  rounded-md focus:ring-purple-500 focus:border-purple-500"
                value={formSettings.timezone}
                onChange={(e) => handleInputChange('timezone', e.target.value)}
              >
                {timezoneOptions.map(tz => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
             </div>
            </div>
          </div>

          {/* Max Per Hour */}
          {isVoiceMailModule && <div className="border-t border-gray-200 pt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-4">Max Ringless Voicemails Per Hour</h4>
            <input
              type="range"
              min="10"
              max="400"
              step="10"
              value={formSettings.maxPerHour}
              onChange={(e) => {
                const value = Math.max(10, Math.min(400, parseInt(e.target.value)));
                handleInputChange('maxPerHour', value);
              }}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <div className="flex justify-between text-sm text-gray-500 mt-2 mb-4">
              <span>10</span>
              <span>100</span>
              <span>200</span>
              <span>300</span>
              <span>400</span>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min="10"
                max="400"
                value={formSettings.maxPerHour}
                onChange={(e) => {
                  let value = parseInt(e.target.value);
                  if (isNaN(value)) value = 10;
                  value = Math.max(10, Math.min(400, value));
                  handleInputChange('maxPerHour', value);
                }}
                onBlur={(e) => {
                  let value = parseInt(e.target.value);
                  if (isNaN(value)) value = 10;
                  value = Math.max(10, Math.min(400, value));
                  handleInputChange('maxPerHour', value);
                }}
                className="w-24   border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
              />
              <span className="text-sm text-gray-600">voicemails/hour</span>
            </div>
          </div>}

          {/* Interval between SMS */}
          {!isAutomationsModule &&!isVoiceMailModule && <div className="border-t border-gray-200 pt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-4">Interval between each SMS</h4>
            <input

              type="range"
              min="1"
              max="59"
              step="1"
              value={formSettings.delayMinutes}
              onChange={(e) => {
                const value = Math.max(1, Math.min(59, parseInt(e.target.value)));
                handleInputChange('delayMinutes', value);
              }}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <div className="flex justify-between text-sm text-gray-500 mt-2 mb-4">
              <span>1</span>
              <span>15</span>
              <span>30</span>
              <span>45</span>
              <span>60</span>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min="1"
                max="59"
                value={formSettings.delayMinutes}
                onChange={(e) => {
                  let value = parseInt(e.target.value);
                  if (isNaN(value)) value = 1;
                  value = Math.max(1, Math.min(59, value));
                  handleInputChange('delayMinutes', value);
                }}

                onBlur={(e) => {
                  let value = parseInt(e.target.value);
                  if (isNaN(value)) value = 1;
                  value = Math.max(1, Math.min(59, value));
                  handleInputChange('delayMinutes', value);
                }}
                className="w-24 p-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <span className="text-sm text-gray-600">minutes</span>
            </div>
          </div>}

          {/* Days of Week */}
          <div className="border-t border-gray-200 pt-6 mt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-4">Active Days</h4>
            <div className="flex flex-wrap gap-3">
              {days.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${formSettings.daysOfWeek.includes(day)
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
          >
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
}