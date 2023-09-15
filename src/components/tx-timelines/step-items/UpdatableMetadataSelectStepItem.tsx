import { MetadataAddMethod, TimedUpdatePermissionUsedFlags, TimedUpdateWithBadgeIdsPermissionUsedFlags, castTimedUpdatePermissionToUniversalPermission, castTimedUpdateWithBadgeIdsPermissionToUniversalPermission, removeUintRangeFromUintRange } from "bitbadgesjs-utils";
import { useState } from "react";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { EmptyStepItem, MSG_PREVIEW_ID } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { GO_MAX_UINT_64 } from "../../../utils/dates";
import { PermissionUpdateSelectWrapper } from "../form-items/PermissionUpdateSelectWrapper";
import { SwitchForm } from "../form-items/SwitchForm";
import { BeforeAfterPermission } from "../form-items/BeforeAfterPermission";
import { getPermissionDataSource } from "../../collection-page/PermissionsInfo";
import { getTotalNumberOfBadges } from "../../../bitbadges-api/utils/badges";
import { Typography } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";

export function UpdatableMetadataSelectStepItem(

  addMethod: MetadataAddMethod,
  collectionMetadataUpdate: boolean,
  existingCollectionId?: bigint,
) {
  const collections = useCollectionsContext();
  const collection = collections.collections[MSG_PREVIEW_ID.toString()];
  const [checked, setChecked] = useState<boolean>(true);

  const [err, setErr] = useState<Error | null>(null);
  if (!collection) return EmptyStepItem;

  let maxBadgeId = getTotalNumberOfBadges(collection);
  // const permissionDetails = getPermissionDataSource(castBalancesActionPermissionToUniversalPermission(collection?.collectionPermissions.canCreateMoreBadges ?? []), BalancesActionPermissionUsedFlags);
  const permissionDetails =
    collectionMetadataUpdate ?
      getPermissionDataSource(castTimedUpdatePermissionToUniversalPermission(collection?.collectionPermissions.canUpdateCollectionMetadata ?? []), TimedUpdatePermissionUsedFlags) :
      getPermissionDataSource(castTimedUpdateWithBadgeIdsPermissionToUniversalPermission(collection?.collectionPermissions.canUpdateBadgeMetadata ?? []), TimedUpdateWithBadgeIdsPermissionUsedFlags);

  const currentlyMintedPermissionDetails = permissionDetails.dataSource.map(x => {
    const [remaining, removed] = removeUintRangeFromUintRange([{ start: 1n, end: maxBadgeId }], x.badgeIds ?? []);

    return {
      ...x,
      badgeIds: removed,
    }
  }).filter(x => x.badgeIds.length > 0);
  const currentlyMintedHasPermittedTimes = currentlyMintedPermissionDetails.some(x => x.permitted);
  const currentlyMintedHasForbiddenTimes = currentlyMintedPermissionDetails.some(x => x.forbidden);
  const currentlyMintedHasNeutralTimes = currentlyMintedPermissionDetails.some(x => !x.permitted && !x.forbidden);

  const options = [];
  options.push({
    title: 'No',
    message: `${addMethod === MetadataAddMethod.UploadUrl ? 'The URIs for the metadata (i.e. the self-hosted ones provided by you)' : 'The metadata'} of the created badges will be frozen and cannot be updated after this transaction.`,
    isSelected:
      collectionMetadataUpdate ?
        !permissionDetails.hasNeutralTimes && !permissionDetails.hasPermittedTimes
        : !currentlyMintedHasNeutralTimes && !currentlyMintedHasPermittedTimes
  })

  options.push({
    title: 'Yes - Updatable',
    message: <div>{`${addMethod === MetadataAddMethod.UploadUrl ? 'The URIs (i.e. the self-hosted URIs provided by you)' : 'The metadata'} can be updated. This permission will remain updatable. In the future, the manager can change this permission to be permanently allowed or permanently forbidden.
    `}</div>,
    isSelected:
      collectionMetadataUpdate ?
        permissionDetails.hasNeutralTimes && !permissionDetails.hasPermittedTimes && !permissionDetails.hasForbiddenTimes
        : currentlyMintedHasNeutralTimes && !currentlyMintedHasPermittedTimes && !currentlyMintedHasForbiddenTimes
  });

  options.push({
    title: 'Yes - Frozen',
    message: <div>{`${addMethod === MetadataAddMethod.UploadUrl ? 'The URIs (i.e. the self-hosted URIs provided by you)' : 'The metadata'} can always be updated. This permission is permanently permitted.`}</div>,
    isSelected:
      collectionMetadataUpdate ?
        !permissionDetails.hasNeutralTimes && !permissionDetails.hasForbiddenTimes
        : !currentlyMintedHasNeutralTimes && !currentlyMintedHasForbiddenTimes
  });


  let description = `Following this transaction, do you want to be able to update the metadata for ${collectionMetadataUpdate ? 'the collection' : 'the created badges'}? This includes the name, description, image, and other metadata.`


  return {
    title: collectionMetadataUpdate ? 'Updatable Collection Metadata?' : 'Updatable Badge Metadata?',
    description: description,
    node: <PermissionUpdateSelectWrapper
      checked={checked}
      setChecked={setChecked}
      err={err}
      setErr={setErr}
      permissionName={collectionMetadataUpdate ? 'canUpdateCollectionMetadata' : 'canUpdateBadgeMetadata'}
      existingCollectionId={existingCollectionId}
      node={<>
        <SwitchForm
          options={options}
          showCustomOption
          onSwitchChange={(_idx, title) => {
            if (collectionMetadataUpdate) {

              if (title === "Yes - Updatable") {
                collections.updateCollection({
                  ...collection,
                  collectionPermissions: {
                    ...collection.collectionPermissions,
                    canUpdateCollectionMetadata: []
                  }
                });

              } else if (title === "Yes - Frozen") {
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
                        permittedTimesOptions: { invertDefault: false, allValues: true, noValues: false },
                        forbiddenTimesOptions: { invertDefault: false, allValues: false, noValues: true },
                        timelineTimesOptions: { invertDefault: false, allValues: true, noValues: false },
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
                      combinations: [{
                        // permittedTimesOptions: { invertDefault: false, allValues: false, noValues: false },
                        // forbiddenTimesOptions: { invertDefault: false, allValues: false, noValues: false },
                        // timelineTimesOptions: { invertDefault: false, allValues: false, noValues: false },
                      }]
                    }]
                  }

                });
              }
            } else {

              if (title === "Yes - Updatable") {
                collections.updateCollection({
                  ...collection,
                  collectionPermissions: {
                    ...collection.collectionPermissions,
                    canUpdateBadgeMetadata: []
                  }
                });

              } else if (title === "Yes - Frozen") {
                collections.updateCollection({
                  ...collection,
                  collectionPermissions: {
                    ...collection.collectionPermissions,
                    canUpdateBadgeMetadata: [{
                      defaultValues: {
                        badgeIds: [{ start: 1n, end: maxBadgeId }],
                        timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                        permittedTimes: [],
                        forbiddenTimes: [],
                      },
                      combinations: [{
                        permittedTimesOptions: { invertDefault: false, allValues: true, noValues: false },
                        forbiddenTimesOptions: { invertDefault: false, allValues: false, noValues: true },
                        timelineTimesOptions: { invertDefault: false, allValues: true, noValues: false },
                        badgeIdsOptions: { invertDefault: false, allValues: true, noValues: false },
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
                        badgeIds: [{ start: 1n, end: maxBadgeId }],
                        timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                        permittedTimes: [],
                        forbiddenTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                      },
                      combinations: [{
                        // badgeIdsOptions: { invertDefault: false, allValues: false, noValues: false },
                        // permittedTimesOptions: { invertDefault: false, allValues: false, noValues: false },
                        // forbiddenTimesOptions: { invertDefault: false, allValues: false, noValues: false },
                        // timelineTimesOptions: { invertDefault: false, allValues: false, noValues: false },
                      }]
                    }]
                  }

                });
              }

            }
          }}

        />

      </>

      }
    />,
    disabled: !!err
  }
}