import React from 'react';
import { Button, Layout, Typography } from 'antd';
import { DEV_MODE } from '../constants';
import { BlockinDisplay } from '../components/blockin/BlockinDisplay';
import { useRouter } from 'next/router';
import { useChainContext } from '../bitbadges-api/contexts/ChainContext';

const { Content } = Layout;
const { Text } = Typography;

function ConnectScreen({ message }: { message?: string }) {
  const router = useRouter();
  const {
    loggedIn,
    connected
  } = useChainContext();

  return (
    <div
      className='inherit-bg'
      style={{
        minHeight: '100vh',
        textAlign: 'center',
        marginTop: 16,
      }}
    >
      <div>
        <Content>
          <Text
            strong
            style={{ fontSize: 20 }} className='primary-text'
          >
            {message ? message : 'Welcome!'}
          </Text>
        </Content>
        <Content style={{ paddingTop: '15px' }}>
          <BlockinDisplay />
        </Content>
      </div>

      {true && DEV_MODE && connected && loggedIn &&
        <div>
          <Content style={{ paddingTop: '15px' }}>
            <Button type='primary' style={{ width: '50%' }} onClick={() => {
              router.back();
            }}>
              Go Back to Previous Page
            </Button>
          </Content>
        </div>
      }
    </div>
  );
}

export default ConnectScreen;
