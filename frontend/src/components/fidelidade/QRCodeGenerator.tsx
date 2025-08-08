'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeGeneratorProps {
  value: string;
  size?: number;
  className?: string;
  includeMargin?: boolean;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

export default function QRCodeGenerator({ 
  value, 
  size = 256, 
  className = '',
  includeMargin = true,
  errorCorrectionLevel = 'M'
}: QRCodeGeneratorProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    generateQRCode();
  }, [value, size, errorCorrectionLevel]);

  const generateQRCode = async () => {
    try {
      setLoading(true);
      setError('');

      const url = await QRCode.toDataURL(value, {
        width: size,
        margin: includeMargin ? 2 : 0,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel
      });

      setQrCodeUrl(url);
    } catch (err) {
      console.error('Erro ao gerar QR Code:', err);
      setError('Erro ao gerar QR Code');
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;

    const link = document.createElement('a');
    link.download = `qr-code-fidelidade-${Date.now()}.png`;
    link.href = qrCodeUrl;
    link.click();
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg ${className}`} style={{ width: size, height: size }}>
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <img 
        src={qrCodeUrl} 
        alt="QR Code"
        width={size}
        height={size}
        className="rounded-lg cursor-pointer hover:scale-105 transition-transform"
        onClick={downloadQRCode}
        title="Clique para baixar o QR Code"
      />
    </div>
  );
}
