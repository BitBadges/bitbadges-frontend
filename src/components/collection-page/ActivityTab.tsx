import { Collapse, Divider, Empty, Pagination } from 'antd';
import CollapsePanel from 'antd/lib/collapse/CollapsePanel';
import { useEffect, useState } from 'react';
import { useAccountsContext } from '../../contexts/AccountsContext';
import { filterBadgeActivityForBadgeId } from '../../bitbadges-api/badges';
import { ActivityItem, BitBadgeCollection, SupportedChain } from '../../bitbadges-api/types';
import { DEV_MODE, PRIMARY_BLUE, PRIMARY_TEXT } from '../../constants';
import { AddressDisplay } from '../address/AddressDisplay';
import { TransferDisplay } from '../transfers/TransferDisplay';



export function ActivityTab({ collection, badgeId }: {
    collection: BitBadgeCollection;
    badgeId?: number
}) {
    const accounts = useAccountsContext();
    const [currPage, setCurrPage] = useState<number>(1);



    let activity: ActivityItem[];
    //If we are showing a badge's activity, filter the activity to only show that badge's activity
    if (badgeId && collection) {
        activity = filterBadgeActivityForBadgeId(badgeId, collection?.activity);
    } else if (collection) {
        activity = collection.activity;
    } else {
        activity = [];
    }

    const PAGE_SIZE = 25;
    const startId = 0;
    const endId = activity.length ? activity.length - 1 : 0;
    const startIdNum = (currPage - 1) * PAGE_SIZE + startId;
    const endIdNum = endId < startIdNum + PAGE_SIZE - 1 ? endId : startIdNum + PAGE_SIZE - 1;

    useEffect(() => {
        async function getActivity() {
            if (!activity) return;

            const accountsToFetch = [];
            for (const activityItem of activity) {
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
    }, [activity, accounts]);

    if (!activity) return <></>

    if (activity.length === 0) {
        return <Empty
            style={{ color: PRIMARY_TEXT, backgroundColor: PRIMARY_BLUE, width: '100%' }}
            description="No activity yet." image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
    }

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



                <Collapse style={{ color: PRIMARY_TEXT, backgroundColor: PRIMARY_BLUE, width: '100%' }}>
                    {activity.map((activity, idx) => {
                        if (!(idx >= startIdNum && idx <= endIdNum)) return <></>;
                        return <CollapsePanel
                            key={idx}
                            header={<div style={{ color: PRIMARY_TEXT, textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} >
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                                        {activity.from.map((x, i) => <AddressDisplay key={i} fontColor={PRIMARY_TEXT}
                                            userInfo={accounts.accounts[x] || { accountNumber: -1, address: '', cosmosAddress: '', chain: SupportedChain.COSMOS }}
                                        />)}
                                    </div>
                                    <b style={{ marginRight: 8 }}>to</b>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                                        {activity.to.map((x, i) => <AddressDisplay key={i} fontColor={PRIMARY_TEXT}
                                            userInfo={accounts.accounts[x] || { accountNumber: -1, address: '', cosmosAddress: '', chain: SupportedChain.COSMOS }}
                                        />)}
                                    </div>
                                </div>

                                <div>{activity.method}</div>
                            </div>}
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
                                    {activity.balances.map((balance, idx) => {
                                        return <div key={idx} style={{ width: 600 }}>
                                            <h2>Transaction Type: {activity.method}</h2>
                                            <TransferDisplay
                                                fontColor={PRIMARY_TEXT}
                                                key={idx}
                                                collection={collection}
                                                from={activity.from.map((from) => {
                                                    return accounts.accounts[accounts.cosmosAddressesByAccountNumbers[from]] || {
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
                                                            return accounts.accounts[accounts.cosmosAddressesByAccountNumbers[to]] || {
                                                                accountNumber: -1,
                                                                address: '',
                                                                cosmosAddress: '',
                                                                chain: SupportedChain.COSMOS,
                                                            }
                                                        }),
                                                        balances: [{
                                                            balance: balance.balance,
                                                            badgeIds: balance.badgeIds
                                                        }]
                                                    }

                                                ]}
                                                setTransfers={() => { }}
                                            />
                                            <Divider />
                                        </div>
                                    })}
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
