export default function PropertyCountConfig({ 
  propertyCount, 
  onChange, 
  isJobRunning 
}: {
  propertyCount: number;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isJobRunning: boolean;
}) {
    return (
      <div className="flex-1 p-4 bg-gray-50 rounded-lg">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Number of Properties Per Day
        </label>
        <input
          type="number"
          name="propertyCount"
          value={propertyCount}
          onChange={onChange}
          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md bg-white"
          min="1"
          max="100"
          disabled={isJobRunning}
        />
      </div>
    );
  }