import React, { useEffect, useState } from 'react';
import { Empty, Layout } from 'antd';
import { DEV_MODE, PRIMARY_BLUE, PRIMARY_TEXT, SECONDARY_BLUE } from '../../../constants';
import { useRouter } from 'next/router';
import { getBadge, getBadgeBalance } from '../../../bitbadges-api/api';
import { BadgeHeader } from '../../../components/badges/BadgePageHeader';
import { Tabs } from '../../../components/Tabs';
import { BadgeModalManagerActions } from '../../../components/badges/ManagerActions';
import { BitBadgeCollection, UserBalance } from '../../../bitbadges-api/types';
import { BadgeOverviewTab } from '../../../components/badges/BadgePageOverviewTab';
import { useChainContext } from '../../../chain/ChainContext';
import { BadgeBalanceTab } from '../../../components/badges/BadgeBalanceTab';

const { Content } = Layout;


function Badges() {
    const router = useRouter()
    const { id, badgeId } = router.query;

    const [badgeCollection, setBadgeCollection] = useState<BitBadgeCollection | undefined>()

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
        if (isNaN(Number(id))) {
            return
        }

        async function getBadgeFromApi() {
            if (isNaN(Number(id))) return;

            const badgeRes = await getBadge(Number(id));
            const badgeInfo = badgeRes.badge;
            if (badgeInfo) {
                //TODO: Get actual metadata here instead of just hardcoding it
                badgeInfo.metadata = {
                    name: 'test',
                    description: 'test',
                    image: 'https://bitbadges.web.app/img/icons/logo.png'
                }

                setBadgeCollection(badgeInfo)
            } else {
                //TODO: add a 404 clause (possibly in /api)
            }
        }
        getBadgeFromApi();
    }, [id])

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
                    <BadgeHeader
                        badge={badgeCollection}

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
