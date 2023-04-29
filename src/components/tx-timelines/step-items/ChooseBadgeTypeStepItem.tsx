import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { SwitchForm } from "../form-items/SwitchForm";
import { Permissions } from "bitbadgesjs-utils";

export function ChooseBadgeTypeStepItem(newCollectionMsg: MessageMsgNewCollection, setNewCollectionMsg: (newCollectionMsg: MessageMsgNewCollection) => void) {
    return {
        title: 'Choose Badge Standard',
        description: 'What standard of badge(s) do you want to create?',
        node: <SwitchForm
            options={[
                {
                    title: 'Token Collection',
                    message: 'Tokens are unique digital assets that can be traded, claimed, and exchanged. You will create a collection of tokens where each token (badge) can be unique. Tokens are the most customizable type of badge, but they are also the most expensive.',
                    isSelected: newCollectionMsg.standard === 0,
                },
                {
                    title: 'User List',
                    message: 'User lists are an easy and cheaper way to create a badge. You will create a single badge and simply provide a list of addresses that own the badge.',
                    isSelected: newCollectionMsg.standard === 1,
                },
            ]}
            onSwitchChange={(idx) => { 

              setNewCollectionMsg({
                ...newCollectionMsg,
                standard: idx,

              })
            }}
        />
    }
}