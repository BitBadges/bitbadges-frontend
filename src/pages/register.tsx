import React from 'react';
import { Button, Layout, Typography } from 'antd';
import { FAUCET_URL, PRIMARY_BLUE, PRIMARY_TEXT, SECONDARY_BLUE } from '../constants';
import { useChainContext } from '../contexts/ChainContext';

const { Content } = Layout;
const { Text } = Typography;

function RegisterScreen({ message }: { message?: string }) {
    const chain = useChainContext();
    const address = chain.cosmosAddress;

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
                            {message ? message : 'It appears you are not registered. Please register this address to continue.'}
                        </Text>
                    </Content>
                    <Content style={{ paddingTop: '15px' }}>
                        <Button
                            type="primary"
                            onClick={async () => {
                                await navigator.clipboard.writeText(address);
                                window.open(FAUCET_URL, "_blank");
                            }}
                            style={{ margin: 5 }}
                        >
                            Click here to go to the faucet and register your address (one-time)!
                        </Button>
                        <Button
                            type="primary"
                            onClick={async () => {
                                await chain.connect();
                            }}
                            style={{ margin: 5 }}
                        >
                            Refresh
                        </Button>
                    </Content>
                </div>
            </Content>
        </Layout>
    );
}

export default RegisterScreen;
