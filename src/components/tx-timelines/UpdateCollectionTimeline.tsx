import {
  isInAddressMapping
} from "bitbadgesjs-utils"
import {
  EmptyStepItem,
  NEW_COLLECTION_ID,
  useTxTimelineContext,
} from "../../bitbadges-api/contexts/TxTimelineContext"

import { getMaxBadgeIdForCollection } from "bitbadgesjs-utils"
import { useCollection } from "../../bitbadges-api/contexts/collections/CollectionsContext"
import { neverHasManager } from "../../bitbadges-api/utils/manager"
import { getDetailsForCollectionPermission, getDetailsForPermission } from "../../bitbadges-api/utils/permissions"
import { FormTimeline, TimelineItem } from "../navigation/FormTimeline"
import { AddressMappingSelectStepItem } from "./step-items/AddressMappingSelectStepItem"
import { IsArchivedSelectStepItem } from "./step-items/ArchivedSelectStepItem"
import { BadgeSupplySelectStepItem } from "./step-items/BadgeSupplySelectStepItem"
import { BalanceTypeSelectStepItem } from "./step-items/BalancesTypeSelectStepItem"
import { CanCreateMoreStepItem } from "./step-items/CanCreateMoreStepItem"
import { CanDeleteStepItem } from "./step-items/CanDeleteStepItem"
import { CanManagerBeTransferredStepItem } from "./step-items/CanManagerBeTransferredStepItem"
import { CanArchiveCollectionStepItem } from "./step-items/CanUpdateArchivedStepItem"
import { FreezeSelectStepItem } from "./step-items/CanUpdateCollectionApprovals"
import { UpdatableMetadataSelectStepItem } from "./step-items/CanUpdateMetadata"
import { CanUpdateBalancesStepItem } from "./step-items/CanUpdateOffChainBalancesStepItem"
import { CanUpdateStandardsStepItem } from "./step-items/CanUpdateStandardsSelectStepItem"
import {
  ChooseBadgeTypeStepItem,
  MintType,
} from "./step-items/ChooseBadgeTypeStepItem"
import { CodesViewStepItem } from "./step-items/CodesViewStepItem"
import { ChooseControlTypeStepItem } from "./step-items/CompleteControlStepItem"
import { ConfirmManagerStepItem } from "./step-items/ConfirmManagerStepItem"
import { CreateAddressMappingStepItem } from "./step-items/CreateAddressMappingStepItem"
import { CreateCollectionStepItem } from "./step-items/CreateCollectionStepItem"
import { CollectionTypeSelect } from "./step-items/CustomVsPresetCollection"
import { DefaultToApprovedSelectStepItem } from "./step-items/DefaultToApprovedSelectStepItem"
import { DirectTransfersStepItem } from "./step-items/DirectTransfersStepItem"
import { DistributionMethodStepItem } from "./step-items/DistributionMethodStepItem"
import { OffChainBalancesStorageSelectStepItem } from "./step-items/OffChainBalancesStepItem"
import { PreviewBadgePagesStepItem, PreviewCollectionStepItem } from "./step-items/PreviewCollectionStepItem"
import { SetAddressMappingMetadataStepItem } from "./step-items/SetAddressMappingMetadataStepItem"
import { SetBadgeMetadataStepItem } from "./step-items/SetBadgeMetadata"
import { SetCollectionMetadataStepItem } from "./step-items/SetCollectionMetadataStepItem"
import { StandardsSelectStepItem } from "./step-items/StandardsSelectStepItem"
import { TemplateCollectionSelect } from "./step-items/TemplateCollections"
import { TransferabilitySelectStepItem } from "./step-items/TransferabilitySelectStepItem"

