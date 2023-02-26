import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { SwitchForm } from "../form-items/SwitchForm";
import { CanManagerBeTransferredDigit, GetPermissions, Permissions } from "../../../bitbadges-api/permissions";

export function CanManagerBeTransferredStepItem(
    newCollectionMsg: MessageMsgNewCollection,
    handledPermissions: Permissions,
    updatePermissions: (digit: number, value: boolean) => void,
) {
    return {
        title: 'Can Manager Be Transferred?',
        description: ``,
        node: <SwitchForm
            noSelectUntilClick
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
        />,
        disabled: !handledPermissions.CanManagerBeTransferred
    }
}