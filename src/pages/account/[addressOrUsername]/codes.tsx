import { Layout } from 'antd';
import 'react-markdown-editor-lite/lib/index.css';
import { useChainContext } from '../../../bitbadges-api/contexts/ChainContext';

import { DeleteOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { QRCode } from 'react-qrcode-logo';
import { deleteAuthCode } from '../../../bitbadges-api/api';
import { getAuthCodesView, updateAccount, useAccount } from '../../../bitbadges-api/contexts/accounts/AccountsContext';
import { CollectionHeader } from '../../../components/badges/CollectionHeader';
import { EmptyIcon } from '../../../components/common/Empty';
import CustomCarousel from '../../../components/display/Carousel';
import { Divider } from '../../../components/display/Divider';
import IconButton from '../../../components/display/IconButton';
import { InformationDisplayCard } from '../../../components/display/InformationDisplayCard';
import { DisconnectedWrapper } from '../../../components/wrappers/DisconnectedWrapper';

const { Content } = Layout;

export function AuthCodes() {
  const chain = useChainContext();
  const signedInAccount = useAccount(chain.address);

  const [loading, setLoading] = useState(false);

  const [authCodes, setAuthCodes] = useState(getAuthCodesView(signedInAccount, 'authCodes'));

  useEffect(() => {
    setAuthCodes(getAuthCodesView(signedInAccount, 'authCodes'));
  }, [signedInAccount]);


  return (
    <DisconnectedWrapper
      requireLogin
      message={'Please connect your wallet and sign in to view this page.'}
      node={
        <Content
          className="full-area"
          style={{ minHeight: '100vh', padding: 8 }}
        >
          {signedInAccount && <>
            <br />
            <div className='flex-center'>
              {authCodes.length > 0 && <InformationDisplayCard md={12} xs={24} sm={24} title='' >

                <CustomCarousel
                  title={<div className='primary-text' style={{ fontSize: 20, textAlign: 'center', fontWeight: 'bolder' }}>My QR  Codes</div>}
                  items={authCodes.map((x, i) => {
                    if (!x) return <></>;
                    return <div className='flex-center flex-column full-width' key={i}>
                      <CollectionHeader
                        collectionId={1n} //dummy value
                        metadataOverride={{
                          ...x,
                        }}
                        hideCollectionLink
                      />
                      <div className='flex-center flex-column'>
                        <div className='secondary-text' style={{ fontSize: 16, marginBottom: 8 }}>
                          {x.description}
                        </div>
                        <br />

                        <div className='secondary-text' style={{ fontSize: 16, marginBottom: 8 }}>
                          <QRCode value={x.signature} size={256} />
                        </div>
                        <Divider />
                        <IconButton
                          src={<DeleteOutlined />}
                          text='Delete'
                          disabled={loading}
                          onClick={async () => {
                            setLoading(true);
                            if (confirm('Are you sure you want to delete this QR code?')) {
                              await deleteAuthCode({ signature: x.signature });
                              updateAccount({
                                ...signedInAccount,
                                authCodes: signedInAccount.authCodes.filter(y => y.signature !== x.signature)
                              });
                              setAuthCodes(getAuthCodesView(signedInAccount, 'authCodes'));
                            }
                            setLoading(false);
                          }}
                          tooltipMessage='Delete this QR code'
                        />
                      </div>
                      {/* <Divider />
                        <div className='secondary-text flex-center flex-column' style={{ fontSize: 16, marginBottom: 8 }}>
                          Consider saving this code for easier access at authentication time via:

                          <li>Printing it out</li>
                          <li>Saving to your device</li>
                          <li>Screenshot it</li>
                          <li>Or any other method</li>

                        </div> */}
                    </div>
                  }
                  )}
                />
              </InformationDisplayCard>}
            </div>

            {authCodes.length === 0 && <div className='flex-center flex-column'>
              <EmptyIcon description='No QR codes found. Events should provide you with details on how to generate QR codes for authentication.' />
            </div>}
          </>}
        </ Content>
      }
    />
  );
}

export default AuthCodes;