export default function PipelineSelector({ 
  pipelineId, 
  pipelines = [] as Array<{ id: string; name: string }>, 
  onChange, 
  isJobRunning, 
  loadingPipelines 
}: {
  pipelineId: string;
  pipelines: Array<{ id: string; name: string }>;
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  isJobRunning: boolean;
  loadingPipelines: boolean;
}) {
    return (
      <div className="flex-1 p-4 bg-gray-50 rounded-lg">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Pipeline*
        </label>
        <select
          value={pipelineId}
          onChange={onChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          disabled={isJobRunning || loadingPipelines}
        >
          <option value="">Select a pipeline</option>
          {pipelines.map((pipeline) => (
            <option key={pipeline.id} value={pipeline.id}>
              {pipeline.name}
            </option>
          ))}
        </select>
        {loadingPipelines && (
          <p className="mt-1 text-sm text-gray-500">Loading pipelines...</p>
        )}
        {!loadingPipelines && pipelines.length === 0 && (
          <p className="mt-1 text-sm text-red-500">No pipelines available. Please create a pipeline first.</p>
        )}
      </div>
    );
  }