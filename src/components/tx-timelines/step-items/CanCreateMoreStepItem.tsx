import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { CanCreateMoreBadgesDigit, GetPermissions, Permissions } from "../../../bitbadges-api/permissions";
import { SwitchForm } from "../form-items/SwitchForm";

export function CanCreateMoreStepItem(
    newCollectionMsg: MessageMsgNewCollection,
    handledPermissions: Permissions,
    updatePermissions: (digit: number, value: boolean) => void
) {
    return {
        title: 'Can Manager Add Badges?',
        description: ``,
        node: <SwitchForm
            noSelectUntilClick
            options={[
                {
                    title: 'No',
                    message: `New badges can never be added to this collection.`,
                    isSelected: handledPermissions.CanCreateMoreBadges && !GetPermissions(newCollectionMsg.permissions).CanCreateMoreBadges
                },
                {
                    title: 'Yes',
                    message: `New badges can be added to this collection in the future by the manager.`,
                    isSelected: handledPermissions.CanCreateMoreBadges && !!GetPermissions(newCollectionMsg.permissions).CanCreateMoreBadges,
                },
            ]}
            onSwitchChange={(idx) => {
                updatePermissions(CanCreateMoreBadgesDigit, idx === 1);
            }}
            helperMessage="Note: If this permission is enabled (set to Yes), the manager can disable it at anytime. However, once disabled (set to No), it can never be re-enabled."
        />,
        disabled: !handledPermissions.CanCreateMoreBadges
    }
}