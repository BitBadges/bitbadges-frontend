import { InfoCircleOutlined } from "@ant-design/icons";
import { Col, Divider, Typography } from "antd";
import { BalancesActionPermission } from "bitbadgesjs-proto";
import { BalancesActionPermissionUsedFlags, castBalancesActionPermissionToUniversalPermission } from "bitbadgesjs-utils";
import { useEffect, useState } from "react";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { EmptyStepItem, MSG_PREVIEW_ID } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { getTotalNumberOfBadges } from "../../../bitbadges-api/utils/badges";
import { INFINITE_LOOP_MODE } from "../../../constants";
import { GO_MAX_UINT_64 } from "../../../utils/dates";
import { getPermissionDetails } from "../../collection-page/PermissionsInfo";
import { DevMode } from "../../common/DevMode";
import { PermissionUpdateSelectWrapper } from "../form-items/PermissionUpdateSelectWrapper";
import { SwitchForm } from "../form-items/SwitchForm";

const DefaultCombinations = [{}];

const DefaultCombinationsEverythingLocked = [{},
//Everything forbidden is already locked, we just lock everything else that is permitted here
{
  badgeIdsOptions: { allValues: true },
  ownershipTimesOptions: { allValues: true },
  permittedTimesOptions: { allValues: true },
  forbiddenTimesOptions: { noValues: true },
}];

const AlwaysLockedPermission: BalancesActionPermission<bigint> = {
  defaultValues: {
    badgeIds: [{ start: 1n, end: GO_MAX_UINT_64 }],
    ownershipTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
    permittedTimes: [],
    forbiddenTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
  },
  combinations: DefaultCombinations
}

