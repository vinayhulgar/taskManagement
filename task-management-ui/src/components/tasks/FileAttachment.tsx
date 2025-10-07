import React, { useState, useRef, useCallback } from 'react';
import { Attachment, User } from '../../types';
import { Button } from '../ui/Button';
import { formatFileSize, formatRelativeTime } from '../../utils';
import { 
  PaperClipIcon,
  CloudArrowUpIcon,
  DocumentIcon,
  PhotoIcon,
  VideoCameraIcon,
  MusicalNoteIcon,
  ArchiveBoxIcon,
  TrashIcon,
  EyeIcon,
  ArrowDownTrayIcon,
} from '../icons';

interface FileAttachmentProps {
  taskId: string;
  attachments: Attachment[];
  currentUser: User;
  onUpload: (files: File[]) => Promise<void>;
  onDelete: (attachmentId: string) => void;
  onPreview?: (attachment: Attachment) => void;
  maxFileSize?: number; // in bytes
  allowedTypes?: string[];
  className?: string;
}

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) {
    return <PhotoIcon className="h-8 w-8 text-blue-500" />;
  } else if (mimeType.startsWith('video/')) {
    return <VideoCameraIcon className="h-8 w-8 text-purple-500" />;
  } else if (mimeType.startsWith('audio/')) {
    return <MusicalNoteIcon className="h-8 w-8 text-green-500" />;
  } else if (mimeType.includes('pdf')) {
    return <DocumentIcon className="h-8 w-8 text-red-500" />;
  } else if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) {
    return <ArchiveBoxIcon className="h-8 w-8 text-yellow-500" />;
  } else {
    return <DocumentIcon className="h-8 w-8 text-gray-500" />;
  }
};

const getFileTypeLabel = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return 'Image';
  if (mimeType.startsWith('video/')) return 'Video';
  if (mimeType.startsWith('audio/')) return 'Audio';
  if (mimeType.includes('pdf')) return 'PDF';
  if (mimeType.includes('zip')) return 'Archive';
  if (mimeType.includes('word')) return 'Document';
  if (mimeType.includes('sheet')) return 'Spreadsheet';
  if (mimeType.includes('presentation')) return 'Presentation';
  return 'File';
};

const FileAttachment: React.FC<FileAttachmentProps> = ({
  taskId,
  attachments,
  currentUser,
  onUpload,
  onDelete,
  onPreview,
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  allowedTypes = [],
  className = '',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSize) {
      return `File size must be less than ${formatFileSize(maxFileSize)}`;
    }
    
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      return `File type ${file.type} is not allowed`;
    }
    
    return null;
  };

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const errors: string[] = [];

    // Validate files
    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    // Show errors if any
    if (errors.length > 0) {
      alert(`Upload errors:\n${errors.join('\n')}`);
    }

    // Upload valid files
    if (validFiles.length > 0) {
      setIsUploading(true);
      try {
        await onUpload(validFiles);
      } catch (error) {
        console.error('Upload failed:', error);
        alert('Upload failed. Please try again.');
      } finally {
        setIsUploading(false);
        setUploadProgress({});
      }
    }
  }, [maxFileSize, allowedTypes, onUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  const handleDeleteAttachment = (attachmentId: string) => {
    if (window.confirm('Are you sure you want to delete this attachment?')) {
      onDelete(attachmentId);
    }
  };

  const handleDownload = (attachment: Attachment) => {
    // Create a temporary link to download the file
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <PaperClipIcon className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900">
            Attachments ({attachments.length})
          </h3>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center space-x-2"
        >
          <CloudArrowUpIcon className="h-4 w-4" />
          <span>Upload Files</span>
        </Button>
      </div>

      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        accept={allowedTypes.length > 0 ? allowedTypes.join(',') : undefined}
      />

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${isDragging 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${isUploading ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <CloudArrowUpIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
        <p className="text-sm text-gray-600 mb-1">
          {isDragging ? 'Drop files here' : 'Drag and drop files here, or click to select'}
        </p>
        <p className="text-xs text-gray-500">
          Max file size: {formatFileSize(maxFileSize)}
          {allowedTypes.length > 0 && (
            <span> • Allowed types: {allowedTypes.join(', ')}</span>
          )}
        </p>
        
        {isUploading && (
          <div className="mt-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-sm text-blue-600 mt-2">Uploading...</p>
          </div>
        )}
      </div>

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 group"
            >
              {/* File Icon */}
              <div className="flex-shrink-0">
                {getFileIcon(attachment.mimeType)}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {attachment.originalName}
                  </p>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                    {getFileTypeLabel(attachment.mimeType)}
                  </span>
                </div>
                
                <div className="flex items-center space-x-4 mt-1">
                  <span className="text-xs text-gray-500">
                    {formatFileSize(attachment.size)}
                  </span>
                  
                  {attachment.uploadedBy && (
                    <span className="text-xs text-gray-500">
                      Uploaded by {attachment.uploadedBy.firstName} {attachment.uploadedBy.lastName}
                    </span>
                  )}
                  
                  <span className="text-xs text-gray-500">
                    {formatRelativeTime(attachment.createdAt)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Preview button for images */}
                {attachment.mimeType.startsWith('image/') && onPreview && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onPreview(attachment)}
                    className="p-1 h-8 w-8"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </Button>
                )}
                
                {/* Download button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(attachment)}
                  className="p-1 h-8 w-8"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                </Button>
                
                {/* Delete button (only for file uploader or admin) */}
                {(attachment.uploadedById === currentUser.id || currentUser.role === 'ADMIN') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteAttachment(attachment.id)}
                    className="p-1 h-8 w-8 text-red-600 hover:text-red-700"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {attachments.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <PaperClipIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p>No attachments yet</p>
          <p className="text-sm">Drag and drop files or click upload to add attachments</p>
        </div>
      )}
    </div>
  );
};

export default FileAttachment;