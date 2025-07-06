import React, { useState } from 'react';

interface SidebarLayoutProps {
  sidebarContent: React.ReactNode;
  mainContent: React.ReactNode;
}

export const SidebarLayout: React.FC<SidebarLayoutProps> = ({ sidebarContent, mainContent }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-full bg-gradient-to-br from-violet-50 via-pink-50 to-cyan-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-80 lg:w-80 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {sidebarContent}
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header with sidebar toggle */}
        <div className="lg:hidden bg-white/80 backdrop-blur-sm border-b border-gray-200/50 p-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className="font-medium">Menu</span>
          </button>
        </div>

        {/* Main content area */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            {mainContent}
          </div>
        </div>
      </div>
    </div>
  );
}; 