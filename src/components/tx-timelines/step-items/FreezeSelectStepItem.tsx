import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { CanUpdateDisallowedDigit, GetPermissions, Permissions } from "../../../bitbadges-api/permissions";
import { SwitchForm } from "../form-items/SwitchForm";

export function FreezeSelectStepItem(
    newCollectionMsg: MessageMsgNewCollection,
    handledPermissions: Permissions,
    updatePermissions: (digit: number, value: boolean) => void,
) {
    return {
        title: `Edit Transferability?`,
        description: ``, //You previously selected badges to be ${newCollectionMsg.disallowedTransfers.length > 0 ? 'non-transferable' : 'transferable'} by default.
        node: <SwitchForm
            noSelectUntilClick
            options={[
                {
                    title: 'No',
                    message: `The manager cannot edit the transferability. The transferability selected in the last step will be permanent.`,
                    isSelected: handledPermissions.CanUpdateDisallowed && !GetPermissions(newCollectionMsg.permissions).CanUpdateDisallowed
                },
                {
                    title: 'Yes',
                    message: `The manager can edit the transferability.`,
                    isSelected: handledPermissions.CanUpdateDisallowed && !!GetPermissions(newCollectionMsg.permissions).CanUpdateDisallowed
                },
            ]}
            onSwitchChange={(idx) => {
                updatePermissions(CanUpdateDisallowedDigit, idx === 1);
            }}
            helperMessage="Note: If this permission is enabled (set to Yes), the manager can disable it at anytime. However, once disabled (set to No), it can never be re-enabled."
        />,
        disabled: !handledPermissions.CanUpdateDisallowed
    }
}