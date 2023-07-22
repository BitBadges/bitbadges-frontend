import { BalancesActionPermission, CollectionPermissions } from "bitbadgesjs-proto";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { FOREVER_DATE } from "../../../utils/dates";
import { EmptyStepItem, MSG_PREVIEW_ID } from "../TxTimeline";
import { SwitchForm } from "../form-items/SwitchForm";

export function CanCreateMoreStepItem(
  handledPermissions: CollectionPermissions<bigint>,
  setHandledPermissions: (permissions: CollectionPermissions<bigint>) => void
) {
  const collections = useCollectionsContext();
  const collection = collections.collections[MSG_PREVIEW_ID.toString()];

  if (!collection) return EmptyStepItem;

  return {
    title: 'Can Add Badges?',
    description: ``,
    node: <SwitchForm
      // 
      options={[
        {
          title: 'No',
          message: `New badges can never be added to this collection. The badge amounts selected in the previous step can never be added to.`,
          isSelected: handledPermissions.canCreateMoreBadges.length > 0 && collection.collectionPermissions.canCreateMoreBadges.length > 0
        },
        {
          title: 'Yes',
          message: `In the future, new badges can be added to this collection by the manager.`,
          isSelected: handledPermissions.canCreateMoreBadges.length > 0 && collection.collectionPermissions.canCreateMoreBadges.length === 0,
        },
      ]}
      onSwitchChange={(idx) => {
        setHandledPermissions({
          ...handledPermissions,
          canCreateMoreBadges: [{} as BalancesActionPermission<bigint>]
        });

        collections.updateCollection({
          ...collection,
          collectionPermissions: {
            ...collection.collectionPermissions,
            canCreateMoreBadges: idx === 0 ? [{
              defaultValues: {
                badgeIds: [{ start: 1n, end: FOREVER_DATE }],
                ownedTimes: [{ start: 1n, end: FOREVER_DATE }],
                permittedTimes: [],
                forbiddenTimes: [{ start: 1n, end: FOREVER_DATE }],
              },
              combinations: [{
                badgeIdsOptions: { invertDefault: false, allValues: false, noValues: false },
                ownedTimesOptions: { invertDefault: false, allValues: false, noValues: false },
                permittedTimesOptions: { invertDefault: false, allValues: false, noValues: false },
                forbiddenTimesOptions: { invertDefault: false, allValues: false, noValues: false },
              }]
            }] : []
          }
        });
      }}
      helperMessage="*If this permission is enabled (set to Yes), the manager can disable it at anytime. However, if disabled (set to No), it can never be re-enabled."
    />,
    disabled: handledPermissions.canCreateMoreBadges.length == 0
  }
}