import React, { useEffect, useState } from 'react';
import { Empty, Layout } from 'antd';
import { DEV_MODE, PRIMARY_BLUE, PRIMARY_TEXT, SECONDARY_BLUE } from '../../../constants';
import { useRouter } from 'next/router';
import { getBadge, getBadgeBalance } from '../../../bitbadges-api/api';
import { PageHeaderWithAvatar } from '../../../components/badges/PageHeaderWithAvatar';
import { Tabs } from '../../../components/Tabs';
import { BadgeModalManagerActions } from '../../../components/badges/tabs/ManagerActionsTab';
import { BadgeMetadata, BitBadgeCollection, UserBalance } from '../../../bitbadges-api/types';
import { BadgeOverviewTab } from '../../../components/badges/tabs/BadgePageOverviewTab';
import { useChainContext } from '../../../chain/ChainContext';
import { BadgeBalanceTab } from '../../../components/badges/tabs/BadgeBalanceTab';
import { getFromIpfs } from '../../../chain/backend_connectors';

const { Content } = Layout;


function Badges() {
    const router = useRouter()
    const { collectionId, badgeId } = router.query;

    const [badgeCollection, setBadgeCollection] = useState<BitBadgeCollection | undefined>()
    const [badgeMetadata, setBadgeMetadata] = useState<BadgeMetadata>();

    const chain = useChainContext();
    const accountNumber = chain.accountNumber;
    const [tab, setTab] = useState('overview');

    const tabInfo = [
        { key: 'overview', content: 'Overview', disabled: false },
        {
            key: 'balances',
            content: 'Balances',
            disabled: false
        },

        { key: 'activity', content: 'Activity', disabled: false },
        {
            key: 'Actions',
            content: 'Actions',
        }
    ];

    useEffect(() => {
        if (isNaN(Number(collectionId))) {
            return
        }

        async function getBadgeFromApi() {
            if (isNaN(Number(collectionId))) return;

            const badgeRes = await getBadge(Number(collectionId));
            const badgeInfo = badgeRes.badge;

            console.log('badgeInfo', badgeInfo)

            if (badgeInfo) {
                console.log('badgeInfo', badgeInfo)
                const res = await getFromIpfs(badgeInfo.uri.uri, 'collection');
                badgeInfo.metadata = JSON.parse(res.file)

                setBadgeCollection(badgeInfo)
            } else {
                //TODO: add a 404 clause (possibly in /api)
            }
        }
        getBadgeFromApi();
    }, [collectionId])

    useEffect(() => {
        if (isNaN(Number(badgeId)) || !badgeCollection) {
            return;
        }

        async function getBadgeFromApi() {
            if (isNaN(Number(badgeId)) || !badgeCollection) return;

            const res = await getFromIpfs(badgeCollection.uri.uri, `${badgeId}`);
            const metadata = JSON.parse(res.file);
            setBadgeMetadata(metadata);

            console.log('metadata', metadata);
        }
        getBadgeFromApi();
    }, [badgeId, badgeCollection])

    const [userBalance, setUserBalance] = useState<UserBalance | undefined>();

    useEffect(() => {
        async function getBadgeBalanceFromApi() {
            if (!badgeCollection) {
                return;
            }
            if (DEV_MODE) console.log("Getting user's badge balance: ");
            const balanceInfoRes = await getBadgeBalance(badgeCollection.id, accountNumber);
            console.log("Got user's badge balance: ", balanceInfoRes);

            if (balanceInfoRes.error) {
                //TODO: add a 404 clause (possibly in /api)
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
                        metadata={badgeMetadata}
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
                            metadata={badgeMetadata}
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

export default Badges;
