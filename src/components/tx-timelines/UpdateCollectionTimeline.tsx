import { ActionPermissionUsedFlags, ApprovedTransferPermissionUsedFlags, BalancesActionPermissionUsedFlags, TimedUpdatePermissionUsedFlags, TimedUpdateWithBadgeIdsPermissionUsedFlags, DistributionMethod, MetadataAddMethod, castActionPermissionToUniversalPermission, castBalancesActionPermissionToUniversalPermission, castCollectionApprovedTransferPermissionToUniversalPermission, castTimedUpdatePermissionToUniversalPermission, castTimedUpdateWithBadgeIdsPermissionToUniversalPermission, CollectionApprovedTransferWithDetails } from 'bitbadgesjs-utils';
import { useCollectionsContext } from '../../bitbadges-api/contexts/CollectionsContext';
import { getPermissionDataSource } from '../collection-page/PermissionsInfo';
import { FormTimeline, TimelineItem } from '../navigation/FormTimeline';
import { EmptyStepItem, MSG_PREVIEW_ID, MsgUpdateCollectionProps } from './TxTimeline';
import { BadgeSupplySelectStepItem } from './step-items/BadgeSupplySelectStepItem';
import { CanCreateMoreStepItem } from './step-items/CanCreateMoreStepItem';
import { CanDeleteStepItem } from './step-items/CanDeleteStepItem';
import { CanManagerBeTransferredStepItem } from './step-items/CanManagerBeTransferredStepItem';
import { CanUpdateBalancesStepItem } from './step-items/CanUpdateBytesStepItem';
import { ChooseBadgeTypeStepItem } from './step-items/ChooseBadgeTypeStepItem';
import { ConfirmManagerStepItem } from './step-items/ConfirmManagerStepItem';
import { CreateClaimsStepItem } from './step-items/CreateClaimsStepItem';
import { CreateCollectionStepItem } from './step-items/CreateCollectionStepItem';
import { DistributionMethodStepItem } from './step-items/DistributionMethodStepItem';
import { ExistingWarningStepItem } from './step-items/ExistingWarningStepItem';
import { FreezeSelectStepItem } from './step-items/FreezeSelectStepItem';
import { MetadataStorageSelectStepItem } from './step-items/MetadataStorageSelectStepItem';
import { MetadataTooBigStepItem } from './step-items/MetadataTooBigStepItem';
import { PreviewCollectionStepItem } from './step-items/PreviewCollectionStepItem';
import { SetBadgeMetadataStepItem } from './step-items/SetBadgeMetadata';
import { SetCollectionMetadataStepItem } from './step-items/SetCollectionMetadataStepItem';
import { TransferabilitySelectStepItem } from './step-items/TransferabilitySelectStepItem';
import { UpdatableMetadataSelectStepItem } from './step-items/UpdatableMetadataSelectStepItem';
import { useState } from 'react';
import { Balance } from 'bitbadgesjs-proto';
import { DefaultToApprovedSelectStepItem } from './step-items/DefaultToApprovedSelectStepItem';
import { CanArchiveCollectionStepItem } from './step-items/CanUpdateArchivedStepItem';
import { IsArchivedSelectStepItem } from './step-items/ArchivedSelectStepItem';
import { RevokeSelectStepItem } from './step-items/RevokeSelectStepItem';

//See TxTimeline for explanations and documentation


