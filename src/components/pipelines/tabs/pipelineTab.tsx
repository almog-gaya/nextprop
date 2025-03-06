import { Pipeline } from "@/types";

const PipelinesTab: React.FC<{
    pipelines: Pipeline[];
    setPipelines: React.Dispatch<React.SetStateAction<Pipeline[]>>;
  }> = () => {
    return (
      <div className="container mx-auto px-4 py-6">
        <h2 className="text-2xl font-semibold mb-4">Pipelines</h2>
        <p className="text-gray-600">Pipeline management coming soon...</p>
      </div>
    );
  };


  export default PipelinesTab;