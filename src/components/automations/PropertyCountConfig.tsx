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
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          min="1"
          max="100"
          disabled={isJobRunning}
        />
      </div>
    );
  }