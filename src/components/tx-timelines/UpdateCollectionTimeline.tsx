import { ActionPermissionUsedFlags, ApprovedTransferPermissionUsedFlags, BalancesActionPermissionUsedFlags, DistributionMethod, MetadataAddMethod, TimedUpdatePermissionUsedFlags, TimedUpdateWithBadgeIdsPermissionUsedFlags, castActionPermissionToUniversalPermission, castBalancesActionPermissionToUniversalPermission, castCollectionApprovedTransferPermissionToUniversalPermission, castTimedUpdatePermissionToUniversalPermission, castTimedUpdateWithBadgeIdsPermissionToUniversalPermission } from 'bitbadgesjs-utils';
import { useCollectionsContext } from '../../bitbadges-api/contexts/CollectionsContext';
import { EmptyStepItem, MSG_PREVIEW_ID, useTxTimelineContext } from '../../bitbadges-api/contexts/TxTimelineContext';
import { getTotalNumberOfBadges } from '../../bitbadges-api/utils/badges';
import { getPermissionDetails } from '../collection-page/PermissionsInfo';
import { FormTimeline, TimelineItem } from '../navigation/FormTimeline';
import { AddressMappingSelectStepItem } from './step-items/AddressMappingSelectStepItem';
import { IsArchivedSelectStepItem } from './step-items/ArchivedSelectStepItem';
import { BadgeSupplySelectStepItem } from './step-items/BadgeSupplySelectStepItem';
import { CanCreateMoreStepItem } from './step-items/CanCreateMoreStepItem';
import { CanDeleteStepItem } from './step-items/CanDeleteStepItem';
import { CanManagerBeTransferredStepItem } from './step-items/CanManagerBeTransferredStepItem';
import { CanArchiveCollectionStepItem } from './step-items/CanUpdateArchivedStepItem';
import { CanUpdateBalancesStepItem } from './step-items/CanUpdateOffChainBalancesStepItem';
import { ChooseBadgeTypeStepItem, MintType } from './step-items/ChooseBadgeTypeStepItem';
import { ChooseControlTypeStepItem } from './step-items/CompleteControlStepItem';
import { ConfirmManagerStepItem } from './step-items/ConfirmManagerStepItem';
import { CreateAddressMappingStepItem } from './step-items/CreateAddressMappingStepItem';
import { CreateClaimsStepItem } from './step-items/CreateClaimsStepItem';
import { CreateCollectionStepItem } from './step-items/CreateCollectionStepItem';
import { DefaultToApprovedSelectStepItem } from './step-items/DefaultToApprovedSelectStepItem';
import { DistributionMethodStepItem } from './step-items/DistributionMethodStepItem';
import { FreezeSelectStepItem } from './step-items/CanUpdateCollectionApprovedTransfers';
import { MetadataStorageSelectStepItem } from './step-items/MetadataStorageSelectStepItem';
import { MetadataTooBigStepItem } from './step-items/MetadataTooBigStepItem';
import { OffChainBalancesStorageSelectStepItem } from './step-items/OffChainBalancesStepItem';
import { PreviewCollectionStepItem } from './step-items/PreviewCollectionStepItem';
import { SetAddressMappingMetadataStepItem } from './step-items/SetAddressMappingMetadataStepItem';
import { SetBadgeMetadataStepItem } from './step-items/SetBadgeMetadata';
import { SetCollectionMetadataStepItem } from './step-items/SetCollectionMetadataStepItem';
import { JSONTransferabilitySelectStepItem } from './step-items/TransferabilityJSONSelect';
import { TransferabilitySelectStepItem } from './step-items/TransferabilitySelectStepItem';
import { UpdatableMetadataSelectStepItem } from './step-items/CanUpdateMetadata';

