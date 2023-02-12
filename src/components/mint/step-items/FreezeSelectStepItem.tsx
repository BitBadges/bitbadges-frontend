import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { CanUpdateDisallowedDigit, GetPermissions, Permissions } from "../../../bitbadges-api/permissions";
import { SwitchForm } from "../../common/SwitchForm";

export function FreezeSelectStepItem(
    newCollectionMsg: MessageMsgNewCollection,
    handledPermissions: Permissions,
    updatePermissions: (digit: number, value: boolean) => void,
) {
    return {
        title: `Can Manager Freeze and Unfreeze Addresses?`,
        description: ``,
        node: <SwitchForm
            noSelectUntilClick
            options={[
                {
                    title: 'No',
                    message: `The manager cannot freeze or unfreeze any owner's ability to transfer badges in this collection. Badges will always be ${newCollectionMsg.disallowedTransfers.length > 0 ? 'non-transferable.' : 'transferable.'}`,
                    isSelected: handledPermissions.CanUpdateDisallowed && !GetPermissions(newCollectionMsg.permissions).CanUpdateDisallowed
                },
                {
                    title: 'Yes',
                    message: `The manager can freeze and unfreeze any owner's ability to transfer badges in this collection.`,
                    isSelected: handledPermissions.CanUpdateDisallowed && !!GetPermissions(newCollectionMsg.permissions).CanUpdateDisallowed
                },
            ]}
            onSwitchChange={(idx) => {
                updatePermissions(CanUpdateDisallowedDigit, idx === 1);
            }}
        />,
        disabled: !handledPermissions.CanUpdateDisallowed
    }
}