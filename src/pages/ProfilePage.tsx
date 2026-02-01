import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Save, Loader2, Trash2, AlertTriangle, LogOut } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [username, setUsername] = useState(user?.username || '');
  const [profileUrl, setProfileUrl] = useState(user?.profile_url || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState({ type: '', text: '' });

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setProfileUrl(user.profile_url || '');
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setUpdateMessage({ type: '', text: '' });

    try {
      await authService.updateProfile({ username, profile_url: profileUrl });
      setUpdateMessage({ type: 'success', text: 'Profile updated successfully' });
      toast.success('Profile updated successfully');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to update profile';
      setUpdateMessage({ type: 'error', text: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
      toast.error('New passwords do not match');
      return;
    }

    setIsChangingPassword(true);
    setPasswordMessage({ type: '', text: '' });

    try {
      await authService.changePassword({ currentPassword, newPassword });
      setPasswordMessage({ type: 'success', text: 'Password changed successfully' });
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to change password';
      setPasswordMessage({ type: 'error', text: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await authService.deleteAccount(deletePassword);
      await logout();
      toast.success('Account deleted successfully');
      navigate('/');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to delete account';
      alert(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-12">
      <div className="flex items-center justify-between border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Settings</h1>
          <p className="text-gray-400 text-sm mt-1">Manage your account preferences and security.</p>
        </div>
        <button
          onClick={async () => {
            try {
              await logout();
              navigate('/auth/signin');
            } catch (error) {
              console.error('Logout failed', error);
            }
          }}
          className="px-4 py-2 hover:bg-gray-800/50 text-gray-400 hover:text-white font-medium text-sm rounded-lg transition-colors flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Log out
        </button>
      </div>

      <div className="space-y-12">
        {/* Profile Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-1">
            <h2 className="text-lg font-medium text-white">Profile</h2>
            <p className="text-sm text-gray-400">Update your personal information.</p>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              {updateMessage.text && (
                <div className={`p-3 rounded-lg text-sm ${updateMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                  {updateMessage.text}
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-transparent border border-gray-800 rounded-lg py-2.5 px-3 text-white text-sm focus:border-gray-600 focus:ring-0 transition-colors placeholder-gray-600"
                    placeholder="Enter username"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Email address</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full bg-gray-900/30 border border-gray-800 rounded-lg py-2.5 px-3 text-gray-500 text-sm cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-2 bg-white text-black hover:bg-gray-200 font-medium text-sm rounded-lg transition-colors flex items-center gap-2"
                >
                  {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="h-px bg-gray-800" />

        {/* Security Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-1">
            <h2 className="text-lg font-medium text-white">Password</h2>
            <p className="text-sm text-gray-400">Ensure your account is secure.</p>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleChangePassword} className="space-y-6">
              {passwordMessage.text && (
                <div className={`p-3 rounded-lg text-sm ${passwordMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                  {passwordMessage.text}
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Current password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-transparent border border-gray-800 rounded-lg py-2.5 px-3 text-white text-sm focus:border-gray-600 focus:ring-0 transition-colors"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">New password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-transparent border border-gray-800 rounded-lg py-2.5 px-3 text-white text-sm focus:border-gray-600 focus:ring-0 transition-colors"
                      minLength={8}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Confirm password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-transparent border border-gray-800 rounded-lg py-2.5 px-3 text-white text-sm focus:border-gray-600 focus:ring-0 transition-colors"
                      minLength={8}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="px-4 py-2 bg-white text-black hover:bg-gray-200 font-medium text-sm rounded-lg transition-colors flex items-center gap-2"
                >
                  {isChangingPassword ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                  Update password
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="h-px bg-gray-800" />

        {/* Danger Zone */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-1">
            <h2 className="text-lg font-medium text-red-500">Danger Zone</h2>
            <p className="text-sm text-gray-400">Actions here cannot be undone.</p>
          </div>

          <div className="lg:col-span-2">
            {!showDeleteConfirm ? (
              <div className="flex items-center justify-between p-4 border border-red-900/30 rounded-lg bg-red-900/5">
                <div>
                  <h3 className="text-sm font-medium text-white">Delete account</h3>
                  <p className="text-sm text-gray-400 mt-1">Permanently remove your account and all of its contents.</p>
                </div>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 font-medium text-sm rounded-lg transition-colors"
                >
                  Delete account
                </button>
              </div>
            ) : (
              <div className="p-6 border border-red-900/30 rounded-lg bg-red-900/5 space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-white">Confirm deletion</h3>
                  <p className="text-sm text-gray-400 mt-1">Please enter your password to confirm. This action cannot be reversed.</p>
                </div>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full bg-black/20 border border-red-900/30 rounded-lg py-2.5 px-3 text-white text-sm focus:border-red-500/50 focus:ring-0 transition-colors placeholder-red-900/30"
                  placeholder="Enter your password"
                />
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={!deletePassword || isDeleting}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium text-sm rounded-lg transition-colors flex items-center gap-2"
                  >
                    {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                    Confirm delete
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeletePassword('');
                    }}
                    className="px-4 py-2 text-gray-400 hover:text-white font-medium text-sm rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
