import React, { useState } from 'react';
import { CelebrationEvent, PlanningTask, TaskStatus, TaskPriority } from '../types';
import { exportIcsCalendar, calculateEventReadiness } from '../services/rippleEngine';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  Plus, 
  Download, 
  Filter, 
  Check, 
  AlertTriangle,
  ChevronRight,
  Building2,
  Share2
} from 'lucide-react';

interface TimelineViewProps {
  event: CelebrationEvent;
  onUpdateEvent: (updatedEvent: CelebrationEvent) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  event,
  onUpdateEvent
}) => {
  const [selectedFunctionId, setSelectedFunctionId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);

  // New task form state
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState(event.startDate);
  const [newTaskFunctionId, setNewTaskFunctionId] = useState<string>('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('medium');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');

  const handleToggleTaskStatus = (taskId: string) => {
    const updatedTasks = event.tasks.map(t => {
      if (t.id !== taskId) return t;
      const nextStatus: TaskStatus = t.status === 'completed' ? 'in_progress' : 'completed';
      return { ...t, status: nextStatus };
    });

    const updatedEvent: CelebrationEvent = {
      ...event,
      tasks: updatedTasks,
      updatedAt: new Date().toISOString()
    };

    // Recompute readiness
    updatedEvent.readinessScore = calculateEventReadiness(updatedEvent).score;
    onUpdateEvent(updatedEvent);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;

    const newTask: PlanningTask = {
      id: `task-${Date.now()}`,
      name: newTaskName.trim(),
      description: newTaskDesc.trim() || 'Task details',
      dueDate: newTaskDueDate,
      originalDueDate: newTaskDueDate,
      functionId: newTaskFunctionId || undefined,
      category: 'Coordination',
      status: 'not_started',
      priority: newTaskPriority,
      assignedTo: newTaskAssignee || undefined,
      dependencies: []
    };

    const updatedEvent: CelebrationEvent = {
      ...event,
      tasks: [...event.tasks, newTask],
      updatedAt: new Date().toISOString()
    };
    updatedEvent.readinessScore = calculateEventReadiness(updatedEvent).score;
    onUpdateEvent(updatedEvent);

    setNewTaskName('');
    setNewTaskDesc('');
    setShowAddTaskModal(false);
  };

  const handleDownloadCalendar = () => {
    const icsContent = exportIcsCalendar(event);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.name.replace(/\s+/g, '_')}_calendar.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter tasks
  const filteredTasks = event.tasks.filter(t => {
    if (selectedFunctionId !== 'all' && t.functionId !== selectedFunctionId) return false;
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    return true;
  });

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#405B43]/15 text-[#405B43] flex items-center gap-1"><Check className="w-2.5 h-2.5" /> Done</span>;
      case 'overdue':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C76F50]/15 text-[#C76F50] flex items-center gap-1"><AlertCircle className="w-2.5 h-2.5" /> Overdue</span>;
      case 'blocked':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E7A83E]/20 text-[#B45309] flex items-center gap-1"><AlertTriangle className="w-2.5 h-2.5" /> Blocked</span>;
      case 'in_progress':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#405B43]/10 text-[#405B43]">In Progress</span>;
      case 'not_started':
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF7F0] text-[#77756B] border border-[#E7E0D3]">To Do</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-[#FFFDF9] border border-[#E7E0D3] rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-[#EDF3EC] text-[#405B43] border border-[#DCE6D6]">
              Adaptive Timeline
            </span>
            <span className="text-xs text-[#77756B]">Lead-Time Recalculations & ICS Synchronization</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-[#302F28]">Multi-Function Schedule & Deadlines</h1>
          <p className="text-xs text-[#77756B] mt-1">
            Dynamic milestone tracker. Date shifts in the Ripple Engine automatically recalculate critical task deadlines.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleDownloadCalendar}
            className="px-4 py-2.5 rounded-xl border border-[#E7E0D3] hover:bg-[#FAF7F0] text-xs font-medium text-[#302F28] flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#405B43]" />
            <span>Download .ics Calendar</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddTaskModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[#405B43] hover:bg-[#324734] text-[#FAF7F0] font-semibold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Milestone Task</span>
          </button>
        </div>
      </div>

      {/* Function Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setSelectedFunctionId('all')}
          className={`px-4 py-2 rounded-2xl text-xs font-medium shrink-0 transition-colors cursor-pointer ${
            selectedFunctionId === 'all'
              ? 'bg-[#405B43] text-[#FAF7F0] shadow-xs'
              : 'bg-[#FFFDF9] border border-[#E7E0D3] text-[#77756B] hover:text-[#302F28]'
          }`}
        >
          All Combined Schedule ({event.tasks.length})
        </button>

        {event.functions.map((func) => (
          <button
            key={func.id}
            type="button"
            onClick={() => setSelectedFunctionId(func.id)}
            className={`px-4 py-2 rounded-2xl text-xs font-medium shrink-0 transition-colors cursor-pointer flex items-center gap-2 ${
              selectedFunctionId === func.id
                ? 'bg-[#405B43] text-[#FAF7F0] shadow-xs'
                : 'bg-[#FFFDF9] border border-[#E7E0D3] text-[#302F28] hover:border-[#405B43]/40'
            }`}
          >
            <span>{func.name}</span>
            <span className="text-[10px] opacity-75 font-mono">{func.date.split('-').slice(1).join('/')}</span>
          </button>
        ))}
      </div>

      {/* Tasks Table Card */}
      <div className="bg-[#FFFDF9] border border-[#E7E0D3] rounded-3xl overflow-hidden shadow-xs">
        <div className="p-4 bg-[#FAF7F0] border-b border-[#E7E0D3] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <span className="font-bold text-[#405B43] uppercase tracking-wider">
            Active Planning Milestones ({filteredTasks.length})
          </span>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[#77756B]">Filter Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1 rounded-xl border border-[#E7E0D3] bg-[#FFFDF9] text-xs text-[#302F28]"
            >
              <option value="all">All Statuses</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#77756B]">
            No milestones found matching the selected filter.
          </div>
        ) : (
          <div className="divide-y divide-[#E7E0D3]">
            {filteredTasks.map((task) => {
              const isDone = task.status === 'completed';
              return (
                <div 
                  key={task.id} 
                  className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    isDone ? 'bg-[#FAF7F0]/40 opacity-75' : 'hover:bg-[#FAF7F0]/30'
                  }`}
                >
                  <div className="flex items-start gap-3 sm:max-w-[65%]">
                    <button
                      type="button"
                      onClick={() => handleToggleTaskStatus(task.id)}
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 cursor-pointer transition-colors ${
                        isDone 
                          ? 'bg-[#405B43] border-[#405B43] text-white' 
                          : 'border-[#77756B]/40 hover:border-[#405B43] bg-[#FFFDF9]'
                      }`}
                      aria-label="Toggle task completed"
                    >
                      {isDone && <Check className="w-3.5 h-3.5" />}
                    </button>

                    <div>
                      <p className={`font-serif font-bold text-sm text-[#302F28] ${isDone ? 'line-through text-[#77756B]' : ''}`}>
                        {task.name}
                      </p>
                      <p className="text-xs text-[#77756B] mt-0.5">{task.description}</p>
                      
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-[#77756B] flex-wrap">
                        <span className="flex items-center gap-1 font-mono text-[#302F28]">
                          <Calendar className="w-3 h-3 text-[#405B43]" />
                          Due: {task.dueDate}
                        </span>
                        {task.assignedTo && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3 text-[#77756B]" />
                            {task.assignedTo}
                          </span>
                        )}
                        {task.functionId && (
                          <span className="bg-[#FAF7F0] px-2 py-0.2 rounded border border-[#E7E0D3] text-[10px]">
                            {event.functions.find(f => f.id === task.functionId)?.name || 'Function specific'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      task.priority === 'critical' ? 'bg-[#C76F50]/15 text-[#C76F50]' :
                      task.priority === 'high' ? 'bg-[#E7A83E]/15 text-[#B45309]' :
                      'bg-[#FAF7F0] text-[#77756B] border border-[#E7E0D3]'
                    }`}>
                      {task.priority}
                    </span>

                    {getStatusBadge(task.status)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <form onSubmit={handleAddTask} className="bg-[#FFFDF9] border border-[#E7E0D3] rounded-3xl p-6 max-w-md w-full shadow-xl">
            <h3 className="font-serif text-lg font-bold text-[#302F28] mb-1">Add Planning Milestone</h3>
            <p className="text-xs text-[#77756B] mb-4">Track connected deadlines across event functions.</p>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-medium text-[#302F28] mb-1">Task Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Confirm DJ Playlist & Sound Check"
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E7E0D3] bg-[#FAF7F0] text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#302F28] mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Deliverable details"
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E7E0D3] bg-[#FAF7F0] text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#302F28] mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E7E0D3] bg-[#FAF7F0] text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#302F28] mb-1">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E7E0D3] bg-[#FAF7F0] text-xs"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#302F28] mb-1">Assigned Person</label>
                <input
                  type="text"
                  placeholder="e.g. Aarav, Uncle Rajesh, Decor Lead"
                  value={newTaskAssignee}
                  onChange={(e) => setNewTaskAssignee(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E7E0D3] bg-[#FAF7F0] text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddTaskModal(false)}
                className="px-3.5 py-2 rounded-xl border border-[#E7E0D3] text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#405B43] text-[#FAF7F0] rounded-xl text-xs font-semibold"
              >
                Create Milestone
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
