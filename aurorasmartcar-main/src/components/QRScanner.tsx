import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Camera } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface QRScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

export const QRScanner = ({ onScan, onClose }: QRScannerProps) => {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    
    const startScanning = async () => {
      try {
        setIsScanning(true);
        const videoInputDevices = await codeReader.listVideoInputDevices();
        
        if (videoInputDevices.length === 0) {
          setError(t('scanner.no_camera'));
          return;
        }

        const selectedDeviceId = videoInputDevices[0].deviceId;

        codeReader.decodeFromVideoDevice(
          selectedDeviceId,
          videoRef.current!,
          (result, error) => {
            if (result) {
              onScan(result.getText());
              codeReader.reset();
            }
            if (error && error.name !== 'NotFoundException') {
              console.error(error);
            }
          }
        );
      } catch (err) {
        setError(t('scanner.error'));
        console.error(err);
      }
    };

    startScanning();

    return () => {
      codeReader.reset();
    };
  }, [onScan, t]);

  return (
    <div className="fixed inset-0 bg-background/95 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-6 h-6 text-secondary" />
            <h2 className="text-2xl font-bold">{t('scanner.title')}</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {error ? (
          <div className="text-center py-12">
            <p className="text-destructive">{error}</p>
          </div>
        ) : (
          <>
            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
              />
              {isScanning && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-64 border-4 border-secondary/50 rounded-lg animate-pulse" />
                </div>
              )}
            </div>
            <p className="text-center text-muted-foreground">
              {t('scanner.point_camera')}
            </p>
          </>
        )}
      </Card>
    </div>
  );
};
