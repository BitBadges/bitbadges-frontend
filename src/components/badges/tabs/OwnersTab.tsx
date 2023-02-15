import { BitBadgeCollection, BitBadgesUserInfo, SupportedChain } from '../../../bitbadges-api/types';
import { DEV_MODE, PRIMARY_TEXT } from '../../../constants';
import { useEffect, useState } from 'react';
import { getBadgeOwners } from '../../../bitbadges-api/api';
import { AddressDisplay } from '../../address/AddressDisplay';

export function OwnersTab({ badgeCollection, badgeId }: {
    badgeCollection: BitBadgeCollection | undefined;
    badgeId: number
}) {
    const [badgeOwners, setBadgeOwners] = useState<BitBadgesUserInfo[]>([]);

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
            }
        }
        getOwners();
    }, []);

    return (
        <div>
            <div
                style={{
                    color: PRIMARY_TEXT,
                    justifyContent: 'center',
                    alignItems: 'center',
                    display: 'flex'
                }}>
                <div>
                    {badgeOwners?.map((owner, idx) => {
                        return <div key={idx} style={{ color: PRIMARY_TEXT, maxWidth: 600 }}>
                            <AddressDisplay
                                userInfo={owner}
                                fontColor={PRIMARY_TEXT} />
                        </div>
                    })}
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
