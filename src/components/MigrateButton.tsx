import React, { useState } from 'react';
import { migrateExistingEntries } from '../lib/migrate';
import { RefreshCcw, CheckCircle, AlertCircle } from 'lucide-react';

const MigrateButton: React.FC = () => {
  const [isMigrating, setIsMigrating] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleMigrate = async () => {
    setIsMigrating(true);
    setStatus('idle');
    setMessage('');

    try {
      await migrateExistingEntries();
      setStatus('success');
      setMessage('All entries updated successfully! Refresh to see changes.');
      
      // Reload page after 2 seconds to show updated entries
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'Failed to migrate entries');
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="mb-4">
      <button
        onClick={handleMigrate}
        disabled={isMigrating}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          isMigrating
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        <RefreshCcw className={`w-4 h-4 ${isMigrating ? 'animate-spin' : ''}`} />
        <span>{isMigrating ? 'Migrating...' : 'Update All Entries'}</span>
      </button>

      {status === 'success' && (
        <div className="mt-2 flex items-center space-x-2 text-sm text-green-600">
          <CheckCircle className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}

      {status === 'error' && (
        <div className="mt-2 flex items-center space-x-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}
    </div>
  );
};

export default MigrateButton;

