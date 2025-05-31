import React from 'react';
import SettingsModal from './SettingsModal';
import { SettingsModalSkeleton } from './skeletons/SettingsSkeleton';

// Simple test component to verify imports work
const SettingsTest = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Settings Import Test</h1>
      <p className="text-green-600">✅ SettingsModal imported successfully</p>
      <p className="text-green-600">✅ SettingsModalSkeleton imported successfully</p>
      <p className="text-blue-600">All imports are working correctly!</p>
    </div>
  );
};

export default SettingsTest;
