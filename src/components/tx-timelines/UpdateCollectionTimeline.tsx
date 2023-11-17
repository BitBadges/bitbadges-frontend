import { ActionPermissionUsedFlags, ApprovalPermissionUsedFlags, BalancesActionPermissionUsedFlags, TimedUpdatePermissionUsedFlags, TimedUpdateWithBadgeIdsPermissionUsedFlags, castActionPermissionToUniversalPermission, castBalancesActionPermissionToUniversalPermission, castCollectionApprovalPermissionToUniversalPermission, castTimedUpdatePermissionToUniversalPermission, castTimedUpdateWithBadgeIdsPermissionToUniversalPermission, isInAddressMapping } from 'bitbadgesjs-utils';
import { EmptyStepItem, NEW_COLLECTION_ID, useTxTimelineContext } from '../../bitbadges-api/contexts/TxTimelineContext';

import { getTotalNumberOfBadges } from '../../bitbadges-api/utils/badges';
import { getPermissionDetails } from '../collection-page/PermissionsInfo';
import { FormTimeline, TimelineItem } from '../navigation/FormTimeline';
import { AddressMappingSelectStepItem } from './step-items/AddressMappingSelectStepItem';
import { IsArchivedSelectStepItem } from './step-items/ArchivedSelectStepItem';
import { BadgeSupplySelectStepItem } from './step-items/BadgeSupplySelectStepItem';
import { BalanceTypeSelectStepItem } from './step-items/BalancesTypeSelectStepItem';
import { CanCreateMoreStepItem } from './step-items/CanCreateMoreStepItem';
import { CanDeleteStepItem } from './step-items/CanDeleteStepItem';
import { CanManagerBeTransferredStepItem } from './step-items/CanManagerBeTransferredStepItem';
import { CanArchiveCollectionStepItem } from './step-items/CanUpdateArchivedStepItem';
import { FreezeSelectStepItem } from './step-items/CanUpdateCollectionApprovals';
import { UpdatableMetadataSelectStepItem } from './step-items/CanUpdateMetadata';
import { CanUpdateBalancesStepItem } from './step-items/CanUpdateOffChainBalancesStepItem';
import { ChooseBadgeTypeStepItem, MintType } from './step-items/ChooseBadgeTypeStepItem';
import { CodesViewStepItem } from './step-items/CodesViewStepItem';
import { ChooseControlTypeStepItem } from './step-items/CompleteControlStepItem';
import { ConfirmManagerStepItem } from './step-items/ConfirmManagerStepItem';
import { CreateAddressMappingStepItem } from './step-items/CreateAddressMappingStepItem';
import { CreateCollectionStepItem } from './step-items/CreateCollectionStepItem';
import { DefaultToApprovedSelectStepItem } from './step-items/DefaultToApprovedSelectStepItem';
import { DistributionMethodStepItem } from './step-items/DistributionMethodStepItem';
import { OffChainBalancesStorageSelectStepItem } from './step-items/OffChainBalancesStepItem';
import { PreviewCollectionStepItem } from './step-items/PreviewCollectionStepItem';
import { SetAddressMappingMetadataStepItem } from './step-items/SetAddressMappingMetadataStepItem';
import { SetBadgeMetadataStepItem } from './step-items/SetBadgeMetadata';
import { SetCollectionMetadataStepItem } from './step-items/SetCollectionMetadataStepItem';
import { TransferabilitySelectStepItem } from './step-items/TransferabilitySelectStepItem';
import { neverHasManager } from '../../bitbadges-api/utils/manager';
import { useCollection } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { CollectionTypeSelect } from './step-items/CustomVsPresetCollection';
import { TemplateCollectionSelect } from './step-items/TemplateCollections';

