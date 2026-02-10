import React, { useState, useEffect } from 'react';
import { RotateCcw, Info } from 'lucide-react';
import { checkClientRestoration, isRecentlyRestored, RestorationInfo } from './restorationUtils';

interface RestorationBadgeProps {
  clientId: string;
  showDetails?: boolean;
  daysThreshold?: number;
}

export function RestorationBadge({
  clientId,
  showDetails = false,
  daysThreshold = 30
}: RestorationBadgeProps) {
  const [restorationInfo, setRestorationInfo] = useState<RestorationInfo | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRestorationInfo();
  }, [clientId]);

  const loadRestorationInfo = async () => {
    setIsLoading(true);
    const info = await checkClientRestoration(clientId);
    setRestorationInfo(info);
    setIsLoading(false);
  };

  if (isLoading || !restorationInfo || !restorationInfo.wasRestored) {
    return null;
  }

  if (!isRecentlyRestored(restorationInfo.daysAgo, daysThreshold)) {
    return null;
  }

  const daysText = restorationInfo.daysAgo === 0
    ? 'today'
    : restorationInfo.daysAgo === 1
    ? 'yesterday'
    : `${restorationInfo.daysAgo} days ago`;

  return (
    <div className="relative inline-block">
      <div
        className="inline-flex items-center gap-1.5 px-2 py-1 bg-green-100 text-green-800 rounded-md text-xs font-medium cursor-help"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <RotateCcw className="w-3 h-3" />
        <span>Restored {daysText}</span>
        {showDetails && <Info className="w-3 h-3" />}
      </div>

      {showDetails && showTooltip && (
        <div className="absolute z-50 w-80 p-3 bg-white border border-gray-200 rounded-lg shadow-lg top-full mt-2 left-0">
          <div className="space-y-2">
            <div>
              <div className="text-xs font-medium text-gray-500">Restored Date</div>
              <div className="text-sm text-gray-900">
                {restorationInfo.restoredAt
                  ? new Date(restorationInfo.restoredAt).toLocaleString()
                  : 'Unknown'}
              </div>
            </div>
            {restorationInfo.restoredBy && (
              <div>
                <div className="text-xs font-medium text-gray-500">Restored By</div>
                <div className="text-sm text-gray-900">{restorationInfo.restoredBy}</div>
              </div>
            )}
            {restorationInfo.restorationReason && (
              <div>
                <div className="text-xs font-medium text-gray-500">Reason</div>
                <div className="text-sm text-gray-900">{restorationInfo.restorationReason}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