//See TxTimeline for explanations and documentation
export function UpdateCollectionTimeline() {

  const collections = useCollectionsContext();
  const txTimelineContext = useTxTimelineContext();
  const existingCollectionId = txTimelineContext.existingCollectionId;
  const collection = collections.collections[MSG_PREVIEW_ID.toString()];
  const distributionMethod = txTimelineContext.distributionMethod;
  const addMethod = txTimelineContext.addMethod;
  const mintType = txTimelineContext.mintType;
  const isUpdateAddressMapping = txTimelineContext.isUpdateAddressMapping;
  const formStepNum = txTimelineContext.formStepNum;
  const setFormStepNum = txTimelineContext.setFormStepNum;
  const completeControl = txTimelineContext.completeControl;
  const startingCollection = txTimelineContext.startingCollection;


  //All mint timeline step items
  const ChooseBadgeType = ChooseBadgeTypeStepItem();
  const ConfirmManager = ConfirmManagerStepItem();
  const BadgeSupplySelectStep = BadgeSupplySelectStepItem();
  const FreezeSelectStep = FreezeSelectStepItem();
  const CanManagerBeTransferredStep = CanManagerBeTransferredStepItem();
  const MetadataStorageSelectStep = MetadataStorageSelectStepItem();
  const UpdatableMetadataSelectStep = UpdatableMetadataSelectStepItem(true);
  const UpdatableBadgeMetadataSelectStep = UpdatableMetadataSelectStepItem(false);
  const SetAddressMappingMetadataStep = SetAddressMappingMetadataStepItem();
  const SetCollectionMetadataStep = SetCollectionMetadataStepItem();
  const SetBadgeMetadataStep = SetBadgeMetadataStepItem();
  const DistributionMethodStep = DistributionMethodStepItem();
  const CreateClaims = CreateClaimsStepItem();
  const CreateCollectionStep = CreateCollectionStepItem();
  const CanCreateMoreStep = CanCreateMoreStepItem();
  const CanDeleteStep = CanDeleteStepItem();
  const CollectionPreviewStep = PreviewCollectionStepItem();
  const MetadataTooLargeStep = MetadataTooBigStepItem();
  const TransferabilityStep = TransferabilitySelectStepItem();
  const IsArchivedSelectStep = IsArchivedSelectStepItem();
  const CanArchiveCollectionStep = CanArchiveCollectionStepItem();
  const DefaultToApprovedStepItem = DefaultToApprovedSelectStepItem();
  const OffChainBalancesStorageStepItem = OffChainBalancesStorageSelectStepItem();
  const ChooseControlStepItem = ChooseControlTypeStepItem();
  const JSONTransferability = JSONTransferabilitySelectStepItem();
  const CanUpdateBytesStep = CanUpdateBalancesStepItem();
  const AddressMappingSelectItem = AddressMappingSelectStepItem();
  const CreateAddressMappingStep = CreateAddressMappingStepItem();


  const items: TimelineItem[] = [
    (existingCollectionId && existingCollectionId > 0n) || isUpdateAddressMapping ? EmptyStepItem : ChooseBadgeType
  ];

  if (!collection || !startingCollection) return <></>;

  if (mintType === MintType.BitBadge) {
    const isOffChainBalances = distributionMethod === DistributionMethod.OffChainBalances;
    const managerTimeline = collection.managerTimeline;
    const hasManager = managerTimeline.length > 0 && managerTimeline.some(x => x.manager !== '');

    //For the following, we show the permission update if it has neutral times (i.e. it's not always permitted or always forbidden at all times)
    //We show the action if the permissions allow it, meaning it has neutral (currently permitted) or permitted times (always permitted)

    const deleteDetails = getPermissionDetails(
      castActionPermissionToUniversalPermission(startingCollection.collectionPermissions.canDeleteCollection ?? []),
      ActionPermissionUsedFlags,
      !hasManager
    );
    const toShowCanDeletePermission = deleteDetails.hasNeutralTimes

    const canCreateMoreDetails = getPermissionDetails(
      castBalancesActionPermissionToUniversalPermission(startingCollection.collectionPermissions.canCreateMoreBadges ?? []),
      BalancesActionPermissionUsedFlags,
      !hasManager
    );
    const toShowCanCreateMorePermission = canCreateMoreDetails.hasNeutralTimes
    const toShowCreateMoreAction = canCreateMoreDetails.hasNeutralTimes || canCreateMoreDetails.hasPermittedTimes

    const canManagerBeTransferredDetails = getPermissionDetails(
      castTimedUpdatePermissionToUniversalPermission(startingCollection.collectionPermissions.canUpdateManager ?? []),
      TimedUpdatePermissionUsedFlags,
      !hasManager
    );
    const toShowCanManagerBeTransferredPermission = canManagerBeTransferredDetails.hasNeutralTimes
    const toShowManagerTransferAction = canManagerBeTransferredDetails.hasNeutralTimes || canManagerBeTransferredDetails.hasPermittedTimes

    const canUpdateBadgeMetadataDetails = getPermissionDetails(
      castTimedUpdateWithBadgeIdsPermissionToUniversalPermission(startingCollection.collectionPermissions.canUpdateBadgeMetadata ?? []),
      TimedUpdateWithBadgeIdsPermissionUsedFlags,
      !hasManager
    );
    const maxBadgeId = getTotalNumberOfBadges(collection);
    const toShowCanUpdateBadgeMetadataPermission = canUpdateBadgeMetadataDetails.hasNeutralTimes;

    const toShowUpdateBadgeMetadataAction = canUpdateBadgeMetadataDetails.dataSource.some(x => !x.forbidden &&
      //Check if we have any badge IDs from 1 to maxBadgeID
      x.badgeIds?.find(y => y.start <= maxBadgeId && y.end > 0n) !== undefined
    )

    const canUpdateCollectionMetadataDetails = getPermissionDetails(
      castTimedUpdatePermissionToUniversalPermission(startingCollection.collectionPermissions.canUpdateCollectionMetadata ?? []),
      TimedUpdatePermissionUsedFlags,
      !hasManager
    );
    const toShowCanUpdateCollectionMetadataPermission = canUpdateCollectionMetadataDetails.hasNeutralTimes
    const toShowUpdateCollectionMetadataAction = canUpdateCollectionMetadataDetails.hasNeutralTimes || canUpdateCollectionMetadataDetails.hasPermittedTimes



    const canUpdateOffChainBalancesMetadata = getPermissionDetails(
      castTimedUpdatePermissionToUniversalPermission(startingCollection.collectionPermissions.canUpdateOffChainBalancesMetadata ?? []),
      TimedUpdatePermissionUsedFlags,
      !hasManager
    );
    const toShowCanUpdateOffChainBalancesMetadataPermission = canUpdateOffChainBalancesMetadata.hasNeutralTimes
    const toShowUpdateOffChainBalancesMetadataAction = canUpdateOffChainBalancesMetadata.hasNeutralTimes || canUpdateOffChainBalancesMetadata.hasPermittedTimes

    const canArchiveCollection = getPermissionDetails(
      castTimedUpdatePermissionToUniversalPermission(startingCollection.collectionPermissions.canArchiveCollection ?? []),
      TimedUpdatePermissionUsedFlags,
      !hasManager
    );
    const toShowCanArchiveCollectionPermission = canArchiveCollection.hasNeutralTimes
    const toShowArchiveCollectionAction = canArchiveCollection.hasNeutralTimes || canArchiveCollection.hasPermittedTimes

    const canUpdateCollectionApprovedTransfersDetails = getPermissionDetails(
      castCollectionApprovedTransferPermissionToUniversalPermission(startingCollection.collectionPermissions.canUpdateCollectionApprovedTransfers ?? []),
      ApprovedTransferPermissionUsedFlags,
      !hasManager
    );
    const toShowCanUpdateCollectionApprovedTransfersPermission = canUpdateCollectionApprovedTransfersDetails.hasNeutralTimes

    const toShowUpdateMintTransfersAction = (canUpdateCollectionApprovedTransfersDetails.hasNeutralTimes || canUpdateCollectionApprovedTransfersDetails.hasPermittedTimes)

    const toShowUpdateNonMintTransfersAction = (canUpdateCollectionApprovedTransfersDetails.hasNeutralTimes || canUpdateCollectionApprovedTransfersDetails.hasPermittedTimes)

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

      addMethod === MetadataAddMethod.Manual ? toShowUpdateBadgeMetadataAction ? SetBadgeMetadataStep : EmptyStepItem : EmptyStepItem,
      MetadataTooLargeStep,
      !completeControl && hasManager && toShowCanUpdateCollectionMetadataPermission ? UpdatableMetadataSelectStep : EmptyStepItem,
      !completeControl && hasManager && toShowCanUpdateBadgeMetadataPermission ? UpdatableBadgeMetadataSelectStep : EmptyStepItem,

      isOffChainBalances || toShowUpdateMintTransfersAction ? DistributionMethodStep : EmptyStepItem,

      distributionMethod === DistributionMethod.OffChainBalances ? OffChainBalancesStorageStepItem : EmptyStepItem,
      distributionMethod === DistributionMethod.OffChainBalances && toShowUpdateOffChainBalancesMetadataAction ? CreateClaims : EmptyStepItem,
      distributionMethod !== DistributionMethod.None && distributionMethod !== DistributionMethod.Unminted && distributionMethod !== DistributionMethod.JSON && distributionMethod !== DistributionMethod.DirectTransfer && distributionMethod !== DistributionMethod.OffChainBalances
        ? CreateClaims : EmptyStepItem,

      distributionMethod === DistributionMethod.JSON ? JSONTransferability : EmptyStepItem,
      !isOffChainBalances && distributionMethod !== DistributionMethod.JSON && toShowUpdateNonMintTransfersAction ? TransferabilityStep : EmptyStepItem,

      !isOffChainBalances && (!completeControl && hasManager && toShowCanUpdateCollectionApprovedTransfersPermission) ? FreezeSelectStep : EmptyStepItem,
      !isOffChainBalances ? DefaultToApprovedStepItem : EmptyStepItem,
      isOffChainBalances && (hasManager && toShowCanUpdateOffChainBalancesMetadataPermission) ? CanUpdateBytesStep : EmptyStepItem,


      CollectionPreviewStep,
      CreateCollectionStep,
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
      />
    </>
  );
}
