import { useState } from "react";
import { BitBadgesUserInfo, TransferMappingWithUnregisteredUsers } from "bitbadges-sdk";
import { TransferMappingSelectType, TransfersMappingSelect } from "../form-items/TransfersMappingSelect";

export function TransferabilitySelectStepItem(
    disallowedTransfersWithUnregisteredUsers: TransferMappingWithUnregisteredUsers[],
    setDisallowedTransfersWithUnregisteredUsers: (disallowedTransfersWithUnregisteredUsers: TransferMappingWithUnregisteredUsers[]) => void,
    transferabilityToSelectType: TransferMappingSelectType,
    setTransferabilityToSelectType: (transferabilityToSelectType: TransferMappingSelectType) => void,
    transferabilityFromSelectType: TransferMappingSelectType,
    setTransferabiityFromSelectType: (transferabilityFromSelectType: TransferMappingSelectType) => void,
    transferabilityTo: BitBadgesUserInfo[],
    setTransferabilityTo: (transferabilityTo: BitBadgesUserInfo[]) => void,
    transferabilityFrom: BitBadgesUserInfo[],
    setTransferabilityFrom: (transferabilityFrom: BitBadgesUserInfo[]) => void,
) {
    const [handledTransfers, setHandledTransfers] = useState(false);

    return {
        title: `Select Transferability`,
        description: `Note that transferability only applies to the transferring of distributed badges, not the minting or claiming process.`,
        node: <TransfersMappingSelect
            transfersMapping={disallowedTransfersWithUnregisteredUsers}
            setTransfersMapping={(disallowedTransfers) => {
                setDisallowedTransfersWithUnregisteredUsers(disallowedTransfers);
            }}
            setHandled={() => setHandledTransfers(true)}
            toSelectType={transferabilityToSelectType}
            setToSelectType={(toSelectType) => setTransferabilityToSelectType(toSelectType)}
            fromSelectType={transferabilityFromSelectType}
            setFromSelectType={(fromSelectType) => setTransferabiityFromSelectType(fromSelectType)}
            to={transferabilityTo}
            setTo={(to) => setTransferabilityTo(to)}
            from={transferabilityFrom}
            setFrom={(from) => setTransferabilityFrom(from)}
        />,
        disabled: !handledTransfers
    }
}