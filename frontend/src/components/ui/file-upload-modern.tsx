'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  X, 
  File, 
  Image, 
  Video, 
  Music, 
  FileText, 
  Archive,
  CheckCircle,
  AlertCircle,
  Loader2,
  Trash2,
  Eye,
  Download,
  Copy,
  MoreHorizontal,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

// 🎯 TYPES
interface FileItem {
  id: string;
  file: File;
  preview?: string;
  progress: number;
  status: 'uploading' | 'success' | 'error' | 'pending';
  error?: string;
  size: number;
  type: string;
  name: string;
}

interface ModernFileUploadProps {
  multiple?: boolean;
  accept?: string;
  maxSize?: number; // in bytes
  maxFiles?: number;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'default' | 'minimal' | 'glass' | 'premium';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  showPreview?: boolean;
  showProgress?: boolean;
  showFileList?: boolean;
  dragAndDrop?: boolean;
  autoUpload?: boolean;
  onFilesSelect?: (files: File[]) => void;
  onFileUpload?: (file: FileItem) => Promise<void>;
  onFileRemove?: (fileId: string) => void;
  onUploadComplete?: (files: FileItem[]) => void;
  className?: string;
}

// 🎨 COMPONENTE PRINCIPAL
export const ModernFileUpload = React.forwardRef<HTMLDivElement, ModernFileUploadProps>(
  ({
    multiple = false,
    accept,
    maxSize = 10 * 1024 * 1024, // 10MB default
    maxFiles = 10,
    disabled = false,
    loading = false,
    variant = 'default',
    size = 'md',
    animated = true,
    showPreview = true,
    showProgress = true,
    showFileList = true,
    dragAndDrop = true,
    autoUpload = false,
    onFilesSelect,
    onFileUpload,
    onFileRemove,
    onUploadComplete,
    className,
    ...props
  }, ref) => {
    // 🎭 STATES
    const [files, setFiles] = React.useState<FileItem[]>([]);
    const [isDragOver, setIsDragOver] = React.useState(false);
    const [uploadingCount, setUploadingCount] = React.useState(0);
    const [dragCounter, setDragCounter] = React.useState(0);

    // 🔍 REFS
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const dropZoneRef = React.useRef<HTMLDivElement>(null);

    // 🎯 HELPER FUNCTIONS
    const formatFileSize = (bytes: number): string => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileIcon = (type: string): React.ReactNode => {
      if (type.startsWith('image/')) return <Image className="w-6 h-6" />;
      if (type.startsWith('video/')) return <Video className="w-6 h-6" />;
      if (type.startsWith('audio/')) return <Music className="w-6 h-6" />;
      if (type.includes('pdf') || type.includes('document')) return <FileText className="w-6 h-6" />;
      if (type.includes('zip') || type.includes('rar') || type.includes('tar')) return <Archive className="w-6 h-6" />;
      return <File className="w-6 h-6" />;
    };

    const validateFile = (file: File): { valid: boolean; error?: string } => {
      // Size validation
      if (file.size > maxSize) {
        return {
          valid: false,
          error: `Arquivo muito grande. Tamanho máximo: ${formatFileSize(maxSize)}`
        };
      }

      // Type validation
      if (accept) {
        const acceptedTypes = accept.split(',').map(t => t.trim());
        const fileType = file.type;
        const fileName = file.name.toLowerCase();
        
        const isAccepted = acceptedTypes.some(type => {
          if (type.startsWith('.')) {
            return fileName.endsWith(type);
          }
          if (type.endsWith('/*')) {
            return fileType.startsWith(type.slice(0, -1));
          }
          return fileType === type;
        });

        if (!isAccepted) {
          return {
            valid: false,
            error: `Tipo de arquivo não suportado. Tipos aceitos: ${accept}`
          };
        }
      }

      return { valid: true };
    };

    const createFileItem = (file: File): FileItem => {
      const id = Math.random().toString(36).substr(2, 9);
      let preview: string | undefined;

      // Create preview for images
      if (file.type.startsWith('image/')) {
        preview = URL.createObjectURL(file);
      }

      return {
        id,
        file,
        preview,
        progress: 0,
        status: 'pending',
        size: file.size,
        type: file.type,
        name: file.name
      };
    };

    // 🎮 EVENT HANDLERS
    const handleFileSelect = (selectedFiles: FileList | null) => {
      if (!selectedFiles) return;

      const fileArray = Array.from(selectedFiles);
      const validFiles: File[] = [];
      const errors: string[] = [];

      fileArray.forEach(file => {
        const validation = validateFile(file);
        if (validation.valid) {
          validFiles.push(file);
        } else {
          errors.push(`${file.name}: ${validation.error}`);
        }
      });

      if (errors.length > 0) {
        // Show errors (you can implement a toast notification here)
        console.error('File validation errors:', errors);
      }

      if (validFiles.length > 0) {
        const newFileItems = validFiles.map(createFileItem);
        
        if (multiple) {
          setFiles(prev => {
            const updated = [...prev, ...newFileItems];
            return updated.slice(0, maxFiles);
          });
        } else {
          setFiles(newFileItems.slice(0, 1));
        }

        onFilesSelect?.(validFiles);

        if (autoUpload) {
          newFileItems.forEach(uploadFile);
        }
      }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFileSelect(e.target.files);
      // Reset input value to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

    const handleDragEnter = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragCounter(prev => prev + 1);
      
      if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
        setIsDragOver(true);
      }
    };

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragCounter(prev => prev - 1);
      
      if (dragCounter === 0) {
        setIsDragOver(false);
      }
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      setDragCounter(0);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFileSelect(e.dataTransfer.files);
      }
    };

    const handleFileRemove = (fileId: string) => {
      setFiles(prev => {
        const fileToRemove = prev.find(f => f.id === fileId);
        if (fileToRemove?.preview) {
          URL.revokeObjectURL(fileToRemove.preview);
        }
        return prev.filter(f => f.id !== fileId);
      });
      onFileRemove?.(fileId);
    };

    const uploadFile = async (fileItem: FileItem) => {
      if (!onFileUpload) return;

      setFiles(prev => 
        prev.map(f => 
          f.id === fileItem.id 
            ? { ...f, status: 'uploading' as const }
            : f
        )
      );

      setUploadingCount(prev => prev + 1);

      try {
        await onFileUpload(fileItem);
        
        setFiles(prev => 
          prev.map(f => 
            f.id === fileItem.id 
              ? { ...f, status: 'success' as const, progress: 100 }
              : f
          )
        );
      } catch (error) {
        setFiles(prev => 
          prev.map(f => 
            f.id === fileItem.id 
              ? { 
                  ...f, 
                  status: 'error' as const, 
                  error: error instanceof Error ? error.message : 'Erro no upload'
                }
              : f
          )
        );
      } finally {
        setUploadingCount(prev => prev - 1);
      }
    };

    const handleUploadAll = () => {
      const pendingFiles = files.filter(f => f.status === 'pending');
      pendingFiles.forEach(uploadFile);
    };

    const handleRetry = (fileId: string) => {
      const fileItem = files.find(f => f.id === fileId);
      if (fileItem) {
        uploadFile(fileItem);
      }
    };

    // 🎨 STYLES
    const getVariantStyles = () => {
      switch (variant) {
        case 'minimal':
          return 'border-2 border-dashed border-gray-300 dark:border-gray-600 bg-transparent hover:border-gray-400 dark:hover:border-gray-500';
        case 'glass':
          return 'border-2 border-dashed border-white/30 dark:border-gray-600/50 bg-white/10 dark:bg-gray-800/10 backdrop-blur-sm hover:border-white/50 dark:hover:border-gray-500/50';
        case 'premium':
          return 'border-2 border-dashed border-purple-300 dark:border-purple-600 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 hover:border-purple-400 dark:hover:border-purple-500';
        default:
          return 'border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700/50';
      }
    };

    const getSizeStyles = () => {
      switch (size) {
        case 'sm': return 'p-6';
        case 'md': return 'p-8';
        case 'lg': return 'p-10';
        case 'xl': return 'p-12';
        default: return 'p-8';
      }
    };

    // 🎭 ANIMATIONS
    const dropZoneVariants = {
      idle: { scale: 1, borderColor: 'rgb(209 213 219)' },
      dragOver: { 
        scale: 1.02, 
        borderColor: 'rgb(59 130 246)',
        transition: { duration: 0.2 }
      }
    };

    const fileItemVariants = {
      hidden: { opacity: 0, y: 20, scale: 0.9 },
      visible: (i: number) => ({
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
          delay: i * 0.1,
          duration: 0.3,
          ease: "easeOut"
        }
      }),
      exit: { 
        opacity: 0, 
        y: -20, 
        scale: 0.9,
        transition: { duration: 0.2 }
      }
    };

    // 🎨 RENDER FILE ITEM
    const renderFileItem = (fileItem: FileItem, index: number) => {
      const isImage = fileItem.type.startsWith('image/');
      const isVideo = fileItem.type.startsWith('video/');
      const isAudio = fileItem.type.startsWith('audio/');

      return (
        <motion.div
          key={fileItem.id}
          custom={index}
          variants={fileItemVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          layout
          className="group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-all duration-200"
        >
          {/* File preview */}
          {showPreview && isImage && fileItem.preview && (
            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 mb-3">
              <img
                src={fileItem.preview}
                alt={fileItem.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* File info */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="flex-shrink-0 text-gray-500 dark:text-gray-400">
                {getFileIcon(fileItem.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {fileItem.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatFileSize(fileItem.size)}
                </p>
              </div>
            </div>

            {/* Status and actions */}
            <div className="flex items-center space-x-2">
              {/* Status indicator */}
              <AnimatePresence mode="wait">
                {fileItem.status === 'uploading' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    className="flex items-center space-x-2"
                  >
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    <span className="text-xs text-blue-600 dark:text-blue-400">
                      {fileItem.progress}%
                    </span>
                  </motion.div>
                )}
                
                {fileItem.status === 'success' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    className="text-green-500"
                  >
                    <CheckCircle className="w-5 h-5" />
                  </motion.div>
                )}
                
                {fileItem.status === 'error' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    className="text-red-500"
                  >
                    <AlertCircle className="w-5 h-5" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action buttons */}
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {fileItem.status === 'error' && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleRetry(fileItem.id)}
                    className="p-1 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    title="Tentar novamente"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </motion.button>
                )}
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleFileRemove(fileItem.id)}
                  className="p-1 text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  title="Remover arquivo"
                >
                  <Trash2 className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          {showProgress && fileItem.status === 'uploading' && (
            <div className="mt-3">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <motion.div
                  className="bg-blue-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${fileItem.progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}

          {/* Error message */}
          {fileItem.status === 'error' && fileItem.error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded"
            >
              {fileItem.error}
            </motion.button>
          )}
        </motion.div>
      );
    };

    // 🚀 RENDER PRINCIPAL
    return (
      <div ref={ref} className={cn('w-full', className)} {...props}>
        {/* Drop zone */}
        <motion.div
          ref={dropZoneRef}
          variants={dropZoneVariants}
          animate={isDragOver ? 'dragOver' : 'idle'}
          className={cn(
            'relative border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer',
            getVariantStyles(),
            getSizeStyles(),
            disabled && 'opacity-50 cursor-not-allowed',
            isDragOver && 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          )}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple={multiple}
            accept={accept}
            onChange={handleInputChange}
            className="hidden"
            disabled={disabled}
          />

          {/* Content */}
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mx-auto w-12 h-12 mb-4 text-gray-400 dark:text-gray-500"
            >
              <Upload className="w-full h-full" />
            </motion.div>
            
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg font-medium text-gray-900 dark:text-white mb-2"
            >
              {isDragOver ? 'Solte os arquivos aqui' : 'Arraste arquivos ou clique para selecionar'}
            </motion.h3>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-sm text-gray-500 dark:text-gray-400"
            >
              {accept ? `Tipos aceitos: ${accept}` : 'Todos os tipos de arquivo'}
              {maxSize && ` • Tamanho máximo: ${formatFileSize(maxSize)}`}
              {multiple && maxFiles && ` • Máximo de ${maxFiles} arquivos`}
            </motion.p>
          </div>

          {/* Drag overlay */}
          {isDragOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-blue-500/10 rounded-xl flex items-center justify-center"
            >
              <div className="text-center">
                <Upload className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                <p className="text-xl font-semibold text-blue-600 dark:text-blue-400">
                  Solte para fazer upload
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* File list */}
        {showFileList && files.length > 0 && (
          <div className="mt-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                Arquivos ({files.length})
              </h4>
              
              {!autoUpload && (
                <div className="flex items-center space-x-2">
                  {uploadingCount > 0 && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Fazendo upload... ({uploadingCount})
                    </span>
                  )}
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleUploadAll}
                    disabled={files.every(f => f.status !== 'pending')}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Upload de Todos
                  </motion.button>
                </div>
              )}
            </div>

            {/* Files grid */}
            <div className="grid gap-4">
              <AnimatePresence>
                {files.map((fileItem, index) => renderFileItem(fileItem, index))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    );
  }
);

ModernFileUpload.displayName = 'ModernFileUpload';

// 🚀 EXPORT
export { ModernFileUpload };
