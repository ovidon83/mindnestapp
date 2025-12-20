import React from 'react';
import { Entry, EntryType } from '../types';
import { TrendingUp, Calendar, FileText } from 'lucide-react';

interface AnalyticsProps {
  entries: Entry[];
  type: EntryType;
}

const Analytics: React.FC<AnalyticsProps> = ({ entries, type }) => {
  // Calculate statistics
  const total = entries.length;
  
  // Group by date
  const entriesByDate = entries.reduce((acc, entry) => {
    const date = new Date(entry.createdAt).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const dates = Object.keys(entriesByDate).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  ).slice(0, 7); // Last 7 days

  // Calculate average length
  const avgLength = total > 0 
    ? Math.round(entries.reduce((sum, e) => sum + e.originalText.length, 0) / total)
    : 0;

  // For todos: completion rate
  const completionRate = type === 'todo' && total > 0
    ? Math.round((entries.filter(e => e.completed).length / total) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Total Count */}
      <div className="bg-slate-50 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-200 rounded-lg">
            <FileText className="w-5 h-5 text-slate-700" />
          </div>
          <div>
            <div className="text-sm text-slate-600">Total {type}s</div>
            <div className="text-2xl font-bold text-slate-900">{total}</div>
          </div>
        </div>
      </div>

      {/* Average Length */}
      <div className="bg-slate-50 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-200 rounded-lg">
            <TrendingUp className="w-5 h-5 text-slate-700" />
          </div>
          <div>
            <div className="text-sm text-slate-600">Avg. Length</div>
            <div className="text-2xl font-bold text-slate-900">{avgLength} chars</div>
          </div>
        </div>
      </div>

      {/* Completion Rate (for todos) or Recent Activity */}
      {type === 'todo' ? (
        <div className="bg-slate-50 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-200 rounded-lg">
              <TrendingUp className="w-5 h-5 text-slate-700" />
            </div>
            <div>
              <div className="text-sm text-slate-600">Completion Rate</div>
              <div className="text-2xl font-bold text-slate-900">{completionRate}%</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-200 rounded-lg">
              <Calendar className="w-5 h-5 text-slate-700" />
            </div>
            <div>
              <div className="text-sm text-slate-600">This Week</div>
              <div className="text-2xl font-bold text-slate-900">
                {entries.filter(e => {
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return new Date(e.createdAt) >= weekAgo;
                }).length}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity Chart */}
      {dates.length > 0 && (
        <div className="md:col-span-3 bg-slate-50 rounded-lg p-4">
          <div className="text-sm font-medium text-slate-700 mb-3">Recent Activity</div>
          <div className="space-y-2">
            {dates.map((date) => (
              <div key={date} className="flex items-center gap-3">
                <div className="text-xs text-slate-600 w-24">{date}</div>
                <div className="flex-1 bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-slate-600 rounded-full h-2"
                    style={{ width: `${(entriesByDate[date] / Math.max(...Object.values(entriesByDate))) * 100}%` }}
                  />
                </div>
                <div className="text-xs text-slate-600 w-8 text-right">{entriesByDate[date]}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;

