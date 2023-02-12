import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { BadgeSupply } from "../form-items/BadgeSupplySelect";

export function BadgeSupplySelectStepItem(
    newCollectionMsg: MessageMsgNewCollection,
    setNewCollectionMsg: (newCollectionMsg: MessageMsgNewCollection) => void,
    fungible: boolean
) {
    return {
        title: `How Many Badges To Create?`,
        description: `${fungible ? `${newCollectionMsg.badgeSupplys[0]?.supply ?? 0} identical` : `${newCollectionMsg.badgeSupplys[0]?.amount ?? '?'} unique`} badges will be created. ${fungible ? 'This will be the maximum total supply and cannot be changed later.' : ''}`,
        node: <BadgeSupply
            newCollectionMsg={newCollectionMsg}
            setNewCollectionMsg={setNewCollectionMsg}
            fungible={fungible}
        />,
        disabled: newCollectionMsg.badgeSupplys?.length == 0
    }
}