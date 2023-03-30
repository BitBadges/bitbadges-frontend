import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { SwitchForm } from "../form-items/SwitchForm";
import { CanManagerBeTransferredDigit, GetPermissions, Permissions } from "../../../bitbadges-api/permissions";

export function CanManagerBeTransferredStepItem(
    newCollectionMsg: MessageMsgNewCollection,
    handledPermissions: Permissions,
    updatePermissions: (digit: number, value: boolean) => void,
) {
    return {
        title: 'Transferable Manager Role?',
        description: ``,
        node: <SwitchForm

            options={[
                {
                    title: 'No',
                    message: `The role of the manager cannot be transferred to another address.`,
                    isSelected: handledPermissions.CanManagerBeTransferred && !GetPermissions(newCollectionMsg.permissions).CanManagerBeTransferred
                },
                {
                    title: 'Yes',
                    message: `The role of the manager can be transferred to another address.`,
                    isSelected: handledPermissions.CanManagerBeTransferred && !!GetPermissions(newCollectionMsg.permissions).CanManagerBeTransferred
                }
            ]}
            onSwitchChange={(idx) => {
                updatePermissions(CanManagerBeTransferredDigit, idx === 1);
            }}
            helperMessage="*If this permission is enabled (set to Yes), the manager can disable it at anytime. However, once disabled (set to No), it can never be re-enabled."
        />,
        disabled: !handledPermissions.CanManagerBeTransferred

    }
}