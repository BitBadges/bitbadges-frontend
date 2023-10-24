import { UintRange, deepCopy } from "bitbadgesjs-proto";
import { BalancesActionPermissionUsedFlags, BitBadgesCollection, MetadataAddMethod, TimedUpdatePermissionUsedFlags, TimedUpdateWithBadgeIdsPermissionUsedFlags, castBalancesActionPermissionToUniversalPermission, castTimedUpdatePermissionToUniversalPermission, castTimedUpdateWithBadgeIdsPermissionToUniversalPermission, invertUintRanges, sortUintRangesAndMergeIfNecessary } from "bitbadgesjs-utils";
import { useEffect, useState } from "react";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/collections/CollectionsContext";
import { EmptyStepItem, NEW_COLLECTION_ID, useTxTimelineContext } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { getTotalNumberOfBadges } from "../../../bitbadges-api/utils/badges";
import { INFINITE_LOOP_MODE } from "../../../constants";
import { GO_MAX_UINT_64 } from "../../../utils/dates";
import { PermissionsOverview, getPermissionDetails } from "../../collection-page/PermissionsInfo";
import { PermissionUpdateSelectWrapper } from "../form-items/PermissionUpdateSelectWrapper";
import { SwitchForm } from "../form-items/SwitchForm";
import { isCompletelyNeutralOrCompletelyPermitted, isCompletelyForbidden } from "./CanUpdateOffChainBalancesStepItem";
import { neverHasManager } from "../../../bitbadges-api/utils/manager";

export const getBadgesWithLockedSupply = (collection: BitBadgesCollection<bigint>, startingCollection: BitBadgesCollection<bigint> | undefined, currentCollection = false) => {
  const collectionToCheck = currentCollection ? collection : startingCollection;
  if (!collectionToCheck) return [];

  const canCreateMoreBadgesRes = getPermissionDetails(
    collectionToCheck ? castBalancesActionPermissionToUniversalPermission(collectionToCheck.collectionPermissions.canCreateMoreBadges ?? []) : [],
    BalancesActionPermissionUsedFlags,
    neverHasManager(collectionToCheck)
  );

  const lockedBadgeIds = sortUintRangesAndMergeIfNecessary([...canCreateMoreBadgesRes.dataSource.map(x => x.forbidden ? x.badgeIds : undefined).filter(x => x !== undefined).flat() as UintRange<bigint>[]], true);
  return lockedBadgeIds
}

export const getBadgesWithUnlockedSupply = (collection: BitBadgesCollection<bigint>, startingCollection: BitBadgesCollection<bigint> | undefined, currentCollection = false) => {
  return invertUintRanges(getBadgesWithLockedSupply(collection, startingCollection, currentCollection), 1n, GO_MAX_UINT_64);
}


