import { PencilIcon, UserIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { ProfileSettingsSkeleton } from '../skeletons/SettingsSkeleton';
import { useSettingsCache } from '../../hooks/useSettingsCache';

const ModernProfileSettings = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    bio: user?.bio || '',
    fullName: user?.fullName || '',
    displayName: user?.displayName || ''
  });

  // Use settings cache hook for smart loading
  const { isLoading, simulateLoading } = useSettingsCache('profile');

  // Simulate loading state only on first render
  useEffect(() => {
    const cleanup = simulateLoading(600);
    return cleanup;
  }, [simulateLoading]);

  // Sync form data with user data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        bio: user.bio || '',
        fullName: user.fullName || '',
        displayName: user.displayName || ''
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const result = await updateProfile(formData);
      if (result.success) {
        setIsEditing(false);
        toast.success('Profile updated successfully!', {
          icon: '✨',
          style: {
            borderRadius: '12px',
            background: '#10B981',
            color: '#fff',
          },
        });
      }
    } catch (error) {
      toast.error('Failed to update profile', {
        style: {
          borderRadius: '12px',
          background: '#EF4444',
          color: '#fff',
        },
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        username: user.username || '',
        bio: user.bio || '',
        fullName: user.fullName || '',
        displayName: user.displayName || ''
      });
    }
    setIsEditing(false);
  };

  const renderAvatar = () => {
    return (
      <div className="relative group">
        <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
          <span className="text-white font-bold text-2xl">
            {user?.username?.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-2xl transition-all duration-300 flex items-center justify-center">
          <PencilIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      </div>
    );
  };

  if (isLoading) {
    return <ProfileSettingsSkeleton variant="shimmer" />;
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg sm:rounded-xl flex-shrink-0">
            <UserIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
              Profile Information
            </h3>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
              Manage your personal information and bio
            </p>
          </div>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg sm:rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 w-full sm:w-auto"
          >
            <PencilIcon className="w-4 h-4" />
            <span className="font-medium">Edit Profile</span>
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          {/* Avatar Section */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-xl sm:rounded-2xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 text-center sm:text-left">
              {renderAvatar()}
              <div className="flex-1">
                <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Profile Picture
                </h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Your profile picture displays your initials with a beautiful gradient
                </p>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Username */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 text-sm sm:text-base"
                placeholder="Enter your username"
                required
                minLength={3}
                maxLength={20}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                3-20 characters, letters, numbers, and underscores only
              </p>
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 text-sm sm:text-base"
                placeholder="Enter your full name"
                maxLength={50}
              />
            </div>

            {/* Display Name */}
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Display Name
              </label>
              <input
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleInputChange}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 text-sm sm:text-base"
                placeholder="Enter your display name"
                maxLength={30}
              />
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Bio
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 text-sm sm:text-base"
              placeholder="Tell others about yourself..."
              maxLength={200}
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Share a bit about yourself with others
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formData.bio.length}/200
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 pt-4 sm:pt-6">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg sm:rounded-xl hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 w-full sm:w-auto"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckIcon className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="flex items-center justify-center space-x-2 px-6 py-3 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 hover:shadow-md w-full sm:w-auto"
            >
              <XMarkIcon className="w-4 h-4" />
              <span>Cancel</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-6 sm:space-y-8">
          {/* Profile Display */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-xl sm:rounded-2xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 text-center sm:text-left">
              {renderAvatar()}
              <div className="flex-1 min-w-0">
                <h4 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1 truncate">
                  {user?.displayName || user?.username}
                </h4>
                <p className="text-blue-600 dark:text-blue-400 font-medium mb-3 truncate">
                  @{user?.username}
                </p>
                {user?.bio && (
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
                    {user.bio}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {[
              { label: 'Username', value: user?.username },
              { label: 'Email', value: user?.email },
              { label: 'Full Name', value: user?.fullName || 'Not set' },
              { label: 'Display Name', value: user?.displayName || 'Not set' }
            ].map((item, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200">
                <label className="block text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
                  {item.label}
                </label>
                <p className="text-gray-900 dark:text-white font-medium text-sm sm:text-base truncate">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernProfileSettings;
