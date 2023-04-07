import { Divider, Empty, Layout } from 'antd';
import { BitBadgeCollection, UserBalance } from 'bitbadges-sdk';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { getBadgeBalance } from '../../bitbadges-api/api';
import { ActivityTab } from '../../components/activity/ActivityDisplay';
import { CollectionHeader } from '../../components/badges/CollectionHeader';
import { BadgeButtonDisplay } from '../../components/button-displays/BadgePageButtonDisplay';
import { ActionsTab } from '../../components/collection-page/ActionsTab';
import { AnnouncementsTab } from '../../components/collection-page/AnnouncementsTab';
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
    { key: 'announcements', content: 'Announcements', disabled: false },
    { key: 'badges', content: 'Badges', disabled: false },
    { key: 'claims', content: 'Claims', disabled: false },
    { key: 'activity', content: 'Activity', disabled: false },
    { key: 'actions', content: 'Actions', disabled: false },
];

function CollectionPage({
    collectionPreview, //Only used for previews on TxTimeline
    // updateMetadataForBadgeIdsDirectlyFromUriIfAbsent
}
    : {
        collectionPreview: BitBadgeCollection
        // updateMetadataForBadgeIdsDirectlyFromUriIfAbsent?: (badgeIds: number[]) => void;
    }
) {
    const router = useRouter()
    const chain = useChainContext();
    const collections = useCollectionsContext();
    const { collectionId, badgeId, password, code, claimsTab } = router.query;

    const accountNumber = chain.accountNumber;
    const isPreview = collectionPreview ? true : false;

    const collectionIdNumber = collectionId && !isPreview ? Number(collectionId) : -1;



    const [collection, setCollection] = useState<BitBadgeCollection | undefined>(isPreview ? collectionPreview : collections.collections[`${collectionIdNumber}`]?.collection);
    const [badgeIdNumber, setBadgeIdNumber] = useState<number>(Number(badgeId));
    const [userBalance, setUserBalance] = useState<UserBalance>();
    const [tab, setTab] = useState(badgeIdNumber ? 'badges' : (password || code || claimsTab) ? 'claims' : 'overview');

    const collectionMetadata = collection?.collectionMetadata;



    async function refreshBadgeBalance() {
        if (isPreview) return;
        const res = await getBadgeBalance(collectionIdNumber, accountNumber);
        setUserBalance(res.balance);
    }

    useEffect(() => {
        setCollection(isPreview ? collectionPreview : collections.collections[`${collectionIdNumber}`]?.collection);
    }, [isPreview, collectionPreview, collections, collectionIdNumber]);

    //Get collection information
    useEffect(() => {
        async function fetchCollections() {
            if (collectionIdNumber > 0) {
                await collections.fetchCollections([collectionIdNumber]);
            }
        }
        if (isPreview) return;
        fetchCollections();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [collectionIdNumber]);

    //Set tab to badges if badgeId is in query
    useEffect(() => {
        const badgeIdNum = Number(badgeId);
        if (!isNaN(badgeIdNum)) {
            setTab('badges');
            setBadgeIdNumber(badgeIdNum);
        }
    }, [badgeId])

    //Set tab to badges if badgeId is in query
    useEffect(() => {
        if (code || password || claimsTab) setTab('claims');
    }, [code, password, claimsTab])


    // Get user's badge balance
    useEffect(() => {
        if (isPreview) return;
        async function getBadgeBalanceFromApi() {
            if (collectionIdNumber > 0 && accountNumber > 0) {
                const res = await getBadgeBalance(collectionIdNumber, accountNumber);
                setUserBalance(res.balance);
            }
        }
        getBadgeBalanceFromApi();
    }, [collectionIdNumber, accountNumber, isPreview])

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
                        marginLeft: !isPreview ? '7vw' : undefined,
                        marginRight: !isPreview ? '7vw' : undefined,
                        paddingLeft: !isPreview ? '1vw' : undefined,
                        paddingRight: !isPreview ? '1vw' : undefined,
                        paddingTop: '20px',
                        background: PRIMARY_BLUE,
                    }}
                >
                    {collection && <>
                        <BadgeButtonDisplay website={collectionMetadata?.externalUrl} />
                        {/* Overview and Tabs */}
                        <CollectionHeader metadata={collectionMetadata} />
                        <Tabs tabInfo={tabInfo} tab={tab} setTab={setTab} theme="dark" fullWidth />
                        <br />

                        {/* Tab Content */}
                        {tab === 'overview' && (
                            <OverviewTab
                                setTab={setTab}
                                collection={collection}
                                refreshUserBalance={refreshBadgeBalance}
                                userBalance={userBalance}
                                isPreview={isPreview}
                            />
                        )}
                        {tab === 'badges' && (
                            <BadgesTab
                                collection={collection}
                            />
                        )}

                        {isPreview && (tab === 'claims' || tab === 'actions' || tab === 'activity' || tab === 'announcements') && <Empty
                            style={{ color: PRIMARY_TEXT }}
                            description={
                                "This tab is not supported for previews."
                            }
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />}

                        {tab === 'claims' && !isPreview && (
                            <ClaimsTab
                                collection={collection}
                                refreshUserBalance={refreshBadgeBalance}
                                isPreview={isPreview}
                            />
                        )}

                        {tab === 'actions' && !isPreview && (
                            <ActionsTab
                                collection={collection}
                                refreshUserBalance={refreshBadgeBalance}
                                userBalance={userBalance}
                            />
                        )}

                        {tab === 'activity' && !isPreview && collection && (
                            <ActivityTab
                                collection={collection}
                                fetchMore={async () => {
                                    await collections.fetchNextActivity(collection.collectionId);
                                }}
                                hasMore={collections.collections[`${collection.collectionId}`]?.pagination.activity.hasMore || false}
                            />
                        )}

                        {tab === 'announcements' && !isPreview && collection && (
                            <>
                                <AnnouncementsTab announcements={collection.announcements} collection={collection}
                                    fetchMore={async () => {
                                        await collections.fetchNextActivity(collection.collectionId);
                                    }}
                                    hasMore={collections.collections[`${collection.collectionId}`]?.pagination.announcements.hasMore || false}
                                />
                            </>
                        )}
                    </>
                    }
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
