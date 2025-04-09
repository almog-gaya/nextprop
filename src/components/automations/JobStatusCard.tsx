
interface JobStatusCardProps {
    jobStatus: {
        status: string;
        progress?: number;
        statistics?: {
            contactsProcessed?: number;
            totalContacts: number;
            messageSent?: number;
        };
    }
}

export default function JobStatusCard({ jobStatus }: JobStatusCardProps) {
    return (
        <div className="bg-white p-6 shadow-md rounded-lg border border-gray-100">
            <div className="flex items-center mb-3">
                <div className={`w-2 h-2 rounded-full mr-2 ${jobStatus.status === 'completed' ? 'bg-emerald-500' :
                        jobStatus.status === 'failed' ? 'bg-red-500' :
                            'bg-indigo-500 animate-pulse'
                    }`}></div>
                <h3 className="font-medium text-gray-900">Job Status: {jobStatus.status}</h3>
            </div>
            <div className="mb-4 w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div
                    className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${jobStatus.progress || 0}%` }}
                ></div>
            </div>
            {jobStatus.statistics && (
                <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div className="flex justify-between mb-1">
                        <span>Properties Processed:</span>
                        <span className="font-medium">{jobStatus.statistics.contactsProcessed || 0} / {jobStatus.statistics.totalContacts}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>SMS Messages Sent:</span>
                        <span className="font-medium">{jobStatus.statistics.messageSent || 0}</span>
                    </div>
                </div>
            )}
        </div>
    );
}