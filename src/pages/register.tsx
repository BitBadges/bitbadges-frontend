import { getInjectedProviderName } from 'web3modal';
import { useSelector } from 'react-redux';
import React, { useEffect, useState } from 'react';
import { Button, Layout, Typography } from 'antd';
import { PRIMARY_BLUE, PRIMARY_TEXT, SECONDARY_BLUE } from '../constants';
import { BlockinDisplay } from '../components/blockin/BlockinDisplay';
import Image from 'next/image';
import { useChainContext } from '../chain/ChainContext';
import { getAccountInformation } from '../bitbadges-api/api';

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
                                window.open('http://localhost:4500', "_blank");
                            }}
                        >
                            Click here to go to the faucet and register your address (one-time)!
                        </Button>
                        <Button
                            type="primary"
                            onClick={async () => {
                                await chain.connect();
                            }}
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
