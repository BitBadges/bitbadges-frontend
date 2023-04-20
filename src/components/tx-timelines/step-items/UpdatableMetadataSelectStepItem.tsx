import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { SwitchForm } from "../form-items/SwitchForm";
import { CanUpdateUrisDigit, GetPermissions, Permissions } from "bitbadgesjs-utils";
import { MetadataAddMethod } from "bitbadgesjs-utils";

export function UpdatableMetadataSelectStepItem(
    newCollectionMsg: MessageMsgNewCollection,
    handledPermissions: Permissions,
    updatePermissions: (digit: number, value: boolean) => void,
    addMethod: MetadataAddMethod
) {
    const options = [];
    options.push({
        title: 'No',
        message: `${addMethod === MetadataAddMethod.UploadUrl ? 'The URIs for the collection and badge metadata (i.e. the self-hosted ones provided by you)' : 'The metadata of the collection and any created badges'} will be frozen and cannot be updated.`,
        isSelected: handledPermissions.CanUpdateUris && !GetPermissions(newCollectionMsg.permissions).CanUpdateUris
    })

    options.push({
        title: 'Yes',
        message: <div>{`${addMethod === MetadataAddMethod.UploadUrl ? 'The URIs for the collection and badge metadata (i.e. the self-hosted URIs provided by you)' : 'The metadata of the collection and any created badges'} can be updated.`}</div>,
        isSelected: handledPermissions.CanUpdateUris && !!GetPermissions(newCollectionMsg.permissions).CanUpdateUris,
    });

    let description = ``;

    return {
        title: 'Updatable Metadata?',
        description: description,
        node: <SwitchForm

            options={options}
            onSwitchChange={(_idx, name) => {
                updatePermissions(CanUpdateUrisDigit, name === 'Yes');
            }}
            helperMessage="*If this permission is enabled (set to Yes), the manager can disable it at anytime. However, once disabled (set to No), it can never be re-enabled."
        />,
        disabled: !handledPermissions.CanUpdateUris
    }
}