import { Divider, Empty, Layout } from 'antd';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { getBadgeBalance } from '../../bitbadges-api/api';
import { UserBalance } from '../../bitbadges-api/types';
import { useChainContext } from '../../chain/ChainContext';
import { useCollectionsContext } from '../../collections/CollectionsContext';
import { BadgePageHeader } from '../../components/badges/BadgePageHeader';
import { ActionsTab } from '../../components/badges/tabs/ActionsTab';
import { ActivityTab } from '../../components/badges/tabs/ActivityTab';
import { BadgesTab } from '../../components/badges/tabs/BadgesTab';
import { ClaimsTab } from '../../components/badges/tabs/ClaimsTab';
import { OverviewTab } from '../../components/badges/tabs/OverviewTab';
import { Tabs } from '../../components/common/Tabs';
import { DEV_MODE, PRIMARY_BLUE, PRIMARY_TEXT, SECONDARY_BLUE } from '../../constants';
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
    const collections = useCollectionsContext();

    const { collectionId, badgeId } = router.query;
    const collectionIdNumber = collectionId ? Number(collectionId) : -1;


    const [badgeIdNumber, setBadgeIdNumber] = useState<number>(Number(badgeId));

    const accountNumber = chain.accountNumber;


    const [tab, setTab] = useState(badgeIdNumber ? 'badges' : 'overview');

    const collection = collections.collections[`${collectionIdNumber}`];

    const collectionMetadata = collection?.collectionMetadata;
    const [userBalance, setUserBalance] = useState<UserBalance>();
    

    async function setBadgeUserBalance() {
        await new Promise(r => setTimeout(r, 3000));

        const res = await getBadgeBalance(collectionIdNumber, accountNumber);
        setUserBalance(res.balance);
    }

    // Get badge collection information
    useEffect(() => {
        async function refreshCollection() {
            await collections.fetchCollections([collectionIdNumber]);
        }
        refreshCollection();
    }, [collectionIdNumber, collections]);

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
                        <OverviewTab setTab={setTab} 
                            collection={collection}
                            
                            refreshUserBalance={setBadgeUserBalance}
                            userBalance={userBalance}
                        />
                    )}
                    {tab === 'badges' && (
                        <BadgesTab
                            collection={collection}
                            balance={userBalance}
                            badgeId={badgeIdNumber}
                            setBadgeId={setBadgeIdNumber}
                        />
                    )}

                    {tab === 'claims' && (
                        <ClaimsTab
                            collection={collection}
                            refreshUserBalance={setBadgeUserBalance}
                        />
                    )}

                    {tab === 'actions' && (
                        <ActionsTab
                            collection={collection}
                            refreshUserBalance={setBadgeUserBalance}
                            userBalance={userBalance}
                        />
                    )}

                    {tab === 'activity' && collection && (
                        <ActivityTab
                            collection={collection}
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