export function CanCreateMoreStepItem() {
  const collections = useCollectionsContext();
  const collection = collections.collections[MSG_PREVIEW_ID.toString()];

  const [checked, setChecked] = useState<boolean>(true);
  const [err, setErr] = useState<Error | null>(null);
  const [lastClickedIdx, setLastClickedIdx] = useState<number>(-1);

  const maxBadgeId = collection ? getTotalNumberOfBadges(collection) : 0n;

  //If we add badges to the collection, we need to update the permission to reflect the new max badge id
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('UpdatableMetadataSelectStepItem useEffect');
    if (lastClickedIdx !== -1) {
      handleSwitchChange(lastClickedIdx, everythingLocked);
    }
  }, [maxBadgeId, lastClickedIdx]);

  if (!collection) return EmptyStepItem;

  const permissionDetails = getPermissionDetails(castBalancesActionPermissionToUniversalPermission(collection?.collectionPermissions.canCreateMoreBadges ?? []), BalancesActionPermissionUsedFlags);


  const currentlyMintedPermissionDetails = getPermissionDetails(castBalancesActionPermissionToUniversalPermission(collection?.collectionPermissions.canCreateMoreBadges ?? []), BalancesActionPermissionUsedFlags, undefined, [{ start: 1n, end: maxBadgeId }]);
  const currentlyMintedHasPermittedTimes = currentlyMintedPermissionDetails.dataSource.some(x => x.permitted);
  const currentlyMintedHasNeutralTimes = currentlyMintedPermissionDetails.dataSource.some(x => !x.permitted && !x.forbidden);
  const currentlyMintedHasForbiddenTimes = currentlyMintedPermissionDetails.dataSource.some(x => x.forbidden);

  const allUnmintedPermissionDetails = getPermissionDetails(castBalancesActionPermissionToUniversalPermission(collection?.collectionPermissions.canCreateMoreBadges ?? []), BalancesActionPermissionUsedFlags, undefined, [{ start: maxBadgeId + 1n, end: GO_MAX_UINT_64 }]);
  const allUnmintedHasPermittedTimes = allUnmintedPermissionDetails.dataSource.some(x => x.permitted);
  const allUnmintedHasNeutralTimes = allUnmintedPermissionDetails.dataSource.some(x => !x.permitted && !x.forbidden);
  const allUnmintedHasForbiddenTimes = allUnmintedPermissionDetails.dataSource.some(x => x.forbidden);

  const everythingLocked = !permissionDetails.hasNeutralTimes;

  const handleSwitchChange = (idx: number, locked?: boolean) => {
    const permissions =
      handleLocked(!!locked,
        idx === 0 ? [{
          ...AlwaysLockedPermission,
        }] :
          idx === 1 ? [{
            defaultValues: {
              ...AlwaysLockedPermission.defaultValues,
              badgeIds: [{ start: 1n, end: maxBadgeId }],
            },
            combinations: locked ? DefaultCombinationsEverythingLocked : DefaultCombinations
          }] : idx === 2 ? [{
            defaultValues: {
              ...AlwaysLockedPermission.defaultValues,
              badgeIds: [{ start: maxBadgeId + 1n, end: GO_MAX_UINT_64 }],
            },
            combinations: locked ? DefaultCombinationsEverythingLocked : DefaultCombinations
          }] : []
      )

    collections.updateCollection({
      ...collection,
      collectionPermissions: {
        ...collection.collectionPermissions,
        canCreateMoreBadges: permissions
      }
    });
  }

  const handleLocked = (locked: boolean, permissions: BalancesActionPermission<bigint>[]) => {
    const permissionDetails = getPermissionDetails(castBalancesActionPermissionToUniversalPermission(permissions), BalancesActionPermissionUsedFlags);
    if (!permissionDetails.hasForbiddenTimes) {
      if (!locked) return [];
      else return [{
        ...AlwaysLockedPermission,
        combinations: [DefaultCombinationsEverythingLocked[1]]
      }]
    }

    if (locked) {
      return permissions.map(x => ({
        ...x,
        combinations: DefaultCombinationsEverythingLocked,
      }))
    } else {
      return permissions.map(x => ({
        ...x,
        combinations: DefaultCombinations
      }))
    }


  }



  const completelyFrozen = !permissionDetails.hasPermittedTimes && !permissionDetails.hasNeutralTimes
  return {
    title: 'Can Create More Badges',
    description: `Can new badges be added to this collection by the manager?`,
    node: <PermissionUpdateSelectWrapper
      checked={checked}
      setChecked={setChecked}
      err={err}
      setErr={setErr}
      permissionName="canCreateMoreBadges"
      node={<>
        <SwitchForm
          showCustomOption
          options={[
            {
              title: 'No',
              message: `New badges can never be added to this collection. The circulating supplys will all be final after this transaction.`,
              isSelected: completelyFrozen,
            },
            {
              title: 'Unique Badges Only',
              message: `In the future, new unique badges (i.e. badges with new IDs) can be added, but any existing badge's supply can never be increased.`,
              isSelected: //all are forbidden explicitly for the currently minted badges
                !completelyFrozen && !currentlyMintedHasPermittedTimes && !currentlyMintedHasNeutralTimes && !allUnmintedHasForbiddenTimes
            },
            {
              title: 'Increment Supply Only',
              message: `In the future, the supply of existing badges can be increased, but no new unique badges (i.e. badges with new IDs) can ever be created.`,
              isSelected: //all are forbidden explicitly for all future badges
                !completelyFrozen && !allUnmintedHasPermittedTimes && !allUnmintedHasNeutralTimes && !currentlyMintedHasForbiddenTimes
            },
            {
              title: 'Any',
              message: `In the future, new unique badges (i.e. badges with new IDs) can be added, and the supply of existing badges can be increased.`,
              isSelected: !permissionDetails.hasForbiddenTimes
            },
          ]}
          onSwitchChange={(idx) => {
            setLastClickedIdx(idx);
          }}
          helperMessage=""
        />
        <Divider />
        {(permissionDetails.hasNeutralTimes || permissionDetails.hasPermittedTimes) && <>
          <Col md={24} xs={24} style={{ textAlign: 'center' }}>
            <Typography.Text className='primary-text' strong style={{ textAlign: 'center', alignContent: 'center', fontSize: 24, alignItems: 'center' }}>
              Permitted Options
            </Typography.Text>
          </Col>
          <div className="primary-text" style={{ textAlign: 'center' }}>
            <InfoCircleOutlined style={{ marginRight: 4 }} /> Permitted values can be set to either be updatable (neutral) or frozen (permanently permitted).
          </div>
          <SwitchForm
            showCustomOption
            options={[
              {
                title: 'Updatable',
                message: `The permitted values will be set to permitted but can be updated by the manager. In the future, they can either be set to be permanently permitted or disabled (permanently forbidden).`,
                isSelected: !everythingLocked,
              },
              {
                title: 'Frozen',
                message: `Moving forward, this permission will be frozen and not updatable.`,
                isSelected: everythingLocked,
              },
            ]}

            onSwitchChange={(idx) => {
              collections.updateCollection({
                ...collection,
                collectionPermissions: {
                  ...collection.collectionPermissions,
                  canCreateMoreBadges: handleLocked(idx === 1, collection.collectionPermissions.canCreateMoreBadges)
                }
              });
            }}
            helperMessage=""
          />

          <br />
          <br />
        </>}

        <DevMode obj={collection.collectionPermissions.canCreateMoreBadges} />
      </>
      }
    />,
    disabled: !!err,
  }
}