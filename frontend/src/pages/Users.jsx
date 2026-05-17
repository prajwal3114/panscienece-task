import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import api from '../api/axios';
import { LogOut, LayoutDashboard, Users as UsersIcon, Trash2, Edit } from 'lucide-react';

const Sidebar = ({ onLogout, isAdmin }) => (
  <aside className="w-64 bg-gray-900 border-r border-gray-800 h-full flex flex-col p-4 shadow-xl">
    <div className="text-2xl font-black tracking-wider mb-10 mt-2 flex items-center gap-3 text-blue-500">
      <LayoutDashboard size={28} />
      TaskFlow
    </div>
    
    <nav className="flex-1 space-y-2">
      <a href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-all font-medium">
        <LayoutDashboard size={20} />
        Dashboard
      </a>
      {isAdmin && (
        <a href="/users" className="flex items-center gap-3 px-4 py-3 bg-blue-600/20 text-blue-400 rounded-xl transition-all font-medium">
          <UsersIcon size={20} />
          Manage Users
        </a>
      )}
    </nav>

    <button onClick={onLogout} className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-all mt-auto font-medium">
      <LogOut size={20} />
      Logout
    </button>
  </aside>
);

const Users = () => {
  const dispatch = useDispatch();
  const { userInfo } = useSelector(state => state.auth);
  const [users, setUsers] = useState([]);
  
  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ id: '', name: '', email: '', password: '', role: 'USER' });

  useEffect(() => {
    if (userInfo?.role === 'ADMIN') {
      fetchUsers();
    }
  }, [page]);

  const fetchUsers = async () => {
    try {
      const res = await api.get(`/users?page=${page}&limit=10`);
      setUsers(res.data.data);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error('Failed to fetch users', err);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await api.put(`/users/${formData.id}`, { name: formData.name, email: formData.email, role: formData.role });
      } else {
        await api.post('/users', formData);
      }
      setShowModal(false);
      resetForm();
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert('Operation failed. Check if email already exists.');
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm('Delete user?')) return;
    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setFormData({ id: '', name: '', email: '', password: '', role: 'USER' });
    setIsEditing(false);
  };
  
  const openEdit = (u) => {
    setFormData({ id: u.id, name: u.name, email: u.email, password: '', role: u.role });
    setIsEditing(true);
    setShowModal(true);
  };

  if (userInfo?.role !== 'ADMIN') {
    return <div className="p-10 text-white bg-gray-950 h-screen">Access Denied. Admins only.</div>;
  }

  return (
    <div className="flex h-screen bg-gray-950 text-white font-sans overflow-hidden">
      <Sidebar onLogout={handleLogout} isAdmin={userInfo?.role === 'ADMIN'} />
      
      <main className="flex-1 p-8 overflow-y-auto relative">
        <header className="flex justify-between items-end mb-10 pb-6 border-b border-gray-800">
          <div>
            <h1 className="text-4xl font-extrabold mb-2 tracking-tight">Manage Users</h1>
            <p className="text-gray-400 text-lg">Admin dashboard for user administration.</p>
          </div>
          <button onClick={() => { resetForm(); setShowModal(true); }} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 font-semibold rounded-xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20">
            + Add User
          </button>
        </header>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-800/50 text-gray-400 text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold">Name</th>
                <th className="p-4 font-semibold">Email</th>
                <th className="p-4 font-semibold">Role</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="p-4 font-medium">{u.name}</td>
                  <td className="p-4 text-gray-400">{u.email}</td>
                  <td className="p-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      u.role === 'ADMIN' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4 flex justify-end gap-2">
                    <button onClick={() => openEdit(u)} className="p-2 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDelete(u.id)} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="p-4 border-t border-gray-800 flex justify-between items-center bg-gray-900/50">
             <span className="text-sm text-gray-400">Page {page} of {Math.max(1, totalPages)}</span>
             <div className="flex gap-2">
               <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 bg-gray-800 border border-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-700 text-sm">Prev</button>
               <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 bg-gray-800 border border-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-700 text-sm">Next</button>
             </div>
          </div>
        </div>

        {showModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                <div className="bg-gray-900 border border-gray-700 shadow-2xl p-8 rounded-2xl w-full max-w-md">
                    <h2 className="text-2xl font-bold mb-6 text-white">{isEditing ? 'Edit User' : 'Create User'}</h2>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Name</label>
                            <input className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white outline-none" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Email</label>
                            <input type="email" className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none text-white" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                        </div>
                        
                        {!isEditing && (
                          <div>
                              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Password</label>
                              <input type="password" minLength="6" className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none text-white" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                          </div>
                        )}

                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Role</label>
                            <select className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-blue-500 text-white outline-none" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                                <option value="USER">User</option>
                                <option value="ADMIN">Admin</option>
                            </select>
                        </div>

                        <div className="flex justify-end gap-3 mt-4">
                            <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-gray-400 hover:text-white font-medium">Cancel</button>
                            <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/20 font-medium">{isEditing ? 'Update User' : 'Create User'}</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
      </main>
    </div>
  );
};

export default Users;