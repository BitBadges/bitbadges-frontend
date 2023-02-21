import { BitBadgeCollection, UserBalance } from "../../bitbadges-api/types";
import { BadgeAvatarDisplay } from "./BadgeAvatarDisplay";

export function BalanceDisplay({
    collection,
    balance,
    message,
    updateCollectionMetadata
}: {
    collection: BitBadgeCollection;
    balance: UserBalance;
    message?: string;
    updateCollectionMetadata: (startBadgeId: number) => void;
}) {
    return <>
        <div style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-evenly',
            alignItems: 'center',
        }}>

            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                <b>{message ? message : 'Balances'}</b>
            </div>
        </div>
        <div style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-evenly',
            alignItems: 'center',
        }}>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center', flexDirection: 'column' }}>
                {balance.balances?.map((balanceAmount) => {
                    return balanceAmount.badgeIds.map((idRange, idx) => {
                        return <div key={idx}>
                            <>
                                <span style={{ color: balanceAmount.balance < 0 ? 'red' : undefined }}><b>x{balanceAmount.balance}</b></span> of IDs {idRange.start} to {idRange.end}<br />
                            </>
                            <BadgeAvatarDisplay
                                collection={collection}
                                userBalance={balance}
                                startId={Number(idRange.start)}
                                endId={Number(idRange.end)}
                                showIds
                                pageSize={25}
                                updateCollectionMetadata={updateCollectionMetadata}
                            />
                        </div>
                    })
                })}
                {(!balance || balance.balances?.length === 0) && <div style={{ textAlign: 'center' }}>
                    <span>None</span>
                </div>}


            </div>
        </div>
    </>
}