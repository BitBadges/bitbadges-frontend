import { CheckCircleFilled, WarningOutlined } from '@ant-design/icons';
import { Input } from 'antd';
import { useState } from 'react';
import { getAuthCode } from '../../bitbadges-api/api';
import { InformationDisplayCard } from '../../components/display/InformationDisplayCard';
import { DisconnectedWrapper } from '../../components/wrappers/DisconnectedWrapper';
import { Divider } from '../../components/display/Divider';

function BlockinCodesScreen() {

  const [inputtedQrCode, setInputtedQrCode] = useState('');
  const [verified, setVerified] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');



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
                autoSize
                value={inputtedQrCode}
                onChange={(e) => {
                  setInputtedQrCode(e.target.value.trim());
                }}
                placeholder='Enter QR Code text here...'
              />
              <Divider />
              <div className='flex-center'>
                <button className='landing-button' onClick={async () => {
                  try {
                    const res = await getAuthCode({ signature: inputtedQrCode, options: {} });
                    console.log(res);
                    setVerified(res.verificationResponse.success);
                    if (!res.verificationResponse.success) setErrorMessage(res.verificationResponse.verificationMessage);
                    else setErrorMessage('');
                  } catch (e: any) {
                    setVerified(false);
                    setErrorMessage(e.message);
                  }
                }}>Verify</button>
              </div>
            </InformationDisplayCard>
            <InformationDisplayCard
              title='QR Code'
              md={12}
              xs={24}
              sm={24}
            >
              <div className='flex-center flex-column'>
                <div className='secondary-text' style={{ fontSize: 16, marginBottom: 8 }}>
                  {verified ? <CheckCircleFilled style={{ color: 'green' }} /> : <WarningOutlined style={{ color: 'red' }} />}
                  The QR Code is {verified ? 'valid' : 'invalid'}.
                </div>
                <br />
                {errorMessage && <div className='secondary-text' style={{ fontSize: 16, marginBottom: 8, color: 'red' }}>
                  {errorMessage}
                </div>}
                <br />
              </div>
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
