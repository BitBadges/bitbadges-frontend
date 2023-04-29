import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { SubmitMsgNewCollection } from "../form-items/SubmitMsgNewCollection";
import { BadgeMetadata, BadgeMetadataMap, BitBadgeCollection, BitBadgesUserInfo, ClaimItemWithTrees, DistributionMethod, MetadataAddMethod, TransferMappingWithUnregisteredUsers } from "bitbadgesjs-utils";

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
    userList: BitBadgesUserInfo[]
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
            userList={userList}
        />
    }
}