import { CheckCircleFilled, CloseCircleFilled, InfoCircleOutlined } from '@ant-design/icons';
import { Input } from 'antd';
import { useEffect, useState } from 'react';
import { getAuthCode } from '../../bitbadges-api/api';
import { Divider } from '../../components/display/Divider';
import { InformationDisplayCard } from '../../components/display/InformationDisplayCard';
import { DisconnectedWrapper } from '../../components/wrappers/DisconnectedWrapper';
import { INFINITE_LOOP_MODE } from '../../constants';
import { QRCode } from 'react-qrcode-logo';

function BlockinCodesScreen() {

  const [inputtedQrCode, setInputtedQrCode] = useState('');
  const [verified, setVerified] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [usedQrCodes, setUsedQrCodes] = useState<string[]>([]);

  const DELAY_MS = 600;
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: uri select, badge uri changed ');
    const delayDebounceFn = setTimeout(async () => {
      if (!inputtedQrCode) return

      //Slightly hacky but this will overwrite all cached metadata to [] -> means next badgeavatardisplay render, we fetch since it is empty
      try {
        const res = await getAuthCode({ signature: inputtedQrCode, options: {} });
        console.log(res);
        setVerified(res.verificationResponse.success);
        if (!res.verificationResponse.success) setErrorMessage(res.verificationResponse.verificationMessage);
        else {
          setErrorMessage('');
          setUsedQrCodes([...usedQrCodes, inputtedQrCode]);
        }
      } catch (e: any) {
        setVerified(false);
        setErrorMessage(e.message);
      }

    }, DELAY_MS)

    return () => clearTimeout(delayDebounceFn)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputtedQrCode])

  //Auto clear the QR code after X seconds
  const AUTO_CLEAR_MS = 5000;
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: uri select, badge uri changed ');
    const delayDebounceFn = setTimeout(async () => {
      setInputtedQrCode('');
    }, AUTO_CLEAR_MS)

    return () => clearTimeout(delayDebounceFn)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputtedQrCode])

  return (
    <DisconnectedWrapper
      requireLogin
      message='Please connect a wallet and sign in to access this page.'
      node={
        <div
          style={{
            marginLeft: '3vw',
            marginRight: '3vw',
            paddingLeft: '1vw',
            paddingRight: '1vw',
            paddingTop: '20px',
            minHeight: '100vh'
          }}
        >
          <div className='flex'>
            <InformationDisplayCard title='Enter QR Code' md={12} xs={24} sm={24} >
              <Input.TextArea
                rows={10}
                value={inputtedQrCode}
                onChange={(e) => {
                  setInputtedQrCode(e.target.value.trim());
                }}
                placeholder='Enter QR Code text here...'
              />

              {inputtedQrCode && <>
                <Divider /> <div className='flex-center'>
                  <QRCode value={inputtedQrCode} size={256} />
                </div>
              </>}
            </InformationDisplayCard>
            <InformationDisplayCard
              title='Valid?'
              md={12}
              xs={24}
              sm={24}
            >
              {inputtedQrCode && <>
                <div className='flex-center flex-column'>
                  <div className='secondary-text' style={{ fontSize: 16, marginBottom: 8 }}>
                    {verified ? <CheckCircleFilled style={{ color: 'green' }} /> : <CloseCircleFilled style={{ color: 'red' }} />}
                    The QR Code is {verified ? 'valid' : 'invalid'}.
                  </div>
                  <br />

                  <div>
                    {verified ? <CheckCircleFilled style={{ color: 'green', fontSize: 100 }} /> : <CloseCircleFilled style={{ color: 'red', fontSize: 100 }} />}
                  </div>
                  {errorMessage && <div className='secondary-text' style={{ fontSize: 16, marginBottom: 8, color: 'red' }}>
                    {errorMessage}
                  </div>}
                  {verified && <div className='secondary-text' style={{ fontSize: 16, marginBottom: 8, textAlign: 'center' }}>
                    <InfoCircleOutlined /> Blockin has verified 1) the QR code signature and 2) ownership of assets / badges.
                    You should now implement any additional checks you require (e.g. one-time use only, verify nonces, etc). We leave this up to you.
                  </div>}
                </div>
              </>}
            </InformationDisplayCard>
          </div>
          <div
            className='inherit-bg'
            style={{
              textAlign: 'center',
              marginTop: 16,
            }}
          >

          </div>

        </div>
      }
    />
  );
}

export default BlockinCodesScreen;
