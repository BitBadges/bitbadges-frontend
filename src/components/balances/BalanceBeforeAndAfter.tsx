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
    updateMetadataForBadgeIdsDirectlyFromUriIfAbsent
}: {
    balance: UserBalance;
    newBalance: UserBalance;
    partyString: string;
    hideTitle?: boolean;
    collection: BitBadgeCollection;
    updateMetadataForBadgeIdsDirectlyFromUriIfAbsent?: (badgeIds: number[]) => void;

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
                    message={beforeMessage ? beforeMessage : 'Before'}
                    updateMetadataForBadgeIdsDirectlyFromUriIfAbsent={updateMetadataForBadgeIdsDirectlyFromUriIfAbsent}
                />
            </div>
            <div style={{ margin: 20, width: '50%' }}>
                <BalanceDisplay
                    collection={collection}
                    balance={newBalance}
                    message={afterMessage ? afterMessage : 'After'}
                    updateMetadataForBadgeIdsDirectlyFromUriIfAbsent={updateMetadataForBadgeIdsDirectlyFromUriIfAbsent}
                />
            </div>
        </div>
    </>
}