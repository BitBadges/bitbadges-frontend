import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { ClaimItemWithTrees, getClaimsFromClaimItems, getTransfersFromClaimItems } from "bitbadgesjs-utils";
import { BitBadgeCollection } from "bitbadgesjs-utils";
import { useAccountsContext } from "../../../contexts/AccountsContext";
import { SwitchForm } from "../form-items/SwitchForm";

export function ManualSendSelectStepItem(
    newCollectionMsg: MessageMsgNewCollection,
    setNewCollectionMsg: (newCollectionMsg: MessageMsgNewCollection) => void,
    manualSend: boolean,
    setManualSend: (manualSend: boolean) => void,
    claimItems: ClaimItemWithTrees[],
    simulatedCollection: BitBadgeCollection
) {
    const accounts = useAccountsContext();

    return {
        title: `Whitelist Distribution`,
        description: `How would you like to distribute badges to the whitelisted addresses?`,
        node: <SwitchForm

            options={[
                {
                    title: 'Direct Transfers',
                    message: `Upon creation of the collection, badges will be transferred directly to the whitelisted addresses. You will pay all transfer fees.`,
                    isSelected: manualSend,
                },
                {
                    title: 'Claimable',
                    message: 'The badges will be able to be claimed by the whitelisted addresses.',
                    isSelected: !manualSend,
                },
            ]}
            onSwitchChange={(idx) => {
                setManualSend(idx === 0);
                if (idx === 0) {
                    setNewCollectionMsg({
                        ...newCollectionMsg,
                        transfers: getTransfersFromClaimItems(claimItems, accounts.accounts),
                        claims: []
                    });
                } else if (idx === 1) {
                    const balance = {
                        balances: simulatedCollection.maxSupplys,
                        approvals: [],
                    }
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