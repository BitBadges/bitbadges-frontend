import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { SwitchForm } from "../form-items/SwitchForm";
import { getNonTransferableDisallowedTransfers } from "bitbadges-sdk";
import { useState } from "react";

export function TransferableSelectStepItem(
    newCollectionMsg: MessageMsgNewCollection,
    setNewCollectionMsg: (newCollectionMsg: MessageMsgNewCollection) => void,
) {
    const [handledDisallowedTransfers, setHandledDisallowedTransfers] = useState(false);

    return {
        title: 'Transferable?',
        description: ``,
        disabled: !handledDisallowedTransfers,
        node: <SwitchForm

            options={[
                {
                    title: 'Non-Transferable',
                    message: `Badge owners cannot transfer their badges to other addresses.`,
                    isSelected: handledDisallowedTransfers && newCollectionMsg.disallowedTransfers.length > 0
                },
                {
                    title: 'Transferable',
                    message: `Badge owners can transfer their badges to other addresses.`,
                    isSelected: handledDisallowedTransfers && newCollectionMsg.disallowedTransfers.length == 0
                },
            ]}
            onSwitchChange={(idx) => {
                const transferable = idx === 1;
                const nonTransferable = idx === 0;
                if (transferable) {
                    setNewCollectionMsg({
                        ...newCollectionMsg,
                        disallowedTransfers: [],
                    })
                } else if (nonTransferable) {
                    setNewCollectionMsg({
                        ...newCollectionMsg,
                        disallowedTransfers: getNonTransferableDisallowedTransfers(),
                    })
                }
                setHandledDisallowedTransfers(true);
            }}
        />,
    }
}