import React, { useEffect, useState } from 'react';
import { Empty, Layout } from 'antd';
import { DEV_MODE, PRIMARY_BLUE, PRIMARY_TEXT, SECONDARY_BLUE } from '../../../constants';
import { useRouter } from 'next/router';
import { getBadge, getBadgeBalance } from '../../../bitbadges-api/api';
import { PageHeaderWithAvatar } from '../../../components/badges/PageHeaderWithAvatar';
import { Tabs } from '../../../components/Tabs';
import { BadgeModalManagerActions } from '../../../components/badges/tabs/ActionsTab';
import { BadgeMetadata, BitBadgeCollection, UserBalance } from '../../../bitbadges-api/types';
import { BadgeOverviewTab } from '../../../components/badges/tabs/BadgePageOverviewTab';
import { useChainContext } from '../../../chain/ChainContext';
import { BadgeBalanceTab } from '../../../components/badges/tabs/BadgeBalanceTab';

const { Content } = Layout;

const tabInfo = [
    { key: 'overview', content: 'Overview', disabled: false },
    { key: 'balances', content: 'Balances', disabled: false },
    { key: 'activity', content: 'Activity', disabled: false },
    { key: 'Actions', content: 'Actions', disabled: false }
];

function BadgePage() {
    const router = useRouter()
    const chain = useChainContext();
    const { collectionId, badgeId } = router.query;

    const [badgeCollection, setBadgeCollection] = useState<BitBadgeCollection>();
    const currBadgeMetadata = badgeCollection?.badgeMetadata && Number(badgeId) >= 0 ?
        badgeCollection?.badgeMetadata[Number(badgeId)] : {} as BadgeMetadata;

    const [tab, setTab] = useState('overview');
    const accountNumber = chain.accountNumber;

    useEffect(() => {
        async function getBadgeInformation() {
            await getBadge(Number(collectionId), badgeCollection, Number(badgeId))
                .then(res => { setBadgeCollection(res.badge) });
        }
        getBadgeInformation();
    }, [collectionId, badgeId, badgeCollection]);

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
                        metadata={currBadgeMetadata}
                        balance={userBalance}
                    />
                    <Tabs
                        tabInfo={tabInfo}
                        setTab={setTab}
                        theme="dark"
                        fullWidth
                    />
                    {tab === 'overview' && (<>
                        <BadgeOverviewTab
                            badge={badgeCollection}
                            metadata={currBadgeMetadata}
                        />
                    </>
                    )}
                    {tab === 'balances' && (<>
                        <BadgeBalanceTab
                            badge={badgeCollection}
                            balanceInfo={userBalance}
                            badgeId={Number(badgeId)}
                        />
                    </>)}
                    {tab === 'manageractions' && (
                        <>
                            <BadgeModalManagerActions
                                badge={badgeCollection}
                            />
                        </>

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
            </Content>
        </Layout>
    );
}

export default BadgePage;
