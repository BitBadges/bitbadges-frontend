import React, { useEffect, useState } from 'react';
import { Empty, Layout } from 'antd';
import { PRIMARY_BLUE, PRIMARY_TEXT, SECONDARY_BLUE } from '../../constants';
import { useRouter } from 'next/router';
import { getBadge, getBadgeBalance } from '../../bitbadges-api/api';
import { BadgeHeader } from '../../components/badges/BadgePageHeader';
import { Tabs } from '../../components/Tabs';
import { BadgeModalManagerActions } from '../../components/badges/ManagerActions';
import { UserBalanceDisplay } from '../../components/badges/UserBalanceDisplay';
import { BitBadge, BitBadgeCollection, UserBalance } from '../../bitbadges-api/types';
import { BadgeOverviewTab } from '../../components/badges/BadgePageOverviewTab';
import { BadgeSubBadgesTab } from '../../components/badges/BadgePageSubBadgesTab';
import { useChainContext } from '../../chain/ChainContext';
import { addToIpfs, getFromIpfs } from '../../chain/backend_connectors';

const { Content } = Layout;

function Badges() {
    const router = useRouter()
    const { collectionId } = router.query;

    const [badgeDetails, setBadgeDetails] = useState<BitBadgeCollection | undefined>()
    const chain = useChainContext();
    const accountNumber = chain.accountNumber;
    const [tab, setTab] = useState('overview');
    const [visible, setVisible] = useState(true);

    const tabInfo = [
        { key: 'overview', content: 'Overview', disabled: false },
        {
            key: 'subbadges',
            content: 'Badges',
            disabled: false
        },

        { key: 'activity', content: 'Activity', disabled: false },
        {
            key: 'manageractions',
            content: 'Manager Actions',
            // disabled: accountNumber !== badgeDetails?.manager //TODO: uncomment this
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
            if (badgeInfo) {
                const res = await getFromIpfs(badgeInfo.uri.uri, 'collection');
                badgeInfo.metadata = JSON.parse(res.file)

                setBadgeDetails(badgeInfo)
            } else {
                //TODO: add a 404 clause (possibly in /api)
            }
        }
        getBadgeFromApi();
    }, [collectionId])

    const [userBalance, setUserBalance] = useState<UserBalance | undefined>();

    useEffect(() => {
        async function getBadgeBalanceFromApi() {
            if (!badgeDetails) {
                return;
            }
            const balanceInfoRes = await getBadgeBalance(badgeDetails.id, accountNumber);
            console.log("Got user's badge balance: ", balanceInfoRes);

            if (balanceInfoRes.error) {
                //TODO: add a 404 clause (possibly in /api)
            } else {
                const balanceInfo = balanceInfoRes.balanceInfo;
                setUserBalance(balanceInfo)
            }
        }
        getBadgeBalanceFromApi();
    }, [badgeDetails, accountNumber])

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
                        badge={badgeDetails}
                        metadata={badgeDetails?.metadata}
                    />
                    <Tabs
                        tabInfo={tabInfo}
                        setTab={setTab}
                        theme="dark"
                        fullWidth
                    />


                    {tab === 'overview' && (<>
                        <BadgeOverviewTab
                            badge={badgeDetails}
                            metadata={badgeDetails?.metadata}
                        />
                    </>
                    )}
                    {tab === 'subbadges' && (<>
                        <BadgeSubBadgesTab
                            badgeCollection={badgeDetails}
                        />
                    </>
                    )}


                    {tab === 'manageractions' && (
                        <>
                            <BadgeModalManagerActions
                                badge={badgeDetails}
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
