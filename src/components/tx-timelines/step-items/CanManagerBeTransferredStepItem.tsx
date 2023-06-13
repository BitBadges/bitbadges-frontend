import { CanManagerBeTransferredDigit, Permissions } from "bitbadgesjs-utils";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { MSG_PREVIEW_ID } from "../TxTimeline";
import { SwitchForm } from "../form-items/SwitchForm";

export function CanManagerBeTransferredStepItem(
  handledPermissions: Permissions,
  updatePermissions: (digit: number, value: boolean) => void,
) {
  const collections = useCollectionsContext();
  const collection = collections.getCollection(MSG_PREVIEW_ID);


  return {
    title: 'Transferable Manager Role?',
    description: ``,
    node: <SwitchForm

      options={[
        {
          title: 'No',
          message: `The role of the manager cannot be transferred to another address.`,
          isSelected: handledPermissions.CanManagerBeTransferred && !collection?.permissions.CanManagerBeTransferred
        },
        {
          title: 'Yes',
          message: `The role of the manager can be transferred to another address.`,
          isSelected: handledPermissions.CanManagerBeTransferred && !!collection?.permissions.CanManagerBeTransferred
        }
      ]}
      onSwitchChange={(idx) => {
        updatePermissions(CanManagerBeTransferredDigit, idx === 1);
      }}
      helperMessage="*If this permission is enabled (set to Yes), the manager can disable it at anytime. However, once disabled (set to No), it can never be re-enabled."
    />,
    disabled: !handledPermissions.CanManagerBeTransferred

  }
}