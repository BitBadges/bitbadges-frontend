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
    if (addMethod === MetadataAddMethod.Manual && GetPermissions(newCollectionMsg.permissions).CanCreateMoreBadges) {

    } else {
        options.push({
            title: 'No',
            message: `The metadata cannot be updated.`,
            isSelected: handledPermissions.CanUpdateUris && !GetPermissions(newCollectionMsg.permissions).CanUpdateUris
        })
    }

    options.push({
        title: 'Yes',
        message: `The metadata can be updated.`,
        isSelected: handledPermissions.CanUpdateUris && !!GetPermissions(newCollectionMsg.permissions).CanUpdateUris,
    });

    let description = `In the future, can the collection and badge metadata be edited?`;
    if (addMethod === MetadataAddMethod.Manual && GetPermissions(newCollectionMsg.permissions).CanCreateMoreBadges) {
        description += ` This must be selected since you are storing metadata with IPFS and have selcted to be able to add badges to the collection in the future.`;
    }

    if (addMethod === MetadataAddMethod.UploadUrl) {
        description += ` Since you are self-hosting, this only applies to the collection and badge metadata URLs. We can not control the metadata you store at those URLs.`;
    }

    return {
        title: 'Updatable Metadata?',
        description: description,
        node: <SwitchForm
            noSelectUntilClick
            options={options}
            onSwitchChange={(_idx, name) => {
                updatePermissions(CanUpdateUrisDigit, name === 'Yes');
            }}
        />,
        disabled: !handledPermissions.CanUpdateUris
    }
}