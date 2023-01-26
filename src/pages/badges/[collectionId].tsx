import React, { useEffect, useState } from 'react';
import { Divider, Empty, Layout } from 'antd';
import { DEV_MODE, PRIMARY_BLUE, PRIMARY_TEXT, SECONDARY_BLUE } from '../../constants';
import { useRouter } from 'next/router';
import { getBadgeCollection, getBadgeBalance } from '../../bitbadges-api/api';
import { BadgePageHeader } from '../../components/badges/BadgePageHeader';
import { Tabs } from '../../components/common/Tabs';
import { ActionsTab } from '../../components/badges/tabs/ActionsTab';
import { BitBadgeCollection, UserBalance } from '../../bitbadges-api/types';
import { BadgesTab } from '../../components/badges/tabs/BadgesTab';
import { useChainContext } from '../../chain/ChainContext';
import { OverviewTab } from '../../components/badges/tabs/OverviewTab';

const { Content } = Layout;

const tabInfo = [
    { key: 'overview', content: 'Overview', disabled: false },
    { key: 'badges', content: 'Badges', disabled: false },
    { key: 'activity', content: 'Activity', disabled: false },
    { key: 'actions', content: 'Actions', disabled: false }
];

function CollectionPage() {
    const router = useRouter()
    const chain = useChainContext();

    const { collectionId } = router.query;
    //TODO: link to exact badge?
    const accountNumber = chain.accountNumber;

    const [tab, setTab] = useState('overview');
    const [badgeCollection, setBadgeCollection] = useState<BitBadgeCollection>();
    const collectionMetadata = badgeCollection?.collectionMetadata;
    const [userBalance, setUserBalance] = useState<UserBalance>();

    // Get badge collection information
    useEffect(() => {
        async function getBadgeInformation() {
            let collectionIdNumber = Number(collectionId);
            if (isNaN(collectionIdNumber) || collectionIdNumber < 0) return;

            try {
                const res = await getBadgeCollection(collectionIdNumber);
                setBadgeCollection(res.collection);
            } catch (e) {
                if (DEV_MODE) console.error("Error getting badge collection: ", e);
            }
        }
        getBadgeInformation();
    }, [collectionId]);

    // Get user's badge balance
    useEffect(() => {
        async function getBadgeBalanceFromApi() {
            if (!accountNumber || accountNumber < 0 || badgeCollection?.collectionId === undefined) return;

            try {
                const res = await getBadgeBalance(badgeCollection?.collectionId, accountNumber);
                setUserBalance(res.balance);
                console.log("setting user balance to", res.balance);
            } catch (e) {
                if (DEV_MODE) console.error("Error getting badge balance: ", e);
            }
        }
        getBadgeBalanceFromApi();
    }, [badgeCollection?.collectionId, accountNumber])

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
                    {/* Overview and Tabs */}
                    <BadgePageHeader metadata={collectionMetadata} />
                    <Tabs tabInfo={tabInfo} setTab={setTab} theme="dark" fullWidth />
                    <br />

                    {/* Tab Content */}
                    {tab === 'overview' && (
                        <OverviewTab badgeCollection={badgeCollection} setBadgeCollection={setBadgeCollection} userBalance={userBalance} />
                    )}
                    {tab === 'badges' && (
                        <BadgesTab
                            badgeCollection={badgeCollection}
                            setBadgeCollection={setBadgeCollection}
                            balance={userBalance}
                        />
                    )}


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
                <Divider />
            </Content>
        </Layout>
    );
}

export default CollectionPage;
