import { Button, Layout, Typography } from 'antd';
import { useState } from 'react';
import { getTokensFromFaucet } from '../bitbadges-api/api';
import { DisconnectedWrapper } from '../components/wrappers/DisconnectedWrapper';
import { PRIMARY_BLUE, PRIMARY_TEXT, SECONDARY_BLUE } from '../constants';
import { useChainContext } from '../contexts/ChainContext';

const { Content } = Layout;
const { Text } = Typography;

function RegisterScreen({ message }: { message?: string }) {
    const chain = useChainContext();
    const airdropped = chain.airdropped;
    const [loading, setLoading] = useState(false);

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
                            style={{ fontSize: 20, color: PRIMARY_TEXT }}
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
                                    Receive 10 $BADGE Tokens from Faucet
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
