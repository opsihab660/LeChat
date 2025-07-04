import jwt from 'jsonwebtoken';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';

// Store active users and their socket connections
const activeUsers = new Map();
// Store all users (online and offline) with their status
const allUsersStatus = new Map();
// ✅ ULTRA-FAST TYPING CACHE - Memory-based for instant performance
const typingCache = new Map();
// 🔄 HEARTBEAT TRACKING - Track last heartbeat from each user
const userHeartbeats = new Map();
// 📱 DEVICE TRACKING - Track multiple devices per user
const userDevices = new Map();
// ⏰ USER ACTIVITY TRACKING - Track user activity status
const userActivity = new Map();

// ✅ PERIODIC CLEANUP for typing cache - runs every 1 second for optimal performance
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of typingCache) {
    // Remove typing indicators older than 3 seconds
    if (now - data.timestamp > 3000) {
      typingCache.delete(key);
      // Could emit typing_stop here if needed, but auto-cleanup handles it
    }
  }
}, 1000);

// 🔄 HEARTBEAT MONITOR - Check for stale connections every 30 seconds
setInterval(() => {
  const now = Date.now();
  const HEARTBEAT_TIMEOUT = 60000; // 60 seconds timeout

  for (const [userId, lastHeartbeat] of userHeartbeats) {
    if (now - lastHeartbeat > HEARTBEAT_TIMEOUT) {
      console.log(`💔 User ${userId} heartbeat timeout, marking as offline`);

      // Mark user as offline
      const userStatus = allUsersStatus.get(userId);
      if (userStatus) {
        userStatus.isOnline = false;
        userStatus.lastSeen = new Date(lastHeartbeat);

        // Broadcast offline status
        const io = global.io; // We'll set this in server.js
        if (io) {
          io.emit('user_status_changed', {
            userId: userId,
            username: userStatus.user.username,
            avatar: userStatus.user.avatar,
            isOnline: false,
            lastSeen: new Date(lastHeartbeat)
          });
        }
      }

      // Clean up
      userHeartbeats.delete(userId);
      activeUsers.delete(userId);
    }
  }
}, 30000);

// ⏰ ACTIVITY MONITOR - Check for idle users every 2 minutes
setInterval(() => {
  const now = Date.now();
  const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes idle = away
  const AWAY_TIMEOUT = 15 * 60 * 1000; // 15 minutes away = offline

  for (const [userId, activity] of userActivity) {
    const timeSinceActivity = now - activity.lastActivity;
    let newStatus = 'online';

    if (timeSinceActivity > AWAY_TIMEOUT) {
      newStatus = 'offline';
    } else if (timeSinceActivity > IDLE_TIMEOUT) {
      newStatus = 'away';
    }

    if (activity.status !== newStatus) {
      activity.status = newStatus;

      // Update user status
      const userStatus = allUsersStatus.get(userId);
      if (userStatus) {
        userStatus.status = newStatus;
        userStatus.isOnline = newStatus !== 'offline';

        // Broadcast status change
        const io = global.io;
        if (io) {
          io.emit('user_status_changed', {
            userId: userId,
            username: userStatus.user.username,
            avatar: userStatus.user.avatar,
            isOnline: newStatus !== 'offline',
            status: newStatus,
            lastSeen: new Date()
          });
        }
      }
    }
  }
}, 120000);

// Authenticate socket connection
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return next(new Error('User not found'));
    }

    socket.userId = user._id.toString();
    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
};

