import React from 'react';
import SkeletonLoader, { SkeletonText, SkeletonAvatar, SkeletonContainer } from '../SkeletonLoader';

/**
 * Skeleton for settings header section
 */
export const SettingsHeaderSkeleton = ({ variant = 'shimmer' }) => {
  return (
    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-4">
        <SkeletonLoader
          width={40}
          height={40}
          variant={variant}
          rounded={true}
          className="flex-shrink-0"
        />
        <div className="space-y-2">
          <SkeletonText lines={1} variant={variant} className="w-32" />
          <SkeletonText lines={1} variant={variant} className="w-48 text-sm" />
        </div>
      </div>
      <SkeletonLoader
        width={80}
        height={36}
        variant={variant}
        className="rounded-lg"
      />
    </div>
  );
};

/**
 * Skeleton for profile settings section
 */
export const ProfileSettingsSkeleton = ({ variant = 'shimmer' }) => {
  return (
    <SkeletonContainer className="p-6 space-y-6">
      {/* Avatar section */}
      <div className="flex items-center space-x-4">
        <SkeletonAvatar size={96} variant={variant} />
        <div className="space-y-2">
          <SkeletonText lines={1} variant={variant} className="w-32" />
          <SkeletonText lines={1} variant={variant} className="w-48 text-sm" />
        </div>
      </div>

      {/* Form fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <SkeletonText lines={1} variant={variant} className="w-20 text-sm" />
            <SkeletonLoader
              width="100%"
              height={40}
              variant={variant}
              className="rounded-lg"
            />
          </div>
        ))}
      </div>

      {/* Bio section */}
      <div className="space-y-2">
        <SkeletonText lines={1} variant={variant} className="w-16 text-sm" />
        <SkeletonLoader
          width="100%"
          height={80}
          variant={variant}
          className="rounded-lg"
        />
      </div>

      {/* Action buttons */}
      <div className="flex space-x-3 pt-4">
        <SkeletonLoader
          width={120}
          height={40}
          variant={variant}
          className="rounded-lg"
        />
        <SkeletonLoader
          width={80}
          height={40}
          variant={variant}
          className="rounded-lg"
        />
      </div>
    </SkeletonContainer>
  );
};

/**
 * Skeleton for notification settings
 */
export const NotificationSettingsSkeleton = ({ variant = 'shimmer' }) => {
  return (
    <SkeletonContainer className="p-6 space-y-6">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="space-y-2">
            <SkeletonText lines={1} variant={variant} className="w-32" />
            <SkeletonText lines={1} variant={variant} className="w-48 text-sm" />
          </div>
          <SkeletonLoader
            width={48}
            height={24}
            variant={variant}
            className="rounded-full"
          />
        </div>
      ))}
    </SkeletonContainer>
  );
};

/**
 * Skeleton for privacy settings
 */
export const PrivacySettingsSkeleton = ({ variant = 'shimmer' }) => {
  return (
    <SkeletonContainer className="p-6 space-y-6">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="flex items-center space-x-3">
            <SkeletonLoader
              width={40}
              height={40}
              variant={variant}
              rounded={true}
            />
            <div className="space-y-2">
              <SkeletonText lines={1} variant={variant} className="w-28" />
              <SkeletonText lines={1} variant={variant} className="w-40 text-sm" />
            </div>
          </div>
          <SkeletonLoader
            width={48}
            height={24}
            variant={variant}
            className="rounded-full"
          />
        </div>
      ))}
    </SkeletonContainer>
  );
};

/**
 * Skeleton for theme settings
 */
export const ThemeSettingsSkeleton = ({ variant = 'shimmer' }) => {
  return (
    <SkeletonContainer className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3">
            <div className="flex items-center space-x-3">
              <SkeletonLoader
                width={32}
                height={32}
                variant={variant}
                rounded={true}
              />
              <SkeletonText lines={1} variant={variant} className="w-20" />
            </div>
            <SkeletonLoader
              width="100%"
              height={60}
              variant={variant}
              className="rounded-lg"
            />
            <SkeletonText lines={1} variant={variant} className="w-32 text-sm" />
          </div>
        ))}
      </div>
    </SkeletonContainer>
  );
};

/**
 * Skeleton for password settings
 */
export const PasswordSettingsSkeleton = ({ variant = 'shimmer' }) => {
  return (
    <SkeletonContainer className="p-6 space-y-6">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="space-y-2">
          <SkeletonText lines={1} variant={variant} className="w-32 text-sm" />
          <SkeletonLoader
            width="100%"
            height={40}
            variant={variant}
            className="rounded-lg"
          />
        </div>
      ))}

      <div className="pt-4">
        <SkeletonLoader
          width={140}
          height={40}
          variant={variant}
          className="rounded-lg"
        />
      </div>
    </SkeletonContainer>
  );
};

/**
 * Complete settings modal skeleton
 */
export const SettingsModalSkeleton = ({ variant = 'shimmer' }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-fade-in">
        {/* Header */}
        <SettingsHeaderSkeleton variant={variant} />

        {/* Content */}
        <div className="flex h-[calc(90vh-80px)]">
          {/* Sidebar */}
          <div className="w-64 border-r border-gray-200 dark:border-gray-700 p-4 space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 rounded-lg">
                <SkeletonLoader
                  width={20}
                  height={20}
                  variant={variant}
                  rounded={true}
                />
                <SkeletonText lines={1} variant={variant} className="w-20" />
              </div>
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1 overflow-y-auto">
            <ProfileSettingsSkeleton variant={variant} />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Settings tab skeleton for sidebar
 */
export const SettingsTabSkeleton = ({ variant = 'shimmer', count = 5 }) => {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex items-center space-x-3 p-3 rounded-lg stagger-item"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <SkeletonLoader
            width={20}
            height={20}
            variant={variant}
            rounded={true}
          />
          <SkeletonText lines={1} variant={variant} className="w-24" />
        </div>
      ))}
    </div>
  );
};

export default {
  SettingsHeaderSkeleton,
  ProfileSettingsSkeleton,
  NotificationSettingsSkeleton,
  PrivacySettingsSkeleton,
  ThemeSettingsSkeleton,
  PasswordSettingsSkeleton,
  SettingsModalSkeleton,
  SettingsTabSkeleton
};
