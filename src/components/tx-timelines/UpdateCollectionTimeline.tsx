import { Balance } from 'bitbadgesjs-proto';
import { ActionPermissionUsedFlags, ApprovedTransferPermissionUsedFlags, BalancesActionPermissionUsedFlags, CollectionApprovedTransferWithDetails, DistributionMethod, MetadataAddMethod, TimedUpdatePermissionUsedFlags, TimedUpdateWithBadgeIdsPermissionUsedFlags, castActionPermissionToUniversalPermission, castBalancesActionPermissionToUniversalPermission, castCollectionApprovedTransferPermissionToUniversalPermission, castTimedUpdatePermissionToUniversalPermission, castTimedUpdateWithBadgeIdsPermissionToUniversalPermission, invertUintRanges, isInAddressMapping } from 'bitbadgesjs-utils';
import { useEffect, useState } from 'react';
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
import { ChooseControlTypeStepItem } from './step-items/CompleteControlStepItem';
import { INFINITE_LOOP_MODE } from '../../constants';
import { getTotalNumberOfBadges } from '../../bitbadges-api/utils/badges';
import { GO_MAX_UINT_64 } from '../../utils/dates';
import { JSONTransferabilitySelectStepItem } from './step-items/TransferabilityJSONSelect';

//See TxTimeline for explanations and documentation


