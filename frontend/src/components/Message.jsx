import { ArrowUturnLeftIcon, CheckIcon, EllipsisVerticalIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useEffect, useRef, useState } from 'react';
import { countEmojis, getEmojiSizeClass, isEmojiOnly, isSingleEmoji } from '../utils/emojiUtils';
import DeleteMessageModal from './DeleteMessageModal';
import ImageModal from './ImageModal';

const Message = ({
  message,
  isOwn,
  currentUser,
  conversationParticipant,
  onReply,
  onDelete,
  onEdit,
  className = ''
}) => {
  // Debug logging for image messages
  if (message.type === 'image') {
    console.log('🖼️ Rendering image message:', {
      id: message._id,
      type: message.type,
      hasImage: !!message.image,
      imageUrl: message.image?.url,
      content: message.content
    });
  }
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content || '');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const editTextareaRef = useRef(null);



  // Focus textarea when editing starts
  useEffect(() => {
    if (isEditing && editTextareaRef.current) {
      editTextareaRef.current.focus();
      // Set cursor to end of text
      const length = editTextareaRef.current.value.length;
      editTextareaRef.current.setSelectionRange(length, length);
    }
  }, [isEditing]);

  const handleReply = () => {
    if (onReply) {
      onReply(message);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditContent(message.content || '');
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(message.content || '');
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim() || editContent.trim() === message.content) {
      handleCancelEdit();
      return;
    }

    if (onEdit) {
      setIsSubmittingEdit(true);
      try {
        await onEdit(message, editContent.trim());
        setIsEditing(false);
      } catch (error) {
        console.error('Edit error:', error);
      } finally {
        setIsSubmittingEdit(false);
      }
    }
  };

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (onDelete) {
      setIsDeleting(true);
      try {
        await onDelete(message);
        setShowDeleteModal(false);
      } catch (error) {
        console.error('Delete error:', error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
  };

  const handleImageClick = () => {
    if (!message.image?.isOptimistic) {
      setShowImageModal(true);
    }
  };

  const handleCloseImageModal = () => {
    setShowImageModal(false);
  };



  // Check if message is emoji-only
  const isEmojiOnlyMessage = isEmojiOnly(message.content);
  const emojiCount = countEmojis(message.content);
  const isSingleEmojiMessage = isSingleEmoji(message.content);

  // Check if reply-to message is emoji-only
  const isReplyToEmojiOnly = message.replyTo ? isEmojiOnly(message.replyTo.content) : false;
  const replyToEmojiCount = message.replyTo ? countEmojis(message.replyTo.content) : 0;

  // Helper function to get reply sender name
  const getReplyToSenderName = () => {
    if (!message.replyTo) return 'Unknown User';

    // Check different possible structures
    if (message.replyTo.sender?.username) {
      return message.replyTo.sender.username;
    }

    // If sender is just an ID, try to find from current conversation participants
    if (typeof message.replyTo.sender === 'string' || message.replyTo.sender?._id) {
      const senderId = typeof message.replyTo.sender === 'string'
        ? message.replyTo.sender
        : message.replyTo.sender._id;

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

  // Check if message is deleted
  const isDeleted = message.deleted?.isDeleted;

  // Check if message can be edited
  const canEdit = () => {
    if (!isOwn || isDeleted || message.type !== 'text') return false;

    // Check edit time limit (15 minutes)
    const editTimeLimit = 15 * 60 * 1000; // 15 minutes in milliseconds
    const timeSinceCreation = Date.now() - new Date(message.createdAt).getTime();

    return timeSinceCreation <= editTimeLimit;
  };

  const isEditable = canEdit();

  // Determine animation class based on message status
  const getAnimationClass = () => {
    if (message.isOptimistic) return 'optimistic';
    if (message.status === 'sending') return 'sending';
    if (message.status === 'sent') return 'sent';
    return '';
  };

  return (
    <>
      <div className={`message-container ${getAnimationClass()} flex ${isOwn ? 'justify-end' : 'justify-start'} group ${className}`}>
        <div className={`message-bubble ${isOwn ? 'own' : 'other'} ${isEmojiOnlyMessage ? 'emoji-only' : ''}`}>
          {/* Reply to message preview */}
          {message.replyTo && (
            <div className="reply-indicator">
              <div className="reply-author">
                {getReplyToSenderName()}
              </div>

              {/* Handle different message types in reply */}
              {message.replyTo.type === 'image' ? (
                <div className="flex items-center space-x-2">
                  {message.replyTo.image?.url && (
                    <img
                      src={message.replyTo.image.url}
                      alt="Reply image"
                      className="w-8 h-8 rounded object-cover"
                    />
                  )}
                  <div className="flex flex-col">
                    <span className="text-xs opacity-75">📷 Image</span>
                    {message.replyTo.content && (
                      <span className="text-xs opacity-60">{message.replyTo.content}</span>
                    )}
                  </div>
                </div>
              ) : isReplyToEmojiOnly ? (
                <div className="flex items-center space-x-2">
                  <span className={`${replyToEmojiCount === 1 ? 'text-base' : replyToEmojiCount <= 3 ? 'text-sm' : 'text-xs'} opacity-75`}>
                    {message.replyTo.content}
                  </span>
                  <span className="text-xs opacity-50">
                    {replyToEmojiCount === 1 ? 'Emoji' : `${replyToEmojiCount} Emojis`}
                  </span>
                </div>
              ) : (
                <div className="reply-content">
                  {message.replyTo.content || 'Message not available'}
                </div>
              )}
            </div>
          )}

          {/* Message content */}
          <div className={`${isEmojiOnlyMessage ? 'emoji-message-container' : ''}`}>
            {isDeleted ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                Message deleted
              </p>
            ) : isEditing ? (
              <div className="space-y-2">
                <textarea
                  ref={editTextareaRef}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  onKeyDown={handleEditKeyDown}
                  className={`
                    w-full text-sm bg-transparent border-none outline-none resize-none
                    ${isOwn ? 'text-white placeholder-blue-200' : 'text-gray-900 dark:text-white placeholder-gray-400'}
                  `}
                  placeholder="Edit message..."
                  rows={Math.max(1, Math.ceil(editContent.length / 50))}
                  disabled={isSubmittingEdit}
                />
                <div className="flex items-center justify-end space-x-2">
                  <button
                    onClick={handleCancelEdit}
                    disabled={isSubmittingEdit}
                    className={`
                      p-1 rounded-full transition-colors
                      ${isOwn
                        ? 'text-blue-200 hover:text-white hover:bg-blue-500'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }
                    `}
                    title="Cancel edit"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={isSubmittingEdit || !editContent.trim() || editContent.trim() === message.content}
                    className={`
                      p-1 rounded-full transition-colors
                      ${isOwn
                        ? 'text-blue-200 hover:text-white hover:bg-blue-500 disabled:text-blue-300 disabled:cursor-not-allowed'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed'
                      }
                    `}
                    title="Save edit"
                  >
                    <CheckIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {/* Image message */}
                {message.type === 'image' && message.image?.url ? (
                  <div className={`image-message relative ${message.image.isOptimistic ? 'optimistic' : ''}`}>
                    <img
                      src={message.image.url}
                      alt="Shared image"
                      className={`max-w-xs max-h-64 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity ${
                        message.image.isOptimistic ? 'opacity-75' : ''
                      }`}
                      onClick={handleImageClick}
                      loading="lazy"
                      onError={(e) => {
                        console.error('Image failed to load:', message.image.url);
                        if (!message.image.isOptimistic) {
                          e.target.style.display = 'none';
                        }
                      }}
                    />

                    {/* Upload progress overlay for optimistic images */}
                    {message.image.isOptimistic && (
                      <div className="upload-overlay absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-lg">
                        <div className="text-white text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <div className="spinner rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            <span>Uploading...</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {message.content && (
                      <p className="message-content mt-2">
                        {message.content}
                      </p>
                    )}
                    {message.edited?.isEdited && (
                      <p className="text-xs mt-1 italic opacity-60">
                        edited
                      </p>
                    )}
                  </div>
                ) : (
                  /* Text message */
                  <div>
                    <p className={`message-content ${
                      isEmojiOnlyMessage
                        ? `${getEmojiSizeClass(emojiCount)} leading-none text-center emoji-message font-emoji ${isSingleEmojiMessage ? 'single-emoji' : ''}`
                        : ''
                    }`}>
                      {message.content}
                    </p>
                    {message.edited?.isEdited && (
                      <p className="text-xs mt-1 italic opacity-60">
                        edited
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Message timestamp and read receipts */}
            {!isEmojiOnlyMessage && (
              <div className="message-timestamp">
                <span>
                  {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>

                {/* Message Status Indicator */}
                {isOwn && (
                  <span className="ml-2 text-xs message-status">
                    {message.isOptimistic ? (
                      message.status === 'uploading' ? (
                        <span className="message-status sending">Uploading...</span>
                      ) : (
                        <span className="message-status sending">Sending...</span>
                      )
                    ) : message.status === 'sending' ? (
                      <span className="message-status sending">Sending...</span>
                    ) : message.status === 'sent' ? (
                      <span className="message-status sent">Sent</span>
                    ) : (
                      <span className="message-status sent">✓</span>
                    )}
                  </span>
                )}

                {/* Read receipts for sent messages */}
                {isOwn && (
                  <div className="flex items-center">
                    {message.readBy && message.readBy.length > 0 ? (
                      <svg className="w-4 h-4 read-receipt read" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 read-receipt sent" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Timestamp for emoji-only messages - show on hover */}
          {isEmojiOnlyMessage && (
            <div className={`
              absolute ${isOwn ? '-left-20' : '-right-20'} top-1/2 transform -translate-y-1/2
              opacity-0 group-hover:opacity-100 transition-opacity duration-200
              text-xs text-white bg-black/75 px-2 py-1 rounded whitespace-nowrap
              pointer-events-none z-10
            `}>
              {new Date(message.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          )}

          {/* Message actions (visible on hover) - hide for deleted messages */}
          {!isDeleted && (
            <div className={`message-actions ${isOwn ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'}`}>
              <button
                onClick={handleReply}
                className="message-action-btn"
                title="Reply"
              >
                <ArrowUturnLeftIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>

              {/* Edit button - only show for own editable messages */}
              {isEditable && (
                <button
                  onClick={handleEdit}
                  className="message-action-btn"
                  title="Edit message"
                >
                  <PencilIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </button>
              )}

              {/* Delete button - only show for own messages */}
              {isOwn && (
                <button
                  onClick={handleDelete}
                  className="message-action-btn"
                  title="Delete message"
                >
                  <TrashIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </button>
              )}

              <button
                className="message-action-btn"
                title="More options"
              >
                <EllipsisVerticalIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
          )}
        </div>
      </div>

    {/* Delete confirmation modal */}
    <DeleteMessageModal
      isOpen={showDeleteModal}
      onClose={handleCancelDelete}
      onConfirm={handleConfirmDelete}
      message={message}
      isDeleting={isDeleting}
    />

    {/* Image modal */}
    {message.type === 'image' && message.image?.url && (
      <ImageModal
        isOpen={showImageModal}
        onClose={handleCloseImageModal}
        imageUrl={message.image.url}
        imageData={message.image}
        senderName={message.sender?.username || 'Unknown'}
      />
    )}

  </>
  );
};

export default Message;
