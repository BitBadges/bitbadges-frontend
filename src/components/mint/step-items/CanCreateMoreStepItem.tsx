import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { CanCreateMoreBadgesDigit, GetPermissions, Permissions } from "../../../bitbadges-api/permissions";
import { SwitchForm } from "../../common/SwitchForm";

export function CanCreateMoreStepItem(
    newCollectionMsg: MessageMsgNewCollection,
    handledPermissions: Permissions,
    updatePermissions: (digit: number, value: boolean) => void
) {
    return {
        title: 'Can Add Badges to Collection?',
        description: `In the future, can additional badges be added to this collection?`,
        node: <SwitchForm
            noSelectUntilClick
            options={[
                {
                    title: 'No',
                    message: `Badges can never be added to this collection.`,
                    isSelected: handledPermissions.CanCreateMoreBadges && !GetPermissions(newCollectionMsg.permissions).CanCreateMoreBadges
                },
                {
                    title: 'Yes',
                    message: `Badges can be added to this collection in the future.`,
                    isSelected: handledPermissions.CanCreateMoreBadges && !!GetPermissions(newCollectionMsg.permissions).CanCreateMoreBadges,
                },
            ]}
            onSwitchChange={(idx) => {
                updatePermissions(CanCreateMoreBadgesDigit, idx === 1);
            }}
        />,
        disabled: !handledPermissions.CanCreateMoreBadges
    }
}