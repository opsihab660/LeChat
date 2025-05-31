import React, { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import useEnhancedOnlineStatus from '../hooks/useEnhancedOnlineStatus';
import StatusIndicator, { ConnectionStatus } from '../components/StatusIndicator';
import UserAvatar from '../components/UserAvatar';
import { MiniConnectionIndicator } from '../components/ConnectionStatusBar';

const StatusDemo = () => {
  const { 
    isConnected, 
    connectionQuality, 
    userStatus, 
    onlineUsers, 
    allUsers,
    updateActivity,
    setUserStatus 
  } = useSocket();
  
  const { 
    isOnline, 
    connectionType, 
    effectiveType, 
    downlink, 
    rtt,
    connectionQuality: networkQuality,
    testConnectivity 
  } = useEnhancedOnlineStatus();

  const [lastActivity, setLastActivity] = useState(Date.now());
  const [manualStatus, setManualStatus] = useState('online');

  // 📊 Demo data for different status types
  const demoUsers = [
    { id: 1, username: 'john_doe', avatar: null, status: 'online' },
    { id: 2, username: 'jane_smith', avatar: null, status: 'away' },
    { id: 3, username: 'bob_wilson', avatar: null, status: 'busy' },
    { id: 4, username: 'alice_brown', avatar: null, status: 'offline' }
  ];

  // ⏰ Update activity timestamp
  useEffect(() => {
    const interval = setInterval(() => {
      setLastActivity(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // 🔄 Handle manual status change
  const handleStatusChange = (status) => {
    setManualStatus(status);
    setUserStatus(status);
  };

  // 🧪 Test connectivity
  const handleTestConnectivity = async () => {
    const result = await testConnectivity();
    alert(`Connectivity test: ${result ? 'Success' : 'Failed'}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Enhanced Online/Offline Status Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time connection monitoring and user presence tracking
          </p>
        </div>

        {/* Connection Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Socket Connection
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                <StatusIndicator 
                  status={isConnected ? 'online' : 'offline'} 
                  showText={true}
                  connectionQuality={connectionQuality}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Quality:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {connectionQuality}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Network Status
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Online:</span>
                <span className={`text-sm font-medium ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                  {isOnline ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Type:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {effectiveType || 'Unknown'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Speed:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {downlink}Mbps
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              User Status
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Current:</span>
                <StatusIndicator 
                  status={userStatus} 
                  showText={true}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Manual:</span>
                <select
                  value={manualStatus}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="online">Online</option>
                  <option value="away">Away</option>
                  <option value="busy">Busy</option>
                  <option value="offline">Offline</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Activity
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Last Activity:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {Math.floor((Date.now() - lastActivity) / 1000)}s ago
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">RTT:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {rtt}ms
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Indicators Demo */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Status Indicators
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Different Status Types */}
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                Status Types
              </h4>
              <div className="space-y-4">
                {['online', 'away', 'busy', 'offline'].map((status) => (
                  <div key={status} className="flex items-center space-x-4">
                    <StatusIndicator status={status} size="md" showText={true} showIcon={true} />
                    <StatusIndicator status={status} size="sm" showText={false} showIcon={false} />
                  </div>
                ))}
              </div>
            </div>

            {/* User Avatars with Status */}
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                User Avatars
              </h4>
              <div className="space-y-4">
                {demoUsers.map((user) => (
                  <div key={user.id} className="flex items-center space-x-4">
                    <UserAvatar 
                      user={user}
                      size="md"
                      showStatus={true}
                      isOnline={user.status !== 'offline'}
                      status={user.status}
                      connectionQuality="good"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.username}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                        {user.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Connection Status Component */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Connection Status Components
          </h3>
          
          <div className="space-y-4">
            <ConnectionStatus 
              isConnected={isConnected}
              connectionQuality={connectionQuality}
              showText={true}
            />
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">Mini Indicator:</span>
              <MiniConnectionIndicator />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Actions
          </h3>
          
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleTestConnectivity}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Test Connectivity
            </button>
            
            <button
              onClick={() => updateActivity('active')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Trigger Activity
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>

        {/* Real-time Data */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Real-time Data
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                Online Users ({onlineUsers.length})
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {onlineUsers.map((user) => (
                  <div key={user.userId} className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <UserAvatar
                      user={user}
                      size="sm"
                      showStatus={true}
                      isOnline={true}
                      status={user.status || 'online'}
                    />
                    <span className="text-sm text-gray-900 dark:text-white">
                      {user.username}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                All Users ({allUsers.length})
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {allUsers.slice(0, 10).map((user) => (
                  <div key={user.userId} className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <UserAvatar
                      user={user}
                      size="sm"
                      showStatus={true}
                      isOnline={user.isOnline}
                      status={user.status || (user.isOnline ? 'online' : 'offline')}
                    />
                    <div className="flex-1">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {user.username}
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {user.isOnline ? `${user.status || 'online'}`.charAt(0).toUpperCase() + `${user.status || 'online'}`.slice(1) : `Last seen: ${new Date(user.lastSeen).toLocaleTimeString()}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusDemo;
