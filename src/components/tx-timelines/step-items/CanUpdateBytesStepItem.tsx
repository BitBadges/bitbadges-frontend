import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { CanUpdateBytesDigit, GetPermissions, Permissions } from "bitbadgesjs-utils";
import { SwitchForm } from "../form-items/SwitchForm";

export function CanUpdateBytesStepItem(
    newCollectionMsg: MessageMsgNewCollection,
    handledPermissions: Permissions,
    updatePermissions: (digit: number, value: boolean) => void
) {
    return {
        title: 'Can Update Balances?',
        description: ``,
        node: <SwitchForm
            options={[
                {
                    title: 'No',
                    message: `The balances (who owns the badge?) are permanent and can never be updated.`,
                    isSelected: handledPermissions.CanUpdateBytes && !GetPermissions(newCollectionMsg.permissions).CanUpdateBytes
                },
                {
                    title: 'Yes',
                    message: `The balances (who owns the badge?) can be updated by the manager.`,
                    isSelected: handledPermissions.CanUpdateBytes && !!GetPermissions(newCollectionMsg.permissions).CanUpdateBytes,
                },
            ]}
            onSwitchChange={(idx) => {
                updatePermissions(CanUpdateBytesDigit, idx === 1);
            }}
            helperMessage="*If this permission is enabled (set to Yes), the manager can disable it at anytime. However, if disabled (set to No), it can never be re-enabled."
        />,
        disabled: !handledPermissions.CanUpdateBytes
    }
}