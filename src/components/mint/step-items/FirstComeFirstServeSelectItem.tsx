import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { FirstComeFirstServeAmountSelect } from "../form-items/FirstComeFirstServeAmountSelect";

export function FirstComeFirstServeSelectStepItem(
    newCollectionMsg: MessageMsgNewCollection,
    setNewCollectionMsg: (newCollectionMsg: MessageMsgNewCollection) => void,
    fungible: boolean
) {
    return {
        title: `How Many Badges Can Each Account Claim?`,
        description: `This collection has ${newCollectionMsg.badgeSupplys[0]?.supply ?? '?'} identical badges. How many will each account be able to receive per claim?`,
        node: <FirstComeFirstServeAmountSelect newCollectionMsg={newCollectionMsg} setNewCollectionMsg={setNewCollectionMsg} fungible={fungible} />,
    }
}