import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { SwitchForm } from "../../common/SwitchForm";
import { ClaimItem, DistributionMethod } from "../../../bitbadges-api/types";
import { getBadgeSupplysFromMsgNewCollection } from "../../../bitbadges-api/balances";
import { getClaimsValueFromClaimItems } from "../../../bitbadges-api/claims";

export function ManualSendSelectStepItem(
    newCollectionMsg: MessageMsgNewCollection,
    setNewCollectionMsg: (newCollectionMsg: MessageMsgNewCollection) => void,
    manualSend: boolean,
    setManualSend: (manualSend: boolean) => void,
    claimItems: ClaimItem[],
    distributionMethod: DistributionMethod
) {
    return {
        title: `Distribution Method`,
        description: `You have whitelisted ${claimItems.length} address${claimItems.length > 1 ? 'es' : ''}. How would you like to distribute badges to these addresses?`,
        node: <SwitchForm
            noSelectUntilClick
            options={[
                {
                    title: 'Send Manually',
                    message: `Upon creation of the collection, badges will be transferred directly to these addresses. You will pay all transfer fees.`,
                    isSelected: manualSend,
                },
                {
                    title: 'Claimable (Recommended)',
                    message: 'The badges will be able to be claimed by these addresses.',
                    isSelected: !manualSend,
                },
            ]}
            onSwitchChange={(idx) => {
                setManualSend(idx === 0);
                if (idx === 0) {
                    setNewCollectionMsg({
                        ...newCollectionMsg,
                        transfers: claimItems.map((x) => ({
                            toAddresses: [x.accountNum],
                            balances: [
                                {
                                    balance: x.amount,
                                    badgeIds: x.badgeIds,
                                }
                            ]
                        })),
                        claims: []
                    });
                } else if (idx === 1) {
                    const balance = getBadgeSupplysFromMsgNewCollection(newCollectionMsg);
                    const claimRes = getClaimsValueFromClaimItems(balance, claimItems, distributionMethod);

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