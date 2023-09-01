import { Balance } from 'bitbadgesjs-proto';
import { ActionPermissionUsedFlags, ApprovedTransferPermissionUsedFlags, BalancesActionPermissionUsedFlags, CollectionApprovedTransferWithDetails, DistributionMethod, MetadataAddMethod, TimedUpdatePermissionUsedFlags, TimedUpdateWithBadgeIdsPermissionUsedFlags, castActionPermissionToUniversalPermission, castBalancesActionPermissionToUniversalPermission, castCollectionApprovedTransferPermissionToUniversalPermission, castTimedUpdatePermissionToUniversalPermission, castTimedUpdateWithBadgeIdsPermissionToUniversalPermission } from 'bitbadgesjs-utils';
import { useState } from 'react';
import { useCollectionsContext } from '../../bitbadges-api/contexts/CollectionsContext';
import { EmptyStepItem, MSG_PREVIEW_ID, useTxTimelineContext } from '../../bitbadges-api/contexts/TxTimelineContext';
import { getPermissionDataSource } from '../collection-page/PermissionsInfo';
import { FormTimeline, TimelineItem } from '../navigation/FormTimeline';
import { AddressMappingSelectStepItem } from './step-items/AddressMappingSelectStepItem';
import { IsArchivedSelectStepItem } from './step-items/ArchivedSelectStepItem';
import { BadgeSupplySelectStepItem } from './step-items/BadgeSupplySelectStepItem';
import { CanCreateMoreStepItem } from './step-items/CanCreateMoreStepItem';
import { CanDeleteStepItem } from './step-items/CanDeleteStepItem';
import { CanManagerBeTransferredStepItem } from './step-items/CanManagerBeTransferredStepItem';
import { CanArchiveCollectionStepItem } from './step-items/CanUpdateArchivedStepItem';
import { CanUpdateBalancesStepItem } from './step-items/CanUpdateBytesStepItem';
import { ChooseBadgeTypeStepItem, MintType } from './step-items/ChooseBadgeTypeStepItem';
import { ConfirmManagerStepItem } from './step-items/ConfirmManagerStepItem';
import { CreateAddressMappingStepItem } from './step-items/CreateAddressMappingStepItem';
import { CreateClaimsStepItem } from './step-items/CreateClaimsStepItem';
import { CreateCollectionStepItem } from './step-items/CreateCollectionStepItem';
import { DefaultToApprovedSelectStepItem } from './step-items/DefaultToApprovedSelectStepItem';
import { DistributionMethodStepItem } from './step-items/DistributionMethodStepItem';
import { FreezeSelectStepItem } from './step-items/FreezeSelectStepItem';
import { MetadataStorageSelectStepItem } from './step-items/MetadataStorageSelectStepItem';
import { MetadataTooBigStepItem } from './step-items/MetadataTooBigStepItem';
import { OffChainBalancesStorageSelectStepItem } from './step-items/OffChainBalancesStepItem';
import { PreviewCollectionStepItem } from './step-items/PreviewCollectionStepItem';
import { RevokeSelectStepItem } from './step-items/RevokeSelectStepItem';
import { SetAddressMappingMetadataStepItem } from './step-items/SetAddressMappingMetadataStepItem';
import { SetBadgeMetadataStepItem } from './step-items/SetBadgeMetadata';
import { SetCollectionMetadataStepItem } from './step-items/SetCollectionMetadataStepItem';
import { TransferabilitySelectStepItem } from './step-items/TransferabilitySelectStepItem';
import { UpdatableMetadataSelectStepItem } from './step-items/UpdatableMetadataSelectStepItem';

//See TxTimeline for explanations and documentation


