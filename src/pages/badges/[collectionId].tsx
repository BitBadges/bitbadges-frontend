import React, { useEffect, useState } from 'react';
import { Col, Divider, Empty, Layout, Row, Typography } from 'antd';
import { DEV_MODE, PRIMARY_BLUE, PRIMARY_TEXT, SECONDARY_BLUE, SECONDARY_TEXT } from '../../constants';
import { useRouter } from 'next/router';
import { getBadge, getBadgeBalance } from '../../bitbadges-api/api';
import { BadgePageHeader } from '../../components/badges/BadgePageHeader';
import { Tabs } from '../../components/common/Tabs';
import { ActionsTab } from '../../components/badges/tabs/ActionsTab';
import { BitBadgeCollection, UserBalance } from '../../bitbadges-api/types';
import { CollectionOverview } from '../../components/badges/CollectionOverview';
import { BadgeSubBadgesTab } from '../../components/badges/tabs/BadgePageSubBadgesTab';
import { useChainContext } from '../../chain/ChainContext';
import { BalanceOverview } from '../../components/badges/BalanceOverview';
import { PermissionsOverview } from '../../components/badges/PermissionsOverview';
import { BadgeAvatar } from '../../components/badges/BadgeAvatar';

const { Content } = Layout;
const { Text } = Typography;

const tabInfo = [

    { key: 'overview', content: 'Overview', disabled: false },
    { key: 'badges', content: 'Badges', disabled: false },
    { key: 'activity', content: 'Activity', disabled: false },
    { key: 'actions', content: 'Actions', disabled: false }
];

function CollectionPage() {
    const router = useRouter()
    const { collectionId } = router.query;

    const [tab, setTab] = useState('overview');
    const [badgeCollection, setBadgeCollection] = useState<BitBadgeCollection>();
    const collectionMetadata = badgeCollection?.collectionMetadata;

    const chain = useChainContext();
    const accountNumber = chain.accountNumber;

    useEffect(() => {
        async function getBadgeInformation() {
            await getBadge(Number(collectionId), badgeCollection)
                .then(res => { setBadgeCollection(res.badge) });
        }
        getBadgeInformation();
    }, [collectionId, badgeCollection]);

    const [userBalance, setUserBalance] = useState<UserBalance | undefined>();
    useEffect(() => {
        async function getBadgeBalanceFromApi() {
            if (!badgeCollection || !accountNumber || accountNumber < 0 || !badgeCollection.id) {
                return;
            }
            if (DEV_MODE) console.log("Getting user's badge balance: ");
            const balanceInfoRes = await getBadgeBalance(badgeCollection.id, accountNumber);

            if (balanceInfoRes.error) {
                console.error("Error getting balance: ", balanceInfoRes.error);
            } else {
                console.log("Got balance: ", balanceInfoRes.balanceInfo);
                const balanceInfo = balanceInfoRes.balanceInfo;
                setUserBalance(balanceInfo)
            }
        }
        getBadgeBalanceFromApi();
    }, [badgeCollection, accountNumber])

    return (
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
                    <BadgePageHeader
                        badge={badgeCollection}
                        metadata={collectionMetadata}
                        balance={userBalance}
                    />
                    <Tabs
                        tabInfo={tabInfo}
                        setTab={setTab}
                        theme="dark"
                        fullWidth
                    />
                    {tab === 'overview' && (<>
                        <br />

                        <div style={{ minHeight: 100, border: '1px solid gray', borderRadius: 10 }}>
                            <Row style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <Text strong style={{ fontSize: 22, color: PRIMARY_TEXT }}>
                                    Badges
                                </Text>
                            </Row>
                            <Divider style={{ margin: "4px 0px", color: 'gray', background: 'gray' }}></Divider>
                            {<div style={{
                                display: 'flex',
                                flexDirection: 'row',
                                justifyContent: 'center',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                maxHeight: 300,
                                overflow: 'auto',
                            }}
                            >{badgeCollection
                                && new Array(Number(badgeCollection.nextSubassetId)).fill(0).map((_, idx) => {
                                    return <div key={idx} style={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',

                                    }}
                                    >
                                        <BadgeAvatar
                                            size={55}
                                            badge={badgeCollection}
                                            metadata={badgeCollection.badgeMetadata[idx]}
                                            badgeId={idx}
                                            balance={userBalance}
                                        />
                                    </div>
                                })}
                            </div>}
                        </div>
                        <br />
                        <Row
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',

                            }}
                        >
                            <Col span={7} style={{ minHeight: 100, border: '1px solid gray', borderRadius: 10 }}>
                                <Text style={{ color: SECONDARY_TEXT }}>
                                    <CollectionOverview
                                        badge={badgeCollection}
                                        metadata={collectionMetadata}
                                        balance={userBalance}
                                    />
                                </Text>
                            </Col>
                            <Col span={7} style={{ minHeight: 100, border: '1px solid gray', borderRadius: 10 }}>
                                <PermissionsOverview
                                    badgeCollection={badgeCollection ? badgeCollection : {} as BitBadgeCollection}
                                />
                            </Col>

                            <Col span={7} style={{ minHeight: 100, border: '1px solid gray', borderRadius: 10 }}>
                                <Text style={{ color: SECONDARY_TEXT }}>
                                    <BalanceOverview
                                        badge={badgeCollection}
                                        metadata={collectionMetadata}
                                        balance={userBalance}
                                    />
                                </Text>
                            </Col>

                        </Row>
                        <Divider></Divider>


                    </>
                    )}
                    {tab === 'badges' && (<>
                        <br />
                        <BadgeSubBadgesTab
                            badgeCollection={badgeCollection}
                            setBadgeCollection={setBadgeCollection}
                            balance={userBalance}
                        />
                    </>)}


                    {tab === 'actions' && (
                        <ActionsTab
                            badge={badgeCollection}
                        />
                    )}

                    {tab === 'activity' && (
                        <Empty
                            style={{ color: PRIMARY_TEXT }}
                            description="This feature is coming soon..."
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                    )}

                    {tab === 'owners' && (
                        <Empty
                            style={{ color: PRIMARY_TEXT }}
                            description="This feature is coming soon..."
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                    )}
                </div>
                {DEV_MODE && (
                    <pre style={{ color: PRIMARY_TEXT }}>
                        USER BALANCE: {JSON.stringify(userBalance, null, 2)}
                    </pre>
                )}
            </Content>
        </Layout>
    );
}

export default CollectionPage;
