import { CanCreateMoreBadgesDigit, Permissions } from "bitbadgesjs-utils";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { MSG_PREVIEW_ID } from "../TxTimeline";
import { SwitchForm } from "../form-items/SwitchForm";

export function CanCreateMoreStepItem(
  handledPermissions: Permissions,
  updatePermissions: (digit: number, value: boolean) => void
) {
  const collections = useCollectionsContext();
  const collection = collections.getCollection(MSG_PREVIEW_ID);


  return {
    title: 'Can Add Badges?',
    description: ``,
    node: <SwitchForm
      // 
      options={[
        {
          title: 'No',
          message: `New badges can never be added to this collection. The badge amounts selected in the previous step can never be added to.`,
          isSelected: handledPermissions.CanCreateMoreBadges && !collection?.permissions.CanCreateMoreBadges
        },
        {
          title: 'Yes',
          message: `In the future, new badges can be added to this collection by the manager.`,
          isSelected: handledPermissions.CanCreateMoreBadges && !!collection?.permissions.CanCreateMoreBadges,
        },
      ]}
      onSwitchChange={(idx) => {
        updatePermissions(CanCreateMoreBadgesDigit, idx === 1);
      }}
      helperMessage="*If this permission is enabled (set to Yes), the manager can disable it at anytime. However, if disabled (set to No), it can never be re-enabled."
    />,
    disabled: !handledPermissions.CanCreateMoreBadges
  }
}