import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import api from '../api/axios';
import { LogOut, LayoutDashboard, CheckSquare, Trash2, Paperclip, CheckCircle } from 'lucide-react';

const Sidebar = ({ onLogout }) => (
  <aside className="w-64 bg-gray-900 border-r border-gray-800 h-full flex flex-col p-4 shadow-xl">
    <div className="text-2xl font-black tracking-wider mb-10 mt-2 flex items-center gap-3 text-blue-500">
      <CheckSquare size={28} />
      TaskFlow
    </div>
    
    <nav className="flex-1 space-y-2">
      <a href="#" className="flex items-center gap-3 px-4 py-3 bg-blue-600/20 text-blue-400 rounded-xl transition-all font-medium">
        <LayoutDashboard size={20} />
        Dashboard
      </a>
      {/* Add more links... */}
    </nav>

    <button onClick={onLogout} className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-all mt-auto font-medium">
      <LogOut size={20} />
      Logout
    </button>
  </aside>
);

const TaskItem = ({ task, onUpdateStatus, onDelete, onUpload }) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onUpload(task.id, file);
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700/50 rounded-xl p-5 flex justify-between items-center hover:bg-gray-750 hover:border-gray-600 transition-all shadow-sm">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-1">
          <h4 className={`font-semibold text-lg ${task.status === 'DONE' ? 'line-through text-gray-500' : 'text-white'}`}>
            {task.title}
          </h4>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
            task.priority === 'HIGH' || task.priority === 'URGENT' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
            task.priority === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
            'bg-blue-500/10 text-blue-400 border border-blue-500/20'
          }`}>
            {task.priority}
          </span>
        </div>
        <p className="text-sm text-gray-400">{task.description}</p>
        
        {/* Attachments rendering */}
        {task.attachments && task.attachments.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {task.attachments.map(att => (
               <a 
                 key={att.id} 
                 href={`http://localhost:5000${att.url}`} 
                 target="_blank" 
                 rel="noreferrer"
                 className="flex items-center gap-1 text-xs text-blue-400 bg-blue-900/20 w-fit px-2 py-1 rounded-md hover:bg-blue-900/40 transition-colors"
               >
                 <Paperclip size={12} />
                 {att.filename}
               </a>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <input 
          type="file"
          accept="application/pdf"
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileChange} 
        />
        <button 
            onClick={() => fileInputRef.current.click()}
            className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
            title="Attach File"
        >
            <Paperclip size={18} />
        </button>

        <button 
            onClick={() => onUpdateStatus(task.id, task.status)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
              task.status === 'DONE' 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' 
                : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
            }`}
            title="Click to advance status"
        >
          {task.status.replace('_', ' ')}
        </button>
        
        <button onClick={() => onDelete(task.id)} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
            <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const dispatch = useDispatch();
  const { userInfo } = useSelector(state => state.auth);
  const [tasks, setTasks] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  
  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDesc, setSortDesc] = useState(true);
  
  // Modal states
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', status: 'TODO', priority: 'MEDIUM' });

  useEffect(() => {
    fetchData();
  }, [page, sortBy, sortDesc]);

  const fetchData = async () => {
    try {
      const [wsRes, taskRes] = await Promise.all([
        api.get('/workspaces'),
        api.get(`/tasks?page=${page}&limit=50&sortBy=${sortBy}&sortDesc=${sortDesc}`)
      ]);
      setWorkspaces(wsRes.data.data || wsRes.data);
      const fetchedTasks = taskRes.data.data || taskRes.data;
      setTasks(fetchedTasks);
      setTotalPages(taskRes.data.totalPages || 1);
    } catch (err) {
      console.error('Failed to fetch data', err);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!workspaces.length) return alert('No workspace found. Please create a workspace first.');
    
    try {
      await api.post('/tasks', {
        ...newTask,
        workspaceId: workspaces[0].id // Defaulting to the first workspace
      });
      setShowTaskModal(false);
      setNewTask({ title: '', description: '', status: 'TODO', priority: 'MEDIUM' });
      fetchData(); // Refresh list
    } catch (error) {
      console.error("Failed to create task", error);
      alert('Failed to create task');
    }
  };
  
  const handleDeleteTask = async (id) => {
      try {
          await api.delete(`/tasks/${id}`);
          fetchData();
      } catch (err) {
          console.error("Failed to delete", err);
      }
  };
  
  const handleUpdateStatus = async (id, currentStatus) => {
      const statuses = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
      const nextIndex = (statuses.indexOf(currentStatus) + 1) % statuses.length;
      try {
          await api.put(`/tasks/${id}`, { status: statuses[nextIndex] });
          fetchData();
      } catch (err) {
          console.error("Failed to update status", err);
      }
  };

  const handleFileUpload = async (taskId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      await api.post(`/tasks/${taskId}/attachments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      fetchData(); // refresh to show attachment count
    } catch (err) {
      console.error("Failed to upload file", err);
      alert('Failed to upload file');
    }
  };

  const activeTasks = tasks.filter(t => t.status !== 'DONE');
  const completedTasks = tasks.filter(t => t.status === 'DONE');

  return (
    <div className="flex h-screen bg-gray-950 text-white font-sans overflow-hidden">
      <Sidebar onLogout={handleLogout} />
      
      <main className="flex-1 p-8 overflow-y-auto relative">
        <header className="flex justify-between items-end mb-10 pb-6 border-b border-gray-800">
          <div>
            <h1 className="text-4xl font-extrabold mb-2 tracking-tight">Hello, {userInfo?.name}</h1>
            <p className="text-gray-400 text-lg">Here is what's happening with your projects today.</p>
          </div>
          <button onClick={() => setShowTaskModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 font-semibold rounded-xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20 active:scale-95">
            + New Task
          </button>
        </header>

        {/* Basic Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 p-6 rounded-2xl shadow-sm">
            <h3 className="text-gray-400 font-medium text-sm uppercase tracking-wider mb-2">Active Tasks</h3>
            <p className="text-4xl font-black text-white">{activeTasks.length}</p>
          </div>
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 p-6 rounded-2xl shadow-sm">
            <h3 className="text-gray-400 font-medium text-sm uppercase tracking-wider mb-2">Completed Tasks</h3>
            <p className="text-4xl font-black text-emerald-400">{completedTasks.length}</p>
          </div>
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 p-6 rounded-2xl shadow-sm">
            <h3 className="text-gray-400 font-medium text-sm uppercase tracking-wider mb-2">Workspaces</h3>
            <p className="text-4xl font-black text-blue-400">{workspaces.length}</p>
          </div>
        </div>
        
        {/* Filters and Controls */}
        <div className="flex justify-between items-center mb-8 gap-4 bg-gray-900/50 p-4 rounded-xl border border-gray-800">
           <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wilder">Sort By:</span>
              <select className="bg-gray-800 border border-gray-700 text-sm text-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 outline-none" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                 <option value="createdAt">Date Created</option>
                 <option value="priority">Priority</option>
                 <option value="title">Title</option>
              </select>
              <button onClick={() => setSortDesc(!sortDesc)} className="text-sm bg-gray-800 border border-gray-700 p-2 rounded-lg hover:bg-gray-700 transition font-medium">
                 {sortDesc ? 'Descending ▼' : 'Ascending ▲'}
              </button>
           </div>
           
           <div className="flex items-center gap-2">
             <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 bg-gray-800 border border-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-700">Prev</button>
             <span className="text-sm text-gray-400">Page {page} of {Math.max(1, totalPages)}</span>
             <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 bg-gray-800 border border-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-700">Next</button>
           </div>
        </div>

        {/* Task Boards Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
            
            {/* Active Tasks Column */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <h2 className="text-2xl font-bold">Active</h2>
                <span className="text-sm bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">{activeTasks.length}</span>
              </div>
              <div className="space-y-4">
                {activeTasks.length === 0 ? (
                  <div className="p-8 border-2 border-dashed border-gray-800 rounded-2xl text-center text-gray-500">
                      No active tasks. You're all caught up!
                  </div>
                ) : (
                  activeTasks.map(task => (
                    <TaskItem 
                        key={task.id} 
                        task={task} 
                        onUpdateStatus={handleUpdateStatus} 
                        onDelete={handleDeleteTask}
                        onUpload={handleFileUpload}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Completed Tasks Column */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <h2 className="text-2xl font-bold">Done</h2>
                <span className="text-sm bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">{completedTasks.length}</span>
              </div>
              <div className="space-y-4 opacity-70 hover:opacity-100 transition-opacity">
                {completedTasks.length === 0 ? (
                  <div className="p-8 border-2 border-dashed border-gray-800 rounded-2xl text-center text-gray-500">
                      Completed tasks will appear here.
                  </div>
                ) : (
                  completedTasks.map(task => (
                    <TaskItem 
                        key={task.id} 
                        task={task} 
                        onUpdateStatus={handleUpdateStatus} 
                        onDelete={handleDeleteTask}
                        onUpload={handleFileUpload}
                    />
                  ))
                )}
              </div>
            </div>
            
        </div>
        
        {/* Simple Modal */}
        {showTaskModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                <div className="bg-gray-900 border border-gray-700 shadow-2xl p-8 rounded-2xl w-full max-w-md transform transition-all">
                    <h2 className="text-2xl font-bold mb-6 text-white">Create New Task</h2>
                    <form onSubmit={handleCreateTask} className="flex flex-col gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Title</label>
                            <input className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white outline-none transition-all" placeholder="E.g. Setup database schema" required value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} />
                        </div>
                        
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Description</label>
                            <textarea className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white outline-none transition-all min-h-[100px]" placeholder="Add details..." value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})}></textarea>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Priority</label>
                            <select className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-blue-500 text-white outline-none" value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})}>
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                                <option value="URGENT">Urgent</option>
                            </select>
                        </div>

                        <div className="flex justify-end gap-3 mt-4">
                            <button type="button" onClick={() => setShowTaskModal(false)} className="px-5 py-2.5 text-gray-400 hover:text-white transition-colors font-medium">Cancel</button>
                            <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/20 font-medium transition-all">Create Task</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
