import { Divider, Layout } from 'antd';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { getBadgeBalance } from '../../bitbadges-api/api';
import { BitBadgeCollection, UserBalance } from '../../bitbadges-api/types';
import { ActionsTab } from '../../components/collection-page/ActionsTab';
import { ActivityTab } from '../../components/activity/ActivityDisplay';
import { CollectionHeader } from '../../components/badges/CollectionHeader';
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
    const { collectionId, badgeId, password, code } = router.query;

    const accountNumber = chain.accountNumber;
    const isPreview = collectionPreview ? true : false;

    const collectionIdNumber = collectionId && !isPreview ? Number(collectionId) : -1;

    const collection = isPreview ? collectionPreview : collections.collections[`${collectionIdNumber}`];
    const collectionMetadata = collection?.collectionMetadata;

    const [badgeIdNumber, setBadgeIdNumber] = useState<number>(Number(badgeId));
    const [userBalance, setUserBalance] = useState<UserBalance>();
    const [tab, setTab] = useState(badgeIdNumber ? 'badges' : (password || code) ? 'claims' : 'overview');

    async function refreshBadgeBalance() {
        if (isPreview) return;
        const res = await getBadgeBalance(collectionIdNumber, accountNumber);
        setUserBalance(res.balance);
    }

    //Get collection information
    useEffect(() => {
        if (isPreview) return;
        if (collectionIdNumber > 0) {
            collections.fetchCollections([collectionIdNumber]);
        }
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
        if (code || password) setTab('claims');
    }, [code, password])


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
                        marginLeft: !isPreview ? '10vw' : undefined,
                        marginRight: !isPreview ? '10vw' : undefined,
                        paddingLeft: !isPreview ? '2vw' : undefined,
                        paddingRight: !isPreview ? '2vw' : undefined,
                        paddingTop: '20px',
                        background: PRIMARY_BLUE,
                    }}
                >
                    {collection && <>
                        {/* Overview and Tabs */}
                        <CollectionHeader metadata={collectionMetadata} />
                        <Tabs tabInfo={tabInfo} tab={tab} setTab={setTab} theme="dark" fullWidth />
                        <br />

                        {/* Tab Content */}
                        {tab === 'overview' && (
                            <OverviewTab setTab={setTab}
                                collection={collection}
                                refreshUserBalance={refreshBadgeBalance}
                                userBalance={userBalance}
                                isPreview={isPreview}
                            />
                        )}
                        {tab === 'badges' && (
                            <BadgesTab
                                collection={collection}
                                balance={userBalance}
                                badgeId={badgeIdNumber}
                                setBadgeId={setBadgeIdNumber}
                                isPreview={isPreview}
                            />
                        )}

                        {tab === 'claims' && (
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

                        {tab === 'activity' && collection && (
                            <ActivityTab
                                collection={collection}
                            />
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
