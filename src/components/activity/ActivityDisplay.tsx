import { Collapse, Divider, Empty, Spin, Typography } from 'antd';
import CollapsePanel from 'antd/lib/collapse/CollapsePanel';
import { BitBadgeCollection, SupportedChain, TransferActivityItem, filterBadgeActivityForBadgeId } from 'bitbadges-sdk';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { DEV_MODE, PRIMARY_BLUE, PRIMARY_TEXT } from '../../constants';
import { useAccountsContext } from '../../contexts/AccountsContext';
import { useCollectionsContext } from '../../contexts/CollectionsContext';
import { AddressDisplay } from '../address/AddressDisplay';
import { TransferDisplay } from '../transfers/TransferDisplay';

enum ActivityType {
    Collection,
    Badge,
    User,
}

export function ActivityTab({ collection, badgeId, userActivity, fetchMore, hasMore }: {
    collection: BitBadgeCollection;
    badgeId?: number
    userActivity?: TransferActivityItem[],
    fetchMore: () => void,
    hasMore: boolean
}) {
    const accounts = useAccountsContext();
    const router = useRouter();
    const collections = useCollectionsContext();

    //We have three categories of activity that we can display, dependent on the props
    //1. User activity (spanning multiple collections (will specify collectionId))
    //2. Activity for a specific badge (one collection and filtered by a specific badgeId)
    //3. Activity for a collection (all badges in the collection)
    let activityType = ActivityType.User;
    let activity: (TransferActivityItem)[];
    if (userActivity) {
        activity = userActivity;
    } else {
        //If we are showing a badge's activity, filter the activity to only show that badge's activity
        if (badgeId && collection) {
            activityType = ActivityType.Badge;
            activity = filterBadgeActivityForBadgeId(badgeId, collection?.activity);
        } else if (collection) {
            activityType = ActivityType.Collection;
            activity = collection.activity;
        } else {
            activity = [];
        }
    }

    useEffect(() => {
        async function getActivity() {
            if (!activity) return;

            let accountsToFetch: number[] = [];
            let collectionsToFetch: number[] = [];
            for (let i = 0; i <= activity.length; i++) {
                const activityItem = activity[i];
                if (!activityItem) continue;

                collectionsToFetch.push(activityItem.collectionId);

                for (const from of activityItem.from) {
                    if (from === 'Mint') continue;
                    accountsToFetch.push(Number(from));
                }

                for (const to of activityItem.to) {
                    accountsToFetch.push(Number(to));
                }
                accountsToFetch = [...new Set(accountsToFetch)];
                collectionsToFetch = [...new Set(collectionsToFetch)];
            }

            console.log("TESTING FOR INFINITE FETCH", accountsToFetch);
            if (accountsToFetch.length > 0) await accounts.fetchAccountsByNumber(accountsToFetch);
            if (collectionsToFetch.length > 0) await collections.fetchCollections(collectionsToFetch);
        }
        getActivity();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activity]);

    if (!activity) return <></>





    return (
        <div>
            <div
                style={{
                    color: PRIMARY_TEXT,
                    justifyContent: 'center',
                    alignItems: 'center',
                    display: 'flex'
                }}>


                <InfiniteScroll
                    dataLength={activity.length}
                    next={fetchMore}
                    hasMore={hasMore}
                    loader={<div>
                        <br />
                        <Spin size={'large'} />
                    </div>}
                    scrollThreshold={"300px"}
                    endMessage={
                        <></>
                    }
                    initialScrollY={0}
                    style={{ width: '100%', overflow: 'hidden' }}
                >
                    {activity.length === 0 && !hasMore && <Empty
                        style={{ color: PRIMARY_TEXT, backgroundColor: PRIMARY_BLUE, width: '100%' }}
                        description="No activity." image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />}
                    {activity.length > 0 && <Collapse style={{ color: PRIMARY_TEXT, backgroundColor: PRIMARY_BLUE, width: '100%', alignItems: 'center' }}
                        expandIconPosition='start'
                    >

                        {activity.map((activity, idx) => {
                            const collectionId = activityType === ActivityType.User && activity.collectionId ? activity.collectionId : collection.collectionId
                            const collectionToShow = activityType === ActivityType.User ? collections.collections[collectionId]?.collection : collection;

                            // if (!(idx >= currPageStart && idx <= currPageEnd)) return <></>;
                            return <CollapsePanel
                                key={idx}
                                header={
                                    <div style={{ color: PRIMARY_TEXT, textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} >
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                                                {activity.from.length > 1 ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', fontSize: 20 }}>
                                                    <Typography.Text strong style={{ color: PRIMARY_TEXT, fontSize: 20 }}>{activity.from.length} Addresses</Typography.Text>
                                                </div>
                                                    : <>
                                                        {activity.from.map((x, i) => <AddressDisplay key={i} fontColor={PRIMARY_TEXT}
                                                            userInfo={accounts.accounts[accounts.cosmosAddressesByAccountNumbers[x]] || { accountNumber: -1, address: '', cosmosAddress: '', chain: SupportedChain.COSMOS }}
                                                        />)}
                                                    </>}
                                            </div>
                                            <b style={{ marginRight: 8 }}>to</b>
                                            <div style={{ flexDirection: 'column' }}>
                                                {activity.to.length > 1 ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', fontSize: 20 }}>
                                                    <Typography.Text strong style={{ color: PRIMARY_TEXT, fontSize: 20 }}>{activity.to.length} Addresses</Typography.Text>
                                                </div>
                                                    : <>
                                                        {activity.to.map((x, i) => <AddressDisplay key={i} fontColor={PRIMARY_TEXT}
                                                            userInfo={accounts.accounts[accounts.cosmosAddressesByAccountNumbers[x]] || { accountNumber: -1, address: '', cosmosAddress: '', chain: SupportedChain.COSMOS }}
                                                        />)}
                                                    </>}
                                            </div>
                                        </div>

                                        <div>{activity.method} ({new Date(activity.timestamp).toLocaleDateString()} {new Date(activity.timestamp).toLocaleTimeString()})</div>
                                    </div>
                                }
                                style={{
                                    width: '100%',
                                }}
                            >
                                {collectionToShow && <div style={{ width: '100%' }}>
                                    <br />
                                    <div
                                        style={{
                                            color: PRIMARY_TEXT,
                                            justifyContent: 'center',
                                            display: 'flex'
                                        }}>

                                        <div key={idx} style={{ color: PRIMARY_TEXT }}>

                                            <div style={{ width: 700 }}>
                                                <h2 style={{ color: PRIMARY_TEXT }}>Transaction Type: {activity.method}</h2>
                                                {activity.collectionId && collection && <div
                                                    style={{
                                                        fontSize: 14,
                                                        color: PRIMARY_TEXT,
                                                        fontWeight: 'bolder',
                                                        whiteSpace: 'normal'
                                                    }}
                                                    onClick={(e) => {
                                                        router.push(`/collections/${activity.collectionId}`);
                                                        e.stopPropagation();
                                                    }}
                                                >
                                                    <a>
                                                        {collections.collections[`${activity.collectionId}`]?.collection.collectionMetadata.name}
                                                    </a>
                                                </div>}

                                                <TransferDisplay
                                                    fontColor={PRIMARY_TEXT}
                                                    key={idx}
                                                    collection={collectionToShow}
                                                    from={activity.from.map((from) => {
                                                        // console.log(accounts.accounts[accounts.cosmosAddressesByAccountNumbers[from]])
                                                        return accounts.cosmosAddressesByAccountNumbers[from] && accounts.accounts[accounts.cosmosAddressesByAccountNumbers[from]]
                                                            ? accounts.accounts[accounts.cosmosAddressesByAccountNumbers[from]] : {
                                                                accountNumber: -1,
                                                                address: '',
                                                                cosmosAddress: '',
                                                                chain: SupportedChain.COSMOS,
                                                            }
                                                    })}
                                                    transfers={[
                                                        {
                                                            toAddresses: activity.to.map((x) => Number(x)),
                                                            toAddressInfo: activity.to.map((to) => {
                                                                // console.log(accounts.accounts[accounts.cosmosAddressesByAccountNumbers[to]])
                                                                return accounts.cosmosAddressesByAccountNumbers[to] && accounts.accounts[accounts.cosmosAddressesByAccountNumbers[to]] ?
                                                                    accounts.accounts[accounts.cosmosAddressesByAccountNumbers[to]] : {
                                                                        accountNumber: -1,
                                                                        address: '',
                                                                        cosmosAddress: '',
                                                                        chain: SupportedChain.COSMOS,
                                                                    }
                                                            }),
                                                            balances: activity.balances
                                                        }

                                                    ]}
                                                    setTransfers={() => { }}
                                                />
                                                <Divider />
                                            </div>
                                        </div>
                                    </div>
                                </div>}
                            </CollapsePanel>
                        })}
                    </Collapse>}
                </InfiniteScroll>
            </div>


            {
                DEV_MODE &&
                <pre style={{ marginTop: '10px', borderTop: '3px dashed white', color: PRIMARY_TEXT, alignContent: 'left', width: '100%', textAlign: 'left' }}>
                    {JSON.stringify(collection, null, 2)}
                </pre>
            }
        </div>
    );
}
