import React from 'react';
import { CalendarDays } from 'lucide-react';
import { useMindnestStore } from '../store';
import { startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';

export const CalendarView: React.FC = () => {
  const { todos, thoughts } = useMindnestStore();

  const datedTodos = todos.filter(t => t.dueDate);
  const datedThoughts = thoughts.filter(t => (t as any).dueDate);

  const events = [
    ...datedTodos.map(t => ({ id: t.id, title: t.content, date: new Date(t.dueDate as Date), kind: 'todo' as const })),
    ...datedThoughts.map(t => ({ id: t.id, title: t.content, date: new Date((t as any).dueDate), kind: 'thought' as const }))
  ];

  const today = new Date();
  const days = eachDayOfInterval({ start: startOfMonth(today), end: endOfMonth(today) });

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-5xl mx-auto">
        <header className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2 justify-center"><CalendarDays className="text-emerald-600" /> Calendar</h1>
          <p className="text-gray-600">Tasks & events with dates</p>
        </header>

        <div className="grid grid-cols-7 gap-2 text-sm">
          {days.map(d => {
            const dayEvents = events.filter(e => isSameDay(e.date, d));
            return (
              <div key={d.toISOString()} className={`p-2 rounded-lg border ${isSameDay(d,today)?'bg-emerald-50 border-emerald-300':'bg-white border-gray-200'}`}>
                <div className="font-semibold mb-1">{d.getDate()}</div>
                {dayEvents.map(ev => (
                  <div key={ev.id} className="bg-emerald-100 text-emerald-800 px-1 py-0.5 rounded mb-1 truncate" title={ev.title}>{ev.title}</div>
                ))}
              </div>
            );
          })}
        </div>

        {events.length === 0 && (
          <div className="text-center py-20 bg-white mt-6 rounded-lg border border-gray-200">
            <p className="text-gray-600">No dated tasks or events yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};
