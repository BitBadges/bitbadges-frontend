import { BitBadgeCollection, UserBalance } from "../../bitbadges-api/types";
import { BadgeAvatarDisplay } from "./BadgeAvatarDisplay";

export function BalanceDisplay({
    collection,
    balance,
    message
}: {
    collection: BitBadgeCollection;
    balance: UserBalance;
    message?: string;
}) {
    const badgeIds = [];
    for (const balanceAmount of balance.balances) {
        for (const idRange of balanceAmount.badgeIds) {
            badgeIds.push(idRange);
        }
    }

    return <>
        <div style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-evenly',
            alignItems: 'center',
        }}>

            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center', fontSize: 15 }}>
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
                <div style={{ fontSize: 15 }}>
                    {balance.balances?.map((balanceAmount, idx) => {

                        return <>
                            <span style={{ color: balanceAmount.balance < 0 ? 'red' : undefined }}>
                                {idx !== 0 && <br />}
                                <b>x{balanceAmount.balance}</b> of IDs

                                {balanceAmount.badgeIds.map((idRange, idx) => {
                                    return <span key={idx}>
                                        {idx !== 0 ? ', ' : ' '} {idRange.start == idRange.end ? `${idRange.start}` : `${idRange.start}-${idRange.end}`}
                                    </span>
                                })}

                            </span>
                        </>
                    })}
                </div>
                <br />
                <BadgeAvatarDisplay
                    collection={collection}
                    userBalance={balance}
                    badgeIds={badgeIds}
                    showIds
                    pageSize={30}
                    showBalance
                    size={50}
                />
                {(!balance || balance.balances?.length === 0) && <div style={{ textAlign: 'center' }}>
                    <span>None</span>
                </div>}


            </div>
        </div>
    </>
}