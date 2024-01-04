import { Avatar, notification } from 'antd';
import { BlockinAuthSignatureDoc } from 'bitbadgesjs-utils';
import { toDataURL } from 'qrcode';
import React, { ReactNode } from 'react';
import { QRCode } from 'react-qrcode-logo';

interface QrCodeDisplayProps {
  value: string
  hideCopyButtons?: boolean
  size?: number
  label?: ReactNode | string
  helperDisplay?: ReactNode
  storeLocally?: boolean
  authCode?: BlockinAuthSignatureDoc<bigint>
}

const QrCodeDisplay: React.FC<QrCodeDisplayProps> = ({ value, hideCopyButtons, size = 256, label, helperDisplay, storeLocally, authCode }) => {


  const handleDownload = (imageUrl: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `blockin-qr-code-${label ?? new Date().toLocaleTimeString()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopy = (imageUrl: string) => {
    const canvas = document.createElement('canvas');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      canvas.toBlob(blob => {
        if (!blob) return;

        const item = new ClipboardItem({ 'image/png': blob });
        navigator.clipboard.write([item]);

        notification.info({
          message: 'Copied to clipboard',
          description: 'The QR code has been copied to your clipboard. You can now paste it anywhere.'
        })
      });
    };
    img.src = imageUrl;
  }

  const handleStoreLocally = () => {
    const existingAuthCodes = localStorage.getItem('savedAuthCodes');
    const authCodes = existingAuthCodes ? JSON.parse(existingAuthCodes) : [];
    const newAuthCodes = [...authCodes, authCode];
    localStorage.setItem('savedAuthCodes', JSON.stringify(newAuthCodes));
  }



  return <>
    <div className='flex-center flex-column'>

      {value && <>
        <div className='secondary-text' style={{ fontSize: 16, marginBottom: 8 }}>
          <Avatar shape='square' size={size + 20} src={
            <QRCode value={value} size={size} />
          }></Avatar>
        </div>
        {helperDisplay}
      </>
      }
    </div>
    {value && !hideCopyButtons && <>
      <div className='flex-center flex-wrap' style={{ marginTop: 8 }}>
        <button className='landing-button' style={{ minWidth: 150, margin: 5 }} onClick={async () => {
          const imageUrl = await toDataURL(value);
          handleDownload(imageUrl);
        }}>
          Save QR As Image
        </button>
        <button className='landing-button' style={{ minWidth: 150, margin: 5 }} onClick={async () => {
          const imageUrl = await toDataURL(value);
          handleCopy(imageUrl);
        }}>
          Copy QR As Image
        </button>
        {storeLocally && authCode &&
          <button className='landing-button' style={{ minWidth: 130, margin: 5 }} onClick={async () => {
            handleStoreLocally();
            notification.info({
              message: 'Stored in Browser',
              description: 'The QR code has been stored in your browser. You can now access it from the "Saved" tab on the QR Codes page. IMPORTANT: This is only stored in this browser on this device. If you clear your browser data, it will be lost.',
              duration: 0
            })

          }}>
            Store in Browser
          </button>}
        {/* //Share as PNG */}
        {navigator.canShare && navigator.canShare({ files: [new File([], 'test.png')] }) &&
          <button className='landing-button' style={{ minWidth: 130, margin: 5 }} onClick={async () => {
            const imageUrl = await toDataURL(value);
            navigator.share({
              files: [new File([imageUrl], 'blockin-qr-code.png', { type: 'image/png' })],
              title: 'Blockin QR Code',
              text: 'Blockin QR Code',
            });
          }}>
            Share
          </button>
        }
      </div>
    </>}
  </ >
};

export default QrCodeDisplay;
