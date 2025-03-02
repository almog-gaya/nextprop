"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed';
  type: 'unread-message' | 'missed-call' | 'client-involvement' | 'lead-notification' | 'upload-contacts' | 'other';
}

// Sample data for demonstration
const SAMPLE_TASKS: Task[] = [
  {
    id: 't1',
    title: 'Respond to John Smith SMS',
    description: 'Client asked about the selling process and timeline',
    dueDate: '2023-03-18',
    priority: 'high',
    status: 'pending',
    type: 'unread-message'
  },
  {
    id: 't2',
    title: 'Call back Sarah Johnson',
    description: 'Missed call at 3:45 PM',
    dueDate: '2023-03-17',
    priority: 'medium',
    status: 'pending',
    type: 'missed-call'
  },
  {
    id: 't3',
    title: 'Client review for Robert Williams contract',
    description: 'Contract terms need client approval',
    dueDate: '2023-03-16',
    priority: 'high',
    status: 'in-progress',
    type: 'client-involvement'
  },
  {
    id: 't4',
    title: 'New lead: Michael Thompson',
    description: 'Progressed to Motivation stage, needs follow-up',
    dueDate: '2023-03-19',
    priority: 'medium',
    status: 'pending',
    type: 'lead-notification'
  },
  {
    id: 't5',
    title: 'Upload new contact list',
    description: 'Current list at 50% depletion',
    dueDate: '2023-03-22',
    priority: 'low',
    status: 'pending',
    type: 'upload-contacts'
  }
];

export default function TaskManagementView() {
  const [tasks, setTasks] = useState<Task[]>(SAMPLE_TASKS);
  const [filter, setFilter] = useState<string>('all');
  
  // Filter tasks based on selected filter
  const filteredTasks = filter === 'all' 
    ? tasks 
    : tasks.filter(task => task.type === filter || task.priority === filter || task.status === filter);
  
  // Count tasks by type
  const unreadMessages = tasks.filter(task => task.type === 'unread-message').length;
  const missedCalls = tasks.filter(task => task.type === 'missed-call').length;
  const overdueTasks = tasks.filter(task => new Date(task.dueDate) < new Date() && task.status !== 'completed').length;
  const clientInvolvement = tasks.filter(task => task.type === 'client-involvement').length;
  const leadNotifications = tasks.filter(task => task.type === 'lead-notification').length;
  const uploadContacts = tasks.filter(task => task.type === 'upload-contacts').length;
  
  // Task priority colors
  const priorityColors = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-amber-100 text-amber-800',
    high: 'bg-red-100 text-red-800',
  };
  
  // Task status colors
  const statusColors = {
    'pending': 'bg-gray-100 text-gray-800',
    'in-progress': 'bg-purple-100 text-purple-800',
    'completed': 'bg-green-100 text-green-800',
  };
  
  // Task type icons (using emoji for simplicity, but would use proper icons in production)
  const typeIcons = {
    'unread-message': '💬',
    'missed-call': '📞',
    'client-involvement': '👥',
    'lead-notification': '🔔',
    'upload-contacts': '📁',
    'other': '📌',
  };
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-4">
        <h2 className="text-2xl font-bold">Task Management</h2>
        <p className="text-muted-foreground">
          Manage tasks for the distressed homeowners pipeline
        </p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter(filter === 'unread-message' ? 'all' : 'unread-message')}>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl mb-1">💬</div>
              <div className="text-xl font-bold">{unreadMessages}</div>
              <div className="text-sm text-muted-foreground">Unread Messages</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter(filter === 'missed-call' ? 'all' : 'missed-call')}>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl mb-1">📞</div>
              <div className="text-xl font-bold">{missedCalls}</div>
              <div className="text-sm text-muted-foreground">Missed Calls</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter(filter === 'high' ? 'all' : 'high')}>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl mb-1">⚠️</div>
              <div className="text-xl font-bold">{overdueTasks}</div>
              <div className="text-sm text-muted-foreground">Overdue Tasks</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter(filter === 'client-involvement' ? 'all' : 'client-involvement')}>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl mb-1">👥</div>
              <div className="text-xl font-bold">{clientInvolvement}</div>
              <div className="text-sm text-muted-foreground">Client Involvement</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter(filter === 'lead-notification' ? 'all' : 'lead-notification')}>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl mb-1">🔔</div>
              <div className="text-xl font-bold">{leadNotifications}</div>
              <div className="text-sm text-muted-foreground">New Leads</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter(filter === 'upload-contacts' ? 'all' : 'upload-contacts')}>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl mb-1">📁</div>
              <div className="text-xl font-bold">{uploadContacts}</div>
              <div className="text-sm text-muted-foreground">Upload Contacts</div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="bg-white rounded-md shadow overflow-hidden mt-8">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">
            {filter === 'all' ? 'All Tasks' : `Filtered Tasks (${filteredTasks.length})`}
          </h3>
          <div className="flex space-x-2">
            <button 
              className={`px-3 py-1 rounded-md ${filter === 'all' ? 'bg-primary text-white' : 'bg-gray-100'}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button 
              className={`px-3 py-1 rounded-md ${filter === 'high' ? 'bg-primary text-white' : 'bg-gray-100'}`}
              onClick={() => setFilter(filter === 'high' ? 'all' : 'high')}
            >
              High Priority
            </button>
            <button 
              className={`px-3 py-1 rounded-md ${filter === 'pending' ? 'bg-primary text-white' : 'bg-gray-100'}`}
              onClick={() => setFilter(filter === 'pending' ? 'all' : 'pending')}
            >
              Pending
            </button>
          </div>
        </div>
        
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTasks.length > 0 ? (
              filteredTasks.map(task => (
                <tr key={task.id}>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{task.title}</div>
                    <div className="text-sm text-gray-500">{task.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-xl mr-2">{typeIcons[task.type]}</span>
                      <span className="text-sm text-gray-500">
                        {task.type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(task.dueDate) < new Date() && task.status !== 'completed' 
                      ? <span className="text-red-600 font-medium">{task.dueDate} (Overdue)</span>
                      : task.dueDate
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${priorityColors[task.priority]}`}>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${statusColors[task.status]}`}>
                      {task.status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                      Edit
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  No tasks found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 