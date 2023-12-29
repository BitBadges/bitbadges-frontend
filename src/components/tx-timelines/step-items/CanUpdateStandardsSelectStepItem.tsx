import { TimedUpdatePermissionUsedFlags, castTimedUpdatePermissionToUniversalPermission } from "bitbadgesjs-utils";
import { useState } from "react";

import { EmptyStepItem, NEW_COLLECTION_ID } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { GO_MAX_UINT_64 } from "../../../utils/dates";
import { PermissionsOverview, getPermissionDetails } from "../../collection-page/PermissionsInfo";
import { PermissionUpdateSelectWrapper } from "../form-items/PermissionUpdateSelectWrapper";
import { SwitchForm } from "../form-items/SwitchForm";
import { isCompletelyNeutralOrCompletelyPermitted, isCompletelyForbidden } from "./CanUpdateOffChainBalancesStepItem";
import { neverHasManager } from "../../../bitbadges-api/utils/manager";
import { updateCollection, useCollection } from "../../../bitbadges-api/contexts/collections/CollectionsContext";

export function CanUpdateStandardsStepItem() {


  const collection = useCollection(NEW_COLLECTION_ID);

  const [checked, setChecked] = useState<boolean>(true);
  const [err, setErr] = useState<Error | null>(null);

  if (!collection) return EmptyStepItem;

  const permissionDetails = getPermissionDetails(castTimedUpdatePermissionToUniversalPermission(collection?.collectionPermissions.canUpdateStandards ?? []), TimedUpdatePermissionUsedFlags, neverHasManager(collection));
  const AdditionalNode = () => <>
    <div className="flex-center">
      <PermissionsOverview
        span={24}
        collectionId={collection.collectionId}
        permissionName="canUpdateStandards"
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

    updateCollection({
      collectionId: NEW_COLLECTION_ID,
      collectionPermissions: {
        canUpdateStandards: idx === 0 ? [{
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
    title: 'Can update standards?',
    description: `Can the manager update the standards for this collection?`,
    node: () => <PermissionUpdateSelectWrapper
      checked={checked}
      setChecked={setChecked}
      err={err}
      setErr={setErr}
      permissionName="canUpdateStandards"
      node={() => <>
        <SwitchForm
          showCustomOption
          options={[
            {
              title: 'No',
              message: `The manager can never update the standards for this collection. They will be frozen forever.`,
              isSelected: isCompletelyForbidden(permissionDetails),
              additionalNode: AdditionalNode
            },
            {
              title: 'Yes',
              message: `The manager can update the standards for this collection`,
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