export function UpdateCollectionTimeline({
  isModal
}: {
  isModal: boolean
}) {

  const collections = useCollectionsContext();
  const txTimelineContext = useTxTimelineContext();
  const existingCollectionId = txTimelineContext.existingCollectionId;
  const existingCollection = existingCollectionId ? collections.collections[existingCollectionId.toString()] : undefined;
  const collection = collections.collections[MSG_PREVIEW_ID.toString()];




  const [approvedTransfersToAdd, setApprovedTransfersToAdd] = useState<(CollectionApprovedTransferWithDetails<bigint> & { balances: Balance<bigint>[] })[]>(
    existingCollection && existingCollection.collectionApprovedTransfersTimeline.length > 0
      ? existingCollection.collectionApprovedTransfersTimeline[0].collectionApprovedTransfers.filter(x => x.fromMappingId === 'Mint').map(x => {
        return {
          ...x,
          balances: [{
            badgeIds: x.badgeIds,
            ownershipTimes: x.ownershipTimes,
            amount: 1n //will not matter
          }]
        }
      }) : []

  );

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: update collection timeline, existing collection changed');
    if (!existingCollection) return;

    //Slot it right in the middle [existing "Mint", toAdd, non-"Mint"]
    const existingFromMint = existingCollection && existingCollection.collectionApprovedTransfersTimeline.length > 0
      ? existingCollection.collectionApprovedTransfersTimeline[0].collectionApprovedTransfers.filter(x => x.fromMappingId === 'Mint') : [];

    setApprovedTransfersToAdd(existingFromMint.map(x => {
      return {
        ...x,
        balances: [{
          badgeIds: x.badgeIds,
          ownershipTimes: x.ownershipTimes,
          amount: 1n //will not matter
        }]
      }
    }));
  }, [existingCollection]);




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
  const completeControl = txTimelineContext.completeControl;
  const setCompleteControl = txTimelineContext.setCompleteControl;



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
  const CreateClaims = CreateClaimsStepItem(approvedTransfersToAdd, setApprovedTransfersToAdd, transfers, setTransfers, distributionMethod, updateCollectionApprovedTransfers, setUpdateCollectionApprovedTransfers, existingCollectionId);
  const CreateCollectionStep = CreateCollectionStepItem(existingCollectionId);
  const CanCreateMoreStep = CanCreateMoreStepItem(existingCollectionId);
  const CanDeleteStep = CanDeleteStepItem(existingCollectionId);
  const CollectionPreviewStep = PreviewCollectionStepItem();
  const MetadataTooLargeStep = MetadataTooBigStepItem(metadataSize);
  const TransferabilityStep = TransferabilitySelectStepItem(updateCollectionApprovedTransfers, setUpdateCollectionApprovedTransfers, existingCollectionId);
  const IsArchivedSelectStep = IsArchivedSelectStepItem(updateIsArchivedTimeline, setUpdateIsArchivedTimeline, existingCollectionId);
  const CanArchiveCollectionStep = CanArchiveCollectionStepItem(existingCollectionId);
  const DefaultToApprovedStepItem = DefaultToApprovedSelectStepItem(existingCollectionId);
  const RevokeStepItem = RevokeSelectStepItem(updateCollectionApprovedTransfers, setUpdateCollectionApprovedTransfers, existingCollectionId);
  const OffChainBalancesStorageStepItem = OffChainBalancesStorageSelectStepItem();
  const ChooseControlStepItem = ChooseControlTypeStepItem(completeControl, setCompleteControl);
  const JSONTransferability = JSONTransferabilitySelectStepItem(updateCollectionApprovedTransfers, setUpdateCollectionApprovedTransfers, existingCollectionId);

  // const UserBalancesStep = UserBalancesSelectStepItem(userBalances, setUserBalances);
  const CanUpdateBytesStep = CanUpdateBalancesStepItem();
  const AddressMappingSelectItem = AddressMappingSelectStepItem(addressMapping, setAddressMapping);
  const CreateAddressMappingStep = CreateAddressMappingStepItem();
  const items: TimelineItem[] = [

    (existingCollectionId && existingCollectionId > 0n) || isUpdateAddressMapping ? EmptyStepItem :

      ChooseBadgeType
  ];

  if (!collection) return <></>;


  console.log(distributionMethod);

  if (mintType === MintType.BitBadge) {
    if (existingCollectionId && existingCollectionId > 0n) {
      // items.push(ExistingWarningStepItem());
    } else {

    }

    const isOffChainBalances = distributionMethod === DistributionMethod.OffChainBalances;
    const hasManager = (collections.collections[MSG_PREVIEW_ID.toString()]?.managerTimeline ?? []).length > 0;

    const existingCollection = existingCollectionId ? collections.collections[existingCollectionId.toString()] : undefined;

    let deleteRes = getPermissionDataSource(
      existingCollection ? castActionPermissionToUniversalPermission(existingCollection.collectionPermissions.canDeleteCollection ?? []) : [],
      ActionPermissionUsedFlags,
      !hasManager
    );
    let toShowCanDeletePermission = deleteRes.hasNeutralTimes
    let toShowDeleteAction = deleteRes.hasNeutralTimes || deleteRes.hasPermittedTimes

    let canCreateMoreRes = getPermissionDataSource(
      existingCollection ? castBalancesActionPermissionToUniversalPermission(existingCollection.collectionPermissions.canCreateMoreBadges ?? []) : [],
      BalancesActionPermissionUsedFlags,
      !hasManager
    );
    let toShowCanCreateMorePermission = canCreateMoreRes.hasNeutralTimes
    let toShowCreateMoreAction = canCreateMoreRes.hasNeutralTimes || canCreateMoreRes.hasPermittedTimes

    let canManagerBeTransferredRes = getPermissionDataSource(
      existingCollection ? castTimedUpdatePermissionToUniversalPermission(existingCollection.collectionPermissions.canUpdateManager ?? []) : [],
      TimedUpdatePermissionUsedFlags,
      !hasManager
    );
    let toShowCanManagerBeTransferredPermission = canManagerBeTransferredRes.hasNeutralTimes
    let toShowManagerTransferAction = canManagerBeTransferredRes.hasNeutralTimes || canManagerBeTransferredRes.hasPermittedTimes

    let canUpdateBadgeMetadataRes = getPermissionDataSource(
      existingCollection ? castTimedUpdateWithBadgeIdsPermissionToUniversalPermission(existingCollection.collectionPermissions.canUpdateBadgeMetadata ?? []) : [],
      TimedUpdateWithBadgeIdsPermissionUsedFlags,
      !hasManager
    );
    let maxBadgeId = getTotalNumberOfBadges(collection);
    let toShowCanUpdateBadgeMetadataPermission = canUpdateBadgeMetadataRes.hasNeutralTimes;

    let toShowUpdateBadgeMetadataAction = canUpdateBadgeMetadataRes.dataSource.some(x => !x.forbidden &&
      //Check if we have any badge IDs from 1 to maxBadgeID
      x.badgeIds?.find(y => y.start < maxBadgeId && y.end > 0n) !== undefined
    )


    let canUpdateCollectionMetadataRes = getPermissionDataSource(
      existingCollection ? castTimedUpdatePermissionToUniversalPermission(existingCollection.collectionPermissions.canUpdateCollectionMetadata ?? []) : [],
      TimedUpdatePermissionUsedFlags,
      !hasManager
    );
    let toShowCanUpdateCollectionMetadataPermission = canUpdateCollectionMetadataRes.hasNeutralTimes
    let toShowUpdateCollectionMetadataAction = canUpdateCollectionMetadataRes.hasNeutralTimes || canUpdateCollectionMetadataRes.hasPermittedTimes



    let canUpdateOffChainBalancesMetadata = getPermissionDataSource(
      existingCollection ? castTimedUpdatePermissionToUniversalPermission(existingCollection.collectionPermissions.canUpdateOffChainBalancesMetadata ?? []) : [],
      TimedUpdatePermissionUsedFlags,
      !hasManager
    );
    let toShowCanUpdateOffChainBalancesMetadataPermission = canUpdateOffChainBalancesMetadata.hasNeutralTimes
    let toShowUpdateOffChainBalancesMetadataAction = canUpdateOffChainBalancesMetadata.hasNeutralTimes || canUpdateOffChainBalancesMetadata.hasPermittedTimes

    let canArchiveCollection = getPermissionDataSource(
      existingCollection ? castTimedUpdatePermissionToUniversalPermission(existingCollection.collectionPermissions.canArchiveCollection ?? []) : [],
      TimedUpdatePermissionUsedFlags,
      !hasManager
    );
    let toShowCanArchiveCollectionPermission = canArchiveCollection.hasNeutralTimes
    let toShowArchiveCollectionAction = canArchiveCollection.hasNeutralTimes || canArchiveCollection.hasPermittedTimes

    const lockedBadgeIds = collection.collectionPermissions.canCreateMoreBadges.length > 0 ? collection.collectionPermissions.canCreateMoreBadges.map(x => x.defaultValues.badgeIds).flat() : [];
    const unlockedBadgeIds = invertUintRanges(lockedBadgeIds, 1n, GO_MAX_UINT_64);

    // If we never have a manager, this step will not be shown
    // const neverHasManager = collection.managerTimeline.length === 0 || collection.managerTimeline.every(timelineVal => !timelineVal.manager);

    const permissionDetails = getPermissionDataSource(castCollectionApprovedTransferPermissionToUniversalPermission(existingCollection?.collectionPermissions.canUpdateCollectionApprovedTransfers ?? []), ApprovedTransferPermissionUsedFlags);
    const mintPermissionDetails = permissionDetails.dataSource.filter(x => x.fromMapping && isInAddressMapping(x.fromMapping, "Mint"));
    const mintHasPermittedTimes = mintPermissionDetails.some(x => x.permitted);
    const mintHasForbiddenTimes = mintPermissionDetails.some(x => x.forbidden);
    const mintHasNeutralTimes = mintPermissionDetails.some(x => !x.permitted && !x.forbidden);

    const nonMintPermissionDetails = permissionDetails.dataSource.filter(x => x.fromMapping && !isInAddressMapping(x.fromMapping, "Mint"));
    const nonMintHasPermittedTimes = nonMintPermissionDetails.some(x => x.permitted);
    const nonMintHasForbiddenTimes = nonMintPermissionDetails.some(x => x.forbidden);
    const nonMintHasNeutralTimes = nonMintPermissionDetails.some(x => !x.permitted && !x.forbidden);

    let canUpdateCollectionApprovedTransfersRes = getPermissionDataSource(
      existingCollection ? castCollectionApprovedTransferPermissionToUniversalPermission(existingCollection.collectionPermissions.canUpdateCollectionApprovedTransfers ?? []) : [],
      ApprovedTransferPermissionUsedFlags,
      !hasManager
    );
    let toShowCanUpdateCollectionApprovedTransfersPermission = canUpdateCollectionApprovedTransfersRes.hasNeutralTimes

    let toShowUpdateMintTransfersAction = (canUpdateCollectionApprovedTransfersRes.hasNeutralTimes || canUpdateCollectionApprovedTransfersRes.hasPermittedTimes)

    let toShowUpdateNonMintTransfersAction = (canUpdateCollectionApprovedTransfersRes.hasNeutralTimes || canUpdateCollectionApprovedTransfersRes.hasPermittedTimes)

    items.push(
      toShowManagerTransferAction ? ConfirmManager : EmptyStepItem,
      hasManager && (!existingCollectionId || existingCollectionId == 0n) ? ChooseControlStepItem : EmptyStepItem,
      toShowCreateMoreAction ? BadgeSupplySelectStep : EmptyStepItem,
      !completeControl && hasManager && toShowCanCreateMorePermission ? CanCreateMoreStep : EmptyStepItem,
      !completeControl && hasManager && toShowCanManagerBeTransferredPermission ? CanManagerBeTransferredStep : EmptyStepItem,
      !completeControl && hasManager && toShowCanDeletePermission ? CanDeleteStep : EmptyStepItem,
      toShowArchiveCollectionAction && existingCollectionId && existingCollectionId > 0n ? IsArchivedSelectStep : EmptyStepItem,
      !completeControl && hasManager && toShowCanArchiveCollectionPermission ? CanArchiveCollectionStep : EmptyStepItem,


      toShowUpdateCollectionMetadataAction || toShowUpdateBadgeMetadataAction ? MetadataStorageSelectStep : EmptyStepItem,
      addMethod === MetadataAddMethod.Manual ?
        toShowUpdateCollectionMetadataAction ? SetCollectionMetadataStep : EmptyStepItem :
        toShowUpdateCollectionMetadataAction || toShowUpdateBadgeMetadataAction ? SetBadgeMetadataStep :
          EmptyStepItem,

      addMethod === MetadataAddMethod.Manual
        ? toShowUpdateBadgeMetadataAction ? SetBadgeMetadataStep : EmptyStepItem : EmptyStepItem,
      MetadataTooLargeStep,
      !completeControl && hasManager && toShowCanUpdateCollectionMetadataPermission ? UpdatableMetadataSelectStep : EmptyStepItem,
      !completeControl && hasManager && toShowCanUpdateBadgeMetadataPermission ? UpdatableBadgeMetadataSelectStep : EmptyStepItem,

      isOffChainBalances || toShowUpdateMintTransfersAction ?
        DistributionMethodStep : EmptyStepItem,

      distributionMethod === DistributionMethod.OffChainBalances ? OffChainBalancesStorageStepItem : EmptyStepItem,
      distributionMethod === DistributionMethod.OffChainBalances
        && (collections.collections[`${MSG_PREVIEW_ID}`]?.offChainBalancesMetadataTimeline ?? []).length == 0
        ? CreateClaims : EmptyStepItem,
      distributionMethod !== DistributionMethod.None && distributionMethod !== DistributionMethod.Unminted && distributionMethod !== DistributionMethod.JSON && distributionMethod !== DistributionMethod.DirectTransfer && distributionMethod !== DistributionMethod.OffChainBalances
        && (true) ? CreateClaims : EmptyStepItem,

      distributionMethod === DistributionMethod.JSON ?
        JSONTransferability : EmptyStepItem,


      !isOffChainBalances && distributionMethod !== DistributionMethod.JSON && toShowUpdateNonMintTransfersAction ? TransferabilityStep : EmptyStepItem,
      !isOffChainBalances && distributionMethod !== DistributionMethod.JSON && (hasManager && toShowUpdateNonMintTransfersAction) ? RevokeStepItem : EmptyStepItem,

      !isOffChainBalances && (!completeControl && hasManager && toShowCanUpdateCollectionApprovedTransfersPermission) ? FreezeSelectStep : EmptyStepItem,
      !isOffChainBalances ? DefaultToApprovedStepItem : EmptyStepItem,
      isOffChainBalances && (hasManager && toShowCanUpdateOffChainBalancesMetadataPermission) ? CanUpdateBytesStep : EmptyStepItem,


      CollectionPreviewStep,

      // Will also need to support distribution method === JSON (see line 220 TxTimeline with createCollectionFromMsgUpdateCollection and manualSend)
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
