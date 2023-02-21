import { BitBadgeCollection, UserBalance } from "../../bitbadges-api/types";
import { BalanceDisplay } from "./BalanceDisplay";

export function BalanceBeforeAndAfter({
    balance,
    newBalance,
    partyString,
    hideTitle,
    beforeMessage,
    afterMessage,
    collection,
    updateCollectionMetadata
}: {
    balance: UserBalance;
    newBalance: UserBalance;
    partyString: string;
    hideTitle?: boolean;
    collection: BitBadgeCollection;
    updateCollectionMetadata: (startBadgeId: number) => void;

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
                <b>{partyString} Badge Balances</b>
            </div>}
        <div style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            // alignItems: 'center',
        }}>
            <div style={{ margin: 20, width: '50%' }}>
                <BalanceDisplay
                    collection={collection}
                    balance={balance}
                    updateCollectionMetadata={updateCollectionMetadata}
                    message={beforeMessage ? beforeMessage : 'Before'}
                />
            </div>
            <div style={{ margin: 20, width: '50%' }}>
                <BalanceDisplay
                    collection={collection}
                    balance={newBalance}
                    updateCollectionMetadata={updateCollectionMetadata}
                    message={afterMessage ? afterMessage : 'After'}
                />
            </div>
        </div>
    </>
}