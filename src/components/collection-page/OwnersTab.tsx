import { Empty, Spin } from 'antd';
import { useEffect, useState } from 'react';
import { useAccountsContext } from '../../contexts/AccountsContext';
import { getBadgeOwners } from '../../bitbadges-api/api';
import { getSupplyByBadgeId } from '../../bitbadges-api/balances';
import { BitBadgeCollection } from '../../bitbadges-api/types';
import { DEV_MODE, PRIMARY_TEXT } from '../../constants';
import { AddressDisplay } from '../address/AddressDisplay';
import { InformationDisplayCard } from '../display/InformationDisplayCard';

export function OwnersTab({ collection, badgeId }: {
    collection: BitBadgeCollection | undefined;
    badgeId: number
}) {
    const accounts = useAccountsContext();
    const isPreview = collection?.collectionId === 0;

    const [badgeOwners, setBadgeOwners] = useState<number[]>([]);
    const [balances, setBalances] = useState<any>({});
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        async function getOwners() {
            if (collection) {
                if (collection.collectionId === 0) {
                    //Is preview
                    setLoaded(true);
                }
                const ownersRes = await getBadgeOwners(collection?.collectionId, badgeId)
                const badgeOwners = ownersRes.owners;

                await accounts.fetchAccountsByNumber(badgeOwners);

                setBadgeOwners(badgeOwners);
                setBalances(ownersRes.balances);
                setLoaded(true);
            }
        }
        getOwners();
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
                        {loaded ?
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
                                                userInfo={accounts.accounts[accounts.cosmosAddressesByAccountNumbers[owner]]}
                                                fontColor={PRIMARY_TEXT} />
                                        </div>
                                        <div>
                                            x{getSupplyByBadgeId(badgeId, balances[owner].balances)}
                                        </div>
                                    </div>
                                })}
                                {badgeOwners.length === 0 && <Empty
                                    description={isPreview ? "This feature is not supported for previews." : "No owners found for this badge."}
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    style={{ color: PRIMARY_TEXT }}
                                />}
                            </div>
                            : <div>
                                <br />
                                <Spin size={'large'} />
                                <br />
                            </div>
                        }
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
