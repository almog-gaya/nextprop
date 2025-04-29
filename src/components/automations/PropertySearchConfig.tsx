export default function PropertySearchConfig({ 
    searchQuery, 
    onChange, 
    isJobRunning 
  }: {
    searchQuery: string;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    isJobRunning: boolean;
  }) {
    const exampleLink = "https://www.redfin.com/zipcode/32754/filter/min-days-on-market=3mo";
  
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Redfin Property Search Link*
        </label>
      <div className=" border border-gray-300 rounded-md">
      <input
          type="text"
          name="redfin_url"
          value={searchQuery}
          onChange={onChange}
          className="w-full p-2 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white"
          placeholder={`e.g "${exampleLink}"`}
          disabled={isJobRunning}
        />
      </div>
        <p className="mt-1 text-sm text-gray-500">
          Only redfin links are supported at the moment. Please use the search link from the{' '}
          <a 
            href={exampleLink}
            target="_blank" 
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-800 underline"
          >
            redfin website
          </a>.
        </p>
      </div>
    );
  }