import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { SwitchForm } from "../form-items/SwitchForm";
import { EmptyStepItem } from "../TxTimeline";

export function ChooseBadgeTypeStepItem(newCollectionMsg: MessageMsgNewCollection) {
    return EmptyStepItem;

    return {
        title: 'Choose Badge Type',
        description: 'What type of badge would you like to create?',
        node: <SwitchForm

            options={[
                {
                    title: 'BitBadge',
                    message: 'Standard badges are the most customizable type of badge.',
                    isSelected: newCollectionMsg.standard === 0,
                },
            ]}
            onSwitchChange={() => { }}
        />
    }
}