import { Balance, BitBadgeCollection, BitBadgesUserInfo, SupportedChain } from '../../../bitbadges-api/types';
import { DEV_MODE, PRIMARY_TEXT } from '../../../constants';
import { useEffect, useState } from 'react';
import { getBadgeOwners } from '../../../bitbadges-api/api';
import { AddressDisplay } from '../../address/AddressDisplay';
import { InformationDisplayCard } from '../../common/InformationDisplayCard';
import { Empty } from 'antd';

export function OwnersTab({ badgeCollection, badgeId }: {
    badgeCollection: BitBadgeCollection | undefined;
    badgeId: number
}) {
    const [badgeOwners, setBadgeOwners] = useState<BitBadgesUserInfo[]>([]);
    const [balances, setBalances] = useState<any>({});

    useEffect(() => {
        async function getOwners() {
            if (badgeCollection) {
                console.log("CALLING");
                const ownersRes = await getBadgeOwners(badgeCollection?.collectionId, badgeId)
                const badgeOwners = ownersRes.owners.map((x) => {
                    return {
                        accountNumber: x.account_number,
                        address: x.address,
                        cosmosAddress: x.address,
                        chain: SupportedChain.COSMOS
                    }
                })
                setBadgeOwners(badgeOwners);
                setBalances(ownersRes.balances);
            }
        }
        getOwners();
    }, []);

    return (

        <div >
            <div style={{
                color: PRIMARY_TEXT,
                justifyContent: 'center',
                alignItems: 'center',
                display: 'flex',
            }}>
                <div style={{ width: 600 }}>
                    <InformationDisplayCard
                        title="Owners"
                    >
                        <div
                            style={{
                                color: PRIMARY_TEXT,
                                justifyContent: 'center',
                                alignItems: 'center',
                                display: 'flex'
                            }}>
                            {badgeOwners?.map((owner, idx) => {
                                return <div key={idx} className='flex-between' style={{ color: PRIMARY_TEXT, width: '100%', display: 'flex', justifyContent: 'space-between', margin: 10 }}>
                                    <div>
                                        <AddressDisplay
                                            userInfo={owner}
                                            fontColor={PRIMARY_TEXT} />
                                    </div>
                                    <div>
                                        x{balances[owner.accountNumber].balances.find((x: Balance) => {
                                            return x.badgeIds.find((y) => {
                                                return y.start <= badgeId && y.end >= badgeId;
                                            })
                                        }).balance}
                                    </div>
                                </div>
                            })}
                            {badgeOwners.length === 0 && <Empty
                                description="No owners found for this badge."
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                style={{ color: PRIMARY_TEXT }}
                            />}
                        </div>

                    </InformationDisplayCard>
                </div>
            </div>


            {
                DEV_MODE &&
                <pre style={{ marginTop: '10px', borderTop: '3px dashed white', color: PRIMARY_TEXT, alignContent: 'left', width: '100%', textAlign: 'left' }}>
                    {JSON.stringify(badgeOwners, null, 2)}
                </pre>
            }
        </div >
    );
}
