import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { CanDeleteDigit, GetPermissions, Permissions } from "bitbadges-sdk";
import { SwitchForm } from "../form-items/SwitchForm";

export function CanDeleteStepItem(
    newCollectionMsg: MessageMsgNewCollection,
    handledPermissions: Permissions,
    updatePermissions: (digit: number, value: boolean) => void
) {
    return {
        title: 'Can Delete Collection?',
        description: ``,
        node: <SwitchForm
            options={[
                {
                    title: 'No',
                    message: `This collection will always exist and can never be deleted.`,
                    isSelected: handledPermissions.CanDelete && !GetPermissions(newCollectionMsg.permissions).CanDelete
                },
                {
                    title: 'Yes',
                    message: `This collection can be deleted by the manager.`,
                    isSelected: handledPermissions.CanDelete && !!GetPermissions(newCollectionMsg.permissions).CanDelete,
                },
            ]}
            onSwitchChange={(idx) => {
                updatePermissions(CanDeleteDigit, idx === 1);
            }}
            helperMessage="*If this permission is enabled (set to Yes), the manager can disable it at anytime. However, if disabled (set to No), it can never be re-enabled."
        />,
        disabled: !handledPermissions.CanDelete
    }
}