export function UpdatableMetadataSelectStepItem(
  collectionMetadataUpdate: boolean,
) {
  const collections = useCollectionsContext();
  const collection = collections.getCollection(NEW_COLLECTION_ID);
  const [checked, setChecked] = useState<boolean>(true);

  const txTimelineContext = useTxTimelineContext();
  const addMethod = collectionMetadataUpdate ? txTimelineContext.collectionAddMethod : txTimelineContext.badgeAddMethod;

  const [err, setErr] = useState<Error | null>(null);
  const [lastClickedIdx, setLastClickedIdx] = useState<number>(-1); //Note this is the user clicked idx. The highlighted idx is the idx of the permission that is currently selected. These may be mismatched
  const maxBadgeId = collection ? getTotalNumberOfBadges(collection) : 0n;
  const [lastClickedFrozen, setLastClickedFrozen] = useState<boolean>(false);


  //Since we depend on maxBadgeId and lockedBadges, we need to update the lastClickedIdx when these change (even if in other steps)
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('UpdatableMetadataSelectStepItem useEffect');
    if (lastClickedIdx !== -1 && !collectionMetadataUpdate) {
      handleSwitchChange(lastClickedIdx, lastClickedFrozen);
    }
  }, [maxBadgeId, collectionMetadataUpdate,]) //collection?.collectionPermissions.canCreateMoreBadges

  if (!collection) return EmptyStepItem;
  const permissionDetails = collectionMetadataUpdate ?
    getPermissionDetails(castTimedUpdatePermissionToUniversalPermission(collection?.collectionPermissions.canUpdateCollectionMetadata ?? []), TimedUpdatePermissionUsedFlags, neverHasManager(collection)) :
    getPermissionDetails(castTimedUpdateWithBadgeIdsPermissionToUniversalPermission(collection?.collectionPermissions.canUpdateBadgeMetadata ?? []), TimedUpdateWithBadgeIdsPermissionUsedFlags, neverHasManager(collection), [{ start: 1n, end: maxBadgeId }]);

  const badgeIdsWithLockedSupply = getBadgesWithLockedSupply(deepCopy(collection) as BitBadgesCollection<bigint>, undefined, true); //Get badge IDs that will have locked supply moving forward
  const badgeIdsToLockMetadata = sortUintRangesAndMergeIfNecessary([{ start: 1n, end: maxBadgeId }, ...badgeIdsWithLockedSupply], true);

  function AdditionalNode({ noOption }: {
    noOption?: boolean,
  }) {
    if (!collection) return <></>

    return <div className="flex-center">
      <PermissionsOverview
        span={24}
        collectionId={collection.collectionId}
        permissionName={collectionMetadataUpdate ? 'canUpdateCollectionMetadata' : 'canUpdateBadgeMetadata'}
        onFreezePermitted={noOption ? undefined : (frozen: boolean) => {
          handleSwitchChange(1, frozen);
          setLastClickedFrozen(frozen);
        }}
      />
    </div>
  }

  const options = [];
  options.push({
    title: 'No',
    message: `${addMethod === MetadataAddMethod.UploadUrl ? 'The URIs for the metadata (i.e. the self-hosted ones provided by you)' : 'The metadata'} will be frozen and cannot be updated after this transaction.`,
    isSelected: isCompletelyForbidden(permissionDetails),
    additionalNode: <AdditionalNode noOption />
  })

  options.push({
    title: 'Yes',
    message: <div>{`${addMethod === MetadataAddMethod.UploadUrl ? 'The URIs (i.e. the self-hosted URIs provided by you)' : 'The metadata'} can be updated.
    `}</div>,
    additionalNode: <AdditionalNode />,
    isSelected: isCompletelyNeutralOrCompletelyPermitted(permissionDetails),
  });

  const handleSwitchChangeIdxOnly = (idx: number) => {
    setLastClickedIdx(idx);
    handleSwitchChange(idx);
  }


  const handleSwitchChange = (idx: number, frozen?: boolean) => {

    if (collectionMetadataUpdate) {

      if (idx == 1 && !frozen) {
        collections.updateCollection({
          collectionId: NEW_COLLECTION_ID,
          collectionPermissions: {
            canUpdateCollectionMetadata: []
          }
        });

      } else if (idx == 1 && frozen) {
        collections.updateCollection({
          collectionId: NEW_COLLECTION_ID,
          collectionPermissions: {
            canUpdateCollectionMetadata: [{
              timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
              permittedTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
              forbiddenTimes: [],
            }]
          }
        });
      }

      else {
        collections.updateCollection({
          collectionId: NEW_COLLECTION_ID,
          collectionPermissions: {
            canUpdateCollectionMetadata: [{
              timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
              permittedTimes: [],
              forbiddenTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
            }]
          }
        });
      }
    } else {

      if (idx == 1 && !frozen) {
        collections.updateCollection({
          collectionId: NEW_COLLECTION_ID,
          collectionPermissions: {
            canUpdateBadgeMetadata: []
          }
        });

      } else if (idx == 1 && frozen) {
        collections.updateCollection({
          collectionId: NEW_COLLECTION_ID,
          collectionPermissions: {
            canUpdateBadgeMetadata: [{
              badgeIds: [{ start: 1n, end: GO_MAX_UINT_64 }],
              timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
              permittedTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
              forbiddenTimes: [],
            }]
          }
        });
      }
      else {
        collections.updateCollection({
          collectionId: NEW_COLLECTION_ID,
          collectionPermissions: {
            canUpdateBadgeMetadata: [{
              badgeIds: badgeIdsToLockMetadata,
              timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
              permittedTimes: [],
              forbiddenTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
            }]
          }
        });
      }
    }
  }

  let description = `Following this transaction, do you want to be able to update the metadata for ${collectionMetadataUpdate ? 'the collection' : 'the created badges'}?`

  return {
    title: collectionMetadataUpdate ? 'Update collection metadata?' : 'Updatable badge metadata?',
    description: description,
    node: <PermissionUpdateSelectWrapper
      checked={checked}
      setChecked={setChecked}
      err={err}
      setErr={setErr}
      permissionName={collectionMetadataUpdate ? 'canUpdateCollectionMetadata' : 'canUpdateBadgeMetadata'}
      node={<>
        <SwitchForm
          options={options}
          showCustomOption
          onSwitchChange={handleSwitchChangeIdxOnly}
        />
      </>
      }
    />,
    disabled: !!err
  }
}