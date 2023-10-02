import { UintRange } from "bitbadgesjs-proto";
import { BalancesActionPermissionUsedFlags, MetadataAddMethod, TimedUpdatePermissionUsedFlags, TimedUpdateWithBadgeIdsPermissionUsedFlags, castBalancesActionPermissionToUniversalPermission, castTimedUpdatePermissionToUniversalPermission, castTimedUpdateWithBadgeIdsPermissionToUniversalPermission, sortUintRangesAndMergeIfNecessary } from "bitbadgesjs-utils";
import { useEffect, useState } from "react";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { EmptyStepItem, MSG_PREVIEW_ID, useTxTimelineContext } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { getTotalNumberOfBadges } from "../../../bitbadges-api/utils/badges";
import { INFINITE_LOOP_MODE } from "../../../constants";
import { GO_MAX_UINT_64 } from "../../../utils/dates";
import { PermissionsOverview, getPermissionDetails } from "../../collection-page/PermissionsInfo";
import { PermissionUpdateSelectWrapper } from "../form-items/PermissionUpdateSelectWrapper";
import { SwitchForm } from "../form-items/SwitchForm";

export function UpdatableMetadataSelectStepItem(
  collectionMetadataUpdate: boolean,
) {
  const collections = useCollectionsContext();
  const collection = collections.collections[MSG_PREVIEW_ID.toString()];
  const [checked, setChecked] = useState<boolean>(true);

  const txTimelineContext = useTxTimelineContext();
  const addMethod = txTimelineContext.addMethod;

  const [err, setErr] = useState<Error | null>(null);
  const [lastClickedIdx, setLastClickedIdx] = useState<number>(-1); //Note this is the user clicked idx. The highlighted idx is the idx of the permission that is currently selected. These may be mismatched
  const maxBadgeId = collection ? getTotalNumberOfBadges(collection) : 0n;
  const [lastClickedFrozen, setLastClickedFrozen] = useState<boolean>(false);

  const permissionDetails = collectionMetadataUpdate ?
    getPermissionDetails(castTimedUpdatePermissionToUniversalPermission(collection?.collectionPermissions.canUpdateCollectionMetadata ?? []), TimedUpdatePermissionUsedFlags) :
    getPermissionDetails(castTimedUpdateWithBadgeIdsPermissionToUniversalPermission(collection?.collectionPermissions.canUpdateBadgeMetadata ?? []), TimedUpdateWithBadgeIdsPermissionUsedFlags);

  const currentlyMintedPermissionDetails = getPermissionDetails(castTimedUpdateWithBadgeIdsPermissionToUniversalPermission(collection?.collectionPermissions.canUpdateBadgeMetadata ?? []), TimedUpdateWithBadgeIdsPermissionUsedFlags, undefined, [{ start: 1n, end: maxBadgeId }]);
  const currentlyMintedHasPermittedTimes = currentlyMintedPermissionDetails.dataSource.some(x => x.permitted);
  const currentlyMintedHasForbiddenTimes = currentlyMintedPermissionDetails.dataSource.some(x => x.forbidden);
  const currentlyMintedHasNeutralTimes = currentlyMintedPermissionDetails.dataSource.some(x => !x.permitted && !x.forbidden);

  const lockedBadges = getPermissionDetails(
    castBalancesActionPermissionToUniversalPermission(collection?.collectionPermissions.canCreateMoreBadges ?? []),
    BalancesActionPermissionUsedFlags
  );
  const lockedBadgeIds = sortUintRangesAndMergeIfNecessary([{ start: 1n, end: maxBadgeId }, ...lockedBadges.dataSource.map(x => x.forbidden ? x.badgeIds : undefined).filter(x => x !== undefined).flat() as UintRange<bigint>[]]);

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('UpdatableMetadataSelectStepItem useEffect');
    if (lastClickedIdx !== -1 && !collectionMetadataUpdate) {


      handleSwitchChange(lastClickedIdx, lastClickedFrozen);
    }
  }, [maxBadgeId, collectionMetadataUpdate, lockedBadges])


  if (!collection) return EmptyStepItem;

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
    isSelected:
      collectionMetadataUpdate ?
        !permissionDetails.hasNeutralTimes && !permissionDetails.hasPermittedTimes
        : !currentlyMintedHasNeutralTimes && !currentlyMintedHasPermittedTimes,
    additionalNode: <AdditionalNode noOption />
  })

  options.push({
    title: 'Yes',
    message: <div>{`${addMethod === MetadataAddMethod.UploadUrl ? 'The URIs (i.e. the self-hosted URIs provided by you)' : 'The metadata'} can be updated.
    `}</div>,
    additionalNode: <AdditionalNode />,
    isSelected:
      (collectionMetadataUpdate ?
        permissionDetails.hasNeutralTimes && !permissionDetails.hasPermittedTimes && !permissionDetails.hasForbiddenTimes
        : currentlyMintedHasNeutralTimes && !currentlyMintedHasPermittedTimes && !currentlyMintedHasForbiddenTimes)
      ||
      (collectionMetadataUpdate ?
        !permissionDetails.hasNeutralTimes && !permissionDetails.hasForbiddenTimes
        : !currentlyMintedHasNeutralTimes && !currentlyMintedHasForbiddenTimes)
  });

  const handleSwitchChangeIdxOnly = (idx: number) => {
    setLastClickedIdx(idx);
    handleSwitchChange(idx);
  }


  const handleSwitchChange = (idx: number, frozen?: boolean) => {

    if (collectionMetadataUpdate) {

      if (idx == 1 && !frozen) {
        collections.updateCollection({
          ...collection,
          collectionPermissions: {
            ...collection.collectionPermissions,
            canUpdateCollectionMetadata: []
          }
        });

      } else if (idx == 1 && frozen) {
        collections.updateCollection({
          ...collection,
          collectionPermissions: {
            ...collection.collectionPermissions,
            canUpdateCollectionMetadata: [{
              defaultValues: {
                timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                permittedTimes: [],
                forbiddenTimes: [],
              },
              combinations: [{
                permittedTimesOptions: { allValues: true },
                forbiddenTimesOptions: { noValues: true },
                timelineTimesOptions: { allValues: true },
              }]
            }]
          }

        });
      }

      else {
        collections.updateCollection({
          ...collection,
          collectionPermissions: {
            ...collection.collectionPermissions,

            canUpdateCollectionMetadata: [{
              defaultValues: {
                timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                permittedTimes: [],
                forbiddenTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
              },
              combinations: [{}]
            }]
          }

        });
      }
    } else {

      if (idx == 1 && !frozen) {
        collections.updateCollection({
          ...collection,
          collectionPermissions: {
            ...collection.collectionPermissions,
            canUpdateBadgeMetadata: []
          }
        });

      } else if (idx == 1 && frozen) {
        collections.updateCollection({
          ...collection,
          collectionPermissions: {
            ...collection.collectionPermissions,
            canUpdateBadgeMetadata: [{
              defaultValues: {
                badgeIds: lockedBadgeIds,
                timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                permittedTimes: [],
                forbiddenTimes: [],
              },
              combinations: [{
                permittedTimesOptions: { allValues: true },
                forbiddenTimesOptions: { noValues: true },
                timelineTimesOptions: { allValues: true },
                badgeIdsOptions: { allValues: true },
              }]
            }]
          }

        });
      }

      else {
        collections.updateCollection({
          ...collection,
          collectionPermissions: {
            ...collection.collectionPermissions,

            canUpdateBadgeMetadata: [{
              defaultValues: {
                badgeIds: lockedBadgeIds,
                timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                permittedTimes: [],
                forbiddenTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
              },
              combinations: [{}]
            }]
          }

        });
      }

    }
  }

  let description = `Following this transaction, do you want to be able to update the metadata for ${collectionMetadataUpdate ? 'the collection' : 'the created badges'}? This includes the name, description, image, and other metadata.`



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