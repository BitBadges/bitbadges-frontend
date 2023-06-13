import { CanDeleteDigit, Permissions } from "bitbadgesjs-utils";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { MSG_PREVIEW_ID } from "../TxTimeline";
import { SwitchForm } from "../form-items/SwitchForm";

export function CanDeleteStepItem(

  handledPermissions: Permissions,
  updatePermissions: (digit: number, value: boolean) => void
) {
  const collections = useCollectionsContext();
  const collection = collections.getCollection(MSG_PREVIEW_ID);

  return {
    title: 'Can Delete?',
    description: ``,
    node: <SwitchForm
      options={[
        {
          title: 'No',
          message: `These badge(s) will always exist and can never be deleted.`,
          isSelected: handledPermissions.CanDelete && !collection?.permissions.CanDelete
        },
        {
          title: 'Yes',
          message: `These badge(s) can be deleted by the manager.`,
          isSelected: handledPermissions.CanDelete && !!collection?.permissions.CanDelete,
        },
      ]}
      onSwitchChange={(idx) => {
        updatePermissions(CanDeleteDigit, idx === 1);
      }}
      helperMessage="*If this permission is enabled (set to Yes), the manager can disable it at anytime. However, if disabled (set to No), it can never be re-enabled."
    />,
    disabled: !handledPermissions.CanDelete
  }
}