import { TimedUpdateWithBadgeIdsPermission, UintRangeArray } from 'bitbadgesjs-sdk';
import { ReactNode, useState } from 'react';

import { EmptyStepItem, NEW_COLLECTION_ID, useTxTimelineContext } from '../../../bitbadges-api/contexts/TxTimelineContext';
import { updateCollection, useCollection } from '../../../bitbadges-api/contexts/collections/CollectionsContext';
import { getBadgesWithLockedSupply } from '../../../bitbadges-api/utils/badges';
import { getDetailsForCollectionPermission } from '../../../bitbadges-api/utils/permissions';
import { PermissionsOverview } from '../../collection-page/PermissionsInfo';
import { PermissionUpdateSelectWrapper } from '../form-items/PermissionUpdateSelectWrapper';
import { SwitchForm } from '../form-items/SwitchForm';
import { handleSwitchChange as handleSwitchChangeImported } from './CanDeleteStepItem';
import { MetadataAddMethod } from '../../../bitbadges-api/types';

export function UpdatableMetadataSelectStepItem(collectionMetadataUpdate: boolean) {
  const collection = useCollection(NEW_COLLECTION_ID);
  const txTimelineContext = useTxTimelineContext();
  const [checked, setChecked] = useState<boolean>(!txTimelineContext.existingCollectionId);

  const addMethod = collectionMetadataUpdate ? txTimelineContext.collectionAddMethod : txTimelineContext.badgeAddMethod;

  const [err, setErr] = useState<Error | null>(null);
  const maxBadgeId = collection ? collection.getMaxBadgeId() : 0n;

  const badgeIdsWithLockedSupply = getBadgesWithLockedSupply(collection?.clone()!, undefined, true, 'current'); //Get badge IDs that will have locked supply moving forward
  const badgeIdsToLockMetadata = badgeIdsWithLockedSupply.clone();
  badgeIdsToLockMetadata.push({ start: 1n, end: maxBadgeId });
  badgeIdsToLockMetadata.sortAndMerge();

  if (!collection) return EmptyStepItem;
  const permissionDetails = collectionMetadataUpdate
    ? getDetailsForCollectionPermission(collection, 'canUpdateCollectionMetadata')
    : getDetailsForCollectionPermission(collection, 'canUpdateBadgeMetadata', UintRangeArray.From([{ start: 1n, end: maxBadgeId }]));

  function AdditionalNode({ noOption }: { noOption?: boolean }) {
    if (!collection) return <></>;

    return (
      <div className="flex-center">
        <PermissionsOverview
          span={24}
          collectionId={collection.collectionId}
          permissionName={collectionMetadataUpdate ? 'canUpdateCollectionMetadata' : 'canUpdateBadgeMetadata'}
          onFreezePermitted={
            noOption
              ? undefined
              : (frozen: boolean) => {
                  handleSwitchChange(1, frozen);
                }
          }
        />
      </div>
    );
  }

  const options: Array<{
    title: string;
    message: string | ReactNode;
    isSelected: boolean;
    additionalNode?: () => ReactNode;
  }> = [];
  options.push({
    title: 'No',
    message: `${
      addMethod === MetadataAddMethod.UploadUrl ? 'The URIs for the metadata (i.e. the self-hosted ones provided by you)' : 'The metadata'
    } will be frozen and cannot be updated after this transaction.`,
    isSelected: permissionDetails.isAlwaysFrozenAndForbidden,
    additionalNode: () => <AdditionalNode noOption />
  });

  options.push({
    title: 'Yes',
    message: (
      <div>{`${addMethod === MetadataAddMethod.UploadUrl ? 'The URIs (i.e. the self-hosted URIs provided by you)' : 'The metadata'} can be updated.
    `}</div>
    ),
    additionalNode: () => <AdditionalNode />,
    isSelected: permissionDetails.isAlwaysPermittedOrNeutral
  });

  const handleSwitchChangeIdxOnly = (idx: number) => {
    handleSwitchChange(idx);
  };

  const handleSwitchChange = (idx: number, frozen?: boolean) => {
    if (collectionMetadataUpdate) {
      handleSwitchChangeImported(idx, 'canUpdateCollectionMetadata', frozen);
    } else {
      if (idx == 1 && !frozen) {
        updateCollection({
          collectionId: NEW_COLLECTION_ID,
          collectionPermissions: {
            canUpdateBadgeMetadata: []
          }
        });
      } else if (idx == 1 && frozen) {
        updateCollection({
          collectionId: NEW_COLLECTION_ID,
          collectionPermissions: {
            canUpdateBadgeMetadata: [
              new TimedUpdateWithBadgeIdsPermission({
                badgeIds: UintRangeArray.FullRanges(),
                timelineTimes: UintRangeArray.FullRanges(),
                permanentlyPermittedTimes: UintRangeArray.FullRanges(),
                permanentlyForbiddenTimes: []
              })
            ]
          }
        });
      } else {
        updateCollection({
          collectionId: NEW_COLLECTION_ID,
          collectionPermissions: {
            canUpdateBadgeMetadata: [
              new TimedUpdateWithBadgeIdsPermission({
                badgeIds: badgeIdsToLockMetadata,
                timelineTimes: UintRangeArray.FullRanges(),
                permanentlyPermittedTimes: [],
                permanentlyForbiddenTimes: UintRangeArray.FullRanges()
              })
            ]
          }
        });
      }
    }
  };

  const description = `Following this transaction, do you want to be able to update the metadata for ${
    collectionMetadataUpdate ? 'the collection' : 'the created badges'
  }?`;

  return {
    title: collectionMetadataUpdate ? 'Update collection metadata?' : 'Updatable badge metadata?',
    description: description,
    node: () => (
      <PermissionUpdateSelectWrapper
        checked={checked}
        setChecked={setChecked}
        err={err}
        setErr={setErr}
        permissionName={collectionMetadataUpdate ? 'canUpdateCollectionMetadata' : 'canUpdateBadgeMetadata'}
        node={() => (
          <>
            <SwitchForm options={options} showCustomOption onSwitchChange={handleSwitchChangeIdxOnly} />
          </>
        )}
      />
    ),
    disabled: !!err
  };
}
