import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Info, RefreshCw } from 'lucide-react';

type LogType = 'info' | 'error' | 'success';

interface Log {
  timestamp: string;
  type: LogType;
  message: string;
  data?: any;
}

interface DebugResponse {
  success: boolean;
  isEnabled: boolean;
  config: any;
  logs: Log[];
}

// export default function AIAgentDebug() {
//   const [logs, setLogs] = useState<Log[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [isEnabled, setIsEnabled] = useState(false);
//   const [polling, setPolling] = useState(true);

//   const fetchLogs = async () => {
//     try {
//       setLoading(true);
//       const response = await fetch('/api/ai-agent/debug');
      
//       if (!response.ok) {
//         throw new Error(`Error fetching logs: ${response.status}`);
//       }
      
//       const data: DebugResponse = await response.json();
//       console.log('Debug data fetched:', data);
//       setLogs(data.logs);
//       setIsEnabled(data.isEnabled);
//       setError(null);
//     } catch (err) {
//       console.error('Error fetching logs:', err);
//       setError('Failed to load AI agent logs');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchLogs();
    
//     // Set up polling for updates
//     let interval: NodeJS.Timeout;
    
//     if (polling) {
//       interval = setInterval(fetchLogs, 5000); // Poll every 5 seconds
//     }
    
//     // Listen for config changes and refresh immediately
//     const handleConfigChange = () => {
//       console.log('Config change detected, refreshing debug data');
//       fetchLogs();
//     };
    
//     window.addEventListener('ai-agent-config-changed', handleConfigChange);
    
//     return () => {
//       if (interval) clearInterval(interval);
//       window.removeEventListener('ai-agent-config-changed', handleConfigChange);
//     };
//   }, [polling]);

//   const formatTime = (timestamp: string) => {
//     try {
//       const date = new Date(timestamp);
//       return date.toLocaleTimeString();
//     } catch (e) {
//       return 'Invalid time';
//     }
//   };

//   const getIcon = (type: LogType) => {
//     switch (type) {
//       case 'error':
//         return <AlertTriangle className="h-4 w-4 text-[var(--nextprop-error)]" />;
//       case 'success':
//         return <CheckCircle className="h-4 w-4 text-[var(--nextprop-success)]" />;
//       default:
//         return <Info className="h-4 w-4 text-[var(--nextprop-primary)]" />;
//     }
//   };

//   const getRowClass = (type: LogType) => {
//     switch (type) {
//       case 'error':
//         return 'bg-[var(--nextprop-error)]/5';
//       case 'success':
//         return 'bg-[var(--nextprop-success)]/5';
//       default:
//         return '';
//     }
//   };

//   // Add this function for force refreshing
//   const forceRefreshStatus = async () => {
//     console.log('Forcing refresh of AI Agent status');
//     await fetchLogs();
//   };

//   return (
//     <div className="bg-[var(--nextprop-surface)] rounded-lg shadow-sm p-6 mt-8 border border-[var(--nextprop-border)]">
//       <div className="flex items-center justify-between mb-4">
//         <h2 className="text-xl font-semibold text-[var(--nextprop-text-primary)]">AI Agent Debug Logs</h2>
//         <div className="flex items-center space-x-4">
//           <div className="flex items-center">
//             <span className="mr-2 text-sm text-[var(--nextprop-text-secondary)]">Auto-refresh:</span>
//             <button
//               onClick={() => setPolling(!polling)}
//               className={`px-3 py-1 text-sm rounded ${
//                 polling ? 'bg-[var(--nextprop-primary-light)]/10 text-[var(--nextprop-primary-dark)]' : 'bg-[var(--nextprop-surface-hover)] text-[var(--nextprop-text-secondary)]'
//               }`}
//             >
//               {polling ? 'On' : 'Off'}
//             </button>
//           </div>
//           <button
//             onClick={fetchLogs}
//             className="px-3 py-1 bg-[var(--nextprop-primary)] text-white rounded text-sm flex items-center hover:bg-[var(--nextprop-primary-dark)] transition-colors"
//           >
//             <RefreshCw className="h-3 w-3 mr-1" />
//             Refresh Now
//           </button>
//         </div>
//       </div>

