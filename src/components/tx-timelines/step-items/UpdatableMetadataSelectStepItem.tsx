import { CanUpdateMetadataUrisDigit, MetadataAddMethod, Permissions } from "bitbadgesjs-utils";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { MSG_PREVIEW_ID } from "../TxTimeline";
import { SwitchForm } from "../form-items/SwitchForm";

export function UpdatableMetadataSelectStepItem(
  handledPermissions: Permissions,
  updatePermissions: (digit: number, value: boolean) => void,
  addMethod: MetadataAddMethod
) {
  const collections = useCollectionsContext();
  const collection = collections.getCollection(MSG_PREVIEW_ID);


  const options = [];
  options.push({
    title: 'No',
    message: `${addMethod === MetadataAddMethod.UploadUrl ? 'The URIs for the metadata (i.e. the self-hosted ones provided by you)' : 'The metadata'} will be frozen and cannot be updated.`,
    isSelected: handledPermissions.CanUpdateMetadataUris && !collection?.permissions.CanUpdateMetadataUris
  })

  options.push({
    title: 'Yes',
    message: <div>{`${addMethod === MetadataAddMethod.UploadUrl ? 'The URIs (i.e. the self-hosted URIs provided by you)' : 'The metadata'} can be updated.`}</div>,
    isSelected: handledPermissions.CanUpdateMetadataUris && !!collection?.permissions.CanUpdateMetadataUris,
  });

  let description = ``;

  return {
    title: 'Updatable Metadata?',
    description: description,
    node: <SwitchForm

      options={options}
      onSwitchChange={(_idx, name) => {
        updatePermissions(CanUpdateMetadataUrisDigit, name === 'Yes');
      }}
      helperMessage="*If this permission is enabled (set to Yes), the manager can disable it at anytime. However, once disabled (set to No), it can never be re-enabled."
    />,
    disabled: !handledPermissions.CanUpdateMetadataUris
  }
}