//See TxTimeline for explanations and documentation
export function UpdateCollectionTimeline() {
  const txTimelineContext = useTxTimelineContext()
  const existingCollectionId = txTimelineContext.existingCollectionId
  const collection = useCollection(NEW_COLLECTION_ID)
  const mintType = txTimelineContext.mintType
  const isUpdateAddressMapping = txTimelineContext.isUpdateAddressMapping
  const formStepNum = txTimelineContext.formStepNum
  const setFormStepNum = txTimelineContext.setFormStepNum
  const completeControl = txTimelineContext.completeControl
  const startingCollection = txTimelineContext.startingCollection

  //All mint timeline step items
  const ChooseBadgeType = ChooseBadgeTypeStepItem()
  const ConfirmManager = ConfirmManagerStepItem()
  const BadgeSupplySelectStep = BadgeSupplySelectStepItem()
  const FreezeSelectStep = FreezeSelectStepItem()
  const CanManagerBeTransferredStep = CanManagerBeTransferredStepItem()
  const UpdatableMetadataSelectStep = UpdatableMetadataSelectStepItem(true)
  const UpdatableBadgeMetadataSelectStep = UpdatableMetadataSelectStepItem(false)
  const SetAddressMappingMetadataStep = SetAddressMappingMetadataStepItem()
  const SetCollectionMetadataStep = SetCollectionMetadataStepItem()
  const SetBadgeMetadataStep = SetBadgeMetadataStepItem()
  const DistributionMethodStep = DistributionMethodStepItem()
  const CreateCollectionStep = CreateCollectionStepItem()
  const CanCreateMoreStep = CanCreateMoreStepItem()
  const CanDeleteStep = CanDeleteStepItem()
  const CollectionPreviewStep = PreviewCollectionStepItem()
  const BadgePreviewsStep = PreviewBadgePagesStepItem()
  const TransferabilityStep = TransferabilitySelectStepItem()
  const IsArchivedSelectStep = IsArchivedSelectStepItem()
  const CanArchiveCollectionStep = CanArchiveCollectionStepItem()
  const DefaultToApprovedStepItem = DefaultToApprovedSelectStepItem()
  const OffChainBalancesStorageStepItem = OffChainBalancesStorageSelectStepItem()
  const ChooseControlStepItem = ChooseControlTypeStepItem()
  const CanUpdateBytesStep = CanUpdateBalancesStepItem()
  const StandardsSelectStep = StandardsSelectStepItem()
  const CanUpdateStandardsSelectStep = CanUpdateStandardsStepItem()

  const AddressMappingSelectItem = AddressMappingSelectStepItem()
  const CreateAddressMappingStep = CreateAddressMappingStepItem()
  const BalanceTypeSelect = BalanceTypeSelectStepItem()
  const CodesViewStep = CodesViewStepItem()

  const CustomCollectionStep = CollectionTypeSelect()
  const TemplateSelectStep = TemplateCollectionSelect()

  const DirectTransfersStep = DirectTransfersStepItem()

  const items: TimelineItem[] = [
    (existingCollectionId && existingCollectionId > 0n) ||
      isUpdateAddressMapping
      ? EmptyStepItem
      : ChooseBadgeType,
  ]

  if (!collection || !startingCollection) return <></>

  if (mintType === MintType.BitBadge) {
    const isOffChainBalances = collection.balancesType === "Off-Chain - Indexed"
    const isNonIndexedBalances =
      collection.balancesType === "Off-Chain - Non-Indexed"
    const hasManager = !neverHasManager(collection)

    //For the following, we show the PERMISSION UPDATE if it has neutral times (i.e. it's not always permitted or always forbidden at all times)
    //We show the ACTION if the previous permissions allow it, meaning it has neutral (currently permitted) or permitted times (always permitted)

    const deleteDetails = getDetailsForCollectionPermission(startingCollection, "canDeleteCollection")
    const toShowCanDeletePermission = deleteDetails.hasNeutralTimes

    const canCreateMoreDetails = getDetailsForCollectionPermission(startingCollection, "canCreateMoreBadges")
    const toShowCanCreateMorePermission = canCreateMoreDetails.hasNeutralTimes
    const toShowCreateMoreAction = !canCreateMoreDetails.isAlwaysFrozenAndForbidden

    const canManagerBeTransferredDetails = getDetailsForCollectionPermission(startingCollection, "canUpdateManager")
    const toShowCanManagerBeTransferredPermission = canManagerBeTransferredDetails.hasNeutralTimes
    const toShowManagerTransferAction = !canManagerBeTransferredDetails.isAlwaysFrozenAndForbidden


    const canUpdateBadgeMetadataDetails = getDetailsForCollectionPermission(startingCollection, "canUpdateBadgeMetadata")
    const maxBadgeId = getMaxBadgeIdForCollection(collection)
    const toShowCanUpdateBadgeMetadataPermission = canUpdateBadgeMetadataDetails.hasNeutralTimes
    const toShowUpdateBadgeMetadataAction =
      canUpdateBadgeMetadataDetails.dataSource.some(
        (x) =>
          !x.forbidden &&
          //Check if we have any updatable badge IDs from 1 to maxBadgeID
          x.badgeIds?.find((y) => y.start <= maxBadgeId && y.end > 0n) !==
          undefined
      )

    const canUpdateCollectionMetadataDetails = getDetailsForCollectionPermission(startingCollection, "canUpdateCollectionMetadata")
    const toShowCanUpdateCollectionMetadataPermission = canUpdateCollectionMetadataDetails.hasNeutralTimes
    const toShowUpdateCollectionMetadataAction = !canUpdateCollectionMetadataDetails.isAlwaysFrozenAndForbidden

    const canUpdateOffChainBalancesMetadata = getDetailsForCollectionPermission(startingCollection, "canUpdateOffChainBalancesMetadata")
    const toShowCanUpdateOffChainBalancesMetadataPermission = canUpdateOffChainBalancesMetadata.hasNeutralTimes
    const toShowUpdateOffChainBalancesMetadataAction = !canUpdateOffChainBalancesMetadata.isAlwaysFrozenAndForbidden

    const canArchiveCollection = getDetailsForCollectionPermission(startingCollection, "canArchiveCollection")
    const toShowCanArchiveCollectionPermission = canArchiveCollection.hasNeutralTimes
    const toShowArchiveCollectionAction = !canArchiveCollection.isAlwaysFrozenAndForbidden

    const canUpdateStandards = getDetailsForCollectionPermission(startingCollection, "canUpdateStandards")

    const toShowCanUpdateStandardsPermission = canUpdateStandards.hasNeutralTimes
    const toShowUpdateStandardsAction = !canUpdateStandards.isAlwaysFrozenAndForbidden

    const canUpdateCollectionApprovalsDetails = getDetailsForCollectionPermission(startingCollection, "canUpdateCollectionApprovals")
    const toShowCanUpdateCollectionApprovalsPermission = canUpdateCollectionApprovalsDetails.hasNeutralTimes

    const canUpdateMintCollectionApprovalsDetails = getDetailsForPermission(
      (
        startingCollection.collectionPermissions.canUpdateCollectionApprovals ??
        []
      ).filter(
        (x) => x.fromMapping && isInAddressMapping(x.fromMapping, "Mint")
      ),
      "canUpdateCollectionApprovals"
    )

    const canUpdateNonMintCollectionApprovalsDetails = getDetailsForPermission(
      (
        startingCollection.collectionPermissions.canUpdateCollectionApprovals ??
        []
      ).filter(
        (x) =>
          !(
            x.fromMapping.includeAddresses &&
            x.fromMapping.addresses.length == 1 &&
            x.fromMapping.addresses[0] === "Mint"
          )
      ),
      "canUpdateCollectionApprovals"
    )
    const toShowUpdateMintTransfersAction = !canUpdateMintCollectionApprovalsDetails.isAlwaysFrozenAndForbidden
    const toShowUpdateNonMintTransfersAction = !canUpdateNonMintCollectionApprovalsDetails.isAlwaysFrozenAndForbidden

    const toShowCompleteControl =
      !existingCollectionId ||
      existingCollectionId == 0n ||
      //or permissions are completely neutral
      Object.values(startingCollection.collectionPermissions).every(
        (x) => x.length == 0
      )

    const toShowCollectionType =
      !existingCollectionId || existingCollectionId == 0n

    const templateCollectionSelect = !txTimelineContext.customCollection

    const isDefaultUserBalances = collection.defaultBalances.balances.length > 0

    items.push(toShowCollectionType ? CustomCollectionStep : EmptyStepItem)
    if (templateCollectionSelect) {
      items.push(TemplateSelectStep)
    } else {
      items.push(

        false && toShowUpdateStandardsAction
          ? StandardsSelectStep
          : EmptyStepItem,
        false && toShowCanUpdateStandardsPermission
          ? CanUpdateStandardsSelectStep
          : EmptyStepItem,

        toShowManagerTransferAction ? ConfirmManager : EmptyStepItem,
        hasManager && toShowCompleteControl ? ChooseControlStepItem : EmptyStepItem,
        !completeControl &&
          hasManager &&
          toShowCanManagerBeTransferredPermission
          ? CanManagerBeTransferredStep
          : EmptyStepItem,

        BalanceTypeSelect,

        toShowCreateMoreAction ? BadgeSupplySelectStep : EmptyStepItem,
        !completeControl &&
          hasManager &&
          toShowCanCreateMorePermission &&
          !isDefaultUserBalances
          ? CanCreateMoreStep
          : EmptyStepItem,

        toShowUpdateCollectionMetadataAction
          ? SetCollectionMetadataStep
          : EmptyStepItem,
        toShowUpdateBadgeMetadataAction ? SetBadgeMetadataStep : EmptyStepItem,
        !completeControl &&
          hasManager &&
          toShowCanUpdateCollectionMetadataPermission
          ? UpdatableMetadataSelectStep
          : EmptyStepItem,
        !completeControl && hasManager && toShowCanUpdateBadgeMetadataPermission
          ? UpdatableBadgeMetadataSelectStep
          : EmptyStepItem,

        !isOffChainBalances && !isNonIndexedBalances && !isDefaultUserBalances
          ? DefaultToApprovedStepItem
          : EmptyStepItem,
        !isOffChainBalances &&
          !isNonIndexedBalances &&
          toShowUpdateMintTransfersAction &&
          !isDefaultUserBalances
          ? DistributionMethodStep
          : EmptyStepItem,
        CodesViewStep,
        !isDefaultUserBalances ? DirectTransfersStep : EmptyStepItem,

        //TODO: We currently make some assumptions here w/ isBitBadgesHosted and on-chain permissions. Make more robust
        isOffChainBalances && toShowUpdateOffChainBalancesMetadataAction
          ? OffChainBalancesStorageStepItem
          : EmptyStepItem,
        (isOffChainBalances || isNonIndexedBalances) &&
          toShowCanUpdateOffChainBalancesMetadataPermission
          ? CanUpdateBytesStep
          : EmptyStepItem,

        !isOffChainBalances &&
          !isNonIndexedBalances &&
          toShowUpdateNonMintTransfersAction
          ? TransferabilityStep
          : EmptyStepItem,
        !isOffChainBalances &&
          !isNonIndexedBalances &&
          !completeControl &&
          hasManager &&
          toShowCanUpdateCollectionApprovalsPermission
          ? FreezeSelectStep
          : EmptyStepItem,

        !completeControl && hasManager && toShowCanDeletePermission
          ? CanDeleteStep
          : EmptyStepItem,
        toShowArchiveCollectionAction &&
          existingCollectionId &&
          existingCollectionId > 0n
          ? IsArchivedSelectStep
          : EmptyStepItem,
        !completeControl && hasManager && toShowCanArchiveCollectionPermission
          ? CanArchiveCollectionStep
          : EmptyStepItem,

        CollectionPreviewStep,
        BadgePreviewsStep,
        CreateCollectionStep
      )
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
  )
}
