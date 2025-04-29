import { BuildingLibraryIcon } from '@heroicons/react/24/outline';

export default function AutomationHeader({ propertyCount }: { propertyCount: any }) {
  return (
    <div className="mb-8">
      <div className="flex items-center mb-4">
        <BuildingLibraryIcon className="h-7 w-7 text-indigo-600 mr-3 mb-7" />
        <h1 className="text-2xl font-bold text-gray-900">Daily Property Automation</h1>
      </div>
      <p className="text-gray-600 mb-6 ml-10">
        This automation will scrape {propertyCount} properties daily and send an SMS message to each.
      </p>
    </div>
  );
}