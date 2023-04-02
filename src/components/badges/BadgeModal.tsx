import { CloseOutlined } from '@ant-design/icons';
import { Col, Divider, Drawer, Layout, Row } from 'antd';
import { BadgeMetadata, BitBadgeCollection, UserBalance } from 'bitbadges-sdk';
import { useState } from 'react';
import Markdown from 'react-markdown';
import { PRIMARY_BLUE, PRIMARY_TEXT, SECONDARY_BLUE } from '../../constants';
import { useChainContext } from '../../contexts/ChainContext';
import { ActivityTab } from '../activity/ActivityDisplay';
import { BalanceOverview } from '../collection-page/BalancesInfo';
import { OverviewTab } from '../collection-page/OverviewTab';
import { OwnersTab } from '../collection-page/OwnersTab';
import { InformationDisplayCard } from '../display/InformationDisplayCard';
import { Tabs } from '../navigation/Tabs';
import { CollectionHeader } from './CollectionHeader';
import { MetadataDisplay } from './MetadataInfoDisplay';

const { Content } = Layout;

const tabInfo = [
    { key: 'overview', content: 'Badge Overview' },
    { key: 'collection', content: 'Collection' },
    // { key: 'owners', content: 'Owners' },
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
                        {tab === 'collection' && <>
                            <CollectionHeader metadata={collection.collectionMetadata} />
                            <Divider />
                            <OverviewTab
                                collection={collection}
                                setTab={setTab}
                                userBalance={balance}
                                refreshUserBalance={async () => { }}
                                isBadgeModal
                            /></>}

                        {tab === 'overview' && (<>
                            <CollectionHeader
                                metadata={metadata}
                            />

                            {chain.connected && !hideBalances && <div style={{ fontSize: 20 }}>
                                {/* You have x{getSupplyByBadgeId(badgeId, balance.balances)} of this badge. */}
                                {<div>
                                    <BalanceOverview
                                        refreshUserBalance={
                                            async () => { } //TODO:
                                        }
                                        isBadgeModal
                                        setTab={() => { }}
                                        onlyButtons

                                        balance={balance}
                                        collection={collection}
                                        metadata={collection.collectionMetadata}
                                    />
                                </div>}

                            </div>}
                            <br />
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

                            <Row
                                style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                }}
                            >

                                <Col span={11} style={{ minHeight: 100, marginRight: 20, display: 'flex' }}>
                                    <MetadataDisplay
                                        collection={collection}
                                        metadata={metadata}
                                        badgeId={badgeId}
                                    />
                                </Col>
                                <Col span={11} style={{ minHeight: 100, display: 'flex' }}>
                                    <OwnersTab
                                        collection={collection}
                                        badgeId={badgeId}
                                    />
                                </Col>
                            </Row>




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
