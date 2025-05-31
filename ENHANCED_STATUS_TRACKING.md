# 🔄 Enhanced Online/Offline Status Tracking

এই chat app এ একটি comprehensive online/offline tracking system implement করা হয়েছে যা real-time user presence, connection quality monitoring, এবং advanced activity tracking প্রদান করে।

## 🚀 Features

### 1. **Heartbeat System**
- ✅ Client থেকে server এ প্রতি 30 সেকেন্ডে heartbeat পাঠানো হয়
- ✅ Server 60 সেকেন্ড timeout এর পর user কে offline mark করে
- ✅ Automatic cleanup এবং reconnection handling

### 2. **Enhanced Network Detection**
- 📡 Browser's Network Information API ব্যবহার
- 📶 Connection type detection (4G, 3G, WiFi, etc.)
- 🚀 Download speed এবং latency monitoring
- 🔄 Real-time connectivity testing

### 3. **User Activity Tracking**
- 🖱️ Mouse, keyboard, scroll, touch events monitor
- ⏰ 5 মিনিট inactivity এর পর "away" status
- 📱 Page visibility API দিয়ে tab switching detect
- 🔄 Automatic status updates

### 4. **Multiple Device Support**
- 📱 Same user multiple device থেকে login করতে পারে
- 🔄 Device count tracking
- ✅ User offline হয় শুধুমাত্র যখন সব device disconnect হয়

### 5. **Advanced Reconnection Logic**
- 🔄 Exponential backoff with jitter
- 📈 Maximum 5 retry attempts
- ⏱️ Smart delay calculation
- 🔔 User-friendly notifications

### 6. **Status Types**
- 🟢 **Online**: User active এবং connected
- 🟡 **Away**: User inactive বা tab hidden
- 🔴 **Busy**: User manually set করেছে
- ⚫ **Offline**: User disconnected

## 🛠️ Technical Implementation

### Backend Changes

#### Socket Handlers (`backend/socket/socketHandlers.js`)
```javascript
// New tracking maps
const userHeartbeats = new Map();
const userDevices = new Map();
const userActivity = new Map();

// Heartbeat monitoring
setInterval(() => {
  // Check for stale connections every 30 seconds
}, 30000);

// Activity monitoring
setInterval(() => {
  // Check for idle users every 2 minutes
}, 120000);
```

#### User Model (`backend/models/User.js`)
```javascript
// New fields added
status: {
  type: String,
  enum: ['online', 'away', 'busy', 'offline'],
  default: 'offline'
},
deviceCount: {
  type: Number,
  default: 0
}
```

### Frontend Changes

#### Enhanced Socket Context (`frontend/src/contexts/SocketContext.jsx`)
```javascript
// New state management
const [connectionQuality, setConnectionQuality] = useState('good');
const [userStatus, setUserStatus] = useState('online');

// Activity tracking
const updateActivity = useCallback((type = 'active') => {
  // Track user activity and update status
}, []);

// Page visibility handling
useEffect(() => {
  const handleVisibilityChange = () => {
    // Handle tab switching
  };
}, []);
```

#### New Hooks

##### `useEnhancedOnlineStatus.js`
- Network Information API integration
- Connectivity testing
- Connection quality assessment

#### New Components

##### `StatusIndicator.jsx`
- Flexible status display component
- Multiple sizes and styles
- Connection quality indicators

##### `ConnectionStatusBar.jsx`
- Top-level connection status notification
- Auto-hide/show based on connection state
- Connection quality visualization

## 📊 Status Demo Page

Visit `/status-demo` to see all features in action:

- Real-time connection monitoring
- Status indicator examples
- User avatar with status
- Network information display
- Manual status controls
- Live user lists

## 🔧 Configuration

### Timeouts এবং Intervals

```javascript
// Backend
const HEARTBEAT_TIMEOUT = 60000; // 60 seconds
const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const AWAY_TIMEOUT = 15 * 60 * 1000; // 15 minutes

// Frontend
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const ACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes
```

### Connection Quality Thresholds

```javascript
const qualityConfig = {
  excellent: { downlink: '>10Mbps', effectiveType: '4g' },
  good: { downlink: '>5Mbps', effectiveType: '4g' },
  fair: { downlink: '>1Mbps', effectiveType: '3g/4g' },
  poor: { downlink: '<1Mbps', effectiveType: '2g/3g' }
};
```

## 🎯 Usage Examples

### Basic Status Display
```jsx
import StatusIndicator from './components/StatusIndicator';

<StatusIndicator 
  status="online" 
  showText={true} 
  connectionQuality="good" 
/>
```

### User Avatar with Status
```jsx
import UserAvatar from './components/UserAvatar';

<UserAvatar 
  user={user}
  showStatus={true}
  isOnline={user.isOnline}
  status={user.status}
  connectionQuality="good"
/>
```

### Connection Status Bar
```jsx
import ConnectionStatusBar from './components/ConnectionStatusBar';

<ConnectionStatusBar />
```

## 🔄 Event Flow

### Connection Establishment
1. User connects → Socket authentication
2. Initialize heartbeat tracking
3. Setup activity monitoring
4. Add to device list
5. Broadcast online status

### Activity Detection
1. Mouse/keyboard events → Update activity
2. Page visibility change → Update status
3. Inactivity timeout → Set away status
4. Extended inactivity → Set offline status

### Disconnection Handling
1. Socket disconnect → Remove from device list
2. Check remaining devices → Keep online if others exist
3. No devices left → Mark offline
4. Cleanup tracking data
5. Broadcast offline status

## 🚀 Performance Optimizations

- ✅ Memory-based tracking (no database for heartbeats)
- ✅ Throttled activity updates
- ✅ Efficient cleanup intervals
- ✅ Minimal database writes
- ✅ Smart reconnection logic

## 🔮 Future Enhancements

- [ ] Redis integration for scalability
- [ ] Push notifications for status changes
- [ ] Custom status messages
- [ ] Location-based presence
- [ ] Do not disturb mode
- [ ] Status scheduling

## 🐛 Troubleshooting

### Common Issues

1. **Heartbeat timeouts**: Check network stability
2. **Status not updating**: Verify event listeners
3. **Multiple device conflicts**: Check device tracking logic
4. **Poor connection quality**: Test network speed

### Debug Tools

- Browser DevTools → Network tab
- Socket.IO debug logs
- Status demo page for testing
- Connection quality indicators

## 📝 API Reference

### Socket Events

#### Client → Server
- `heartbeat`: Send heartbeat ping
- `user_activity`: Report user activity
- `update_status`: Manual status change

#### Server → Client
- `heartbeat_ack`: Heartbeat acknowledgment
- `user_status_changed`: User status update
- `all_users_status`: Initial user list

### Hook Methods

#### `useSocket()`
- `isConnected`: Socket connection status
- `connectionQuality`: Connection quality level
- `userStatus`: Current user status
- `updateActivity()`: Trigger activity update
- `setUserStatus()`: Manual status change

#### `useEnhancedOnlineStatus()`
- `isOnline`: Network connectivity
- `connectionType`: Network type
- `effectiveType`: Effective connection type
- `downlink`: Download speed
- `rtt`: Round trip time
- `testConnectivity()`: Test connection

---

এই enhanced system দিয়ে আপনার chat app এ অনেক বেশি accurate এবং responsive online/offline tracking পাবেন! 🎉
