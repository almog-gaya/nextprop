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
        <input
          type="text"
          name="redfin_url"
          value={searchQuery}
          onChange={onChange}
          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md bg-white"
          placeholder={`e.g "${exampleLink}"`}
          disabled={isJobRunning}
        />
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