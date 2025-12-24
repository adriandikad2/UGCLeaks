'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { hasAccess, getToken } from '@/lib/auth';
import { ToastContainer, useToast } from '@/app/Toast';
import { useTheme } from '../../components/ThemeContext';

type User = {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'editor' | 'owner';
};

export default function ManageRolesPage() {
  const router = useRouter();
  const { toasts, addToast, removeToast } = useToast();
  const { isGrayscale, toggleTheme, buttonText } = useTheme();

  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<'user' | 'editor' | 'owner'>('user');
  const [loading, setLoading] = useState(false);
  const [confirmMode, setConfirmMode] = useState(false);

  // Check if user is owner
  useEffect(() => {
    if (!hasAccess('owner')) {
      addToast('Only owners can access this page', 'error');
      router.push('/');
    }
  }, [router, addToast]);

  // Search for users
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      addToast('Please enter a username', 'error');
      return;
    }

    setLoading(true);
    try {
      const token = getToken();
      const response = await fetch(`http://localhost:5000/api/users/search?username=${encodeURIComponent(searchTerm)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        addToast('User not found', 'error');
        setSelectedUser(null);
        setLoading(false);
        return;
      }

      const data = await response.json();
      setSelectedUser(data);
      setSelectedRole(data.role);
      setConfirmMode(false);
      addToast(`Found user: ${data.username}`, 'success');
    } catch (error) {
      addToast('Failed to search user', 'error');
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update user role
  const handleUpdateRole = async () => {
    if (!selectedUser || !confirmMode) {
      addToast('Please confirm the role change', 'error');
      return;
    }

    setLoading(true);
    try {
      const token = getToken();
      const response = await fetch('http://localhost:5000/api/auth/grant-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          targetUserId: selectedUser.id,
          newRole: selectedRole,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        addToast(`Failed to update role: ${error.error}`, 'error');
        return;
      }

      setSelectedUser(prev => prev ? { ...prev, role: selectedRole } : null);
      setConfirmMode(false);
      addToast(`Successfully updated ${selectedUser.username} to ${selectedRole}`, 'success');
    } catch (error) {
      addToast('Failed to update role', 'error');
      console.error('Update error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className={`min-h-screen p-6 md:p-10 transition-all duration-700 ${isGrayscale ? 'grayscale bg-gray-900' : 'bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600'}`}>
      {/* --- THEME TOGGLE --- */}
      <button
        onClick={toggleTheme}
        className="fixed top-6 right-6 z-40 px-6 py-2 rounded-full border-2 border-white/50 bg-black/20 backdrop-blur-md text-white font-bold tracking-widest hover:bg-white hover:text-black transition-all duration-300 group"
      >
        <span className="animate-pulse group-hover:animate-none">{buttonText}</span>
      </button>

      {/* --- HOME LINK --- */}
      <Link href="/schedule">
        <button className="fixed top-6 left-6 z-40 px-6 py-2 rounded-full border-2 border-white/50 bg-black/20 backdrop-blur-md text-white font-bold tracking-widest hover:bg-white hover:text-black transition-all duration-300">
          ← Back
        </button>
      </Link>

      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="max-w-2xl mx-auto mt-12">
        {/* --- TITLE --- */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black text-white drop-shadow-2xl mb-2">👥 Manage User Roles</h1>
          <p className="text-white/80">Search for users and update their roles</p>
        </div>

        {/* --- SEARCH BOX --- */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 border-2 border-white/20 mb-8">
          <label className="block text-white font-bold mb-3 uppercase tracking-wide">🔍 Search Username</label>
          <div className="flex gap-3 mb-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter username..."
              className="flex-1 px-4 py-3 rounded-lg border-2 border-blue-400 focus:outline-none focus:border-blue-600 text-gray-800 font-semibold"
              disabled={loading}
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-pink-600 text-white font-bold rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? '⏳' : '🔎'}
            </button>
          </div>
        </div>

        {/* --- USER DETAILS --- */}
        {selectedUser && (
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 border-2 border-white/20">
            <div className="mb-6">
              <p className="text-white/70 text-sm uppercase tracking-wide">Username</p>
              <p className="text-white text-2xl font-bold">{selectedUser.username}</p>
            </div>

            <div className="mb-6">
              <p className="text-white/70 text-sm uppercase tracking-wide">Email</p>
              <p className="text-white text-lg">{selectedUser.email}</p>
            </div>

            <div className="mb-6">
              <label className="block text-white font-bold mb-3 uppercase tracking-wide">Current Role</label>
              <p className="inline-block px-4 py-2 bg-blue-600 text-white rounded-full font-bold">
                {/* FIX 2: Add Optional Chaining just in case */}
                {selectedUser.role?.toUpperCase() || 'UNKNOWN'}
              </p>
            </div>

            {/* --- ROLE SELECTOR --- */}
            <div className="mb-6">
              <label className="block text-white font-bold mb-3 uppercase tracking-wide">New Role</label>
              <select
                value={selectedRole}
                onChange={(e) => {
                    setSelectedRole(e.target.value as 'user' | 'editor' | 'owner');
                    setConfirmMode(false); // Reset confirmation when selection changes
                }}
                disabled={loading}
                className="w-full px-4 py-3 rounded-lg border-2 border-blue-400 focus:outline-none focus:border-blue-600 text-gray-800 font-semibold disabled:opacity-50"
              >
                <option value="user">👤 User (Read-only)</option>
                <option value="editor">✏️ Editor (Can create schedules)</option>
                <option value="owner">👑 Owner (Admin access)</option>
              </select>
            </div>

            {/* --- CONFIRMATION CHECKBOX --- */}
            <div className="mb-6">
              <label className={`flex items-center gap-3 cursor-pointer ${selectedRole === selectedUser.role ? 'opacity-50' : 'opacity-100'}`}>
                <input
                  type="checkbox"
                  checked={confirmMode}
                  onChange={(e) => setConfirmMode(e.target.checked)}
                  // Keep checkbox disabled if roles are identical (no change to confirm)
                  disabled={selectedRole === selectedUser.role}
                  className="w-5 h-5 rounded cursor-pointer"
                />
                <span className="text-white font-bold">
                  Confirm changing {selectedUser.username}'s role to {selectedRole.toUpperCase()}
                </span>
              </label>
            </div>

            {/* --- ACTION BUTTONS --- */}
            <div className="flex gap-3">
              <button
                onClick={handleUpdateRole}
                disabled={!confirmMode || loading || selectedRole === selectedUser.role}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase"
              >
                {loading ? '⏳ Updating...' : '✅ Update Role'}
              </button>
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setSearchTerm('');
                  setConfirmMode(false);
                }}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gray-600 text-white font-bold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 uppercase"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* --- NO USER SELECTED --- */}
        {!selectedUser && searchTerm && !loading && (
          <div className="text-center text-white/60 text-lg">
            No user found. Try another username.
          </div>
        )}
      </div>
    </div>
  );
}
