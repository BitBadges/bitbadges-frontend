import { useState } from "react";
import { TransferMappingWithUnregisteredUsers } from "../../../bitbadges-api/types";
import { TransfersMappingSelect } from "../form-items/TransfersMappingSelect";

export function TransferabilitySelectStepItem(
    disallowedTransfersWithUnregisteredUsers: TransferMappingWithUnregisteredUsers[],
    setDisallowedTransfersWithUnregisteredUsers: (disallowedTransfersWithUnregisteredUsers: TransferMappingWithUnregisteredUsers[]) => void,
) {
    const [handledTransfers, setHandledTransfers] = useState(false);

    return {
        title: `Select Transferability`,
        description: `Transferability only applies to the transferring of distributed badges, not the minting or claiming process.`,
        node: <TransfersMappingSelect
            transfersMapping={disallowedTransfersWithUnregisteredUsers}
            setTransfersMapping={(disallowedTransfers) => {
                setDisallowedTransfersWithUnregisteredUsers(disallowedTransfers);
            }}
            setHandled={() => setHandledTransfers(true)}
        />,
        disabled: !handledTransfers
    }
}