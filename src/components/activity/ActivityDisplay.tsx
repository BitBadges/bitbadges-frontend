import { Collapse, Divider, Empty, Pagination } from 'antd';
import CollapsePanel from 'antd/lib/collapse/CollapsePanel';
import { useEffect, useState } from 'react';
import { filterBadgeActivityForBadgeId } from '../../bitbadges-api/badges';
import { ActivityItem, BitBadgeCollection, SupportedChain } from '../../bitbadges-api/types';
import { DEV_MODE, PRIMARY_BLUE, PRIMARY_TEXT } from '../../constants';
import { useAccountsContext } from '../../contexts/AccountsContext';
import { AddressDisplay } from '../address/AddressDisplay';
import { TransferDisplay } from '../transfers/TransferDisplay';
import { useCollectionsContext } from '../../contexts/CollectionsContext';
import { getPageDetails } from '../../utils/pagination';

enum ActivityType {
    Collection,
    Badge,
    User,
}

export function ActivityTab({ collection, badgeId, userActivity }: {
    collection: BitBadgeCollection;
    badgeId?: number
    userActivity?: (ActivityItem & { collectionId?: number })[]
}) {
    const accounts = useAccountsContext();
    const collections = useCollectionsContext();
    const [currPage, setCurrPage] = useState<number>(1);

    //We have three categories of activity that we can display, dependent on the props
    //1. User activity (spanning multiple collections (will specify collectionId))
    //2. Activity for a specific badge (one collection and filtered by a specific badgeId)
    //3. Activity for a collection (all badges in the collection)
    let activityType = ActivityType.User;
    let activity: (ActivityItem & { collectionId?: number })[];
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

            const accountsToFetch = [];
            for (let i = currPageStart; i <= currPageEnd; i++) {
                const activityItem = activity[i];
                if (!activityItem) continue;

                for (const from of activityItem.from) {
                    if (from === 'Mint') continue;
                    accountsToFetch.push(Number(from));
                }

                for (const to of activityItem.to) {
                    accountsToFetch.push(Number(to));
                }
            }

            await accounts.fetchAccountsByNumber(accountsToFetch);
        }
        getActivity();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activity, currPage]);

    if (!activity) return <></>

    if (activity.length === 0) {
        return <Empty
            style={{ color: PRIMARY_TEXT, backgroundColor: PRIMARY_BLUE, width: '100%' }}
            description="No activity." image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
    }

    const PAGE_SIZE = 25;
    const minId = 0;
    const maxId = activity.length ? activity.length - 1 : 0;

    const currPageDetails = getPageDetails(currPage, PAGE_SIZE, minId, maxId);
    const currPageStart = currPageDetails.start;
    const currPageEnd = currPageDetails.end;

    return (
        <div>
            <div style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
            }} >
                <Pagination
                    style={{ background: PRIMARY_BLUE, color: PRIMARY_TEXT }}
                    current={currPage}
                    total={activity.length}
                    pageSize={PAGE_SIZE}
                    onChange={(page) => {
                        setCurrPage(page);
                    }}
                    hideOnSinglePage
                    showSizeChanger={false}
                />
            </div>
            <br />
            <div
                style={{
                    color: PRIMARY_TEXT,
                    justifyContent: 'center',
                    alignItems: 'center',
                    display: 'flex'
                }}>

                <Collapse style={{ color: PRIMARY_TEXT, backgroundColor: PRIMARY_BLUE, width: '100%', alignItems: 'center' }}
                    expandIconPosition='start'
                >
                    {activity.map((activity, idx) => {
                        const collectionId = activityType === ActivityType.User && activity.collectionId ? activity.collectionId : collection.collectionId;
                        const collectionToShow = activityType === ActivityType.User ? collections.collections[collectionId] : collection;
                        if (!collectionToShow) return <></>;

                        if (!(idx >= currPageStart && idx <= currPageEnd)) return <></>;
                        return <CollapsePanel
                            key={idx}
                            header={
                                <div style={{ color: PRIMARY_TEXT, textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} >
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                                            {activity.from.map((x, i) => <AddressDisplay key={i} fontColor={PRIMARY_TEXT}
                                                userInfo={accounts.accounts[accounts.cosmosAddressesByAccountNumbers[x]] || { accountNumber: -1, address: '', cosmosAddress: '', chain: SupportedChain.COSMOS }}
                                            />)}
                                        </div>
                                        <b style={{ marginRight: 8 }}>to</b>
                                        <div style={{ flexDirection: 'column' }}>
                                            {activity.to.map((x, i) => <AddressDisplay key={i} fontColor={PRIMARY_TEXT}
                                                userInfo={accounts.accounts[accounts.cosmosAddressesByAccountNumbers[x]] || { accountNumber: -1, address: '', cosmosAddress: '', chain: SupportedChain.COSMOS }}
                                            />)}
                                        </div>
                                    </div>

                                    <div>{activity.method}</div>
                                </div>
                            }
                            style={{
                                width: '100%',
                            }}
                        >
                            <br />
                            <div
                                style={{
                                    color: PRIMARY_TEXT,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    display: 'flex'
                                }}>

                                <div key={idx} style={{ color: PRIMARY_TEXT }}>

                                    <div style={{ width: 600 }}>
                                        <h2 style={{ color: PRIMARY_TEXT }}>Transaction Type: {activity.method}</h2>
                                        <TransferDisplay
                                            fontColor={PRIMARY_TEXT}
                                            key={idx}
                                            collection={collectionToShow}
                                            from={activity.from.map((from) => {
                                                console.log(accounts.accounts[accounts.cosmosAddressesByAccountNumbers[from]])
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
                                                        console.log(accounts.accounts[accounts.cosmosAddressesByAccountNumbers[to]])
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
                        </CollapsePanel>
                    })}
                </Collapse>
            </div>


            {
                DEV_MODE &&
                <pre style={{ marginTop: '10px', borderTop: '3px dashed white', color: PRIMARY_TEXT, alignContent: 'left', width: '100%', textAlign: 'left' }}>
                    {JSON.stringify(collection, null, 2)}
                </pre>
            }
        </div >
    );
}
