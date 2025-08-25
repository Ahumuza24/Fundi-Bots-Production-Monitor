'use client';

import { useState, useEffect } from 'react';
import { appCache } from '@/lib/cache';

export function CacheDebug() {
  const [stats, setStats] = useState(appCache.getStats());
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(appCache.getStats());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg hover:bg-blue-700"
      >
        Cache ({stats.size})
      </button>

      {isOpen && (
        <div className="absolute bottom-12 right-0 bg-white border border-gray-200 rounded-lg shadow-xl p-4 w-80 max-h-96 overflow-auto">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-900">Cache Debug</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-gray-600">Size:</span>
                <span className="ml-1 font-mono">{stats.size}/{stats.maxSize}</span>
              </div>
              <div>
                <span className="text-gray-600">Hit Rate:</span>
                <span className="ml-1 font-mono">{stats.hitRate}</span>
              </div>
              <div>
                <span className="text-gray-600">Hits:</span>
                <span className="ml-1 font-mono">{stats.hitCount}</span>
              </div>
              <div>
                <span className="text-gray-600">Misses:</span>
                <span className="ml-1 font-mono">{stats.missCount}</span>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600 font-medium">Cache Keys:</span>
                <button
                  onClick={() => {
                    appCache.clear();
                    setStats(appCache.getStats());
                  }}
                  className="text-red-600 hover:text-red-800 text-xs"
                >
                  Clear All
                </button>
              </div>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {stats.keys.length === 0 ? (
                  <div className="text-gray-400 italic">No cached items</div>
                ) : (
                  stats.keys.map((key) => (
                    <div
                      key={key}
                      className="flex justify-between items-center text-xs bg-gray-50 p-1 rounded"
                    >
                      <span className="font-mono truncate flex-1" title={key}>
                        {key}
                      </span>
                      <button
                        onClick={() => {
                          appCache.delete(key);
                          setStats(appCache.getStats());
                        }}
                        className="text-red-500 hover:text-red-700 ml-1"
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}