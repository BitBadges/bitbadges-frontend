import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { SwitchForm } from "../../common/SwitchForm";
import { CanUpdateUrisDigit, GetPermissions, Permissions } from "../../../bitbadges-api/permissions";
import { MetadataAddMethod } from "../../../bitbadges-api/types";

export function UpdatableMetadataSelectStepItem(
    newCollectionMsg: MessageMsgNewCollection,
    handledPermissions: Permissions,
    updatePermissions: (digit: number, value: boolean) => void,
    addMethod: MetadataAddMethod
) {
    return {
        title: 'Updatable Metadata?',
        description: `In the future, can the collection and badge metadata be updated? ${addMethod === MetadataAddMethod.UploadUrl ? 'Note this is for whether you can update your self-hosted metadata URIs or not (not the actual metadata). We can not control what metadata is returned from your server.' : ''}`,
        node: <SwitchForm
            noSelectUntilClick
            options={[
                {
                    title: 'No',
                    message: `The metadata cannot be updated!`,
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