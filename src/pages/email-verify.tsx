//[token].tsx

import { CheckCircleFilled } from '@ant-design/icons';
import { Form, notification, Spin } from 'antd';
import axios from 'axios';
import { useState } from 'react';
import { useChainContext } from '../bitbadges-api/contexts/ChainContext';
import { useAccount } from '../bitbadges-api/contexts/accounts/AccountsContext';
import { AddressDisplay } from '../components/address/AddressDisplay';
import { Divider } from '../components/display/Divider';
import { InformationDisplayCard } from '../components/display/InformationDisplayCard';
import { GenericTextFormInput } from '../components/tx-timelines/form-items/MetadataForm';
import { DisconnectedWrapper } from '../components/wrappers/DisconnectedWrapper';
import { BACKEND_URL } from '../constants';

export default function EmailVerify() {
  const [verified, setVerified] = useState(false);
  const [fetching, setFetching] = useState(false);
  const chain = useChainContext();

  const [emailToken, setEmailToken] = useState<string>('');

  const signedInAccount = useAccount(chain.address);

  async function verifyEmail() {
    if (!chain) return;
    if (!emailToken) return;
    if (!chain.connected || !chain.loggedIn) return;
    if (!signedInAccount) return;
    if (signedInAccount?.notifications?.emailVerification?.verified) return;

    if (emailToken) {
      try {
        setFetching(true);
        const res = await axios.get(`${BACKEND_URL}/api/v0/verifyEmail/${emailToken}`, {
          withCredentials: true
        });

        if (res.data.success) {
          setVerified(true);
        }

        setFetching(false);
      } catch (e: any) {
        notification.error({
          message: 'Error verifying email',
          description: e.response?.data?.errorMessage || e.message
        });

        setFetching(false);
      }
    }
  }

  return (
    <DisconnectedWrapper
      requireLogin
      node={
        <>
          <div className="flex-center" style={{ minHeight: '70vh', alignItems: 'normal' }}>
            <InformationDisplayCard title="Email Verification" md={12} xs={24}>
              <div className="flex-center">
                <AddressDisplay addressOrUsername={chain.address} />
              </div>
              <Divider />
              <div className="primary-text full-width" style={{ textAlign: 'center' }}>
                {verified ? (
                  <>
                    <div className="full-width" style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center' }}>
                      <>
                        Email verified <CheckCircleFilled style={{ color: 'green' }} />!
                      </>
                    </div>
                    <br />
                    <div className="full-width secondary-text" style={{ fontSize: 16, fontWeight: 'bold', textAlign: 'center' }}>
                      <>You can now close this page.</>
                    </div>
                  </>
                ) : (
                  <>
                    {(fetching || !signedInAccount) && (
                      <div className="full-width" style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center' }}>
                        <>
                          {fetching && 'Verifying email'} <Spin size="large" />
                        </>
                      </div>
                    )}
                    {signedInAccount && !fetching && (
                      <div className="full-width" style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center' }}>
                        {signedInAccount?.notifications?.emailVerification?.verified ? (
                          <>
                            Email already verified <CheckCircleFilled style={{ color: 'green' }} />!
                            <br />
                            <div className="full-width secondary-text" style={{ fontSize: 16, fontWeight: 'bold', textAlign: 'center' }}>
                              <>You can close this page.</>
                            </div>
                          </>
                        ) : (
                          <>
                            <Form layout="vertical">
                              <GenericTextFormInput label="Verification Code" value={emailToken} setValue={setEmailToken} />
                              <br />
                              <button className="landing-button full-width" onClick={verifyEmail}>
                                Verify Email
                              </button>
                            </Form>
                          </>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </InformationDisplayCard>
          </div>
        </>
      }
    />
  );
}
