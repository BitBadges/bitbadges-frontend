import { Avatar, Tooltip, Typography, notification } from 'antd';
import { BlockinAuthSignatureDoc, getAbbreviatedAddress } from 'bitbadgesjs-utils';
import { toDataURL } from 'qrcode';
import React, { ReactNode, useEffect } from 'react';
import { QRCode } from 'react-qrcode-logo';

interface QrCodeDisplayProps {
  value: string
  hideCopyButtons?: boolean
  size?: number
  label?: ReactNode | string
  helperDisplay?: ReactNode
  savedAuthCodes?: BlockinAuthSignatureDoc<bigint>[]
  setSavedAuthCodes?: (authCodes: BlockinAuthSignatureDoc<bigint>[]) => void
  authCode?: BlockinAuthSignatureDoc<bigint>
  view?: string
}

const QrCodeDisplay: React.FC<QrCodeDisplayProps> = ({ value, hideCopyButtons, size = 256, label, helperDisplay, savedAuthCodes, setSavedAuthCodes, authCode, view = 'qr' }) => {
  const storeLocally = !!setSavedAuthCodes;

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

  const [storedInBrowser, setStoredInBrowser] = React.useState(false);

  useEffect(() => {
    const existingAuthCodes = localStorage.getItem('savedAuthCodes');
    const authCodes = existingAuthCodes ? JSON.parse(existingAuthCodes) : [];
    const stored = authCodes.find((x: any) => x._docId === authCode?._docId);
    setStoredInBrowser(!!stored);
  }, [authCode]);

  return <>
    <div className='flex-center flex-column'>

      {value && <>
        <div className='secondary-text' style={{ fontSize: 16, marginBottom: 8 }}>
          {view !== 'qr' && <div className='primary-text' style={{ fontSize: 20, fontWeight: 'bold' }}>
            Code: <Typography.Text className='primary-text' copyable={{ text: value }}>
              <Tooltip title={value}>
                {getAbbreviatedAddress(value)}
              </Tooltip>

            </Typography.Text>
          </div>}
          {view === 'qr' &&
            <Avatar shape='square' size={size + 20} src={
              <QRCode value={value} size={size} />
            }></Avatar>}
        </div>
      </>
      }
    </div>
    {value && !hideCopyButtons && <>
      <div className='flex-center flex-wrap' style={{ marginTop: 8 }}>
        {view === 'qr' && <button className='landing-button' style={{ minWidth: 150, margin: 5 }} onClick={async () => {
          const imageUrl = await toDataURL(value);
          handleDownload(imageUrl);
        }}>
          Save QR As Image
        </button>}
        {view === 'qr' &&
          <button className='landing-button' style={{ minWidth: 150, margin: 5 }} onClick={async () => {
            const imageUrl = await toDataURL(value);
            handleCopy(imageUrl);
          }}>
            Copy QR As Image
          </button>}
        {storeLocally && authCode &&
          <button className='landing-button' style={{ minWidth: storedInBrowser ? 250 : 130, margin: 5 }} onClick={async () => {
            if (storedInBrowser) {
              const existingAuthCodes = localStorage.getItem('savedAuthCodes');
              const authCodes = existingAuthCodes ? JSON.parse(existingAuthCodes) : [];
              const newAuthCodes = authCodes.filter((x: any) => x._docId !== authCode._docId);
              localStorage.setItem('savedAuthCodes', JSON.stringify(newAuthCodes));
              setStoredInBrowser(false);
              setSavedAuthCodes((savedAuthCodes ?? []).filter(x => x._docId !== authCode._docId));
            } else {
              handleStoreLocally();
              notification.info({
                message: 'Stored in Browser',
                description: 'The code has been stored in your browser. You can now access it from the "Saved" tab on the Authentication Codes page. IMPORTANT: This is only stored in this browser on this device. If you clear your browser data, it will be lost.',
                duration: 0
              })
              setStoredInBrowser(true);
              setSavedAuthCodes([...(savedAuthCodes ?? []), authCode]);
            }

          }}>
            {storedInBrowser ? 'Remove from Browser Storage' : 'Store in Browser'}
          </button>}
        {/* //Share as PNG */}
        {navigator.canShare && navigator.canShare({ files: [new File([], 'test.png')] }) &&
          <button className='landing-button' style={{ minWidth: 130, margin: 5 }} onClick={async () => {
            const imageUrl = await toDataURL(value);
            const file = await fetch(imageUrl).then(r => r.blob());
            navigator.share({
              files: [new File([file], 'blockin-qr-code.png', { type: 'image/png' })],
              title: 'BitBadges Authentication Code',
              text: 'BitBadges Authentication Code',
            });
          }}>
            Share
          </button>
        }
      </div>
    </>}
    {authCode?.signature &&
      <div className='flex-center'>

        {helperDisplay}
      </div>}
  </ >
};

export default QrCodeDisplay;
