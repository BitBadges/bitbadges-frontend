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
        description: `The manager will have special permissions to execute these transfers without the badge owner's approval.`,
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
                    title: 'Revoke Any Badge',
                    message: `The manager is able to revoke badges from any user or transfer badges on behalf of any user without approval.`,
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