export function UpdateCollectionTimeline({
  txTimelineProps,
  isModal
}: {
  txTimelineProps: MsgUpdateCollectionProps,
  isModal: boolean
}) {

  const collections = useCollectionsContext();

  const [approvedTransfersToAdd, setApprovedTransfersToAdd] = useState<(CollectionApprovedTransferWithDetails<bigint> & { balances: Balance<bigint>[] })[]>([]);


  const handledPermissions = txTimelineProps.handledPermissions;
  const setHandledPermissions = txTimelineProps.setHandledPermissions;
  const addMethod = txTimelineProps.addMethod;
  const setAddMethod = txTimelineProps.setAddMethod;
  const distributionMethod = txTimelineProps.distributionMethod;
  const setDistributionMethod = txTimelineProps.setDistributionMethod;
  const metadataSize = txTimelineProps.metadataSize;
  const badgesToCreate = txTimelineProps.badgesToCreate;
  const setBadgesToCreate = txTimelineProps.setBadgesToCreate;
  const transfers = txTimelineProps.transfers;
  const setTransfers = txTimelineProps.setTransfers;
  const existingCollectionId = txTimelineProps.existingCollectionId;
  // const existingCollectionId = 1n;
  const updateCollectionApprovedTransfers = txTimelineProps.updateCollectionApprovedTransfersTimeline;
  const setUpdateCollectionApprovedTransfers = txTimelineProps.setUpdateCollectionApprovedTransfersTimeline;
  const updateManagerTimeline = txTimelineProps.updateManagerTimeline;
  const setUpdateManagerTimeline = txTimelineProps.setUpdateManagerTimeline;
  const updateCollectionMetadataTimeline = txTimelineProps.updateCollectionMetadataTimeline;
  const setUpdateCollectionMetadataTimeline = txTimelineProps.setUpdateCollectionMetadataTimeline;
  const updateBadgeMetadataTimeline = txTimelineProps.updateBadgeMetadataTimeline;
  const setUpdateBadgeMetadataTimeline = txTimelineProps.setUpdateBadgeMetadataTimeline;
  const updateOffChainBalancesMetadataTimeline = txTimelineProps.updateOffChainBalancesMetadataTimeline;
  const setUpdateOffChainBalancesMetadataTimeline = txTimelineProps.setUpdateOffChainBalancesMetadataTimeline;
  const updateCustomDataTimeline = txTimelineProps.updateCustomDataTimeline;
  const setUpdateCustomDataTimeline = txTimelineProps.setUpdateCustomDataTimeline;
  const updateInheritedBalancesTimeline = txTimelineProps.updateInheritedBalancesTimeline;
  const setUpdateInheritedBalancesTimeline = txTimelineProps.setUpdateInheritedBalancesTimeline;
  const updateStandardsTimeline = txTimelineProps.updateStandardsTimeline;
  const setUpdateStandardsTimeline = txTimelineProps.setUpdateStandardsTimeline;
  const updateContractAddressTimeline = txTimelineProps.updateContractAddressTimeline;
  const setUpdateContractAddressTimeline = txTimelineProps.setUpdateContractAddressTimeline;
  const updateIsArchivedTimeline = txTimelineProps.updateIsArchivedTimeline;
  const setUpdateIsArchivedTimeline = txTimelineProps.setUpdateIsArchivedTimeline;
  const updateCollectionPermissions = txTimelineProps.updateCollectionPermissions;
  const setUpdateCollectionPermissions = txTimelineProps.setUpdateCollectionPermissions;



  //All mint timeline step items
  const ChooseBadgeType = ChooseBadgeTypeStepItem(distributionMethod, setDistributionMethod);
  const ConfirmManager = ConfirmManagerStepItem(updateManagerTimeline, setUpdateManagerTimeline, existingCollectionId);
  const BadgeSupplySelectStep = BadgeSupplySelectStepItem(badgesToCreate, setBadgesToCreate, existingCollectionId);
  const FreezeSelectStep = FreezeSelectStepItem(handledPermissions, setHandledPermissions, existingCollectionId);
  const CanManagerBeTransferredStep = CanManagerBeTransferredStepItem(handledPermissions, setHandledPermissions, existingCollectionId);
  const MetadataStorageSelectStep = MetadataStorageSelectStepItem(addMethod, setAddMethod);
  const UpdatableMetadataSelectStep = UpdatableMetadataSelectStepItem(handledPermissions, setHandledPermissions, addMethod, true, existingCollectionId);
  const UpdatableBadgeMetadataSelectStep = UpdatableMetadataSelectStepItem(handledPermissions, setHandledPermissions, addMethod, false, existingCollectionId);

  const SetCollectionMetadataStep = SetCollectionMetadataStepItem(addMethod, updateCollectionMetadataTimeline, setUpdateCollectionMetadataTimeline, existingCollectionId);
  const SetBadgeMetadataStep = SetBadgeMetadataStepItem(addMethod, updateBadgeMetadataTimeline, setUpdateBadgeMetadataTimeline, existingCollectionId);
  const DistributionMethodStep = DistributionMethodStepItem(distributionMethod, setDistributionMethod, badgesToCreate, existingCollectionId);
  const CreateClaims = CreateClaimsStepItem(approvedTransfersToAdd, setApprovedTransfersToAdd, transfers, setTransfers, distributionMethod, existingCollectionId);
  const CreateCollectionStep = CreateCollectionStepItem(txTimelineProps, existingCollectionId);
  const CanCreateMoreStep = CanCreateMoreStepItem(handledPermissions, setHandledPermissions, existingCollectionId);
  const CanDeleteStep = CanDeleteStepItem(handledPermissions, setHandledPermissions, existingCollectionId);
  const CollectionPreviewStep = PreviewCollectionStepItem();
  const MetadataTooLargeStep = MetadataTooBigStepItem(metadataSize);
  const TransferabilityStep = TransferabilitySelectStepItem(updateCollectionApprovedTransfers, setUpdateCollectionApprovedTransfers, existingCollectionId);
  const IsArchivedSelectStep = IsArchivedSelectStepItem(updateIsArchivedTimeline, setUpdateIsArchivedTimeline, existingCollectionId);
  const CanArchiveCollectionStep = CanArchiveCollectionStepItem(handledPermissions, setHandledPermissions, existingCollectionId);
  const DefaultToApprovedStepItem = DefaultToApprovedSelectStepItem(existingCollectionId);
  const RevokeStepItem = RevokeSelectStepItem(updateCollectionApprovedTransfers, setUpdateCollectionApprovedTransfers, existingCollectionId);

  // const UserBalancesStep = UserBalancesSelectStepItem(userBalances, setUserBalances);
  const CanUpdateBytesStep = CanUpdateBalancesStepItem(handledPermissions, setHandledPermissions);

  const items: TimelineItem[] = [

    ChooseBadgeType];

  if (existingCollectionId && existingCollectionId > 0n) {
    // items.push(ExistingWarningStepItem());
  }

  const isOffChainBalances = distributionMethod === DistributionMethod.OffChainBalances;
  const hasManager = (collections.collections[MSG_PREVIEW_ID.toString()]?.managerTimeline ?? []).length > 0;

  const existingCollection = existingCollectionId ? collections.collections[existingCollectionId.toString()] : undefined;

  let deleteRes = getPermissionDataSource(
    existingCollection ? castActionPermissionToUniversalPermission(existingCollection.collectionPermissions.canDeleteCollection ?? []) : [],
    ActionPermissionUsedFlags,
    !hasManager
  );
  let toShowCanDeletePermission = !((deleteRes.hasForbiddenTimes && !deleteRes.hasNeutralTimes && !deleteRes.hasPermittedTimes));

  let canCreateMoreRes = getPermissionDataSource(
    existingCollection ? castBalancesActionPermissionToUniversalPermission(existingCollection.collectionPermissions.canCreateMoreBadges ?? []) : [],
    BalancesActionPermissionUsedFlags,
    !hasManager
  );
  let toShowCanCreateMorePermission = !((canCreateMoreRes.hasForbiddenTimes && !canCreateMoreRes.hasNeutralTimes && !canCreateMoreRes.hasPermittedTimes));

  let canManagerBeTransferredRes = getPermissionDataSource(
    existingCollection ? castTimedUpdatePermissionToUniversalPermission(existingCollection.collectionPermissions.canUpdateManager ?? []) : [],
    TimedUpdatePermissionUsedFlags,
    !hasManager
  );
  let toShowCanManagerBeTransferredPermission = !((canManagerBeTransferredRes.hasForbiddenTimes && !canManagerBeTransferredRes.hasNeutralTimes && !canManagerBeTransferredRes.hasPermittedTimes));

  let canUpdateBadgeMetadataRes = getPermissionDataSource(
    existingCollection ? castTimedUpdateWithBadgeIdsPermissionToUniversalPermission(existingCollection.collectionPermissions.canUpdateBadgeMetadata ?? []) : [],
    TimedUpdateWithBadgeIdsPermissionUsedFlags,
    !hasManager
  );
  let toShowCanUpdateBadgeMetadataPermission = !((canUpdateBadgeMetadataRes.hasForbiddenTimes && !canUpdateBadgeMetadataRes.hasNeutralTimes && !canUpdateBadgeMetadataRes.hasPermittedTimes));

  let canUpdateCollectionMetadataRes = getPermissionDataSource(
    existingCollection ? castTimedUpdatePermissionToUniversalPermission(existingCollection.collectionPermissions.canUpdateCollectionMetadata ?? []) : [],
    TimedUpdatePermissionUsedFlags,
    !hasManager
  );
  let toShowCanUpdateCollectionMetadataPermission = !(canUpdateCollectionMetadataRes.hasForbiddenTimes && !canUpdateCollectionMetadataRes.hasNeutralTimes && !canUpdateCollectionMetadataRes.hasPermittedTimes);

  let canUpdateCollectionApprovedTransfersRes = getPermissionDataSource(
    existingCollection ? castCollectionApprovedTransferPermissionToUniversalPermission(existingCollection.collectionPermissions.canUpdateCollectionApprovedTransfers ?? []) : [],
    ApprovedTransferPermissionUsedFlags,
    !hasManager
  );
  let toShowCanUpdateCollectionApprovedTransfersPermission = !(canUpdateCollectionApprovedTransfersRes.hasForbiddenTimes && !canUpdateCollectionApprovedTransfersRes.hasNeutralTimes && !canUpdateCollectionApprovedTransfersRes.hasPermittedTimes);

  let canUpdateOffChainBalancesMetadata = getPermissionDataSource(
    existingCollection ? castTimedUpdatePermissionToUniversalPermission(existingCollection.collectionPermissions.canUpdateOffChainBalancesMetadata ?? []) : [],
    TimedUpdatePermissionUsedFlags,
    !hasManager
  );
  let toShowCanUpdateOffChainBalancesMetadataPermission = !(canUpdateOffChainBalancesMetadata.hasForbiddenTimes && !canUpdateOffChainBalancesMetadata.hasNeutralTimes && !canUpdateOffChainBalancesMetadata.hasPermittedTimes);

  let canArchiveCollection = getPermissionDataSource(
    existingCollection ? castTimedUpdatePermissionToUniversalPermission(existingCollection.collectionPermissions.canArchiveCollection ?? []) : [],
    TimedUpdatePermissionUsedFlags,
    !hasManager
  );
  let toShowCanArchiveCollectionPermission = !(canArchiveCollection.hasForbiddenTimes && !canArchiveCollection.hasNeutralTimes && !canArchiveCollection.hasPermittedTimes);

  items.push(
    toShowCanManagerBeTransferredPermission ? ConfirmManager : EmptyStepItem,
    toShowCanCreateMorePermission ? BadgeSupplySelectStep : EmptyStepItem,
    hasManager && toShowCanCreateMorePermission ? CanCreateMoreStep : EmptyStepItem,
    hasManager && toShowCanManagerBeTransferredPermission ? CanManagerBeTransferredStep : EmptyStepItem,
    hasManager && toShowCanDeletePermission ? CanDeleteStep : EmptyStepItem,
    toShowCanArchiveCollectionPermission && existingCollectionId && existingCollectionId > 0n ? IsArchivedSelectStep : EmptyStepItem,
    hasManager && toShowCanArchiveCollectionPermission ? CanArchiveCollectionStep : EmptyStepItem,


    toShowCanUpdateCollectionMetadataPermission || toShowCanUpdateBadgeMetadataPermission ? MetadataStorageSelectStep : EmptyStepItem,
    addMethod === MetadataAddMethod.Manual ?
      toShowCanUpdateCollectionMetadataPermission ? SetCollectionMetadataStep : EmptyStepItem :
      toShowCanUpdateCollectionMetadataPermission || toShowCanUpdateBadgeMetadataPermission ? SetBadgeMetadataStep :
        EmptyStepItem,

    addMethod === MetadataAddMethod.Manual
      ? toShowCanUpdateBadgeMetadataPermission ? SetBadgeMetadataStep : EmptyStepItem : EmptyStepItem,
    MetadataTooLargeStep,
    hasManager && toShowCanUpdateCollectionMetadataPermission ? UpdatableMetadataSelectStep : EmptyStepItem,
    hasManager && toShowCanUpdateBadgeMetadataPermission ? UpdatableBadgeMetadataSelectStep : EmptyStepItem,
    isOffChainBalances || toShowCanUpdateCollectionApprovedTransfersPermission ?
      DistributionMethodStep : EmptyStepItem,


    distributionMethod === DistributionMethod.OffChainBalances ? CreateClaims : EmptyStepItem,
    distributionMethod !== DistributionMethod.None && distributionMethod !== DistributionMethod.Unminted && distributionMethod !== DistributionMethod.JSON && distributionMethod !== DistributionMethod.DirectTransfer && distributionMethod !== DistributionMethod.OffChainBalances
      && (true) ? CreateClaims : EmptyStepItem,

    !isOffChainBalances && toShowCanUpdateCollectionApprovedTransfersPermission ? TransferabilityStep : EmptyStepItem,
    !isOffChainBalances && (hasManager && toShowCanUpdateCollectionApprovedTransfersPermission) ? RevokeStepItem : EmptyStepItem,
    !isOffChainBalances && (hasManager && toShowCanUpdateCollectionApprovedTransfersPermission) ? FreezeSelectStep : EmptyStepItem,
    !isOffChainBalances && hasManager ? DefaultToApprovedStepItem : EmptyStepItem,
    isOffChainBalances && (hasManager && toShowCanUpdateOffChainBalancesMetadataPermission) ? CanUpdateBytesStep : EmptyStepItem,


    CollectionPreviewStep,

    //Will also need to support distribution method === JSON (see line 220 TxTimeline with createCollectionFromMsgUpdateCollection and manualSend)
    !isModal ? CreateCollectionStep : EmptyStepItem
  );

  return (
    <>
      <FormTimeline
        items={items}
        onFinish={() => {
          if (txTimelineProps.onFinish) txTimelineProps.onFinish(txTimelineProps);
        }}
      />
    </>
  );
}
