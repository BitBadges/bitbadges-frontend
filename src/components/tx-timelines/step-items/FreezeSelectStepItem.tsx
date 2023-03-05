import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { CanUpdateDisallowedDigit, GetPermissions, Permissions } from "../../../bitbadges-api/permissions";
import { SwitchForm } from "../form-items/SwitchForm";

export function FreezeSelectStepItem(
    newCollectionMsg: MessageMsgNewCollection,
    handledPermissions: Permissions,
    updatePermissions: (digit: number, value: boolean) => void,
) {
    return {
        title: `Freezable?`,
        description: ``, //You previously selected badges to be ${newCollectionMsg.disallowedTransfers.length > 0 ? 'non-transferable' : 'transferable'} by default.
        node: <SwitchForm
            noSelectUntilClick
            options={[
                {
                    title: 'No',
                    message: `The manager cannot freeze or unfreeze a user's ability to transfer. Badges will always be ${newCollectionMsg.disallowedTransfers.length > 0 ? 'non-transferable.' : 'transferable.'}`,
                    isSelected: handledPermissions.CanUpdateDisallowed && !GetPermissions(newCollectionMsg.permissions).CanUpdateDisallowed
                },
                {
                    title: 'Yes',
                    message: `The manager can freeze and unfreeze a user's ability to transfer.`,
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