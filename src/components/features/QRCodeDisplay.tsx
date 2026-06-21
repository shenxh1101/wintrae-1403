import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface QRCodeDisplayProps {
  code: string;
  size?: number;
  showActions?: boolean;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  code,
  size = 200,
  showActions = true,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const svg = document.getElementById('qr-code');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = size * 2;
      canvas.height = size * 2;
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }

      const link = document.createElement('a');
      link.download = `预约码-${code}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="flex flex-col items-center">
      <div className="bg-white p-4 rounded-2xl shadow-lg border border-gray-100">
        <QRCodeSVG
          id="qr-code"
          value={code}
          size={size}
          level="H"
          includeMargin={false}
          fgColor="#1E3A5F"
          bgColor="#FFFFFF"
        />
      </div>

      <div className="mt-4 text-center">
        <p className="text-sm text-gray-500 mb-1">预约码</p>
        <p className="font-mono text-2xl font-bold text-primary-900 tracking-wider">{code}</p>
      </div>

      {showActions && (
        <div className="flex gap-2 mt-4">
          <Button variant="secondary" size="sm" onClick={handleCopy}>
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-1" />
                已复制
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-1" />
                复制
              </>
            )}
          </Button>
          <Button variant="secondary" size="sm" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-1" />
            保存
          </Button>
        </div>
      )}
    </div>
  );
};
