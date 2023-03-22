import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { CanCreateMoreBadgesDigit, GetPermissions, Permissions } from "../../../bitbadges-api/permissions";
import { SwitchForm } from "../form-items/SwitchForm";

export function CanCreateMoreStepItem(
    newCollectionMsg: MessageMsgNewCollection,
    handledPermissions: Permissions,
    updatePermissions: (digit: number, value: boolean) => void
) {
    return {
        title: 'Can Add Badges?',
        description: ``,
        node: <SwitchForm
            // noSelectUntilClick
            options={[
                {
                    title: 'No',
                    message: `New badges can never be added to this collection. The badge amounts selected in the previous step can never be added to.`,
                    isSelected: handledPermissions.CanCreateMoreBadges && !GetPermissions(newCollectionMsg.permissions).CanCreateMoreBadges
                },
                {
                    title: 'Yes',
                    message: `In the future, new badges can be added to this collection by the manager.`,
                    isSelected: handledPermissions.CanCreateMoreBadges && !!GetPermissions(newCollectionMsg.permissions).CanCreateMoreBadges,
                },
            ]}
            onSwitchChange={(idx) => {
                updatePermissions(CanCreateMoreBadgesDigit, idx === 1);
            }}
            helperMessage="*If this permission is enabled (set to Yes), the manager can disable it at anytime. However, if disabled (set to No), it can never be re-enabled."
        />,
        disabled: !handledPermissions.CanCreateMoreBadges
    }
}