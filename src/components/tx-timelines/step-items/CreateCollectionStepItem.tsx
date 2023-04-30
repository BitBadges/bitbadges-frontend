import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { BadgeMetadata, BadgeMetadataMap, BitBadgeCollection, ClaimItemWithTrees, DistributionMethod, MetadataAddMethod, TransferMappingWithUnregisteredUsers } from "bitbadgesjs-utils";
import { SubmitMsgNewCollection } from "../form-items/SubmitMsgNewCollection";

export function CreateCollectionStepItem(
    newCollectionMsg: MessageMsgNewCollection,
    setNewCollectionMsg: (msg: MessageMsgNewCollection) => void,
    addMethod: MetadataAddMethod,
    claimItems: ClaimItemWithTrees[],
    collectionMetadata: BadgeMetadata,
    individualBadgeMetadata: BadgeMetadataMap,
    distributionMethod: DistributionMethod,
    manualSend: boolean,
    managerApprovedTransfersWithUnregisteredUsers: TransferMappingWithUnregisteredUsers[],
    disallowedTransfersWithUnregisteredUsers: TransferMappingWithUnregisteredUsers[],
    simulatedCollection: BitBadgeCollection,
) {
    return {
        title: 'Submit Transaction',
        description: '',
        node: <SubmitMsgNewCollection
            newCollectionMsg={newCollectionMsg}
            setNewCollectionMsg={setNewCollectionMsg}
            addMethod={addMethod}
            claimItems={claimItems}
            collectionMetadata={collectionMetadata}
            individualBadgeMetadata={individualBadgeMetadata}
            distributionMethod={distributionMethod}
            managerApprovedTransfersWithUnregisteredUsers={managerApprovedTransfersWithUnregisteredUsers}
            disallowedTransfersWithUnregisteredUsers={disallowedTransfersWithUnregisteredUsers}
            manualSend={manualSend}
            simulatedCollection={simulatedCollection}
        />
    }
}