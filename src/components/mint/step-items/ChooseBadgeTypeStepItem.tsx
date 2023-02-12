import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { SwitchForm } from "../../common/SwitchForm";

export function ChooseBadgeTypeStepItem(newCollectionMsg: MessageMsgNewCollection) {
    return {
        title: 'Choose Badge Type',
        description: 'What type of badge would you like to create?',
        node: <SwitchForm
            noSelectUntilClick
            options={[
                {
                    title: 'BitBadge',
                    message: 'Standard badges are the most customizable type of badge. ',
                    isSelected: newCollectionMsg.standard === 0,
                },
            ]}
            onSwitchChange={(idx, title) => { }}
        />
    }
}