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
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Account Settings</h1>
        <button
          onClick={async () => {
            try {
              await logout();
              navigate('/auth/signin');
            } catch (error) {
              console.error('Logout failed', error);
            }
          }}
          className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-medium rounded-lg border border-red-500/20 transition-colors flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Log Out
        </button>
      </div>

      {/* Profile Information */}
      <div className="bg-[#1B2431]/40 backdrop-blur-xl border border-gray-800 rounded-2xl p-8">
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <User className="w-5 h-5 text-blue-500" />
          Profile Information
        </h2>

        <form onSubmit={handleUpdateProfile} className="space-y-6">
          {updateMessage.text && (
            <div className={`p-4 rounded-xl text-sm ${updateMessage.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
              {updateMessage.text}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#0B1120] border border-gray-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full bg-[#0B1120]/50 border border-gray-800 rounded-xl py-3 pl-10 pr-4 text-gray-400 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isUpdating}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-[#1B2431]/40 backdrop-blur-xl border border-gray-800 rounded-2xl p-8">
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <Lock className="w-5 h-5 text-blue-500" />
          Change Password
        </h2>

        <form onSubmit={handleChangePassword} className="space-y-6">
          {passwordMessage.text && (
            <div className={`p-4 rounded-xl text-sm ${passwordMessage.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
              {passwordMessage.text}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-[#0B1120] border border-gray-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[#0B1120] border border-gray-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  required
                  minLength={8}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#0B1120] border border-gray-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  required
                  minLength={8}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isChangingPassword}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              {isChangingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Update Password
            </button>
          </div>
        </form>
      </div>

      {/* Delete Account */}
      <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-8">
        <h2 className="text-xl font-semibold text-red-500 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Danger Zone
        </h2>
        <p className="text-gray-400 mb-6">
          Deleting your account is permanent and cannot be undone. All your data, including connections and query history, will be erased.
        </p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-6 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-medium rounded-lg border border-red-500/20 transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete Account
          </button>
        ) : (
          <div className="space-y-4 max-w-md">
            <p className="text-sm text-gray-300">Please enter your password to confirm deletion:</p>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className="w-full bg-[#0B1120] border border-red-500/30 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
              placeholder="Enter your password"
            />
            <div className="flex gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={!deletePassword || isDeleting}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Deletion'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletePassword('');
                }}
                className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
