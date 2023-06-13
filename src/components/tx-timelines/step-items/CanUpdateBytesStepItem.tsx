import { CanUpdateBalancesUriDigit, Permissions } from "bitbadgesjs-utils";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { MSG_PREVIEW_ID } from "../TxTimeline";
import { SwitchForm } from "../form-items/SwitchForm";

export function CanUpdateBalancesStepItem(
  handledPermissions: Permissions,
  updatePermissions: (digit: number, value: boolean) => void
) {
  const collections = useCollectionsContext();
  const collection = collections.getCollection(MSG_PREVIEW_ID);


  return {
    title: 'Can Update Balances?',
    description: ``,
    node: <SwitchForm
      options={[
        {
          title: 'No',
          message: `The balances (who owns the badge?) are permanent and can never be updated.`,
          isSelected: handledPermissions.CanUpdateBalancesUri && !collection?.permissions.CanUpdateBalancesUri
        },
        {
          title: 'Yes',
          message: `The balances (who owns the badge?) can be updated by the manager.`,
          isSelected: handledPermissions.CanUpdateBalancesUri && !!collection?.permissions.CanUpdateBalancesUri,
        },
      ]}
      onSwitchChange={(idx) => {
        updatePermissions(CanUpdateBalancesUriDigit, idx === 1);
      }}
      helperMessage="*If this permission is enabled (set to Yes), the manager can disable it at anytime. However, if disabled (set to No), it can never be re-enabled."
    />,
    disabled: !handledPermissions.CanUpdateBalancesUri
  }
}