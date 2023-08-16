import { Button, Layout, Typography } from 'antd';
import { useState } from 'react';
import { getTokensFromFaucet } from '../bitbadges-api/api';
import { DisconnectedWrapper } from '../components/wrappers/DisconnectedWrapper';
import { useChainContext } from '../bitbadges-api/contexts/ChainContext';
import { useStatusContext } from '../bitbadges-api/contexts/StatusContext';
import { useAccountsContext } from '../bitbadges-api/contexts/AccountsContext';

const { Content } = Layout;
const { Text } = Typography;

function RegisterScreen({ message }: { message?: string }) {
  const chain = useChainContext();
  const accounts = useAccountsContext();
  const status = useStatusContext();
  const [loading, setLoading] = useState(false);

  return (
    <Layout>
      <Content
        style={{
          background: `linear-gradient(0deg, #3e83f8 0, #001529 0%)`,
          minHeight: '100vh',
          textAlign: 'center',
        }}
      >
        <div>

          <DisconnectedWrapper
            message='Please connect a wallet and sign in to claim your airdrop.'
            requireLogin
            node={
              <Content style={{ paddingTop: '15px' }}>
                <Content>
                  <Text
                    strong
                    style={{ fontSize: 20 }} className='primary-text'
                  >
                    {message ? message
                      : 'It looks like you have not claimed your airdrop yet!'}
                  </Text>
                </Content>
                <Button
                  loading={loading}
                  type="primary"
                  onClick={async () => {
                    setLoading(true)
                    const res = await getTokensFromFaucet();
                    const height = res.height;
                    let currStatus = status.status;
                    while (currStatus.block.height <= height) {
                      const statusRes = await status.updateStatus();
                      currStatus = statusRes
                      await new Promise(resolve => setTimeout(resolve, 1000));
                    }

                    await accounts.fetchAccountsWithOptions([{ address: chain.address, fetchSequence: true }], true);

                    setLoading(false);
                  }}
                  style={{ margin: 5 }}
                >
                  Receive 1000 $BADGE Tokens from Faucet
                </Button>
              </Content>
            }
          />
        </div>
      </Content >
    </Layout >
  );
}

export default RegisterScreen;
