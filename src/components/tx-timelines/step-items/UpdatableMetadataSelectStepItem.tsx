import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { SwitchForm } from "../form-items/SwitchForm";
import { CanUpdateUrisDigit, GetPermissions, Permissions } from "../../../bitbadges-api/permissions";
import { MetadataAddMethod } from "../../../bitbadges-api/types";

export function UpdatableMetadataSelectStepItem(
    newCollectionMsg: MessageMsgNewCollection,
    handledPermissions: Permissions,
    updatePermissions: (digit: number, value: boolean) => void,
    addMethod: MetadataAddMethod
) {
    const options = [];
    options.push({
        title: 'No',
        message: `The metadata of the collection and any created badges is frozen and cannot be updated.`,
        isSelected: handledPermissions.CanUpdateUris && !GetPermissions(newCollectionMsg.permissions).CanUpdateUris
    })

    let additionalHelperMsg = <></>
    if (addMethod === MetadataAddMethod.Manual && GetPermissions(newCollectionMsg.permissions).CanCreateMoreBadges) {

    }

    if (addMethod === MetadataAddMethod.UploadUrl) {
        additionalHelperMsg = <>{` Since you are self-hosting, note this only applies to updating the collection and badge metadata URIs. We can not control the metadata you store at those URLs.`}</>;
    }

    options.push({
        title: 'Yes',
        message: <div>{`The metadata of the collection and any created badges can be updated.`}{additionalHelperMsg}</div>,
        isSelected: handledPermissions.CanUpdateUris && !!GetPermissions(newCollectionMsg.permissions).CanUpdateUris,
    });

    let description = ``;

    return {
        title: 'Updatable Metadata?',
        description: description,
        node: <SwitchForm
            noSelectUntilClick
            options={options}
            onSwitchChange={(_idx, name) => {
                updatePermissions(CanUpdateUrisDigit, name === 'Yes');
            }}
            helperMessage="Note: If this permission is enabled (set to Yes), the manager can disable it at anytime. However, once disabled (set to No), it can never be re-enabled."
        />,
        disabled: !handledPermissions.CanUpdateUris
    }
}