import { Empty } from "antd";
import { BitBadgeCollection, IdRange, UserBalance } from "../../bitbadges-api/types";
import { PRIMARY_BLUE, PRIMARY_TEXT } from "../../constants";
import { BadgeAvatarDisplay } from "../badges/BadgeAvatarDisplay";

export function BalanceDisplay({
    collection,
    balance,
    message,
    size,
    showingSupplyPreview,
    hideModalBalance,
    numRecipients = 1,
    numIncrements = 0,
    incrementBy = 0,
}: {
    collection: BitBadgeCollection;
    balance: UserBalance;
    message?: string;
    size?: number;
    showingSupplyPreview?: boolean;
    hideModalBalance?: boolean;
    numRecipients?: number,
    numIncrements?: number
    incrementBy?: number
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
                        const amount = Number(balanceAmount.balance) * numRecipients / numIncrements;
                        const allBadgeIds: IdRange[] = JSON.parse(JSON.stringify(balanceAmount.badgeIds))
                        if (numIncrements) {

                            if (incrementBy) {
                                for (const badgeIdRange of allBadgeIds) {
                                    badgeIdRange.end = badgeIdRange.end + (incrementBy * (numIncrements - 1));
                                }
                            }
                        }

                        return <>
                            <span style={{ color: amount < 0 ? 'red' : undefined }}>
                                {idx !== 0 && <br />}
                                ID{allBadgeIds.length === 1 && allBadgeIds[0].start === allBadgeIds[0].end ? ' ' : 's'}{' '}

                                {allBadgeIds.map((idRange, idx) => {
                                    return <span key={idx}>
                                        {idx !== 0 ? ', ' : ' '} {idRange.start == idRange.end ? `${idRange.start}` : `${idRange.start}-${idRange.end}`}
                                    </span>
                                })}

                                {' '}-  {showingSupplyPreview ? <>Supply of </> : <></>}<b>x{amount}</b>

                                {numIncrements > 0 && incrementBy > 0 ? <>
                                    {' '}(x{Number(balanceAmount.balance)} of IDs
                                    {' '}{balanceAmount.badgeIds.map((idRange, idx) => {
                                        return <span key={idx}>
                                            {idx !== 0 ? ', ' : ' '} {idRange.start == idRange.end ? `${idRange.start}` : `${idRange.start}-${idRange.end}`}
                                        </span>
                                    })}, then x{Number(balanceAmount.balance)} of IDs
                                    {' '}{balanceAmount.badgeIds.map((idRange, idx) => {
                                        return <span key={idx}>
                                            {idx !== 0 ? ', ' : ' '} {idRange.start == idRange.end ? `${idRange.start + incrementBy}` : `${idRange.start + incrementBy}-${idRange.end}`}
                                        </span>
                                    })}, and so on)
                                </> : numRecipients > 1 ?
                                    <>
                                        {' '}(x{Number(balanceAmount.balance)} to each recipient)
                                    </> : <></>
                                }
                            </span>
                        </>
                    })}
                </div >

                {(!balance || balance.balances?.length === 0) ? <div style={{ textAlign: 'center', display: 'flex' }}>
                    <Empty
                        style={{ color: PRIMARY_TEXT, backgroundColor: PRIMARY_BLUE }}
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={'None'}
                    />
                </div> : <div style={{ marginTop: 4 }}>
                    <BadgeAvatarDisplay
                        collection={collection}
                        userBalance={balance}
                        badgeIds={badgeIds}
                        showIds
                        // pageSize={30}
                        showBalance
                        size={size ? size : 50}
                        hideModalBalance={hideModalBalance}
                    />
                </div>
                }


            </div>
        </div>
    </>
}