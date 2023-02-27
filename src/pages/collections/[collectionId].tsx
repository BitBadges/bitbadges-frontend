import { Divider, Layout } from 'antd';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { getBadgeBalance } from '../../bitbadges-api/api';
import { UserBalance } from '../../bitbadges-api/types';
import { BadgePageHeader } from '../../components/collection-page/BadgePageHeader';
import { ActionsTab } from '../../components/collection-page/ActionsTab';
import { ActivityTab } from '../../components/collection-page/ActivityTab';
import { BadgesTab } from '../../components/collection-page/BadgesTab';
import { ClaimsTab } from '../../components/collection-page/ClaimsTab';
import { OverviewTab } from '../../components/collection-page/OverviewTab';
import { Tabs } from '../../components/navigation/Tabs';
import { DEV_MODE, PRIMARY_BLUE, PRIMARY_TEXT, SECONDARY_BLUE } from '../../constants';
import { useChainContext } from '../../contexts/ChainContext';
import { useCollectionsContext } from '../../contexts/CollectionsContext';

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
    const accountNumber = chain.accountNumber;
    const collectionIdNumber = collectionId ? Number(collectionId) : -1;

    const collection = collections.collections[`${collectionIdNumber}`];
    const collectionMetadata = collection?.collectionMetadata;

    const [badgeIdNumber, setBadgeIdNumber] = useState<number>(Number(badgeId));
    const [userBalance, setUserBalance] = useState<UserBalance>();
    const [tab, setTab] = useState(badgeIdNumber ? 'badges' : 'overview');

    async function refreshBadgeBalance() {
        const res = await getBadgeBalance(collectionIdNumber, accountNumber);
        setUserBalance(res.balance);
    }

    //Get collection information
    useEffect(() => {
        collections.fetchCollections([collectionIdNumber]);
    }, [collectionIdNumber, collections]);

    //Set tab to badges if badgeId is in query
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

                            refreshUserBalance={refreshBadgeBalance}
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
                            refreshUserBalance={refreshBadgeBalance}
                        />
                    )}

                    {tab === 'actions' && (
                        <ActionsTab
                            collection={collection}
                            refreshUserBalance={refreshBadgeBalance}
                            userBalance={userBalance}
                        />
                    )}

                    {tab === 'activity' && collection && (
                        <ActivityTab
                            collection={collection}
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