//See TxTimeline for explanations and documentation
export function UpdateCollectionTimeline() {

  const txTimelineContext = useTxTimelineContext();
  const existingCollectionId = txTimelineContext.existingCollectionId;
  const collection = useCollection(NEW_COLLECTION_ID);
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
  const UpdatableMetadataSelectStep = UpdatableMetadataSelectStepItem(true);
  const UpdatableBadgeMetadataSelectStep = UpdatableMetadataSelectStepItem(false);
  const SetAddressMappingMetadataStep = SetAddressMappingMetadataStepItem();
  const SetCollectionMetadataStep = SetCollectionMetadataStepItem();
  const SetBadgeMetadataStep = SetBadgeMetadataStepItem();
  const DistributionMethodStep = DistributionMethodStepItem();
  const CreateCollectionStep = CreateCollectionStepItem();
  const CanCreateMoreStep = CanCreateMoreStepItem();
  const CanDeleteStep = CanDeleteStepItem();
  const CollectionPreviewStep = PreviewCollectionStepItem();
  const TransferabilityStep = TransferabilitySelectStepItem();
  const IsArchivedSelectStep = IsArchivedSelectStepItem();
  const CanArchiveCollectionStep = CanArchiveCollectionStepItem();
  const DefaultToApprovedStepItem = DefaultToApprovedSelectStepItem();
  const OffChainBalancesStorageStepItem = OffChainBalancesStorageSelectStepItem();
  const ChooseControlStepItem = ChooseControlTypeStepItem();
  const CanUpdateBytesStep = CanUpdateBalancesStepItem();
  const AddressMappingSelectItem = AddressMappingSelectStepItem();
  const CreateAddressMappingStep = CreateAddressMappingStepItem();
  const BalanceTypeSelect = BalanceTypeSelectStepItem();
  const CodesViewStep = CodesViewStepItem();

  const CustomCollectionStep = CollectionTypeSelect();
  const TemplateSelectStep = TemplateCollectionSelect();

  const items: TimelineItem[] = [
    (existingCollectionId && existingCollectionId > 0n) || isUpdateAddressMapping ? EmptyStepItem : ChooseBadgeType
  ];



  if (!collection || !startingCollection) return <></>;

  if (mintType === MintType.BitBadge) {
    const isOffChainBalances = collection.balancesType === "Off-Chain";
    const hasManager = !neverHasManager(collection);

    //For the following, we show the PERMISSION UPDATE if it has neutral times (i.e. it's not always permitted or always forbidden at all times)
    //We show the ACTION if the previous permissions allow it, meaning it has neutral (currently permitted) or permitted times (always permitted)

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
      //Check if we have any updatable badge IDs from 1 to maxBadgeID
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

    const canUpdateCollectionApprovalsDetails = getPermissionDetails(
      castCollectionApprovalPermissionToUniversalPermission(startingCollection.collectionPermissions.canUpdateCollectionApprovals ?? []),
      ApprovalPermissionUsedFlags,
      !hasManager
    );
    const toShowCanUpdateCollectionApprovalsPermission = canUpdateCollectionApprovalsDetails.hasNeutralTimes

    const canUpdateMintCollectionApprovalsDetails = getPermissionDetails(
      castCollectionApprovalPermissionToUniversalPermission(startingCollection.collectionPermissions.canUpdateCollectionApprovals ?? []).filter(x => x.fromMapping && isInAddressMapping(x.fromMapping, 'Mint')),
      ApprovalPermissionUsedFlags,
      !hasManager
    );

    const canUpdateNonMintCollectionApprovalsDetails = getPermissionDetails(
      castCollectionApprovalPermissionToUniversalPermission(startingCollection.collectionPermissions.canUpdateCollectionApprovals ?? []).filter(x => !(x.fromMapping.includeAddresses && x.fromMapping.addresses.length == 1 && x.fromMapping.addresses[0] === 'Mint')),
      ApprovalPermissionUsedFlags,
      !hasManager
    );

    const toShowUpdateMintTransfersAction = (canUpdateMintCollectionApprovalsDetails.hasNeutralTimes || canUpdateMintCollectionApprovalsDetails.hasPermittedTimes)

    const toShowUpdateNonMintTransfersAction = (canUpdateNonMintCollectionApprovalsDetails.hasNeutralTimes || canUpdateNonMintCollectionApprovalsDetails.hasPermittedTimes)

    const toShowCompleteControl = (!existingCollectionId || existingCollectionId == 0n)
      //or permissions are completely neutral
      || (Object.values(startingCollection.collectionPermissions).every(x => x.length == 0))

    const toShowCollectionType = (!existingCollectionId || existingCollectionId == 0n)

    const templateCollectionSelect = !txTimelineContext.customCollection;

    items.push(
      toShowCollectionType ? CustomCollectionStep : EmptyStepItem,
    )
    if (templateCollectionSelect) {
      items.push(
        TemplateSelectStep
      )
    } else {
      items.push(
        toShowManagerTransferAction ? ConfirmManager : EmptyStepItem,
        hasManager && toShowCompleteControl ? ChooseControlStepItem : EmptyStepItem,
        !completeControl && hasManager && toShowCanManagerBeTransferredPermission ? CanManagerBeTransferredStep : EmptyStepItem,

        toShowCreateMoreAction ? BadgeSupplySelectStep : EmptyStepItem,
        !completeControl && hasManager && toShowCanCreateMorePermission ? CanCreateMoreStep : EmptyStepItem,


        toShowUpdateCollectionMetadataAction ? SetCollectionMetadataStep : EmptyStepItem,
        toShowUpdateBadgeMetadataAction ? SetBadgeMetadataStep : EmptyStepItem,
        !completeControl && hasManager && toShowCanUpdateCollectionMetadataPermission ? UpdatableMetadataSelectStep : EmptyStepItem,
        !completeControl && hasManager && toShowCanUpdateBadgeMetadataPermission ? UpdatableBadgeMetadataSelectStep : EmptyStepItem,

        BalanceTypeSelect,
        !isOffChainBalances && toShowUpdateMintTransfersAction ? DistributionMethodStep : EmptyStepItem,
        CodesViewStep,

        //TODO: We currently make some assumptions here w/ isBitBadgesHosted and on-chain permissions. Make more robust
        isOffChainBalances && toShowUpdateOffChainBalancesMetadataAction ? OffChainBalancesStorageStepItem : EmptyStepItem,
        isOffChainBalances && toShowCanUpdateOffChainBalancesMetadataPermission ? CanUpdateBytesStep : EmptyStepItem,


        !isOffChainBalances && toShowUpdateNonMintTransfersAction ? TransferabilityStep : EmptyStepItem,
        !isOffChainBalances && (!completeControl && hasManager && toShowCanUpdateCollectionApprovalsPermission) ? FreezeSelectStep : EmptyStepItem,
        !isOffChainBalances ? DefaultToApprovedStepItem : EmptyStepItem,


        !completeControl && hasManager && toShowCanDeletePermission ? CanDeleteStep : EmptyStepItem,
        toShowArchiveCollectionAction && existingCollectionId && existingCollectionId > 0n ? IsArchivedSelectStep : EmptyStepItem,
        !completeControl && hasManager && toShowCanArchiveCollectionPermission ? CanArchiveCollectionStep : EmptyStepItem,

        CollectionPreviewStep,
        CreateCollectionStep,
      );
    }
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


