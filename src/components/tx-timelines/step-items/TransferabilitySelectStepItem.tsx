import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { TransfersMappingSelect } from "../form-items/TransfersMappingSelect";
import { useState } from "react";

export function TransferabilitySelectStepItem(
    newCollectionMsg: MessageMsgNewCollection,
    setNewCollectionMsg: (newCollectionMsg: MessageMsgNewCollection) => void
) {
    const [handledTransfers, setHandledTransfers] = useState(false);

    return {
        title: `Select Transferability`,
        description: `Transferability only applies to the transferring of minted badges, not the minting process.`,
        node: <TransfersMappingSelect
            transfersMapping={newCollectionMsg.disallowedTransfers}
            setTransfersMapping={(disallowedTransfers) => {
                setNewCollectionMsg({ ...newCollectionMsg, disallowedTransfers })

            }}
            setHandled={() => setHandledTransfers(true)}
        />,
        disabled: !handledTransfers
    }
}