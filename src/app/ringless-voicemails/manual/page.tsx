'use client';

import { useState, useEffect } from 'react';
import { useAuth, PhoneNumber } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import axios from 'axios';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { ArrowLeftIcon, CheckIcon } from 'lucide-react';

export default function ManualVoicemailPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [script, setScript] = useState('');
  const [voiceClones, setVoiceClones] = useState<any[]>([]);
  const [selectedVoiceClone, setSelectedVoiceClone] = useState<string>('');
  // Generate default script
  const generateDefaultScript = () => {
    setScript(`Hi, this is ${user?.firstName || 'Adforce'} from NextProp. I've got some great listings that might interest you. Call me back when you have a chance. Thanks!`);
  };

  // Fetch phone numbers
  async function fetchPhoneNumbers() {
    try {
      setPhoneNumbers(user?.phoneNumbers || []);
      if (user?.phoneNumbers && user.phoneNumbers.length > 0) {
        setSelectedPhoneNumber(user.phoneNumbers[0].phoneNumber);
      }
    } catch (error) {
      console.error('Error fetching phone numbers:', error);
      toast.error('Failed to load phone numbers');
    }
  }

  useEffect(() => {
    generateDefaultScript();
    fetchPhoneNumbers();
    fetchVoiceClones();
  }, [user]);
  const fetchVoiceClones = async () => {
    try {
      console.log('Fetching voice clones from API...');
      const response = await axios.get('/api/voicemail/voice-clones');
      console.log('Voice clones response:', response.status, Array.isArray(response.data) ? `${response.data.length} clones` : 'not an array');
      
      if (!Array.isArray(response.data) || response.data.length === 0) {
        throw new Error('Invalid voice clones data received');
      }
      
      setVoiceClones(response.data);
    } catch (error) {
      console.error('Error fetching voice clones:', error);
      toast.error('Failed to load voice clones from API, using defaults');
      
      // Extended default voice clones for better fallback
      const defaultVoiceClones = [
        { id: "61EQ2khjAy41AXCqUSSS", name: "Cecilia" },
        { id: "Es45QkMNPudcZKVRZWPs", name: "Rey" },
        { id: "dodUUtwsqo09HrH2RO8w", name: "Default Voice" },
        { id: "K7XqnwwwTHI4FWb3hMcg", name: "American Male" },
        { id: "V2cH3WvRQzV5hpEkPfj8", name: "American Female" },
        { id: "xPALbbfCplcfXEJeWcN2", name: "British Male" },
        { id: "rT9Ym8OzjlQcAgRoWfDd", name: "British Female" },
        { id: "9nK41b6vClYnAqCaSSFL", name: "Australian Male" },
        { id: "E4Nt6X9aOzHg1Vev7KTL", name: "Australian Female" }
      ];
      setVoiceClones(defaultVoiceClones);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!recipientPhone.trim()) {
      toast.error('Recipient phone number is required');
      return;
    }

    if (!script.trim()) {
      toast.error('Voicemail script is required');
      return;
    }

    if (!selectedPhoneNumber) {
      toast.error('Please select a sender phone number');
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post('/api/voicemail/send-voicemail', {
        script: script,
        to: recipientPhone,
        from: selectedPhoneNumber,
        voice_clone_id: selectedVoiceClone,
        validate_recipient_phone: false,
        
      });
      console.log(`Response: ${response.data}`)
      toast.success('Voicemail sent successfully');
      setSent(true);
    } catch (error) {
      console.error('Error sending voicemail:', error);
      toast.error('Failed to send voicemail');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSent(false);
    setRecipientPhone('');
    generateDefaultScript();
  };

  return (
    <DashboardLayout title="Send Manual Voicemail">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center mb-6">
          <Link href="/ringless-voicemails" className="mr-4 text-purple-600 hover:text-purple-800">
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <h2 className="text-2xl font-bold text-gray-900">
            Send Manual Voicemail
          </h2>
        </div>

        {sent ? (
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <CheckIcon className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="mt-2 text-lg font-medium text-gray-900">Voicemail Sent Successfully</h3>
              <p className="mt-1 text-sm text-gray-500">
                Your voicemail has been sent to {recipientPhone}.
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                >
                  Send Another Voicemail
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow sm:rounded-lg">
            <form onSubmit={handleSubmit} className="divide-y divide-gray-200">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Voicemail Details
                </h3>

                <div className="grid grid-cols-1 gap-y-6">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Recipient Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      id="phone"
                      required
                      className="mt-1 shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="+1 (555) 123-4567"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                    />
                  </div>

                  <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                      Sender Phone Number *
                    </label>
                    <select
                      id="phoneNumber"
                      className="mt-1 shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      value={selectedPhoneNumber}
                      onChange={(e) => setSelectedPhoneNumber(e.target.value)}
                      required
                    >
                      {phoneNumbers.map(phone => (
                        <option key={phone.phoneNumber} value={phone.phoneNumber}>
                          {phone.phoneNumber}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="script" className="block text-sm font-medium text-gray-700">
                      Voicemail Script *
                    </label>
                    <textarea
                      id="script"
                      name="script"
                      rows={4}
                      className="mt-1 shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      required
                      value={script}
                      onChange={(e) => setScript(e.target.value)}
                    />
                  </div>
                </div>
              </div>
 {/* Voice Clone Selection */}
 <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                    <label htmlFor="voiceClone" className="block text-sm font-medium text-gray-700 mb-2">
                      Step 4: Select Voice Clone (Optional)
                    </label>
                    <div className="flex space-x-2">
                      <select
                        id="voiceClone"
                        className="flex-1 block w-full sm:text-sm border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                        value={selectedVoiceClone}
                        onChange={(e) => setSelectedVoiceClone(e.target.value)}
                      >
                        <option value="">Use default system voice</option>
                        {voiceClones.map(clone => (
                          <option key={clone.id} value={clone.id}>
                            {clone.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          fetchVoiceClones();
                          toast.success("Loading voice clones...");
                        }}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                      </button>
                    </div>
                  </div>
              <div className="px-4 py-4 sm:px-6 flex justify-end">
                <Link
                  href="/ringless-voicemails"
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 mr-3"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading || !recipientPhone.trim() || !script.trim()}
                  className={`${
                    loading || !recipientPhone.trim() || !script.trim()
                      ? 'bg-purple-300 cursor-not-allowed'
                      : 'bg-purple-600 hover:bg-purple-700'
                  } inline-flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white`}
                >
                  {loading ? 'Sending...' : 'Send Voicemail'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}