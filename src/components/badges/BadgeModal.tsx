import { CloseOutlined } from '@ant-design/icons';
import { Col, Drawer, Layout, Row, Typography } from 'antd';
import { useState } from 'react';
import Markdown from 'react-markdown';
import { getSupplyByBadgeId } from '../../bitbadges-api/balances';
import { BadgeMetadata, BitBadgeCollection, UserBalance } from '../../bitbadges-api/types';
import { PRIMARY_BLUE, PRIMARY_TEXT, SECONDARY_BLUE, SECONDARY_TEXT } from '../../constants';
import { useChainContext } from '../../contexts/ChainContext';
import { ActivityTab } from '../activity/ActivityDisplay';
import { CollectionHeader } from './CollectionHeader';
import { MetadataDisplay } from './MetadataInfoDisplay';
import { OwnersTab } from '../collection-page/OwnersTab';
import { InformationDisplayCard } from '../display/InformationDisplayCard';
import { Tabs } from '../navigation/Tabs';

const { Content } = Layout;
const { Text } = Typography;

const tabInfo = [
    { key: 'overview', content: 'Overview' },
    { key: 'owners', content: 'Owners' },
    { key: 'activity', content: 'Activity' },
];

export function BadgeModal({ collection, metadata, visible, setVisible, balance, badgeId, hideBalances }
    : {
        collection: BitBadgeCollection,
        metadata: BadgeMetadata,
        visible: boolean,
        setVisible: (visible: boolean) => void,
        balance: UserBalance,
        badgeId: number,
        hideBalances?: boolean,
    }) {
    const chain = useChainContext();
    const [tab, setTab] = useState('overview');



    return (
        <Drawer
            destroyOnClose
            onClose={() => { setVisible(false) }}
            open={visible}
            placement={'bottom'}
            size="large"
            title={
                <Tabs
                    tab={tab}
                    tabInfo={tabInfo}
                    setTab={setTab}
                    theme="dark"
                    fullWidth
                />
            }
            headerStyle={{
                paddingLeft: '12px',
                paddingRight: '0px',
                paddingTop: '0px',
                paddingBottom: '0px',
                borderBottom: '0px',
                backgroundColor: '#001529',
                color: PRIMARY_TEXT,
            }}
            closeIcon={<CloseOutlined style={{ color: PRIMARY_TEXT }} />}
            bodyStyle={{
                paddingTop: 8,
                fontSize: 20,
                backgroundColor: '#001529',
                color: PRIMARY_TEXT,
            }}
        >
            <Layout>
                <Content
                    style={{
                        background: `linear-gradient(0deg, ${SECONDARY_BLUE} 0,${PRIMARY_BLUE} 0%)`,
                        textAlign: 'center',
                        minHeight: '100vh',
                    }}
                >
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


                        {tab === 'overview' && (<>
                            <CollectionHeader
                                metadata={metadata}
                            />
                            {chain.connected && !hideBalances && <>You have x{getSupplyByBadgeId(badgeId, balance.balances)} of this badge.</>}
                            <br />

                            <Row
                                style={{
                                    display: 'flex',
                                    justifyContent: 'center',

                                }}
                            >

                                <Col span={16} style={{ minHeight: 100, border: '1px solid white', borderRadius: 10 }}>

                                    <Text style={{ color: SECONDARY_TEXT }}>
                                        <MetadataDisplay
                                            collection={collection}
                                            metadata={metadata}
                                            badgeId={badgeId}
                                        />
                                    </Text>
                                </Col>
                            </Row>
                            <br />
                            {metadata.description &&
                                <Row
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'center',

                                    }}
                                >
                                    <Col span={16} style={{ minHeight: 100, border: '1px solid white', borderRadius: 10 }}>
                                        <InformationDisplayCard
                                            title="Description"
                                        >
                                            <div style={{ maxHeight: 400, overflow: 'auto' }} >
                                                <div className='custom-html-style' id="description" style={{ color: PRIMARY_TEXT }} >
                                                    <Markdown>
                                                        {metadata.description}
                                                    </Markdown>
                                                </div>
                                            </div>
                                        </InformationDisplayCard>
                                    </Col>
                                </Row>
                            }

                        </>
                        )}

                        {tab === 'activity' && (
                            <ActivityTab
                                collection={collection}
                                badgeId={badgeId}
                            />
                        )}

                        {tab === 'owners' && (
                            <OwnersTab
                                collection={collection}
                                badgeId={badgeId}
                            />
                        )}
                    </div>
                </Content>
            </Layout>
        </Drawer>
    );
}
