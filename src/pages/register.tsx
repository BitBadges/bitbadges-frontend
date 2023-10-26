import { InfoCircleOutlined } from '@ant-design/icons';
import { Layout, Spin, Typography, notification } from 'antd';
import { useState } from 'react';
import { getTokensFromFaucet } from '../bitbadges-api/api';
import { useChainContext } from '../bitbadges-api/contexts/ChainContext';
import { useStatusContext } from '../bitbadges-api/contexts/StatusContext';
import { useAccountsContext } from '../bitbadges-api/contexts/accounts/AccountsContext';
import { DisconnectedWrapper } from '../components/wrappers/DisconnectedWrapper';

const { Content } = Layout;
const { Text } = Typography;

function RegisterScreen({ message }: { message?: string }) {
  const chain = useChainContext();
  const accounts = useAccountsContext();
  const status = useStatusContext();
  const [loading, setLoading] = useState(false);

  return (
    <Content
      style={{
        minHeight: '100vh',
        textAlign: 'center',
      }}
    >
      <div>

        <DisconnectedWrapper
          message='Please connect a wallet and sign in to claim your airdrop.'
          requireLogin
          node={
            <div className='flex-center'>
              <Content style={{ paddingTop: '15px', maxWidth: 600, }} className='dark:text-white'>
                <Content>
                  <Text
                    strong
                    style={{ fontSize: 20 }} className='dark:text-white'
                  >
                    {message ? message
                      : 'It looks like you have not claimed your airdrop yet!'}
                  </Text>
                </Content>
                <br />
                <div className='flex-center'>
                  <img src='/images/bitbadgeslogo.png' style={{ height: 200 }} />
                </div>
                <br />
                <br />
                <div className='' style={{ alignItems: 'center', fontSize: 16, fontWeight: 'bold' }}>
                  By claiming this airdrop, you will receive 1000 $BADGE and an airdrop badge to mark the occasion!
                  <br />
                  <br />
                </div>
                <div className='' style={{ alignItems: 'center' }}>
                  <InfoCircleOutlined style={{ marginRight: 4, }} />  All transactions on the BitBadges blockchain require a small fee to be executed, which can be paid using $BADGE.
                  $BADGE is the currency, whereas BitBadges / badges are the tokens used to represent achievements, attendance, etc. Note the airdrop badge may take a few minutes to appear in your portfolio.
                </div>
                <br />
                <div className='flex-center'>
                  <button
                    disabled={loading}
                    className='landing-button full-width'
                    onClick={async () => {
                      setLoading(true)
                      const res = await getTokensFromFaucet();
                      notification.success({
                        message: "Success! You have received 1000 $BADGE Tokens from the faucet.",
                        description: "We now just have to wait for the BitBadges databases to catch up.",
                      });


                      const height = res.height;
                      let currStatus = status.status;
                      while (currStatus.block.height <= height) {
                        const statusRes = await status.updateStatus();
                        currStatus = statusRes
                        await new Promise(resolve => setTimeout(resolve, 1000));
                      }

                      await accounts.fetchAccountsWithOptions([{ address: chain.address, fetchSequence: true }], true);

                      notification.success({
                        message: "Success! Airdrop claimed successfully.",
                      });

                      setLoading(false);
                    }}
                    style={{ margin: 5, width: '100%' }}
                  >
                    Claim 1000 $BADGE {'and Airdrop Badge'} {loading && <Spin />}
                  </button>
                </div>

              </Content>
            </div>
          }
        />
      </div>
    </Content >
  );
}

export default RegisterScreen;
