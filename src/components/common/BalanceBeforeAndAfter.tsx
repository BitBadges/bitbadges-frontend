import { UserBalance } from "../../bitbadges-api/types";

export function BalanceBeforeAndAfter({
    balance,
    newBalance,
    partyString
}: {
    balance: UserBalance;
    newBalance: UserBalance;
    partyString: string;
}) {
    return <>
        <div style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-evenly',
            alignItems: 'center',
            fontSize: 15
        }}>
            <b>Impact on {partyString} Owned Balances</b>
        </div>
        <div style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-evenly',
            alignItems: 'center',
        }}>

            <div style={{ width: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                <b>Before</b>
            </div>
            <div style={{ width: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                <b>After</b>
            </div>
        </div>
        <div style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-evenly',
            alignItems: 'center',
        }}>
            <div style={{ width: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center', flexDirection: 'column' }}>
                {balance.balanceAmounts?.map((balanceAmount) => {
                    return balanceAmount.idRanges.map((idRange, idx) => {
                        return <div key={idx}>
                            <>
                                <span style={{ color: balanceAmount.balance < 0 ? 'red' : undefined }}><b>x{balanceAmount.balance}</b></span> of IDs {idRange.start} to {idRange.end}.<br />
                            </>
                        </div>
                    })
                })}
            </div>
            <div style={{ width: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center', flexDirection: 'column' }}>
                {newBalance.balanceAmounts?.map((balanceAmount) => {
                    return balanceAmount.idRanges.map((idRange, idx) => {
                        return <div key={idx}>
                            <>
                                <span style={{ color: balanceAmount.balance < 0 ? 'red' : undefined }}><b>x{balanceAmount.balance}</b></span> of IDs {idRange.start} to {idRange.end}.<br />
                            </>
                        </div>
                    })
                })}
            </div>
            {(!balance || balance.balanceAmounts?.length === 0) && <div style={{ textAlign: 'center' }}>
                <span style={{ color: 'red' }}><b>No balance found for the requested user.</b></span>
            </div>}
        </div>
    </>
}