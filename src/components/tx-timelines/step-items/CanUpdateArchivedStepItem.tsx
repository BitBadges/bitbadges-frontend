import { TimedUpdatePermissionUsedFlags, castTimedUpdatePermissionToUniversalPermission } from "bitbadgesjs-utils";
import { useState } from "react";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/collections/CollectionsContext";
import { EmptyStepItem, NEW_COLLECTION_ID } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { GO_MAX_UINT_64 } from "../../../utils/dates";
import { PermissionsOverview, getPermissionDetails } from "../../collection-page/PermissionsInfo";
import { PermissionUpdateSelectWrapper } from "../form-items/PermissionUpdateSelectWrapper";
import { SwitchForm } from "../form-items/SwitchForm";
import { isCompletelyNeutralOrCompletelyPermitted, isCompletelyForbidden } from "./CanUpdateOffChainBalancesStepItem";
import { neverHasManager } from "../../../bitbadges-api/utils/manager";

export function CanArchiveCollectionStepItem() {

  const collections = useCollectionsContext();
  const collection = collections.getCollection(NEW_COLLECTION_ID);

  const [checked, setChecked] = useState<boolean>(true);
  const [err, setErr] = useState<Error | null>(null);

  if (!collection) return EmptyStepItem;

  const permissionDetails = getPermissionDetails(castTimedUpdatePermissionToUniversalPermission(collection?.collectionPermissions.canArchiveCollection ?? []), TimedUpdatePermissionUsedFlags, neverHasManager(collection));
  const AdditionalNode = <>
    <div className="flex-center">
      <PermissionsOverview
        span={24}
        collectionId={collection.collectionId}
        permissionName="canArchiveCollection"
        onFreezePermitted={(frozen: boolean) => {
          handleSwitchChange(1, frozen);
        }}
      />
    </div>
  </>

  const handleSwitchChangeIdxOnly = (idx: number) => {
    handleSwitchChange(idx);
  }

  const handleSwitchChange = (idx: number, frozen?: boolean) => {

    collections.updateCollection({
      collectionId: NEW_COLLECTION_ID,
      collectionPermissions: {
        canArchiveCollection: idx === 0 ? [{
          timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
          permittedTimes: [],
          forbiddenTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
        }] : idx == 1 && !frozen ? [] : [{
          timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
          permittedTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
          forbiddenTimes: [],
        }]
      }
    });
  }


  return {
    title: 'Can archive / unarchive collection?',
    description: `When a collection is archived, all transaactions are disabled until unarchived.`,
    node: <PermissionUpdateSelectWrapper
      checked={checked}
      setChecked={setChecked}
      err={err}
      setErr={setErr}
      permissionName="canArchiveCollection"
      node={<>
        <SwitchForm
          showCustomOption
          options={[
            {
              title: 'No',
              message: `The collection can never be archived or unarchived by the manager. This permission can not be updated. It will be frozen forever.`,
              isSelected: isCompletelyForbidden(permissionDetails),
              additionalNode: AdditionalNode
            },
            {
              title: 'Yes',
              message: `The collection can be archived or unarchived by the manager.`,
              isSelected: isCompletelyNeutralOrCompletelyPermitted(permissionDetails),
              additionalNode: AdditionalNode
            }
          ]}
          onSwitchChange={handleSwitchChangeIdxOnly}
        />
        <br />
        <br />

      </>
      }
    />
    ,
    disabled: !!err,

  }
}