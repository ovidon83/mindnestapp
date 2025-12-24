// Legacy component - no longer used in MVP
// Kept for backward compatibility during migration
import React from 'react';

const ToDoView: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-slate-600">This view is no longer available. Please use the Thoughts view.</p>
      </div>
    </div>
  );
};

export default ToDoView;
