import React from 'react';
import { Sun, Zap, Coffee, Battery, CheckCircle, Circle, Clock, Target } from 'lucide-react';
import { useADHDStore } from '../store/adhd-store';
import { Task } from '../types';

export const TodayView: React.FC = () => {
  const { 
    getTodayTasks, 
    completeTask, 
    snoozeTask, 
    updateTask 
  } = useADHDStore();
  
  const todayTasks = getTodayTasks();
  
  // Group tasks by energy level
  const groupedTasks = {
    high_energy: todayTasks.filter(task => task.tags.includes('high_energy')),
    creative: todayTasks.filter(task => task.tags.includes('creative')),
    admin: todayTasks.filter(task => task.tags.includes('admin')),
    low_energy: todayTasks.filter(task => task.tags.includes('low_energy')),
    other: todayTasks.filter(task => 
      !task.tags.some(tag => ['high_energy', 'creative', 'admin', 'low_energy'].includes(tag))
    )
  };
  
  const handleComplete = (taskId: string) => {
    completeTask(taskId);
  };
  
  const handleSendToNow = (task: Task) => {
    const newTags = [...task.tags.filter(tag => tag !== 'later'), 'now'];
    updateTask(task.id, { tags: newTags });
  };
  
  const handleSnooze = (taskId: string) => {
    snoozeTask(taskId, 60);
  };
  
  const TaskCard: React.FC<{ task: Task }> = ({ task }) => (
    <div className="bg-white/80 rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <button
            onClick={() => handleComplete(task.id)}
            className="mt-1 p-1 hover:bg-gray-100 rounded transition-colors"
          >
            {task.completedAt ? (
              <CheckCircle size={20} className="text-green-600" />
            ) : (
              <Circle size={20} className="text-gray-400 hover:text-green-500" />
            )}
          </button>
          
          <div className="flex-1">
            <p className={`text-gray-800 font-medium leading-relaxed ${
              task.completedAt ? 'line-through opacity-60' : ''
            }`}>
              {task.content}
            </p>
            
            {task.tags.length > 0 && (
              <div className="flex gap-1 flex-wrap mt-2">
                {task.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            
            <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
              <Clock size={12} />
              <span>{new Date(task.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => handleSendToNow(task)}
            className="p-1 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
            title="Send to Now"
          >
            <Target size={16} />
          </button>
          <button
            onClick={() => handleSnooze(task.id)}
            className="p-1 text-gray-400 hover:bg-gray-100 rounded transition-colors"
            title="Snooze 1h"
          >
            <Clock size={16} />
          </button>
        </div>
      </div>
    </div>
  );
  
  const EnergyGroup: React.FC<{ 
    title: string; 
    icon: React.ReactNode; 
    tasks: Task[]; 
    color: string;
    description: string;
  }> = ({ title, icon, tasks, color, description }) => {
    if (tasks.length === 0) return null;
    
    return (
      <div className={`rounded-2xl border-2 p-6 ${color}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-white/80 rounded-lg flex items-center justify-center">
            {icon}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
          <div className="ml-auto bg-white/60 rounded-full px-3 py-1 text-sm font-medium text-gray-700">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''}
          </div>
        </div>
        
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-amber-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
            <Sun className="text-orange-600" size={36} />
            Today's Focus
          </h1>
          <p className="text-gray-600 font-medium">
            Organize your day by energy levels. Match tasks to how you feel.
          </p>
        </div>

        {/* Summary Stats */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-orange-200 p-6 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-orange-600">{todayTasks.length}</div>
              <div className="text-sm text-gray-600">Today's Tasks</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {todayTasks.filter(t => t.completedAt).length}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-indigo-600">
                {todayTasks.filter(t => t.tags.includes('now')).length}
              </div>
              <div className="text-sm text-gray-600">Ready Now</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {Math.round((todayTasks.filter(t => t.completedAt).length / Math.max(todayTasks.length, 1)) * 100)}%
              </div>
              <div className="text-sm text-gray-600">Progress</div>
            </div>
          </div>
        </div>

        {todayTasks.length === 0 ? (
          /* Empty state */
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
            <div className="text-6xl mb-4">☀️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No tasks for today!</h2>
            <p className="text-gray-600 mb-6">
              Add some tasks in the Unpack view, or check your Later list to move items to today.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-blue-800 text-sm">
                💡 Pro tip: Use tags like #today, #urgent, or #must_today to automatically show tasks here.
              </p>
            </div>
          </div>
        ) : (
          /* Energy groups */
          <div className="space-y-6">
            <EnergyGroup
              title="High Energy Tasks"
              icon={<Zap className="text-red-600" size={20} />}
              tasks={groupedTasks.high_energy}
              color="bg-red-50 border-red-200"
              description="When you're feeling energized and focused"
            />
            
            <EnergyGroup
              title="Creative Work"
              icon={<Zap className="text-purple-600" size={20} />}
              tasks={groupedTasks.creative}
              color="bg-purple-50 border-purple-200"
              description="Best tackled when your creative mind is flowing"
            />
            
            <EnergyGroup
              title="Administrative Tasks"
              icon={<Battery className="text-blue-600" size={20} />}
              tasks={groupedTasks.admin}
              color="bg-blue-50 border-blue-200"
              description="Routine tasks that need steady focus"
            />
            
            <EnergyGroup
              title="Quick Wins"
              icon={<Coffee className="text-green-600" size={20} />}
              tasks={groupedTasks.low_energy}
              color="bg-green-50 border-green-200"
              description="Easy tasks perfect for low-energy moments"
            />
            
            <EnergyGroup
              title="Other Tasks"
              icon={<Target className="text-gray-600" size={20} />}
              tasks={groupedTasks.other}
              color="bg-gray-50 border-gray-200"
              description="Tasks without specific energy requirements"
            />
          </div>
        )}

        {/* Energy Guide */}
        <div className="mt-8 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            🎯 Energy Level Guide
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <Zap className="text-red-600 mx-auto mb-2" size={20} />
              <strong className="text-red-700">High Energy</strong>
              <p className="text-gray-600 mt-1">Complex problems, important decisions, challenging tasks</p>
            </div>
            
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <Zap className="text-purple-600 mx-auto mb-2" size={20} />
              <strong className="text-purple-700">Creative</strong>
              <p className="text-gray-600 mt-1">Writing, designing, brainstorming, innovative work</p>
            </div>
            
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <Battery className="text-blue-600 mx-auto mb-2" size={20} />
              <strong className="text-blue-700">Admin</strong>
              <p className="text-gray-600 mt-1">Emails, organizing, data entry, routine tasks</p>
            </div>
            
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <Coffee className="text-green-600 mx-auto mb-2" size={20} />
              <strong className="text-green-700">Quick Wins</strong>
              <p className="text-gray-600 mt-1">Simple tasks, easy calls, quick responses</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};