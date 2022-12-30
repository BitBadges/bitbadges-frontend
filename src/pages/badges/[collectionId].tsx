import React, { useEffect, useState } from 'react';
import { Col, Divider, Empty, Layout, Row, Typography } from 'antd';
import { DEV_MODE, PRIMARY_BLUE, PRIMARY_TEXT, SECONDARY_BLUE } from '../../constants';
import { useRouter } from 'next/router';
import { getBadge, getBadgeBalance } from '../../bitbadges-api/api';
import { PageHeaderWithAvatar } from '../../components/badges/PageHeaderWithAvatar';
import { Tabs } from '../../components/Tabs';
import { ActionsTab } from '../../components/badges/tabs/ActionsTab';
import { BitBadgeCollection, UserBalance } from '../../bitbadges-api/types';
import { BadgeOverviewTab } from '../../components/badges/tabs/BadgePageOverviewTab';
import { BadgeSubBadgesTab } from '../../components/badges/tabs/BadgePageSubBadgesTab';
import { useChainContext } from '../../chain/ChainContext';

const { Content } = Layout;

const tabInfo = [
    { key: 'overview', content: 'Overview', disabled: false },
    { key: 'subbadges', content: 'Badges', disabled: false },
    { key: 'activity', content: 'Activity', disabled: false },
    { key: 'manageractions', content: 'Manager Actions', disabled: false }
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
                    <PageHeaderWithAvatar
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
                        <Row>
                            <Divider></Divider>
                            <Col span={8}>
                                <BadgeOverviewTab
                                    badge={badgeCollection}
                                    metadata={collectionMetadata}
                                    balance={userBalance}
                                />
                            </Col>
                            <Col span={16}>
                                <BadgeSubBadgesTab
                                    badgeCollection={badgeCollection}
                                    setBadgeCollection={setBadgeCollection}
                                />
                            </Col>
                        </Row>


                    </>
                    )}
                    {tab === 'subbadges' && (<>
                        <Divider></Divider>
                        <BadgeSubBadgesTab
                            badgeCollection={badgeCollection}
                            setBadgeCollection={setBadgeCollection}
                        />
                    </>)}


                    {tab === 'manageractions' && (
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
                    <pre>
                        USER BALANCE: {JSON.stringify(userBalance, null, 2)}
                    </pre>
                )}
            </Content>
        </Layout>
    );
}

export default CollectionPage;
