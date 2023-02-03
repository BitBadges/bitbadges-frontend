import { MintCollectionTimeline } from '../../components/mint/mint-collection/MintCollectionTimeline';
import React from 'react';
import { Layout } from 'antd';
import { PRIMARY_BLUE, SECONDARY_BLUE } from '../../constants';
import { DisconnectedWrapper } from '../../components/wrappers/DisconnectedWrapper';
import { RegisteredWrapper } from '../../components/wrappers/RegisterWrapper';

const { Content } = Layout;

function Mint() {
    return (
        <DisconnectedWrapper
            message='Please connect a wallet and sign in to access the Mint page.'
            node={
                <RegisteredWrapper
                    message='Please register to access the Mint page.'
                    node={
                        <Layout>
                            <Content
                                style={{
                                    background: `linear-gradient(0deg, ${SECONDARY_BLUE} 0,${PRIMARY_BLUE} 0%)`,
                                    textAlign: 'center',
                                    minHeight: '100vh',
                                }}
                            >
                                <div className="primary-text">Mint</div>
                                <div
                                    style={{
                                        marginLeft: '10vw',
                                        marginRight: '10vw',
                                        paddingLeft: '2vw',
                                        paddingRight: '2vw',
                                        paddingTop: '20px',
                                        background: PRIMARY_BLUE,
                                    }}
                                >
                                    <MintCollectionTimeline />
                                </div>
                            </Content>
                        </Layout>
                    }
                />
            }
        />
    );
}

export default Mint;