// Handle socket connection
export const handleSocketConnection = async (socket, io) => {
  console.log(`🔌 User connected: ${socket.user.username} (${socket.id})`);

  // 🔄 Initialize heartbeat tracking
  userHeartbeats.set(socket.userId, Date.now());

  // ⏰ Initialize user activity tracking
  userActivity.set(socket.userId, {
    lastActivity: Date.now(),
    status: 'online',
    deviceInfo: socket.handshake.headers['user-agent'] || 'Unknown Device'
  });

  // 📱 Track multiple devices for same user
  if (!userDevices.has(socket.userId)) {
    userDevices.set(socket.userId, new Set());
  }
  userDevices.get(socket.userId).add(socket.id);

  // Add user to active users
  activeUsers.set(socket.userId, {
    socketId: socket.id,
    user: socket.user,
    lastSeen: new Date(),
    deviceCount: userDevices.get(socket.userId).size
  });

  // Update all users status map
  allUsersStatus.set(socket.userId, {
    user: socket.user,
    isOnline: true,
    status: 'online',
    lastSeen: new Date(),
    socketId: socket.id,
    deviceCount: userDevices.get(socket.userId).size
  });

  // Update user online status in database
  socket.user.setOnlineStatus(true, socket.id);

  // Join user to their personal room
  const roomName = `user_${socket.userId}`;
  socket.join(roomName);
  console.log(`📍 User ${socket.user.username} joined room: ${roomName}`);
  console.log(`📊 Active users count: ${activeUsers.size}`);

  // Get all users (online and offline) for the connected user
  const allUsers = await User.find({
    _id: { $ne: socket.userId }
  }).select('username avatar isOnline lastSeen').limit(50);

  console.log('📋 Database users found:', allUsers.length);

  // Create comprehensive users list with real-time status
  const usersWithStatus = allUsers.map(user => {
    const userStatus = allUsersStatus.get(user._id.toString());
    const isOnline = userStatus ? userStatus.isOnline : user.isOnline || false;
    return {
      userId: user._id,
      username: user.username,
      avatar: user.avatar,
      isOnline: isOnline,
      lastSeen: userStatus ? userStatus.lastSeen : (user.lastSeen || new Date())
    };
  });

  console.log('📊 Sending users with status:', usersWithStatus.map(u => ({
    username: u.username,
    isOnline: u.isOnline
  })));

  // Send all users list to the connected user
  socket.emit('all_users_status', usersWithStatus);

  // Broadcast user online status to all users
  socket.broadcast.emit('user_status_changed', {
    userId: socket.userId,
    username: socket.user.username,
    avatar: socket.user.avatar,
    isOnline: true,
    lastSeen: new Date()
  });

  // Handle sending messages
  socket.on('send_message', async (data) => {
    try {
      const { recipientId, content, type = 'text', conversationId, replyTo, file, imageData } = data;

      console.log('📨 Received message data:', { recipientId, content, type, imageData: !!imageData });

      // Validate recipient
      const recipient = await User.findById(recipientId);
      if (!recipient) {
        socket.emit('message_error', { error: 'Recipient not found' });
        return;
      }

      // Check if users can message each other
      if (recipient.blockedUsers.includes(socket.userId) ||
          socket.user.blockedUsers.includes(recipientId)) {
        socket.emit('message_error', { error: 'Cannot send message to this user' });
        return;
      }

      // Find or create conversation
      let conversation;
      if (conversationId) {
        conversation = await Conversation.findById(conversationId);
      } else {
        conversation = await Conversation.findOrCreateDirectConversation(socket.userId, recipientId);
      }

      // Create message
      const messageData = {
        sender: socket.userId,
        recipient: recipientId,
        content,
        type,
        replyTo: replyTo || null
      };

      // Add image data for image messages
      if (type === 'image' && imageData) {
        console.log('🖼️ Adding image data to message:', imageData);
        messageData.image = {
          url: imageData.imageUrl || imageData.url,
          publicId: imageData.publicId,
          width: imageData.width,
          height: imageData.height,
          format: imageData.format,
          bytes: imageData.bytes
        };
      }

      console.log('💾 Creating message with data:', messageData);

      const message = new Message(messageData);
      await message.save();

      console.log('✅ Message saved:', message._id, 'Type:', message.type, 'Has image:', !!message.image);

      // Populate message
      await message.populate('sender', 'username avatar');
      await message.populate('recipient', 'username avatar');
      if (replyTo) {
        await message.populate({
          path: 'replyTo',
          select: 'content sender createdAt type image',
          populate: {
            path: 'sender',
            select: 'username avatar'
          }
        });
      }

      // Update conversation
      await conversation.updateLastActivity(message._id);
      await conversation.incrementUnreadCount(recipientId);

      // Send message to sender
      socket.emit('message_sent', {
        message,
        conversationId: conversation._id
      });

      // Send message to recipient if online
      const recipientSocket = activeUsers.get(recipientId);
      if (recipientSocket) {
        io.to(`user_${recipientId}`).emit('new_message', {
          message,
          conversationId: conversation._id
        });
      }

      console.log(`📨 Message sent from ${socket.user.username} to ${recipient.username}`);

    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('message_error', { error: 'Failed to send message' });
    }
  });

  // Handle message editing
  socket.on('edit_message', async (data) => {
    try {
      console.log('✏️ Backend received edit_message:', data);
      const { messageId, content, conversationId } = data;

      // Validate input
      if (!messageId || !content || !conversationId) {
        console.log('❌ Missing required fields:', { messageId, content, conversationId });
        socket.emit('edit_error', { error: 'Message ID, content, and conversation ID are required' });
        return;
      }

      // Validate content length
      if (content.trim().length === 0 || content.length > 1000) {
        socket.emit('edit_error', { error: 'Message content must be between 1 and 1000 characters' });
        return;
      }

      // Find the message
      const message = await Message.findById(messageId);
      if (!message) {
        socket.emit('edit_error', { error: 'Message not found' });
        return;
      }

      // Check if user can edit this message (only sender can edit)
      if (message.sender.toString() !== socket.userId) {
        socket.emit('edit_error', { error: 'You can only edit your own messages' });
        return;
      }

      // Check if message is deleted
      if (message.deleted.isDeleted) {
        socket.emit('edit_error', { error: 'Cannot edit deleted message' });
        return;
      }

      // Check if message type is text (only text messages can be edited)
      if (message.type !== 'text') {
        socket.emit('edit_error', { error: 'Only text messages can be edited' });
        return;
      }

      // Check edit time limit (15 minutes)
      const editTimeLimit = 15 * 60 * 1000; // 15 minutes in milliseconds
      const timeSinceCreation = Date.now() - new Date(message.createdAt).getTime();

      if (timeSinceCreation > editTimeLimit) {
        socket.emit('edit_error', { error: 'Message can only be edited within 15 minutes of sending' });
        return;
      }

      // Check if content is actually different
      if (message.content === content.trim()) {
        socket.emit('edit_error', { error: 'New content must be different from current content' });
        return;
      }

      // Edit the message
      await message.editMessage(content.trim());

      // Populate the message for response
      await message.populate('sender', 'username avatar');
      await message.populate('recipient', 'username avatar');

      // Get recipient ID for real-time update
      const recipientId = message.sender.toString() === socket.userId
        ? message.recipient.toString()
        : message.sender.toString();

      // Send confirmation to sender
      socket.emit('message_edited', {
        message,
        conversationId
      });

      // Send real-time update to recipient if online
      const recipientSocket = activeUsers.get(recipientId);
      if (recipientSocket) {
        io.to(`user_${recipientId}`).emit('message_edited', {
          message,
          conversationId
        });
      }

      console.log(`✏️ Message edited by ${socket.user.username}: ${messageId}`);

    } catch (error) {
      console.error('Edit message error:', error);
      socket.emit('edit_error', { error: 'Failed to edit message' });
    }
  });

  // Handle message deletion
  socket.on('delete_message', async (data) => {
    try {
      console.log('🗑️ Backend received delete_message:', data);
      const { messageId, conversationId } = data;

      // Validate input
      if (!messageId || !conversationId) {
        console.log('❌ Missing required fields:', { messageId, conversationId });
        socket.emit('delete_error', { error: 'Message ID and conversation ID are required' });
        return;
      }

      // Find the message
      const message = await Message.findById(messageId);
      if (!message) {
        socket.emit('delete_error', { error: 'Message not found' });
        return;
      }

      // Check if user can delete this message (only sender can delete)
      if (message.sender.toString() !== socket.userId) {
        socket.emit('delete_error', { error: 'You can only delete your own messages' });
        return;
      }

      // Check if message is already deleted
      if (message.deleted.isDeleted) {
        socket.emit('delete_error', { error: 'Message is already deleted' });
        return;
      }

      // Mark message as deleted
      message.deleted.isDeleted = true;
      message.deleted.deletedAt = new Date();
      message.deleted.deletedBy = socket.userId;
      await message.save();

      // Get recipient ID for real-time update
      const recipientId = message.sender.toString() === socket.userId
        ? message.recipient.toString()
        : message.sender.toString();

      // Send confirmation to sender
      socket.emit('message_deleted', {
        messageId,
        conversationId,
        deletedAt: message.deleted.deletedAt
      });

      // Send real-time update to recipient if online
      const recipientSocket = activeUsers.get(recipientId);
      if (recipientSocket) {
        io.to(`user_${recipientId}`).emit('message_deleted', {
          messageId,
          conversationId,
          deletedAt: message.deleted.deletedAt
        });
      }

      console.log(`🗑️ Message deleted by ${socket.user.username}: ${messageId}`);

    } catch (error) {
      console.error('Delete message error:', error);
      socket.emit('delete_error', { error: 'Failed to delete message' });
    }
  });

  // Throttle typing events to prevent spam
  const typingThrottle = new Map();

  // ✅ ENHANCED TYPING HANDLERS - Improved consistency and state management
  socket.on('typing_start', async (data) => {
    try {
      const { recipientId, conversationId } = data;

      // Validate input
      if (!recipientId || !conversationId) {
        console.warn('Invalid typing_start data:', data);
        return;
      }

      // ✅ Improved throttling with better consistency
      const throttleKey = `${socket.userId}_${conversationId}`;
      const now = Date.now();
      const lastTyping = typingThrottle.get(throttleKey);

      // Reduced throttle to 150ms for better responsiveness while preventing spam
      if (lastTyping && now - lastTyping < 150) {
        return; // Skip this typing event
      }

      typingThrottle.set(throttleKey, now);

      // ✅ Enhanced state management with timeout tracking
      const typingKey = `${conversationId}_${socket.userId}`;
      const existingState = typingCache.get(typingKey);

      // Clear any existing timeout to prevent conflicts
      if (existingState && existingState.timeoutId) {
        clearTimeout(existingState.timeoutId);
      }

      // Create new timeout for auto-cleanup
      const timeoutId = setTimeout(() => {
        const currentState = typingCache.get(typingKey);
        if (currentState && currentState.timeoutId === timeoutId) {
          typingCache.delete(typingKey);
          const recipientSocket = activeUsers.get(recipientId);
          if (recipientSocket) {
            io.to(`user_${recipientId}`).emit('user_stopped_typing', {
              userId: socket.userId,
              conversationId
            });
          }
        }
      }, 3000); // Increased to 3 seconds for better consistency

      // Store enhanced typing state with timeout tracking
      typingCache.set(typingKey, {
        userId: socket.userId,
        username: socket.user.username,
        conversationId,
        timestamp: now,
        timeoutId: timeoutId
      });

      // ✅ INSTANT notification to recipient (no database delay)
      const recipientSocket = activeUsers.get(recipientId);
      if (recipientSocket) {
        io.to(`user_${recipientId}`).emit('user_typing', {
          userId: socket.userId,
          username: socket.user.username,
          conversationId,
          timestamp: now
        });
      }

    } catch (error) {
      console.error('Typing start error:', error);
      // Don't crash the socket connection, just log the error
    }
  });

  socket.on('typing_stop', async (data) => {
    try {
      const { recipientId, conversationId } = data;

      // Validate input
      if (!recipientId || !conversationId) {
        console.warn('Invalid typing_stop data:', data);
        return;
      }

      // ✅ Enhanced cleanup with timeout management
      const typingKey = `${conversationId}_${socket.userId}`;
      const existingState = typingCache.get(typingKey);

      // Clear any existing timeout to prevent conflicts
      if (existingState && existingState.timeoutId) {
        clearTimeout(existingState.timeoutId);
      }

      // Remove from cache
      typingCache.delete(typingKey);

      // ✅ INSTANT notification to recipient
      const recipientSocket = activeUsers.get(recipientId);
      if (recipientSocket) {
        io.to(`user_${recipientId}`).emit('user_stopped_typing', {
          userId: socket.userId,
          conversationId,
          timestamp: Date.now()
        });
      }

    } catch (error) {
      console.error('Typing stop error:', error);
      // Don't crash the socket connection, just log the error
    }
  });

  // Handle message reactions
  socket.on('add_reaction', async (data) => {
    try {
      const { messageId, emoji } = data;

      const message = await Message.findById(messageId);
      if (!message) {
        socket.emit('reaction_error', { error: 'Message not found' });
        return;
      }

      // Check if user is part of this conversation
      if (message.sender.toString() !== socket.userId &&
          message.recipient.toString() !== socket.userId) {
        socket.emit('reaction_error', { error: 'Access denied' });
        return;
      }

      await message.addReaction(socket.userId, emoji);

      // Notify both users
      const otherUserId = message.sender.toString() === socket.userId
        ? message.recipient.toString()
        : message.sender.toString();

      const reactionData = {
        messageId,
        userId: socket.userId,
        username: socket.user.username,
        emoji
      };

      socket.emit('reaction_added', reactionData);

      const otherUserSocket = activeUsers.get(otherUserId);
      if (otherUserSocket) {
        io.to(`user_${otherUserId}`).emit('reaction_added', reactionData);
      }

    } catch (error) {
      console.error('Add reaction error:', error);
      socket.emit('reaction_error', { error: 'Failed to add reaction' });
    }
  });



  // Handle marking messages as read/seen
  socket.on('mark_messages_read', async (data) => {
    try {
      console.log(`📖 Raw data received:`, data);

      // Handle different data formats
      let conversationId, messageIds, recipientId;

      if (typeof data === 'string') {
        // If data is a string, it might be a conversationId
        conversationId = data;
      } else if (typeof data === 'object') {
        // Extract from object
        conversationId = data.conversationId;
        messageIds = data.messageIds;
        recipientId = data.recipientId;
      }

      console.log(`📖 Marking messages as read for user ${socket.userId}`, {
        conversationId,
        messageIds,
        recipientId
      });

      // If specific message IDs provided, mark only those
      if (messageIds && messageIds.length > 0) {
        const messages = await Message.find({
          _id: { $in: messageIds },
          recipient: socket.userId,
          'readBy.user': { $ne: socket.userId }
        });

        console.log(`📋 Found ${messages.length} messages to mark as read`);

        for (const message of messages) {
          await message.markAsRead(socket.userId);

          // Notify sender about read receipt
          const senderSocket = activeUsers.get(message.sender.toString());
          if (senderSocket) {
            io.to(`user_${message.sender}`).emit('message_read', {
              messageId: message._id,
              readBy: socket.userId,
              readAt: new Date()
            });
          }
        }
      } else if (recipientId || conversationId) {
        // Mark all unread messages from a specific user
        const otherUserId = recipientId || conversationId;
        const messages = await Message.find({
          sender: otherUserId,
          recipient: socket.userId,
          'readBy.user': { $ne: socket.userId }
        });

        console.log(`📋 Found ${messages.length} unread messages from user ${otherUserId}`);

        for (const message of messages) {
          await message.markAsRead(socket.userId);

          // Notify sender
          const senderSocket = activeUsers.get(message.sender.toString());
          if (senderSocket) {
            io.to(`user_${message.sender}`).emit('message_read', {
              messageId: message._id,
              readBy: socket.userId,
              readAt: new Date()
            });
          }
        }
      }

      console.log(`✅ Messages marked as read successfully`);

    } catch (error) {
      console.error('Mark messages read error:', error);
      socket.emit('read_error', { error: 'Failed to mark messages as read' });
    }
  });

  // 🔄 Handle heartbeat from client
  socket.on('heartbeat', () => {
    userHeartbeats.set(socket.userId, Date.now());
    socket.emit('heartbeat_ack'); // Acknowledge heartbeat
  });

  // ⏰ Handle user activity updates
  socket.on('user_activity', (data) => {
    try {
      const { type } = data; // 'active', 'idle', 'away'

      const activity = userActivity.get(socket.userId);
      if (activity) {
        activity.lastActivity = Date.now();
        if (type === 'active') {
          activity.status = 'online';
        }

        // Update user status
        const userStatus = allUsersStatus.get(socket.userId);
        if (userStatus && userStatus.status !== activity.status) {
          userStatus.status = activity.status;
          userStatus.isOnline = activity.status !== 'offline';

          // Broadcast status change
          socket.broadcast.emit('user_status_changed', {
            userId: socket.userId,
            username: socket.user.username,
            avatar: socket.user.avatar,
            isOnline: activity.status !== 'offline',
            status: activity.status,
            lastSeen: new Date()
          });
        }
      }
    } catch (error) {
      console.error('User activity error:', error);
    }
  });

  // Handle user status updates
  socket.on('update_status', async (data) => {
    try {
      const { status } = data; // 'online', 'away', 'busy', 'offline'

      // Update activity tracking
      const activity = userActivity.get(socket.userId);
      if (activity) {
        activity.status = status;
        activity.lastActivity = Date.now();
      }

      // Update user status
      const userStatus = allUsersStatus.get(socket.userId);
      if (userStatus) {
        userStatus.status = status;
        userStatus.isOnline = status !== 'offline';
      }

      // Broadcast status change
      socket.broadcast.emit('user_status_changed', {
        userId: socket.userId,
        username: socket.user.username,
        avatar: socket.user.avatar,
        isOnline: status !== 'offline',
        status: status,
        lastSeen: new Date()
      });

    } catch (error) {
      console.error('Update status error:', error);
    }
  });

  // Handle disconnection
  socket.on('disconnect', async () => {
    try {
      console.log(`❌ User disconnected: ${socket.user.username} (${socket.id})`);

      // 📱 Remove device from user's device list
      const userDeviceSet = userDevices.get(socket.userId);
      if (userDeviceSet) {
        userDeviceSet.delete(socket.id);

        // If user has other active devices, don't mark as offline
        if (userDeviceSet.size > 0) {
          console.log(`📱 User ${socket.user.username} still has ${userDeviceSet.size} active device(s)`);

          // Update device count in status
          const userStatus = allUsersStatus.get(socket.userId);
          if (userStatus) {
            userStatus.deviceCount = userDeviceSet.size;
          }

          // Clean up this specific socket but keep user online
          return;
        } else {
          // No more devices, clean up completely
          userDevices.delete(socket.userId);
        }
      }

      // Remove from active users (only if no other devices)
      activeUsers.delete(socket.userId);

      // 🔄 Clean up heartbeat tracking
      userHeartbeats.delete(socket.userId);

      // ⏰ Clean up activity tracking
      userActivity.delete(socket.userId);

      // Update all users status map to offline
      allUsersStatus.set(socket.userId, {
        user: socket.user,
        isOnline: false,
        status: 'offline',
        lastSeen: new Date(),
        socketId: null,
        deviceCount: 0
      });

      // Update user offline status in database
      await socket.user.setOnlineStatus(false);

      // Broadcast user offline status to all users
      socket.broadcast.emit('user_status_changed', {
        userId: socket.userId,
        username: socket.user.username,
        avatar: socket.user.avatar,
        isOnline: false,
        status: 'offline',
        lastSeen: new Date()
      });

      // Remove typing indicators for this user
      // This would be more efficient with Redis in production
      const conversations = await Conversation.find({
        participants: socket.userId,
        'typing.user': socket.userId
      });

      await Promise.all(conversations.map(conv => conv.removeTyping(socket.userId)));

      // Clean up typing throttle entries for this user
      for (const [key] of typingThrottle.entries()) {
        if (key.startsWith(`${socket.userId}_`)) {
          typingThrottle.delete(key);
        }
      }

      console.log(`📊 Online users: ${activeUsers.size}`);

    } catch (error) {
      console.error('Disconnect error:', error);
    }
  });
};

// Middleware to authenticate socket connections
export const socketAuthMiddleware = (socket, next) => {
  authenticateSocket(socket, next);
};

// Get online users count
export const getOnlineUsersCount = () => {
  return activeUsers.size;
};

// Get online users list
export const getOnlineUsers = () => {
  return Array.from(activeUsers.values()).map(activeUser => ({
    userId: activeUser.user._id,
    username: activeUser.user.username,
    avatar: activeUser.user.avatar,
    lastSeen: activeUser.lastSeen
  }));
};

export default {
  handleSocketConnection,
  socketAuthMiddleware,
  getOnlineUsersCount,
  getOnlineUsers
};
