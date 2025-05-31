import { KeyIcon, EyeIcon, EyeSlashIcon, ShieldCheckIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { PasswordSettingsSkeleton } from '../skeletons/SettingsSkeleton';
import { useSettingsCache } from '../../hooks/useSettingsCache';

const ModernPasswordSettings = () => {
  const { user, updatePassword } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: []
  });

  // Use settings cache hook for smart loading
  const { isLoading, simulateLoading } = useSettingsCache('password');

  // Simulate loading state only on first render
  useEffect(() => {
    const cleanup = simulateLoading(600);
    return cleanup;
  }, [simulateLoading]);

  // Password strength checker
  useEffect(() => {
    if (formData.newPassword) {
      const strength = calculatePasswordStrength(formData.newPassword);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength({ score: 0, feedback: [] });
    }
  }, [formData.newPassword]);

  const calculatePasswordStrength = (password) => {
    let score = 0;
    const feedback = [];

    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('At least 8 characters');
    }

    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Include lowercase letters');
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Include uppercase letters');
    }

    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('Include numbers');
    }

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Include special characters');
    }

    return { score, feedback };
  };

  const getStrengthColor = (score) => {
    if (score <= 1) return 'bg-red-500';
    if (score <= 2) return 'bg-orange-500';
    if (score <= 3) return 'bg-yellow-500';
    if (score <= 4) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStrengthText = (score) => {
    if (score <= 1) return 'Very Weak';
    if (score <= 2) return 'Weak';
    if (score <= 3) return 'Fair';
    if (score <= 4) return 'Good';
    return 'Strong';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('New passwords do not match', {
        style: {
          borderRadius: '12px',
          background: '#EF4444',
          color: '#fff',
        },
      });
      return;
    }

    if (passwordStrength.score < 3) {
      toast.error('Please choose a stronger password', {
        style: {
          borderRadius: '12px',
          background: '#EF4444',
          color: '#fff',
        },
      });
      return;
    }

    setIsSaving(true);

    try {
      const result = await updatePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });

      if (result.success) {
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        toast.success('Password updated successfully!', {
          icon: '🔒',
          style: {
            borderRadius: '12px',
            background: '#10B981',
            color: '#fff',
          },
        });
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update password', {
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

  const PasswordInput = ({ name, label, placeholder, value, showPassword, onToggleVisibility }) => (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          name={name}
          value={value}
          onChange={handleInputChange}
          className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
          placeholder={placeholder}
          required
        />
        <button
          type="button"
          onClick={onToggleVisibility}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-200"
        >
          {showPassword ? (
            <EyeSlashIcon className="w-5 h-5" />
          ) : (
            <EyeIcon className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );

  if (isLoading) {
    return <PasswordSettingsSkeleton variant="shimmer" />;
  }

  return (
    <div className="p-6 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <div className="p-3 bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 rounded-xl">
          <KeyIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            Security Settings
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Update your password and security preferences
          </p>
        </div>
      </div>

      {/* Password Change Form */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <ShieldCheckIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                Change Password
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Keep your account secure with a strong password
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Current Password */}
          <PasswordInput
            name="currentPassword"
            label="Current Password"
            placeholder="Enter your current password"
            value={formData.currentPassword}
            showPassword={showPasswords.current}
            onToggleVisibility={() => togglePasswordVisibility('current')}
          />

          {/* New Password */}
          <PasswordInput
            name="newPassword"
            label="New Password"
            placeholder="Enter your new password"
            value={formData.newPassword}
            showPassword={showPasswords.new}
            onToggleVisibility={() => togglePasswordVisibility('new')}
          />

          {/* Password Strength Indicator */}
          {formData.newPassword && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password Strength
                </span>
                <span className={`text-sm font-semibold ${
                  passwordStrength.score <= 2 ? 'text-red-600' : 
                  passwordStrength.score <= 3 ? 'text-yellow-600' : 
                  'text-green-600'
                }`}>
                  {getStrengthText(passwordStrength.score)}
                </span>
              </div>
              
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(passwordStrength.score)}`}
                  style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                />
              </div>

              {passwordStrength.feedback.length > 0 && (
                <div className="space-y-1">
                  {passwordStrength.feedback.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      <XMarkIcon className="w-4 h-4 text-red-500" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Confirm Password */}
          <PasswordInput
            name="confirmPassword"
            label="Confirm New Password"
            placeholder="Confirm your new password"
            value={formData.confirmPassword}
            showPassword={showPasswords.confirm}
            onToggleVisibility={() => togglePasswordVisibility('confirm')}
          />

          {/* Password Match Indicator */}
          {formData.confirmPassword && (
            <div className={`flex items-center space-x-2 text-sm ${
              formData.newPassword === formData.confirmPassword 
                ? 'text-green-600' 
                : 'text-red-600'
            }`}>
              {formData.newPassword === formData.confirmPassword ? (
                <CheckIcon className="w-4 h-4" />
              ) : (
                <XMarkIcon className="w-4 h-4" />
              )}
              <span>
                {formData.newPassword === formData.confirmPassword 
                  ? 'Passwords match' 
                  : 'Passwords do not match'
                }
              </span>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSaving || passwordStrength.score < 3 || formData.newPassword !== formData.confirmPassword}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <ShieldCheckIcon className="w-4 h-4" />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Security Tips */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Security Tips
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300">
          <div className="flex items-start space-x-2">
            <CheckIcon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span>Use a unique password for this account</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckIcon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span>Include uppercase and lowercase letters</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckIcon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span>Add numbers and special characters</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckIcon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span>Make it at least 8 characters long</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernPasswordSettings;
