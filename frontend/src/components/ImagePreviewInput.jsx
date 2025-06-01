import { useState, useRef } from 'react';
import { PhotoIcon, XMarkIcon, PaperAirplaneIcon, FaceSmileIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import api from '../services/api';

const ImagePreviewInput = ({
  onImageSelect,
  onSendMessage,
  disabled = false,
  message,
  setMessage,
  onMessageChange,
  placeholder = "Type a message...",
  showEmojiPicker = false,
  onToggleEmojiPicker,
  onEmojiClick
}) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(''); // 'uploading', 'uploaded', 'sending', 'sent'
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('Image size must be less than 10MB');
      return;
    }

    setSelectedImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadAndSend = async () => {
    if (!selectedImage) return;

    // Immediately send optimistic message with local image preview
    const optimisticImageData = {
      url: imagePreview, // Use local preview URL
      isOptimistic: true,
      fileName: selectedImage.name,
      fileSize: selectedImage.size
    };

    console.log('📤 Sending optimistic image message');
    onImageSelect(optimisticImageData);

    // Reset UI state immediately
    const imageFile = selectedImage;
    setSelectedImage(null);
    setImagePreview(null);
    setUploadStatus('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Upload in background
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      console.log('🔄 Starting background upload...');
      const response = await api.post('/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        console.log('✅ Background upload successful:', response.data);
        // Update the optimistic message with real Cloudinary URL
        if (onImageSelect.updateOptimistic) {
          onImageSelect.updateOptimistic(response.data);
        }
      } else {
        console.error('❌ Background upload failed:', response.data);
        toast.error('Failed to upload image');
      }
    } catch (error) {
      console.error('Background upload error:', error);
      toast.error(error.response?.data?.error || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setUploadStatus('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const getStatusText = () => {
    switch (uploadStatus) {
      case 'uploading': return 'Uploading...';
      case 'uploaded': return 'Uploaded';
      case 'sending': return 'Sending...';
      case 'sent': return 'Sent';
      default: return '';
    }
  };

  const getStatusColor = () => {
    switch (uploadStatus) {
      case 'uploading': return 'text-blue-500';
      case 'uploaded': return 'text-green-500';
      case 'sending': return 'text-blue-500';
      case 'sent': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Image Preview Section */}
      {selectedImage && (
        <div className="mb-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-12 h-12 object-cover rounded-lg"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {selectedImage.name}
              </p>
              <p className={`text-xs upload-status ${uploadStatus} ${getStatusColor()}`}>
                {getStatusText() || 'Ready to send'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isUploading}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Remove image"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Input Field */}
      <div className="flex items-center space-x-2">
        {/* Image Upload Button */}
        <button
          type="button"
          onClick={triggerFileSelect}
          disabled={disabled || isUploading}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white transition-colors"
          title="Upload image"
        >
          <PhotoIcon className="w-5 h-5" />
        </button>

        {/* Text Input */}
        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={onMessageChange || ((e) => setMessage(e.target.value))}
            placeholder={placeholder}
            className="message-input w-full pr-12"
            rows="1"
            disabled={isUploading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (selectedImage) {
                  handleUploadAndSend();
                } else {
                  onSendMessage(e);
                }
              }
            }}
          />
          {/* Emoji Button */}
          {onToggleEmojiPicker && (
            <button
              type="button"
              className={`absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-lg transition-all duration-200 text-sm sm:text-base ${
                showEmojiPicker
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              onClick={onToggleEmojiPicker}
              title="Add emoji"
            >
              <FaceSmileIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Send Button */}
        <button
          type="button"
          onClick={selectedImage ? handleUploadAndSend : onSendMessage}
          disabled={(!message.trim() && !selectedImage) || isUploading}
          className="send-button"
        >
          <PaperAirplaneIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ImagePreviewInput;
