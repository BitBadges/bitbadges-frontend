import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { useState } from "react";
import { getNonTransferableDisallowedTransfers } from "../../../bitbadges-api/badges";
import { SwitchForm } from "../form-items/SwitchForm";

export function ManagerApprovedTransfersStepItem(
    newCollectionMsg: MessageMsgNewCollection,
    setNewCollectionMsg: (newCollectionMsg: MessageMsgNewCollection) => void,
) {
    const [handledManagerApprovedTransfers, setHandledManagerApprovedTransfers] = useState(false);

    return {
        title: 'Manager\'s Approved Transfers',
        description: ``,
        disabled: !handledManagerApprovedTransfers,
        node: <SwitchForm
            noSelectUntilClick
            options={[
                {
                    title: 'None',
                    message: `The manager will have no special approved transfers.`,
                    isSelected: handledManagerApprovedTransfers && newCollectionMsg.managerApprovedTransfers.length == 0
                },
                {
                    title: 'Complete Control',
                    message: `The manager will be able to revoke and transfer any badge without its owners' approval.`,
                    isSelected: handledManagerApprovedTransfers && newCollectionMsg.managerApprovedTransfers.length > 0
                },
            ]}
            onSwitchChange={(idx) => {
                const none = idx === 0;
                const revokable = idx === 1;
                if (none) {
                    setNewCollectionMsg({
                        ...newCollectionMsg,
                        managerApprovedTransfers: [],
                    })
                } else if (revokable) {
                    setNewCollectionMsg({
                        ...newCollectionMsg,
                        managerApprovedTransfers: getNonTransferableDisallowedTransfers(),
                    })
                }
                setHandledManagerApprovedTransfers(true);
            }}
        />,
    }
}