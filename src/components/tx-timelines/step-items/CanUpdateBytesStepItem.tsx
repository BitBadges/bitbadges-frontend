import { CollectionPermissions, TimedUpdatePermission } from "bitbadgesjs-proto";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { FOREVER_DATE } from "../../../utils/dates";
import { EmptyStepItem, MSG_PREVIEW_ID } from "../TxTimeline";
import { SwitchForm } from "../form-items/SwitchForm";

export function CanUpdateBalancesStepItem(
  handledPermissions: CollectionPermissions<bigint>,
  setHandledPermissions: (permissions: CollectionPermissions<bigint>) => void
) {
  const collections = useCollectionsContext();
  const collection = collections.collections[MSG_PREVIEW_ID.toString()];

  if (!collection) return EmptyStepItem;


  return {
    title: 'Can Update Balances?',
    description: ``,
    node: <SwitchForm
      options={[
        {
          title: 'No',
          message: `The balances (who owns the badge?) are permanent and can never be updated.`,
          isSelected: handledPermissions.canUpdateOffChainBalancesMetadata.length > 0 && collection?.collectionPermissions.canUpdateOffChainBalancesMetadata.length > 0
        },
        {
          title: 'Yes',
          message: `The balances (who owns the badge?) can be updated by the manager.`,
          isSelected: handledPermissions.canUpdateOffChainBalancesMetadata.length > 0 && collection?.collectionPermissions.canUpdateOffChainBalancesMetadata.length === 0,
        },
      ]}
      onSwitchChange={(idx) => {
        setHandledPermissions({
          ...handledPermissions,
          canUpdateOffChainBalancesMetadata: [{} as TimedUpdatePermission<bigint>]
        });

        collections.updateCollection({
          ...collection,
          collectionPermissions: {
            ...collection.collectionPermissions,
            canUpdateOffChainBalancesMetadata: idx === 0 ? [{
              defaultValues: {
                timelineTimes: [{ start: 1n, end: FOREVER_DATE }],
                permittedTimes: [],
                forbiddenTimes: [{ start: 1n, end: FOREVER_DATE }],
              },
              combinations: [{
                permittedTimesOptions: { invertDefault: false, allValues: false, noValues: false },
                forbiddenTimesOptions: { invertDefault: false, allValues: false, noValues: false },
                timelineTimesOptions: { invertDefault: false, allValues: false, noValues: false },
              }]
            }] : []
          }
        });
      }}
      helperMessage="*If this permission is enabled (set to Yes), the manager can disable it at anytime. However, if disabled (set to No), it can never be re-enabled."
    />,
    disabled: handledPermissions.canUpdateOffChainBalancesMetadata.length === 0,
  }
}