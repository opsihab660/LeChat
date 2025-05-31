import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: function() {
      return !this.audio;
    },
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  type: {
    type: String,
    enum: ['text', 'audio', 'emoji'],
    default: 'text'
  },
  audio: {
    url: String,
    duration: Number,
    size: Number
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  edited: {
    isEdited: {
      type: Boolean,
      default: false
    },
    editedAt: {
      type: Date
    },
    originalContent: String
  },
  deleted: {
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: {
      type: Date
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  metadata: {
    deviceInfo: String,
    ipAddress: String,
    userAgent: String
  }
}, {
  timestamps: true
});

// 🚀 ENHANCED PERFORMANCE OPTIMIZATION: Add comprehensive database indexes
messageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });
messageSchema.index({ recipient: 1, sender: 1, createdAt: -1 });
messageSchema.index({ createdAt: -1 });
messageSchema.index({ 'deleted.isDeleted': 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ recipient: 1, createdAt: -1 });
// Compound index for conversation queries with read status
messageSchema.index({
  $or: [
    { sender: 1, recipient: 1 },
    { sender: 1, recipient: 1 }
  ],
  'deleted.isDeleted': 1,
  createdAt: -1
});
// Index for unread message queries
messageSchema.index({ recipient: 1, 'readBy.user': 1, 'deleted.isDeleted': 1 });
// Text index for message search
messageSchema.index({ content: 'text', sender: 1, recipient: 1 });

// Virtual for conversation participants
messageSchema.virtual('participants').get(function() {
  return [this.sender, this.recipient];
});

// Method to mark message as read
messageSchema.methods.markAsRead = function(userId) {
  const existingRead = this.readBy.find(read => read.user.toString() === userId.toString());

  if (!existingRead) {
    this.readBy.push({
      user: userId,
      readAt: new Date()
    });
    return this.save();
  }

  return Promise.resolve(this);
};

// Method to add reaction
messageSchema.methods.addReaction = function(userId, emoji) {
  // Remove existing reaction from this user
  this.reactions = this.reactions.filter(reaction =>
    reaction.user.toString() !== userId.toString()
  );

  // Add new reaction
  this.reactions.push({
    user: userId,
    emoji: emoji,
    createdAt: new Date()
  });

  return this.save();
};

// Method to remove reaction
messageSchema.methods.removeReaction = function(userId) {
  this.reactions = this.reactions.filter(reaction =>
    reaction.user.toString() !== userId.toString()
  );

  return this.save();
};

// Method to edit message
messageSchema.methods.editMessage = function(newContent) {
  if (!this.edited.isEdited) {
    this.edited.originalContent = this.content;
  }

  this.content = newContent;
  this.edited.isEdited = true;
  this.edited.editedAt = new Date();

  return this.save();
};

// Method to soft delete message
messageSchema.methods.softDelete = function(deletedBy) {
  this.deleted.isDeleted = true;
  this.deleted.deletedAt = new Date();
  this.deleted.deletedBy = deletedBy;

  return this.save();
};

// 🚀 HIGHLY OPTIMIZED: Static method to get conversation between two users
messageSchema.statics.getConversation = function(user1Id, user2Id, page = 1, limit = 50) {
  const skip = (page - 1) * limit;

  return this.aggregate([
    // Match messages between users
    {
      $match: {
        $or: [
          { sender: user1Id, recipient: user2Id },
          { sender: user2Id, recipient: user1Id }
        ]
      }
    },
    // Sort by creation date (newest first for pagination)
    { $sort: { createdAt: -1 } },
    // Skip and limit for pagination
    { $skip: skip },
    { $limit: limit },
    // Lookup sender details
    {
      $lookup: {
        from: 'users',
        localField: 'sender',
        foreignField: '_id',
        as: 'sender',
        pipeline: [{ $project: { username: 1, avatar: 1, isOnline: 1 } }]
      }
    },
    // Lookup recipient details
    {
      $lookup: {
        from: 'users',
        localField: 'recipient',
        foreignField: '_id',
        as: 'recipient',
        pipeline: [{ $project: { username: 1, avatar: 1, isOnline: 1 } }]
      }
    },
    // Lookup reply-to message details
    {
      $lookup: {
        from: 'messages',
        localField: 'replyTo',
        foreignField: '_id',
        as: 'replyTo',
        pipeline: [
          { $project: { content: 1, sender: 1, createdAt: 1, deleted: 1 } },
          {
            $lookup: {
              from: 'users',
              localField: 'sender',
              foreignField: '_id',
              as: 'sender',
              pipeline: [{ $project: { username: 1, avatar: 1 } }]
            }
          },
          { $unwind: { path: '$sender', preserveNullAndEmptyArrays: true } }
        ]
      }
    },
    // Unwind arrays to objects
    { $unwind: { path: '$sender', preserveNullAndEmptyArrays: true } },
    { $unwind: { path: '$recipient', preserveNullAndEmptyArrays: true } },
    { $unwind: { path: '$replyTo', preserveNullAndEmptyArrays: true } }
  ]);
};

// Static method to get unread message count
messageSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    recipient: userId,
    'readBy.user': { $ne: userId },
    'deleted.isDeleted': false
  });
};

export default mongoose.model('Message', messageSchema);
