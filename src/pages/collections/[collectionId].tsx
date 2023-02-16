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
import { ClaimsTab } from '../../components/badges/tabs/ClaimsTab';
import { ActivityTab } from '../../components/badges/tabs/ActivityTab';
const { Content } = Layout;

const tabInfo = [
    { key: 'overview', content: 'Overview', disabled: false },
    { key: 'badges', content: 'Badges', disabled: false },
    { key: 'claims', content: 'Claims', disabled: false },
    { key: 'activity', content: 'Activity', disabled: false },
    { key: 'actions', content: 'Actions', disabled: false },
];

function CollectionPage() {
    const router = useRouter()
    const chain = useChainContext();

    const { collectionId, badgeId } = router.query;
    const collectionIdNumber = Number(collectionId);

    const [badgeIdNumber, setBadgeIdNumber] = useState<number>(Number(badgeId));

    const accountNumber = chain.accountNumber;


    const [tab, setTab] = useState(badgeIdNumber ? 'badges' : 'overview');
    const [badgeCollection, setBadgeCollection] = useState<BitBadgeCollection>();
    const collectionMetadata = badgeCollection?.collectionMetadata;
    const [userBalance, setUserBalance] = useState<UserBalance>();

    // Get badge collection information
    useEffect(() => {
        async function getBadgeInformation() {
            const res = await getBadgeCollection(collectionIdNumber);
            setBadgeCollection(res.collection);
        }
        getBadgeInformation();
    }, [collectionIdNumber]);

    useEffect(() => {
        const badgeIdNum = Number(badgeId);
        if (!isNaN(badgeIdNum)) {
            setTab('badges');
            setBadgeIdNumber(badgeIdNum);
        }
    }, [badgeId])

    // Get user's badge balance
    useEffect(() => {
        async function getBadgeBalanceFromApi() {
            const res = await getBadgeBalance(collectionIdNumber, accountNumber);
            setUserBalance(res.balance);
        }
        getBadgeBalanceFromApi();
    }, [collectionIdNumber, accountNumber])

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
                    <Tabs tabInfo={tabInfo} tab={tab} setTab={setTab} theme="dark" fullWidth />
                    <br />

                    {/* Tab Content */}
                    {tab === 'overview' && (
                        <OverviewTab setTab={setTab} badgeCollection={badgeCollection} setBadgeCollection={setBadgeCollection} userBalance={userBalance} />
                    )}
                    {tab === 'badges' && (
                        <BadgesTab
                            badgeCollection={badgeCollection}
                            setBadgeCollection={setBadgeCollection}
                            balance={userBalance}
                            badgeId={badgeIdNumber}
                            setBadgeId={setBadgeIdNumber}
                        />
                    )}

                    {tab === 'claims' && (
                        <ClaimsTab
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
                        <ActivityTab
                            badgeCollection={badgeCollection}

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
