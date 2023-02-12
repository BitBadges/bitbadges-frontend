import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { SubmitNewMintMsg } from "../form-items/SubmitNewMintMsg";
import { BitBadgeCollection, ClaimItem, DistributionMethod } from "../../../bitbadges-api/types";

export function SubmitNewMintMsgStepItem(
    newCollectionMsg: MessageMsgNewCollection,
    setNewCollectionMsg: (newCollectionMsg: MessageMsgNewCollection) => void,
    collection: BitBadgeCollection,
    claimItems: ClaimItem[],
    distributionMethod: DistributionMethod
) {
    return {
        title: 'Distribute Badges',
        description: '',
        node: <SubmitNewMintMsg
            newCollectionMsg={newCollectionMsg}
            setNewCollectionMsg={setNewCollectionMsg}
            collection={collection}
            claimItems={claimItems}
            distributionMethod={distributionMethod}
        />,
    }
}