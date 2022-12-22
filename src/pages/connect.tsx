import { Web3ModalButtons } from '../components/Web3ModalConnectButton';
import { getInjectedProviderName } from 'web3modal';
import { useSelector } from 'react-redux';
import React, { useEffect, useState } from 'react';
import { Layout, Typography } from 'antd';
import { PRIMARY_BLUE, PRIMARY_TEXT, SECONDARY_BLUE } from '../constants';
import { BlockinDisplay } from '../components/blockin/BlockinDisplay';
import Image from 'next/image';
import { useChainContext } from '../chain/ChainContext';

const { Content } = Layout;
const { Text } = Typography;

function ConnectScreen({ message }: { message?: string }) {
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
            </Content>
        </Layout>
    );
}

export default ConnectScreen;
