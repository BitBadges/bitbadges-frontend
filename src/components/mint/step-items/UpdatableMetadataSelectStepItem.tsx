import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { SwitchForm } from "../../common/SwitchForm";
import { CanUpdateUrisDigit, GetPermissions, Permissions } from "../../../bitbadges-api/permissions";

export function UpdatableMetadataSelectStepItem(
    newCollectionMsg: MessageMsgNewCollection,
    handledPermissions: Permissions,
    updatePermissions: (digit: number, value: boolean) => void,
) {
    return {
        title: 'Updatable Metadata?',
        description: `In the future, can the colleciton and badge metadata be updated?`,
        node: <SwitchForm
            noSelectUntilClick
            options={[
                {
                    title: 'No',
                    message: `The metadata cannot be updated and is frozen forever!`,
                    isSelected: handledPermissions.CanUpdateUris && !GetPermissions(newCollectionMsg.permissions).CanUpdateUris
                },
                {
                    title: 'Yes',
                    message: `The metadata can be updated in the future.`,
                    isSelected: handledPermissions.CanUpdateUris && !!GetPermissions(newCollectionMsg.permissions).CanUpdateUris,
                },
            ]}
            onSwitchChange={(idx) => {
                updatePermissions(CanUpdateUrisDigit, idx === 1);
            }}
        />,
        disabled: !handledPermissions.CanUpdateUris
    }
}