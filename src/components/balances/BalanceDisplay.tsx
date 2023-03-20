import { Empty } from "antd";
import { BitBadgeCollection, UserBalance } from "../../bitbadges-api/types";
import { PRIMARY_BLUE, PRIMARY_TEXT } from "../../constants";
import { BadgeAvatarDisplay } from "../badges/BadgeAvatarDisplay";

export function BalanceDisplay({
    collection,
    balance,
    message,
    size,
    showingSupplyPreview,
    hideModalBalance,
}: {
    collection: BitBadgeCollection;
    balance: UserBalance;
    message?: string;
    size?: number;
    showingSupplyPreview?: boolean;
    hideModalBalance?: boolean;
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
                                ID{balanceAmount.badgeIds.length === 1 && balanceAmount.badgeIds[0].start === balanceAmount.badgeIds[0].end ? ' ' : 's'}{' '}

                                {balanceAmount.badgeIds.map((idRange, idx) => {
                                    return <span key={idx}>
                                        {idx !== 0 ? ', ' : ' '} {idRange.start == idRange.end ? `${idRange.start}` : `${idRange.start}-${idRange.end}`}
                                    </span>
                                })}

                                {' '}-  {showingSupplyPreview ? <>Supply of </> : <></>}<b>x{balanceAmount.balance}</b>

                            </span>
                        </>
                    })}
                </div>

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
                </div>}


            </div>
        </div>
    </>
}