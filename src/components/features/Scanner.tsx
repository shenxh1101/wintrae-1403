import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, Flashlight, FlashlightOff, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface ScannerProps {
  onScan: (code: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

export const Scanner: React.FC<ScannerProps> = ({ onScan, onError, className }) => {
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [hasError, setHasError] = useState(false);
  const lastScannedRef = useRef<string>('');

  const startScanning = async () => {
    if (!scannerRef.current) return;

    try {
      const html5QrCode = new Html5Qrcode('scanner-container');
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          if (decodedText !== lastScannedRef.current) {
            lastScannedRef.current = decodedText;
            onScan(decodedText);
            setTimeout(() => {
              lastScannedRef.current = '';
            }, 2000);
          }
        },
        () => {}
      );

      setIsScanning(true);
      setHasError(false);
    } catch (error) {
      setHasError(true);
      onError?.(error instanceof Error ? error.message : '无法启动摄像头');
    }
  };

  const stopScanning = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (error) {
        console.error('停止扫码失败:', error);
      }
      setIsScanning(false);
    }
  };

  const toggleFlash = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (isFlashOn) {
          await html5QrCodeRef.current.applyVideoConstraints({
            advanced: [{ torch: false }] as any,
          });
        } else {
          await html5QrCodeRef.current.applyVideoConstraints({
            advanced: [{ torch: true }] as any,
          });
        }
        setIsFlashOn(!isFlashOn);
      } catch (error) {
        console.error('切换闪光灯失败:', error);
      }
    }
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <div className={cn('relative', className)}>
      <div
        id="scanner-container"
        ref={scannerRef}
        className="w-full aspect-square max-w-md mx-auto bg-gray-900 rounded-2xl overflow-hidden relative"
      >
        {!isScanning && !hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800">
            <div className="w-20 h-20 bg-primary-900/30 rounded-full flex items-center justify-center mb-4">
              <Camera className="w-10 h-10 text-white" />
            </div>
            <p className="text-white text-sm mb-4">点击下方按钮开始扫描</p>
            <Button onClick={startScanning}>
              <QrCode className="w-4 h-4 mr-2" />
              开始扫码
            </Button>
          </div>
        )}

        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800">
            <div className="w-20 h-20 bg-red-500/30 rounded-full flex items-center justify-center mb-4">
              <X className="w-10 h-10 text-white" />
            </div>
            <p className="text-white text-sm mb-4">无法访问摄像头</p>
            <p className="text-gray-400 text-xs mb-4">请检查权限设置或使用手动输入</p>
            <Button variant="secondary" onClick={startScanning}>
              重新尝试
            </Button>
          </div>
        )}

        {isScanning && (
          <>
            <div className="absolute inset-0 pointer-events-none z-10">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-64 h-64">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-accent-teal rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-accent-teal rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-accent-teal rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-accent-teal rounded-br-lg" />
                  <div className="absolute inset-x-4 top-0 h-0.5 bg-accent-teal animate-scan-line opacity-75" />
                </div>
              </div>
            </div>

            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3 z-20">
              <Button
                variant="secondary"
                size="sm"
                onClick={toggleFlash}
                className="bg-black/50 text-white border-transparent hover:bg-black/70"
              >
                {isFlashOn ? <Flashlight className="w-4 h-4" /> : <FlashlightOff className="w-4 h-4" />}
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={stopScanning}
                className="bg-red-500/80 hover:bg-red-600"
              >
                <X className="w-4 h-4 mr-1" />
                停止
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
