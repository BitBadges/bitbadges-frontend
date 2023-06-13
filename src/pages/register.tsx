import { Button, Layout, Typography } from 'antd';
import { useState } from 'react';
import { getTokensFromFaucet } from '../bitbadges-api/api';
import { DisconnectedWrapper } from '../components/wrappers/DisconnectedWrapper';
import { useChainContext } from '../bitbadges-api/contexts/ChainContext';

const { Content } = Layout;
const { Text } = Typography;

function RegisterScreen({ message }: { message?: string }) {
  const chain = useChainContext();
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
          <Content>
            <Text
              strong
              style={{ fontSize: 20 }} className='primary-text'
            >
              {message ? message
                : 'It looks like you have not claimed your airdrop yet!'}
            </Text>
          </Content>
          <DisconnectedWrapper
            message='Please connect a wallet and sign in to claim your airdrop.'
            requireLogin
            node={
              <Content style={{ paddingTop: '15px' }}>
                <Button
                  loading={loading}
                  type="primary"
                  onClick={async () => {
                    setLoading(true)
                    await getTokensFromFaucet();
                    await chain.connect();

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
