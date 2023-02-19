import { Empty } from 'antd';
import { useEffect, useState } from 'react';
import { getBadgeOwners } from '../../../bitbadges-api/api';
import { getSupplyByBadgeId } from '../../../bitbadges-api/balances';
import { BitBadgeCollection, BitBadgesUserInfo } from '../../../bitbadges-api/types';
import { convertToBitBadgesUserInfo } from '../../../bitbadges-api/users';
import { DEV_MODE, PRIMARY_TEXT } from '../../../constants';
import { AddressDisplay } from '../../address/AddressDisplay';
import { InformationDisplayCard } from '../../common/InformationDisplayCard';

export function OwnersTab({ collection, badgeId }: {
    collection: BitBadgeCollection | undefined;
    badgeId: number
}) {
    const [badgeOwners, setBadgeOwners] = useState<BitBadgesUserInfo[]>([]);
    const [balances, setBalances] = useState<any>({});

    useEffect(() => {
        async function getOwners() {
            if (collection) {
                const ownersRes = await getBadgeOwners(collection?.collectionId, badgeId)
                const badgeOwners = ownersRes.owners.map((x) => convertToBitBadgesUserInfo(x));
                setBadgeOwners(badgeOwners);
                setBalances(ownersRes.balances);
            }
        }
        getOwners();
    }, [collection, badgeId]);

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
                                        x{getSupplyByBadgeId(badgeId, balances[owner.accountNumber].balances)}
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
