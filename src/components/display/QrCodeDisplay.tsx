import { InfoCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { Avatar, Tooltip, Typography, notification } from 'antd';
import { BlockinAuthSignatureDoc, getAbbreviatedAddress } from 'bitbadgesjs-sdk';
import { createChallenge } from 'blockin';
import { toDataURL } from 'qrcode';
import React, { ReactNode, useEffect } from 'react';
import { QRCode } from 'react-qrcode-logo';
import { BitBadgesApi } from '../../bitbadges-api/api';
import { GenericModal } from './GenericModal';
import { ShareButton } from '../../pages/saveforlater';

interface QrCodeDisplayProps {
  value: string;
  hideCopyButtons?: boolean;
  size?: number;
  label?: ReactNode | string;
  helperDisplay?: ReactNode;
  savedAuthCodes?: Array<BlockinAuthSignatureDoc<bigint>>;
  setSavedAuthCodes?: (authCodes: Array<BlockinAuthSignatureDoc<bigint>>) => void;
  authCode?: BlockinAuthSignatureDoc<bigint>;
  view?: string;
  isUrl?: boolean;
}

const QrCodeDisplay: React.FC<QrCodeDisplayProps> = ({
  isUrl,
  value,
  hideCopyButtons,
  size = 256,
  label,
  helperDisplay,
  savedAuthCodes,
  setSavedAuthCodes,
  authCode,
  view = 'qr'
}) => {
  const storeLocally = !!setSavedAuthCodes;
  const [portModalIsVisible, setPortModalIsVisible] = React.useState(false);

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
      canvas.toBlob((blob) => {
        if (!blob) return;

        const item = new ClipboardItem({ 'image/png': blob });
        navigator.clipboard.write([item]);

        notification.info({
          message: 'Copied to clipboard',
          description: 'The QR code has been copied to your clipboard. You can now paste it anywhere.'
        });
      });
    };
    img.src = imageUrl;
  };

  let portUrl = 'https://bitbadges.io/auth/code?code=' + authCode?.signature;
  if (authCode?.name) portUrl += '&name=' + authCode?.name;
  if (authCode?.description) portUrl += '&description=' + authCode?.description;
  if (authCode?.image) portUrl += '&image=' + authCode?.image;

  const handleStoreLocally = () => {
    const existingAuthCodes = localStorage.getItem('savedAuthCodes');
    const authCodes = existingAuthCodes ? JSON.parse(existingAuthCodes) : [];
    const newAuthCodes = [...authCodes, authCode];
    localStorage.setItem('savedAuthCodes', JSON.stringify(newAuthCodes));
  };

  const [storedInBrowser, setStoredInBrowser] = React.useState(false);

  useEffect(() => {
    const existingAuthCodes = localStorage.getItem('savedAuthCodes');
    const authCodes = existingAuthCodes ? JSON.parse(existingAuthCodes) : [];
    const stored = authCodes.find((x: any) => x._docId === authCode?._docId);
    setStoredInBrowser(!!stored);
  }, [authCode]);

  const [isIos, setIsIos] = React.useState(false);

  useEffect(() => {
    setIsIos(/iPad|iPhone|iPod/.test(navigator.userAgent));
  }, []);

  return (
    <>
      <div className="flex-center flex-column">
        {value && (
          <>
            <div className="secondary-text" style={{ fontSize: 16, marginBottom: 8 }}>
              {view !== 'qr' && (
                <div className="primary-text" style={{ fontSize: 20, fontWeight: 'bold' }}>
                  Code:{' '}
                  <Typography.Text className="primary-text" copyable={{ text: value }}>
                    <Tooltip title={value}>{getAbbreviatedAddress(value)}</Tooltip>
                  </Typography.Text>
                </div>
              )}
              {view === 'qr' && <Avatar shape="square" size={size + 20} src={<QRCode value={value} size={size} />}></Avatar>}
            </div>
          </>
        )}
      </div>
      {value && !hideCopyButtons && (
        <>
          {isUrl && (
            <div className="flex-center">
              <Typography.Text className="primary-text" style={{ fontSize: 16 }} copyable={{ text: value }}>
                <Tooltip title={value}>
                  <a href={value} target="_blank">
                    QR URL
                  </a>
                </Tooltip>
              </Typography.Text>
            </div>
          )}
          <div className="flex-center flex-wrap" style={{ marginTop: 8 }}>
            {view === 'qr' && (
              <button
                className="landing-button"
                style={{ minWidth: 150, margin: 5 }}
                onClick={async () => {
                  const imageUrl = await toDataURL(value);
                  handleDownload(imageUrl);
                }}>
                Save QR Image
              </button>
            )}
            {view === 'qr' && (
              <button
                className="landing-button"
                style={{ minWidth: 150, margin: 5 }}
                onClick={async () => {
                  const imageUrl = await toDataURL(value);
                  handleCopy(imageUrl);
                }}>
                Copy QR Image
              </button>
            )}

            {storeLocally && authCode && (
              <>
                <button
                  className="landing-button"
                  style={{ minWidth: storedInBrowser ? 250 : 130, margin: 5 }}
                  onClick={async () => {
                    if (storedInBrowser) {
                      const existingAuthCodes = localStorage.getItem('savedAuthCodes');
                      const authCodes = existingAuthCodes ? JSON.parse(existingAuthCodes) : [];
                      const newAuthCodes = authCodes.filter((x: any) => x._docId !== authCode._docId);
                      localStorage.setItem('savedAuthCodes', JSON.stringify(newAuthCodes));
                      setStoredInBrowser(false);
                      setSavedAuthCodes((savedAuthCodes ?? []).filter((x) => x._docId !== authCode._docId));
                    } else {
                      handleStoreLocally();
                      notification.info({
                        message: 'Stored in Browser',
                        description:
                          'The code has been stored in your browser. You can now access it from the "Saved" tab on the Authentication Codes page. IMPORTANT: This is only stored in this browser on this device. If you clear your browser data, it will be lost.',
                        duration: 0
                      });
                      setStoredInBrowser(true);
                      setSavedAuthCodes([...(savedAuthCodes ?? []), authCode]);
                    }
                  }}>
                  {storedInBrowser ? 'Remove from Browser Storage' : 'Store in Browser'}
                </button>
                <button
                  className="landing-button"
                  style={{ minWidth: 210, margin: 5 }}
                  onClick={async () => {
                    setPortModalIsVisible(true);
                  }}>
                  {'View on Different Device'}
                </button>
              </>
            )}
          </div>
          {!isIos && (
            <>
              <div className="flex-center">
                {storeLocally && authCode && !isIos && (
                  <>
                    <div className="secondary-text text-center">
                      <InfoCircleOutlined /> Open on a mobile Apple device to add to Apple Wallet.
                    </div>
                  </>
                )}

                {storeLocally && authCode && isIos && (
                  <>
                    <br />
                    <br />
                    <a
                      onClick={async () => {
                        const res = await BitBadgesApi.generateAppleWalletPass({
                          name: authCode.name,
                          description: authCode.description,
                          signature: authCode.signature,
                          message: createChallenge(authCode.params)
                        });
                        const pass = Buffer.from(res.data);

                        const blob = new Blob([pass], { type: 'application/vnd.apple.pkpass' });
                        const url = window.URL.createObjectURL(blob);
                        if (url) {
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = 'bitbadges.pkpass';
                          link.click();

                          // window.URL.revokeObjectURL(url);
                        }
                      }}>
                      <img src="/images/add_to_apple_wallet.svg" style={{ width: 150 }} />
                    </a>
                  </>
                )}
              </div>
            </>
          )}

          <br />
          <GenericModal title="View on Different Device" visible={portModalIsVisible} setVisible={setPortModalIsVisible} style={{ minWidth: '90%' }}>
            <div className="secondary-text">
              <InfoCircleOutlined /> If you want to view your secret code on a different device, you can scan the QR code below. This will open a
              similar screen on the other device which will allow you to save the code there.{' '}
              <span style={{ color: 'orange' }}>
                <WarningOutlined style={{ color: 'orange' }} /> The QR code below is not the same as your secret authentication QR code.
              </span>
            </div>
            <br />
            <div className="flex-center">
              <QRCode value={portUrl} size={size} />
            </div>
            <br />
            <div className="flex-center">
              <a href={portUrl} target="_blank">
                Go to URL
              </a>
            </div>
          </GenericModal>
        </>
      )}

      {navigator.canShare && navigator.canShare({ files: [new File([], 'test.png')] }) && (
        <button
          className="landing-button"
          style={{ minWidth: 130, margin: 5 }}
          onClick={async () => {
            const imageUrl = await toDataURL(value);
            const file = await fetch(imageUrl).then(async (r) => await r.blob());
            navigator.share({
              files: [new File([file], 'blockin-qr-code.png', { type: 'image/png' })]
            });
          }}>
          Share {isUrl && 'QR Image'}
        </button>
      )}

      {/* <ShareButton data={{ files: [new File([file], 'blockin-qr-code.png', { type: 'image/png' })] }} text={`Share${isUrl ? '' : ' QR Image'}`} /> */}
      {isUrl && <ShareButton data={{ text: value }} text="Share QR URL" />}
      {authCode?.signature && <div className="flex-center">{helperDisplay}</div>}
    </>
  );
};

export default QrCodeDisplay;
