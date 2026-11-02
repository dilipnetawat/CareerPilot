import React from 'react';
import type { HealthStatus } from '../types';

interface StatusCardProps {
  health: HealthStatus | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export const StatusCard: React.FC<StatusCardProps> = ({
  health,
  loading,
  error,
  onRefresh,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
        <div>
          <h3 className="text-base font-semibold text-slate-100">System Integration Status</h3>
          <p className="text-sm text-slate-400">Verifying live API and database communication</p>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-colors cursor-pointer"
        >
          {loading ? 'Refreshing...' : 'Ping API'}
        </button>
      </div>

      {error ? (
        <div className="p-4 rounded-lg bg-rose-950/40 border border-rose-800/80 text-rose-200 text-sm">
          <div className="font-semibold mb-1">Connection Error</div>
          <p className="text-xs text-rose-300 font-mono">{error}</p>
          <p className="text-xs text-slate-400 mt-2">
            Ensure the FastAPI backend is running on <code className="text-indigo-300">http://localhost:8000</code>.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">FastAPI Endpoint</span>
            <div className="mt-1 flex items-center space-x-2">
              <span className="text-sm font-semibold text-slate-100 font-mono">/api/health</span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
            </div>
            <p className="text-xs text-emerald-400 mt-1">
              {health?.status ? `Status: ${health.status}` : 'Awaiting response'}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">Database (SQLite)</span>
            <div className="mt-1 flex items-center space-x-2">
              <span className="text-sm font-semibold text-slate-100">SQLAlchemy</span>
              <span
                className={`inline-block w-2 h-2 rounded-full ${
                  health?.database === 'connected' ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
            </div>
            <p
              className={`text-xs mt-1 ${
                health?.database === 'connected' ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {health?.database || 'Pending'}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">Environment</span>
            <div className="mt-1">
              <span className="text-sm font-semibold text-slate-100 capitalize">
                {health?.environment || 'development'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Version {health?.version || '0.1.0'}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">Last Checked</span>
            <div className="mt-1 text-xs font-mono text-slate-200 truncate">
              {health?.timestamp ? new Date(health.timestamp).toLocaleTimeString() : 'N/A'}
            </div>
            <p className="text-xs text-slate-400 mt-1 truncate">
              {health?.timestamp ? new Date(health.timestamp).toLocaleDateString() : 'Awaiting ping'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
