import { BuildingLibraryIcon } from '@heroicons/react/24/outline';

export default function AutomationToggle({
    isAutomationEnabled,
    toggleAutomation
}: {
    isAutomationEnabled: boolean;
    toggleAutomation: () => void;
}) {
    return (
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
            <div className="flex items-center">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mr-4">
                    <BuildingLibraryIcon className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">Property Scraper + SMS</h2>
                    <p className="text-gray-500">Daily property scraping with SMS notification</p>
                </div>
            </div>
            <div className="flex items-center">
                <span className={`mr-3 text-sm font-medium ${isAutomationEnabled ? 'text-indigo-700' : 'text-gray-500'
                    }`}>
                    {isAutomationEnabled ? 'Enabled' : 'Disabled'}
                </span>
                <button
                    onClick={toggleAutomation}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full ${isAutomationEnabled ? 'bg-indigo-600' : 'bg-gray-200'
                        }`}
                >
                    <span className="sr-only">Enable automation</span>
                    <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${isAutomationEnabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                    />
                </button>
            </div>
        </div>
    );
}