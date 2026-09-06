import React, { useState, useEffect, useCallback } from 'react';
import { Wifi, WifiOff, RefreshCw, Server } from 'lucide-react';
import { healthApi } from '../../lib/api/health.api';

interface ConnectionStatusBadgeProps {
  className?: string;
}

export const ConnectionStatusBadge: React.FC<ConnectionStatusBadgeProps> = ({ className = '' }) => {
  const [status, setStatus] = useState<'checking' | 'live' | 'fallback'>('checking');
  const [lastCheck, setLastCheck] = useState<string | null>(null);
  const [details, setDetails] = useState<string>('Checking backend...');

  const checkConnection = useCallback(async () => {
    try {
      const res = await healthApi.checkLive();
      if (res.status === 'ok') {
        setStatus('live');
        setDetails(`Connected to API: ${res.service || 'kka-api'}`);
      } else {
        setStatus('fallback');
        setDetails('API reported non-ready status');
      }
    } catch {
      setStatus('fallback');
      setDetails('Backend offline. Operating in local prototype mode.');
    } finally {
      setLastCheck(new Date().toLocaleTimeString());
    }
  }, []);

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 45000); // Check every 45s
    return () => clearInterval(interval);
  }, [checkConnection]);

  return (
    <div
      onClick={checkConnection}
      title={`${details} (Last check: ${lastCheck || 'just now'}). Click to refresh.`}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium transition-all cursor-pointer select-none border ${
        status === 'live'
          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80 hover:bg-emerald-900/60 shadow-sm shadow-emerald-950'
          : status === 'fallback'
          ? 'bg-amber-950/60 text-amber-300 border-amber-800/80 hover:bg-amber-900/60'
          : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:bg-slate-700/60'
      } ${className}`}
    >
      {status === 'live' ? (
        <>
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
          </span>
          <Server className="w-3 h-3 text-emerald-400" />
          <span className="hidden sm:inline">API Live</span>
        </>
      ) : status === 'fallback' ? (
        <>
          <span className="inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
          <WifiOff className="w-3 h-3 text-amber-400" />
          <span className="hidden sm:inline">Local Prototype</span>
        </>
      ) : (
        <>
          <RefreshCw className="w-3 h-3 animate-spin text-slate-400" />
          <span className="hidden sm:inline">Connecting...</span>
        </>
      )}
    </div>
  );
};
