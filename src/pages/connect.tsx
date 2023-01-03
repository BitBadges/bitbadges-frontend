import React from 'react';
import { Button, Layout, Typography } from 'antd';
import { PRIMARY_BLUE, PRIMARY_TEXT, SECONDARY_BLUE } from '../constants';
import { BlockinDisplay } from '../components/blockin/BlockinDisplay';
import { useRouter } from 'next/router';
import { useChainContext } from '../chain/ChainContext';

const { Content } = Layout;
const { Text } = Typography;

function ConnectScreen({ message }: { message?: string }) {
    const router = useRouter();
    const {
        loggedIn,
        connected
    } = useChainContext();

    return (
        <Layout>
            <Content
                style={{
                    background: `linear-gradient(0deg, ${SECONDARY_BLUE} 0, ${PRIMARY_BLUE} 0%)`,
                    minHeight: '100vh',
                    textAlign: 'center',
                }}
            >
                <div>
                    <Content>
                        <Text
                            strong
                            style={{ fontSize: 28, color: PRIMARY_TEXT }}
                        >
                            {message ? message : 'Welcome!'}
                        </Text>
                    </Content>
                    <Content style={{ paddingTop: '15px' }}>
                        <BlockinDisplay />
                    </Content>
                </div>
                {true && connected && //TODO: change to actually loggedIn
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
            </Content>
        </Layout>
    );
}

export default ConnectScreen;