//       <div className="mb-4 p-2 border border-[var(--nextprop-border)] rounded flex items-center bg-[var(--nextprop-surface-hover)]/50">
//         <span className="font-medium mr-2 text-[var(--nextprop-text-primary)]">AI Agent Status:</span>
//         <span
//           className={`px-2 py-1 rounded text-sm ${
//             isEnabled
//               ? 'bg-[var(--nextprop-success)]/10 text-[var(--nextprop-success)]'
//               : 'bg-[var(--nextprop-error)]/10 text-[var(--nextprop-error)]'
//           }`}
//         >
//           {isEnabled ? 'Enabled' : 'Disabled'}
//         </span>
//         {!isEnabled && (
//           <span className="ml-2 text-sm text-[var(--nextprop-text-tertiary)]">
//             (Enable the agent in the settings above to see responses)
//           </span>
//         )}
//         <button 
//           onClick={forceRefreshStatus}
//           className="ml-auto px-2 py-1 bg-[var(--nextprop-surface-hover)] text-xs rounded hover:bg-[var(--nextprop-surface-hover)]/80 flex items-center text-[var(--nextprop-text-secondary)]"
//         >
//           <RefreshCw className="h-3 w-3 mr-1" />
//           Force Refresh Status
//         </button>
//       </div>

//       {error && (
//         <div className="bg-[var(--nextprop-error)]/10 text-[var(--nextprop-error)] p-3 rounded mb-4 border border-[var(--nextprop-error)]/20">
//           {error}
//         </div>
//       )}

//       {loading && logs.length === 0 ? (
//         <div className="flex justify-center items-center h-32">
//           <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--nextprop-primary)]"></div>
//         </div>
//       ) : logs.length === 0 ? (
//         <div className="text-center p-6 bg-[var(--nextprop-surface-hover)]/50 rounded">
//           <p className="text-[var(--nextprop-text-tertiary)]">No logs available. Try sending some messages.</p>
//         </div>
//       ) : (
//         <div className="overflow-x-auto mt-4">
//           <table className="min-w-full divide-y divide-[var(--nextprop-border)]">
//             <thead className="bg-[var(--nextprop-surface-hover)]">
//               <tr>
//                 <th className="px-3 py-2 text-left text-xs font-medium text-[var(--nextprop-text-secondary)] uppercase tracking-wider">Time</th>
//                 <th className="px-3 py-2 text-left text-xs font-medium text-[var(--nextprop-text-secondary)] uppercase tracking-wider">Type</th>
//                 <th className="px-3 py-2 text-left text-xs font-medium text-[var(--nextprop-text-secondary)] uppercase tracking-wider">Message</th>
//                 <th className="px-3 py-2 text-left text-xs font-medium text-[var(--nextprop-text-secondary)] uppercase tracking-wider">Details</th>
//               </tr>
//             </thead>
//             <tbody className="bg-[var(--nextprop-surface)] divide-y divide-[var(--nextprop-border)]">
//               {logs.map((log, index) => (
//                 <tr key={index} className={getRowClass(log.type)}>
//                   <td className="px-3 py-2 whitespace-nowrap text-xs text-[var(--nextprop-text-secondary)]">
//                     {formatTime(log.timestamp)}
//                   </td>
//                   <td className="px-3 py-2 whitespace-nowrap">
//                     <div className="flex items-center">
//                       {getIcon(log.type)}
//                       <span className="ml-1 text-xs capitalize">{log.type}</span>
//                     </div>
//                   </td>
//                   <td className="px-3 py-2 whitespace-nowrap text-xs text-[var(--nextprop-text-primary)]">
//                     {log.message}
//                   </td>
//                   <td className="px-3 py-2 text-xs">
//                     {log.data ? (
//                       <details>
//                         <summary className="cursor-pointer text-[var(--nextprop-primary)]">View details</summary>
//                         <pre className="mt-2 p-2 bg-[var(--nextprop-surface-hover)]/50 rounded text-xs overflow-auto max-h-32 text-[var(--nextprop-text-primary)]">
//                           {JSON.stringify(log.data, null, 2)}
//                         </pre>
//                       </details>
//                     ) : (
//                       <span className="text-[var(--nextprop-text-tertiary)]">No details</span>
//                     )}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </div>
//   );
// } 