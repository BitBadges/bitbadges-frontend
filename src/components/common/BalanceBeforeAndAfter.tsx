import { UserBalance } from "../../bitbadges-api/types";
import { BalanceDisplay } from "./BalanceDisplay";

export function BalanceBeforeAndAfter({
    balance,
    newBalance,
    partyString,
    hideTitle,
    beforeMessage,
    afterMessage,
}: {
    balance: UserBalance;
    newBalance: UserBalance;
    partyString: string;
    hideTitle?: boolean;

    beforeMessage?: string;
    afterMessage?: string;
}) {
    return <>
        {!hideTitle &&
            <div style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                fontSize: 15
            }}>
                <b>Impact on {partyString} Owned Balances</b>
            </div>}
        <div style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
        }}>
            <div style={{ margin: 20 }}>
                <BalanceDisplay
                    balance={balance}
                    message={beforeMessage ? beforeMessage : 'Before'}
                />
            </div>
            <div style={{ margin: 20 }}>
                <BalanceDisplay
                    balance={newBalance}
                    message={afterMessage ? afterMessage : 'After'}
                />
            </div>
        </div>
    </>
}