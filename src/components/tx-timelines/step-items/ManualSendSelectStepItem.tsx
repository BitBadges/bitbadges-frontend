import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { SwitchForm } from "../form-items/SwitchForm";
import { ClaimItem, DistributionMethod } from "../../../bitbadges-api/types";
import { getBadgeSupplysFromMsgNewCollection } from "../../../bitbadges-api/balances";
import { getClaimsFromClaimItems, getTransfersFromClaimItems } from "../../../bitbadges-api/claims";
import { useAccountsContext } from "../../../contexts/AccountsContext";

export function ManualSendSelectStepItem(
    newCollectionMsg: MessageMsgNewCollection,
    setNewCollectionMsg: (newCollectionMsg: MessageMsgNewCollection) => void,
    manualSend: boolean,
    setManualSend: (manualSend: boolean) => void,
    claimItems: ClaimItem[]
) {
    const accounts = useAccountsContext();

    return {
        title: `Whitelist Distribution`,
        description: `How would you like to distribute badges to the whitelisted addresses?`,
        node: <SwitchForm
            noSelectUntilClick
            options={[
                {
                    title: 'Direct Transfers',
                    message: `Upon creation of the collection, badges will be transferred directly to the whitelisted addresses. You will pay all transfer fees.`,
                    isSelected: manualSend,
                },
                {
                    title: 'Claimable (Recommended)',
                    message: 'The badges will be able to be claimed by the whitelisted addresses.',
                    isSelected: !manualSend,
                },
            ]}
            onSwitchChange={(idx) => {
                setManualSend(idx === 0);
                if (idx === 0) {
                    setNewCollectionMsg({
                        ...newCollectionMsg,
                        transfers: getTransfersFromClaimItems(claimItems, accounts),
                        claims: []
                    });
                } else if (idx === 1) {
                    const balance = getBadgeSupplysFromMsgNewCollection(newCollectionMsg);
                    const claimRes = getClaimsFromClaimItems(balance, claimItems);

                    setNewCollectionMsg({
                        ...newCollectionMsg,
                        transfers: [],
                        claims: claimRes.claims
                    })
                }
            }}
        />,
    }
}