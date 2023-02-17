import { Collapse, Divider, Empty } from 'antd';
import CollapsePanel from 'antd/lib/collapse/CollapsePanel';
import { useEffect, useState } from 'react';
import { getAccountInformationByAccountNumber } from '../../../bitbadges-api/api';
import { BitBadgeCollection, BitBadgesUserInfo, SupportedChain } from '../../../bitbadges-api/types';
import { DEV_MODE, PRIMARY_BLUE, PRIMARY_TEXT } from '../../../constants';
import { AddressDisplay } from '../../address/AddressDisplay';
import { TransferDisplay } from '../../common/TransferDisplay';

export function ActivityTab({ badgeCollection }: {
    badgeCollection: BitBadgeCollection | undefined;
}) {
    const [users, setUsers] = useState<Map<string, BitBadgesUserInfo>>(new Map());
    const [updated, setUpdated] = useState<boolean>(false);
    const [currPage, setCurrPage] = useState<number>(1);

    let activity = badgeCollection?.activity;



    useEffect(() => {
        async function getActivity() {
            if (!activity) return;
            const currUserMap = users;
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
                        if (userInfo) {
                            console.log(userInfo.chain);
                            currUserMap.set(from, {
                                accountNumber: userInfo.account_number,
                                address: userInfo.address,
                                cosmosAddress: userInfo.cosmosAddress,
                                chain: userInfo.chain,
                            });
                        }
                    }
                }
                for (const to of activityItem.to) {
                    if (!currUserMap.has(to)) {
                        const userInfo = await getAccountInformationByAccountNumber(Number(to));
                        if (userInfo) {

                            currUserMap.set(to, {
                                accountNumber: userInfo.account_number,
                                address: userInfo.address,
                                cosmosAddress: userInfo.cosmosAddress,
                                chain: userInfo.chain,
                            });
                        }
                    }
                }
            }
            setUsers(currUserMap);
            setUpdated(!updated);
        }
        getActivity();
    }, [activity, users, updated]);

    if (!activity) return <></>

    if (activity.length === 0) {
        return <Empty
            style={{ color: PRIMARY_TEXT, backgroundColor: PRIMARY_BLUE, width: '100%' }}
            description="No activity yet." image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
    }

    return (
        <div>
            {/* <h2>Activity</h2> */}
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
                                                badge={badgeCollection}
                                                // setBadgeCollection={setBadgeCollection}
                                                setBadgeCollection={() => { }}
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
                    {JSON.stringify(badgeCollection, null, 2)}
                </pre>
            }
        </div >
    );
}
