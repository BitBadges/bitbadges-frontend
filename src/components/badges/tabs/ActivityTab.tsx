import { Collapse, Divider, Empty } from 'antd';
import CollapsePanel from 'antd/lib/collapse/CollapsePanel';
import { useEffect, useState } from 'react';
import { getAccountInformationByAccountNumber } from '../../../bitbadges-api/api';
import { filterBadgeActivityForBadgeId } from '../../../bitbadges-api/badges';
import { ActivityItem, BitBadgeCollection, BitBadgesUserInfo, SupportedChain } from '../../../bitbadges-api/types';
import { convertToBitBadgesUserInfo } from '../../../bitbadges-api/users';
import { DEV_MODE, PRIMARY_BLUE, PRIMARY_TEXT } from '../../../constants';
import { AddressDisplay } from '../../address/AddressDisplay';
import { TransferDisplay } from '../../common/TransferDisplay';



export function ActivityTab({ collection, badgeId }: {
    collection: BitBadgeCollection | undefined;
    badgeId?: number
}) {
    const [users, setUsers] = useState<Map<string, BitBadgesUserInfo>>(new Map());

    let activity: ActivityItem[];
    //If we are showing a badge's activity, filter the activity to only show that badge's activity
    if (badgeId && collection) {
        activity = filterBadgeActivityForBadgeId(badgeId, collection?.activity);
    } else if (collection) {
        activity = collection.activity;
    } else {
        activity = [];
    }

    //TODO: this needs to be more efficient; need to update on map change; and need to cache the user info
    useEffect(() => {
        async function getActivity() {
            if (!activity) return;
            const currUserMap = new Map();
            //Set the mint user
            currUserMap.set("Mint",
                {
                    accountNumber: -1,
                    address: "Mint",
                    cosmosAddress: "Mint",
                    chain: SupportedChain.COSMOS
                }
            );

            for (const activityItem of activity) {
                for (const from of activityItem.from) {
                    if (!currUserMap.has(from)) {
                        const userInfo = await getAccountInformationByAccountNumber(Number(from));
                        currUserMap.set(from, convertToBitBadgesUserInfo(userInfo));
                    }
                }

                for (const to of activityItem.to) {
                    if (!currUserMap.has(to)) {
                        const userInfo = await getAccountInformationByAccountNumber(Number(to));
                        currUserMap.set(to, convertToBitBadgesUserInfo(userInfo));
                    }
                }
            }
            setUsers(currUserMap);
        }
        getActivity();
    }, [activity]);

    if (!activity) return <></>

    if (activity.length === 0) {
        return <Empty
            style={{ color: PRIMARY_TEXT, backgroundColor: PRIMARY_BLUE, width: '100%' }}
            description="No activity yet." image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
    }

    return (
        <div>
            <div
                style={{
                    color: PRIMARY_TEXT,
                    justifyContent: 'center',
                    alignItems: 'center',
                    display: 'flex'
                }}>

                <Collapse style={{ color: PRIMARY_TEXT, backgroundColor: PRIMARY_BLUE, width: '100%' }}>
                    {activity.map((activity, idx) => {
                        return <CollapsePanel
                            key={idx}
                            header={<div style={{ color: PRIMARY_TEXT, textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} >
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                                        {activity.from.map((x, i) => <AddressDisplay key={i} fontColor={PRIMARY_TEXT}
                                            userInfo={users.get(x) || { accountNumber: -1, address: '', cosmosAddress: '', chain: SupportedChain.COSMOS }}
                                        />)}
                                    </div>
                                    <b style={{ marginRight: 8 }}>to</b>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                                        {activity.to.map((x, i) => <AddressDisplay key={i} fontColor={PRIMARY_TEXT}
                                            userInfo={users.get(x) || { accountNumber: -1, address: '', cosmosAddress: '', chain: SupportedChain.COSMOS }}
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

                                <div key={idx} style={{ color: PRIMARY_TEXT, maxWidth: 800 }}>
                                    {activity.balances.map((balance, idx) => {
                                        return <>
                                            <h2>Transaction Type: {activity.method}</h2>
                                            <TransferDisplay
                                                fontColor={PRIMARY_TEXT}
                                                key={idx}
                                                collection={collection}
                                                from={activity.from.map((from) => {
                                                    return users.get(from) || {
                                                        accountNumber: -1,
                                                        address: '',
                                                        cosmosAddress: '',
                                                        chain: SupportedChain.COSMOS,
                                                    }
                                                })}
                                                to={activity.to.map((to) => {
                                                    return users.get(to) || {
                                                        accountNumber: -1,
                                                        address: '',
                                                        cosmosAddress: '',
                                                        chain: SupportedChain.COSMOS,
                                                    }
                                                })}
                                                amount={balance.balance}
                                                badgeIds={balance.badgeIds}
                                            />
                                            <Divider />
                                        </>
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
