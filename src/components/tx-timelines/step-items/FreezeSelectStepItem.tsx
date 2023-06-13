import { CanUpdateAllowedDigit, Permissions } from "bitbadgesjs-utils";
import { SwitchForm } from "../form-items/SwitchForm";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { MSG_PREVIEW_ID } from "../TxTimeline";

export function FreezeSelectStepItem(
  handledPermissions: Permissions,
  updatePermissions: (digit: number, value: boolean) => void,
) {
  const collections = useCollectionsContext();
  const collection = collections.getCollection(MSG_PREVIEW_ID);

  return {
    title: `Edit Transferability?`,
    description: ``, //You previously selected badges to be ${collection.allowedTransfers.length > 0 ? 'non-transferable' : 'transferable'} by default.
    node: <SwitchForm

      options={[
        {
          title: 'No',
          message: `The manager cannot edit the transferability. The transferability selected in the last step will be permanent.`,
          isSelected: handledPermissions.CanUpdateAllowed && !collection?.permissions.CanUpdateAllowed
        },
        {
          title: 'Yes',
          message: `The manager can edit the transferability.`,
          isSelected: handledPermissions.CanUpdateAllowed && !!collection?.permissions.CanUpdateAllowed
        },
      ]}
      onSwitchChange={(idx) => {
        updatePermissions(CanUpdateAllowedDigit, idx === 1);
      }}
      helperMessage="*If this permission is enabled (set to Yes), the manager can disable it at anytime. However, once disabled (set to No), it can never be re-enabled."
    />,
    disabled: !handledPermissions.CanUpdateAllowed
  }
}