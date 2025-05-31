import { XMarkIcon } from '@heroicons/react/24/outline';
import { isEmojiOnly, countEmojis } from '../utils/emojiUtils';

const ReplyPreview = ({ replyingTo, onCancel, currentUser, conversationParticipant, className = '' }) => {
  if (!replyingTo) return null;

  // Check if the reply message is emoji-only
  const isEmojiOnlyMessage = isEmojiOnly(replyingTo.content);
  const emojiCount = countEmojis(replyingTo.content);

  // Helper function to get sender name
  const getSenderName = () => {
    if (!replyingTo) return 'Unknown User';

    // Check different possible structures
    if (replyingTo.sender?.username) {
      return replyingTo.sender.username;
    }

    // If sender is just an ID, try to find from current conversation participants
    if (typeof replyingTo.sender === 'string' || replyingTo.sender?._id) {
      const senderId = typeof replyingTo.sender === 'string'
        ? replyingTo.sender
        : replyingTo.sender._id;

      // If it's the current user
      if (senderId === currentUser?._id) {
        return 'You';
      }

      // If it's the conversation participant
      if (senderId === conversationParticipant?._id) {
        return conversationParticipant.username;
      }

      // Otherwise return a fallback
      return 'User';
    }

    return 'Unknown User';
  };

  return (
    <div className={`message-input-container border-t-0 ${className}`}>
      <div className="flex items-center justify-between bg-white dark:bg-gray-700 rounded-lg p-3 mb-2 shadow-sm">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3">
            <div className="w-1 h-10 bg-green-500 rounded-full"></div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">
                Replying to {getSenderName()}
              </p>
              {isEmojiOnlyMessage ? (
                <div className="flex items-center space-x-2">
                  <span className={`font-emoji ${emojiCount === 1 ? 'text-lg' : emojiCount <= 3 ? 'text-base' : 'text-sm'}`}>
                    {replyingTo.content}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {emojiCount === 1 ? 'Emoji' : `${emojiCount} Emojis`}
                  </span>
                </div>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                  {replyingTo.content || 'Message not available'}
                </p>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={onCancel}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ml-3"
          title="Cancel reply"
        >
          <XMarkIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </button>
      </div>
    </div>
  );
};

export default ReplyPreview;
