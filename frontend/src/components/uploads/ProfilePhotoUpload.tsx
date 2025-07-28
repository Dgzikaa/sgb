'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, X, Check, AlertTriangle } from 'lucide-react';
import Image from 'next/image';

interface ProfilePhotoUploadProps {
  currentPhoto?: string;
  onPhotoChange: (photoData: string) => void;
  disabled?: boolean;
}

export default function ProfilePhotoUpload({
  currentPhoto,
  onPhotoChange,
  disabled = false,
}: ProfilePhotoUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string>(currentPhoto || '');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validações
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem válida');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB
      alert('A imagem deve ter menos que 5MB');
      return;
    }

    setIsUploading(true);

    // Converter para base64 para preview e armazenamento
    const reader = new FileReader();
    reader.onload = e => {
      const result = e.target?.result as string;
      setPreviewUrl(result);
      onPhotoChange(result);
      setIsUploading(false);
    };
    reader.onerror = () => {
      alert('Erro ao processar a imagem');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPreviewUrl('');
    onPhotoChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileDialog = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Preview da foto */}
      <div className="relative">
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-200 shadow-lg bg-slate-100">
          {previewUrl ? (
            <Image
              src={previewUrl}
              alt="Foto de perfil"
              width={128}
              height={128}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300">
              {/* <User className="w-16 h-16 text-slate-400" /> */}
            </div>
          )}
        </div>

        {/* Botão para remover foto */}
        {previewUrl && !disabled && (
          <button
            onClick={handleRemovePhoto}
            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg transition-colors"
            title="Remover foto"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Indicador de carregamento */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}
      </div>

      {/* Input de arquivo (oculto) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {/* Botões de ação */}
      <div className="flex space-x-2">
        <Button
          onClick={openFileDialog}
          disabled={disabled || isUploading}
          variant="outline"
          size="sm"
          className="flex items-center space-x-2"
        >
          <Upload className="w-4 h-4" />
          <span>Carregar foto</span>
        </Button>

        {/* Futuramente pode adicionar câmera */}
        {/* 
        <Button
          onClick={openCamera}
          disabled={disabled || isUploading}
          variant="outline"
          size="sm"
          className="flex items-center space-x-2"
        >
          <Camera className="w-4 h-4" />
          <span>Câmera</span>
        </Button>
        */}
      </div>

      {/* Dicas */}
      <div className="text-xs text-slate-500 text-center max-w-xs">
        <p>Recomendado: imagem quadrada, máximo 5MB</p>
        <p>Formatos aceitos: JPG, PNG, GIF</p>
      </div>
    </div>
  );
}
