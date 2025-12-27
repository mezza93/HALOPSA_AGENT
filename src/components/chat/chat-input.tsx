'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Send,
  Paperclip,
  X,
  Image as ImageIcon,
  FileText,
  StopCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import { formatBytes } from '@/lib/utils/format';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  attachments: File[];
  setAttachments: (files: File[]) => void;
  onStop: () => void;
  formRef?: React.RefObject<HTMLFormElement | null>;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = {
  'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
  'application/pdf': ['.pdf'],
  'text/plain': ['.txt'],
};

export function ChatInput({
  input,
  setInput,
  handleSubmit,
  isLoading,
  attachments,
  setAttachments,
  onStop,
  formRef,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [previewUrls, setPreviewUrls] = useState<Map<File, string>>(new Map());

  // Create and manage object URLs for image previews
  useEffect(() => {
    const newUrls = new Map<File, string>();

    attachments.forEach((file) => {
      if (file.type.startsWith('image/')) {
        // Reuse existing URL if file is the same object
        const existingUrl = previewUrls.get(file);
        if (existingUrl) {
          newUrls.set(file, existingUrl);
        } else {
          newUrls.set(file, URL.createObjectURL(file));
        }
      }
    });

    // Revoke URLs that are no longer needed
    previewUrls.forEach((url, file) => {
      if (!newUrls.has(file)) {
        URL.revokeObjectURL(url);
      }
    });

    setPreviewUrls(newUrls);

    // Cleanup all URLs on unmount
    return () => {
      newUrls.forEach((url) => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attachments]);

  // Handle file drop
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const validFiles = acceptedFiles.filter((file) => {
        if (file.size > MAX_FILE_SIZE) {
          console.warn(`File ${file.name} is too large (max 10MB)`);
          return false;
        }
        return true;
      });

      setAttachments([...attachments, ...validFiles]);
    },
    [attachments, setAttachments]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    noClick: true,
    noKeyboard: true,
  });

  // Remove attachment
  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);

    // Auto-resize
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  // Get file icon
  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  return (
    <div className="border-t border-gray-200 bg-background/80 backdrop-blur-lg p-4">
      <div className="mx-auto max-w-3xl">
        {/* Attachments preview */}
        {attachments.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm"
              >
                {file.type.startsWith('image/') && previewUrls.get(file) ? (
                  <img
                    src={previewUrls.get(file)}
                    alt={file.name}
                    className="h-8 w-8 rounded object-cover"
                  />
                ) : (
                  getFileIcon(file)
                )}
                <div className="max-w-[150px]">
                  <p className="truncate text-xs font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(file.size)}
                  </p>
                </div>
                <button
                  onClick={() => removeAttachment(index)}
                  className="rounded-full p-1 hover:bg-gray-200"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input form */}
        <form ref={formRef} onSubmit={handleSubmit} className="relative">
          <div
            {...getRootProps()}
            className={cn(
              'relative rounded-2xl border transition-all',
              isDragActive
                ? 'border-turquoise-500 bg-turquoise-50'
                : 'border-gray-200 bg-white'
            )}
          >
            <input {...getInputProps()} />

            {/* Drag overlay */}
            {isDragActive && (
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-turquoise-50/90 z-10">
                <div className="text-center">
                  <Paperclip className="mx-auto h-8 w-8 text-turquoise-500" />
                  <p className="mt-2 text-sm font-medium text-turquoise-700">
                    Drop files here
                  </p>
                </div>
              </div>
            )}

            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your HaloPSA data..."
              className="w-full resize-none rounded-2xl bg-transparent px-4 py-4 pr-24 text-foreground placeholder:text-muted-foreground focus:outline-none"
              rows={1}
              disabled={isLoading}
            />

            {/* Action buttons */}
            <div className="absolute bottom-2 right-2 flex items-center gap-1">
              {/* Attachment button */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={open}
                disabled={isLoading}
                className="h-9 w-9"
              >
                <Paperclip className="h-5 w-5" />
              </Button>

              {/* Send/Stop button */}
              {isLoading ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={onStop}
                  className="h-9 w-9 text-red-500 hover:text-red-600"
                >
                  <StopCircle className="h-5 w-5" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() && attachments.length === 0}
                  className="h-9 w-9"
                >
                  <Send className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        </form>

        {/* Help text */}
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Press Enter to send, Shift+Enter for new line. Drag & drop files or
          click{' '}
          <Paperclip className="inline h-3 w-3" /> to attach images.
        </p>
      </div>
    </div>
  );
}