export function UpdateCollectionTimeline({
  isModal
}: {
  isModal: boolean
}) {

  const collections = useCollectionsContext();
  const txTimelineContext = useTxTimelineContext();

  const [approvedTransfersToAdd, setApprovedTransfersToAdd] = useState<(CollectionApprovedTransferWithDetails<bigint> & { balances: Balance<bigint>[] })[]>([]);

  //TODO: Eventually we should refactor this bc txTimelineContext is now a context so we don't need to pass it in as a prop
  const addMethod = txTimelineContext.addMethod;
  const setAddMethod = txTimelineContext.setAddMethod;
  const distributionMethod = txTimelineContext.distributionMethod;
  const setDistributionMethod = txTimelineContext.setDistributionMethod;
  const metadataSize = txTimelineContext.metadataSize;
  const badgesToCreate = txTimelineContext.badgesToCreate;
  const setBadgesToCreate = txTimelineContext.setBadgesToCreate;
  const transfers = txTimelineContext.transfers;
  const setTransfers = txTimelineContext.setTransfers;
  const existingCollectionId = txTimelineContext.existingCollectionId;
  // const existingCollectionId = 1n;
  const updateCollectionApprovedTransfers = txTimelineContext.updateCollectionApprovedTransfersTimeline;
  const setUpdateCollectionApprovedTransfers = txTimelineContext.setUpdateCollectionApprovedTransfersTimeline;
  const updateManagerTimeline = txTimelineContext.updateManagerTimeline;
  const setUpdateManagerTimeline = txTimelineContext.setUpdateManagerTimeline;
  const updateCollectionMetadataTimeline = txTimelineContext.updateCollectionMetadataTimeline;
  const setUpdateCollectionMetadataTimeline = txTimelineContext.setUpdateCollectionMetadataTimeline;
  const updateBadgeMetadataTimeline = txTimelineContext.updateBadgeMetadataTimeline;
  const setUpdateBadgeMetadataTimeline = txTimelineContext.setUpdateBadgeMetadataTimeline;
  const updateIsArchivedTimeline = txTimelineContext.updateIsArchivedTimeline;
  const setUpdateIsArchivedTimeline = txTimelineContext.setUpdateIsArchivedTimeline;
  const mintType = txTimelineContext.mintType;
  const setMintType = txTimelineContext.setMintType;
  const addressMapping = txTimelineContext.addressMapping;
  const setAddressMapping = txTimelineContext.setAddressMapping;
  const isUpdateAddressMapping = txTimelineContext.isUpdateAddressMapping;
  const formStepNum = txTimelineContext.formStepNum;
  const setFormStepNum = txTimelineContext.setFormStepNum;



  //All mint timeline step items
  const ChooseBadgeType = ChooseBadgeTypeStepItem(mintType, setMintType);
  const ConfirmManager = ConfirmManagerStepItem(updateManagerTimeline, setUpdateManagerTimeline, existingCollectionId);
  const BadgeSupplySelectStep = BadgeSupplySelectStepItem(badgesToCreate, setBadgesToCreate, existingCollectionId);
  const FreezeSelectStep = FreezeSelectStepItem(existingCollectionId);
  const CanManagerBeTransferredStep = CanManagerBeTransferredStepItem(existingCollectionId);
  const MetadataStorageSelectStep = MetadataStorageSelectStepItem(addMethod, setAddMethod);
  const UpdatableMetadataSelectStep = UpdatableMetadataSelectStepItem(addMethod, true, existingCollectionId);
  const UpdatableBadgeMetadataSelectStep = UpdatableMetadataSelectStepItem(addMethod, false, existingCollectionId);

  const SetAddressMappingMetadataStep = SetAddressMappingMetadataStepItem();

  const SetCollectionMetadataStep = SetCollectionMetadataStepItem(addMethod, updateCollectionMetadataTimeline, setUpdateCollectionMetadataTimeline, existingCollectionId);
  const SetBadgeMetadataStep = SetBadgeMetadataStepItem(addMethod, updateBadgeMetadataTimeline, setUpdateBadgeMetadataTimeline, existingCollectionId);
  const DistributionMethodStep = DistributionMethodStepItem(distributionMethod, setDistributionMethod, existingCollectionId);
  const CreateClaims = CreateClaimsStepItem(approvedTransfersToAdd, setApprovedTransfersToAdd, transfers, setTransfers, distributionMethod, existingCollectionId);
  const CreateCollectionStep = CreateCollectionStepItem(existingCollectionId);
  const CanCreateMoreStep = CanCreateMoreStepItem(existingCollectionId);
  const CanDeleteStep = CanDeleteStepItem(existingCollectionId);
  const CollectionPreviewStep = PreviewCollectionStepItem();
  const MetadataTooLargeStep = MetadataTooBigStepItem(metadataSize);
  const TransferabilityStep = TransferabilitySelectStepItem(updateCollectionApprovedTransfers, setUpdateCollectionApprovedTransfers, existingCollectionId);
  const IsArchivedSelectStep = IsArchivedSelectStepItem(updateIsArchivedTimeline, setUpdateIsArchivedTimeline, existingCollectionId);
  const CanArchiveCollectionStep = CanArchiveCollectionStepItem(existingCollectionId);
  const DefaultToApprovedStepItem = DefaultToApprovedSelectStepItem(existingCollectionId);
  const RevokeStepItem = RevokeSelectStepItem(updateCollectionApprovedTransfers, existingCollectionId);
  const OffChainBalancesStorageStepItem = OffChainBalancesStorageSelectStepItem();

  // const UserBalancesStep = UserBalancesSelectStepItem(userBalances, setUserBalances);
  const CanUpdateBytesStep = CanUpdateBalancesStepItem();
  const AddressMappingSelectItem = AddressMappingSelectStepItem(addressMapping, setAddressMapping);
  const CreateAddressMappingStep = CreateAddressMappingStepItem();
  const items: TimelineItem[] = [

    (existingCollectionId && existingCollectionId > 0n) || isUpdateAddressMapping ? EmptyStepItem :

      ChooseBadgeType
  ];

  if (mintType === MintType.BitBadge) {
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

      distributionMethod === DistributionMethod.OffChainBalances ? OffChainBalancesStorageStepItem : EmptyStepItem,
      distributionMethod === DistributionMethod.OffChainBalances
        && (collections.collections[`${MSG_PREVIEW_ID}`]?.offChainBalancesMetadataTimeline ?? []).length == 0
        ? CreateClaims : EmptyStepItem,
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
  } else {
    items.push(
      AddressMappingSelectItem,
      SetAddressMappingMetadataStep,
      CreateAddressMappingStep
    )
  }

  return (
    <>
      <FormTimeline
        formStepNum={formStepNum}
        setFormStepNum={setFormStepNum}
        items={items}
        onFinish={() => {
          if (txTimelineContext.onFinish) txTimelineContext.onFinish(txTimelineContext);
        }}
      />
    </>
  );
}
