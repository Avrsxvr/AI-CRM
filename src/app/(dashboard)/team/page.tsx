'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Shield, ShieldAlert, Trash2, Mail, MoreVertical, Check, X, RefreshCw
} from 'lucide-react';
import { useToast } from '@/components/Toast';
import { createClient } from '@/utils/supabase/client';

export default function TeamPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { addToast } = useToast();
  const supabase = createClient();

  // Invite Modal State
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [isInviting, setIsInviting] = useState(false);

  // Role Edit State
  const [editingRoleFor, setEditingRoleFor] = useState<string | null>(null);

  const fetchTeam = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        const { data } = await supabase.from('users').select('role').eq('id', user.id).single();
        if (data) setCurrentUserRole(data.role);
      }

      const res = await fetch('/api/team');
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      setMembers(json.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load team members.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setIsInviting(true);
    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      
      addToast('success', 'Invitation sent successfully!');
      setIsInviteOpen(false);
      setInviteEmail('');
      fetchTeam();
    } catch (err: any) {
      addToast('error', err.message || 'Failed to send invitation');
    } finally {
      setIsInviting(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/team/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      
      addToast('success', 'Role updated');
      setMembers(members.map(m => m.id === userId ? { ...m, role: newRole } : m));
      setEditingRoleFor(null);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to update role');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member? This action cannot be undone.')) return;
    try {
      const res = await fetch(`/api/team/${userId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      
      addToast('success', 'Member removed');
      setMembers(members.filter(m => m.id !== userId));
    } catch (err: any) {
      addToast('error', err.message || 'Failed to remove member');
    }
  };

  const isAdmin = currentUserRole === 'admin' || currentUserRole === 'superadmin';

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Users className="w-8 h-8 text-indigo-600" />
              Team Management
            </h1>
            <p className="text-slate-500 mt-2">Manage access and roles for your organization.</p>
          </div>
          {isAdmin && (
            <button 
              onClick={() => setIsInviteOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-sm hover:bg-indigo-700 hover:shadow-md transition-all hover:-translate-y-0.5"
            >
              <UserPlus className="w-4 h-4" />
              Invite Member
            </button>
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl">
            {error}
          </div>
        )}

        {/* Team List */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">Loading team...</td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold uppercase overflow-hidden border border-indigo-200">
                          {member.avatar_url ? (
                            <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            member.name ? member.name.charAt(0) : member.email.charAt(0)
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 flex items-center gap-2">
                            {member.name || 'Invited User'}
                            {member.id === currentUserId && (
                              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold uppercase tracking-wider">You</span>
                            )}
                          </div>
                          <div className="text-sm text-slate-500">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {editingRoleFor === member.id ? (
                        <div className="flex items-center gap-2">
                          <select 
                            className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            defaultValue={member.role}
                            onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                          >
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                            <option value="superadmin">Super Admin</option>
                          </select>
                          <button onClick={() => setEditingRoleFor(null)} className="p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-600">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          {member.role === 'admin' || member.role === 'superadmin' ? (
                            <ShieldAlert className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <Shield className="w-4 h-4 text-slate-400" />
                          )}
                          <span className="text-sm font-medium text-slate-700 capitalize">
                            {member.role === 'superadmin' ? 'Super Admin' : member.role}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(member.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isAdmin && member.id !== currentUserId && member.role !== 'superadmin' && (
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setEditingRoleFor(member.id)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit Role"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleRemoveMember(member.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsInviteOpen(false)}></div>
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md relative z-10 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Mail className="w-5 h-5 text-indigo-600" />
                Invite Team Member
              </h3>
              <button onClick={() => setIsInviteOpen(false)} className="text-slate-400 hover:text-slate-900 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleInvite} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Email Address</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:border-indigo-500 focus:ring-0 outline-none"
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:border-indigo-500 focus:ring-0 outline-none"
                >
                  <option value="member">Member (Can view and edit leads)</option>
                  <option value="admin">Admin (Can invite users and change settings)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isInviting}
                  className="px-5 py-2.5 rounded-xl font-bold text-sm bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {isInviting ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
