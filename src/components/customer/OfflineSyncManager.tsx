import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  CloudOff, 
  Sparkles, 
  Radio, 
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { 
  OfflineOrderInquiry, 
  getOfflineInquiries, 
  onQueueUpdate, 
  onConnectivityChange, 
  isDeviceOnline, 
  setSimulatedOffline, 
  getSimulatedOffline, 
  syncOfflineInquiries,
  clearSyncedInquiries
} from '../../utils/offlineQueueService';

interface OfflineSyncManagerProps {
  onManualRefreshOrder?: () => void;
  className?: string;
}

export const OfflineSyncManager: React.FC<OfflineSyncManagerProps> = ({
  onManualRefreshOrder,
  className = ''
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(isDeviceOnline());
  const [simulatedOff, setSimulatedOff] = useState<boolean>(getSimulatedOffline());
  const [queue, setQueue] = useState<OfflineOrderInquiry[]>(getOfflineInquiries());
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  useEffect(() => {
    const unsubConn = onConnectivityChange(online => {
      setIsOnline(online);
      setSimulatedOff(getSimulatedOffline());
    });

    const unsubQueue = onQueueUpdate(updatedQueue => {
      setQueue(updatedQueue);
    });

    return () => {
      unsubConn();
      unsubQueue();
    };
  }, []);

  const pendingCount = queue.filter(q => q.status === 'queued' || q.status === 'syncing').length;

  const handleToggleSimulatedOffline = () => {
    const nextVal = !simulatedOff;
    setSimulatedOffline(nextVal);
    setSimulatedOff(nextVal);
  };

  const handleTriggerSyncNow = async () => {
    setIsSyncing(true);
    await syncOfflineInquiries();
    if (onManualRefreshOrder) {
      onManualRefreshOrder();
    }
    setIsSyncing(false);
  };

  return (
    <div className={`rounded-2xl border transition-all shadow-xs ${
      !isOnline 
        ? 'bg-amber-500/10 border-amber-500/30 text-amber-950'
        : 'bg-white border-slate-200 text-slate-800'
    } ${className}`}>
      
      {/* Top Banner Bar */}
      <div className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl flex items-center justify-center shrink-0 ${
            !isOnline
              ? 'bg-amber-500 text-white shadow-xs animate-pulse'
              : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
          }`}>
            {!isOnline ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-xs sm:text-sm">
                {!isOnline ? 'Offline Mode Active' : 'Service Worker & Offline Sync'}
              </span>
              <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase ${
                !isOnline
                  ? 'bg-amber-200 text-amber-900'
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {!isOnline ? 'Offline' : 'Online'}
              </span>
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-indigo-100 text-indigo-700 animate-pulse">
                  {pendingCount} Queued
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-500 mt-0.5">
              {!isOnline
                ? 'Order status inquiries are queued locally in Service Worker storage. Automatic background sync occurs on reconnect.'
                : 'UI assets precached. Background Sync API ready to replay queued driver queries.'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button
            onClick={handleToggleSimulatedOffline}
            className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 transition-colors ${
              simulatedOff
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-xs'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
            }`}
            title="Simulate network loss to test offline queuing"
          >
            {simulatedOff ? <Wifi className="w-3.5 h-3.5" /> : <CloudOff className="w-3.5 h-3.5 text-amber-600" />}
            <span>{simulatedOff ? 'Reconnect (Online)' : 'Simulate Offline'}</span>
          </button>

          {isOnline && pendingCount > 0 && (
            <button
              onClick={handleTriggerSyncNow}
              disabled={isSyncing}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] rounded-xl flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100/60 rounded-lg transition-colors"
            title={isExpanded ? 'Collapse Queue Details' : 'Expand Queue Details'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Queue Drawer */}
      {isExpanded && (
        <div className="p-3 sm:p-4 border-t border-slate-200/80 bg-white/70 space-y-3 rounded-b-2xl">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-indigo-600" />
              <span>Offline Inquiry Queue Ledger ({queue.length} total)</span>
            </span>

            {queue.some(q => q.status === 'synced') && (
              <button
                onClick={clearSyncedInquiries}
                className="text-[11px] text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear Synced</span>
              </button>
            )}
          </div>

          {queue.length === 0 ? (
            <div className="text-center py-4 bg-slate-50 rounded-xl border border-slate-100 text-slate-400 text-xs space-y-1">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />
              <p className="font-medium text-slate-600">All Order Inquiries Synced with Telemetry Server</p>
              <p className="text-[10px]">When offline, checking order status or driver ETA will automatically register here.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {queue.map(item => (
                <div
                  key={item.id}
                  className={`p-2.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs transition-colors ${
                    item.status === 'synced'
                      ? 'bg-emerald-50/50 border-emerald-200/80 text-emerald-950'
                      : item.status === 'syncing'
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-950 animate-pulse'
                        : 'bg-amber-50/70 border-amber-200 text-amber-950'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">
                        Order #{item.orderNumber}
                      </span>
                      <span className="px-1.5 py-0.2 rounded font-mono text-[9px] uppercase font-bold bg-white/80 border border-slate-200">
                        {item.inquiryType.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {item.timestamp}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600">
                      {item.promptText || `Telemetry & ETA inquiry for Order #${item.orderNumber}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {item.status === 'synced' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Reconciled at {item.syncedAt}</span>
                      </span>
                    ) : item.status === 'syncing' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 flex items-center gap-1">
                        <RefreshCw className="w-3 h-3 text-indigo-600 animate-spin" />
                        <span>Replaying...</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>Queued for Sync</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
