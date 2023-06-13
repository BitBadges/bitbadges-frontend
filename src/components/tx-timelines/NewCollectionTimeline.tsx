import { DistributionMethod, MetadataAddMethod } from 'bitbadgesjs-utils';
import { FormTimeline, TimelineItem } from '../navigation/FormTimeline';
import { EmptyStepItem, MsgNewCollectionProps } from './TxTimeline';
import { BadgeSupplySelectStepItem } from './step-items/BadgeSupplySelectStepItem';
import { CanCreateMoreStepItem } from './step-items/CanCreateMoreStepItem';
import { CanDeleteStepItem } from './step-items/CanDeleteStepItem';
import { CanManagerBeTransferredStepItem } from './step-items/CanManagerBeTransferredStepItem';
import { ChooseBadgeTypeStepItem } from './step-items/ChooseBadgeTypeStepItem';
import { ConfirmManagerStepItem } from './step-items/ConfirmManagerStepItem';
import { CreateClaimsStepItem } from './step-items/CreateClaimsStepItem';
import { CreateCollectionStepItem } from './step-items/CreateCollectionStepItem';
import { DistributionMethodStepItem } from './step-items/DistributionMethodStepItem';
import { FreezeSelectStepItem } from './step-items/FreezeSelectStepItem';
import { ManagerApprovedTransfersStepItem } from './step-items/ManagerApprovedTransfersStepItem';
import { MetadataStorageSelectStepItem } from './step-items/MetadataStorageSelectStepItem';
import { MetadataTooBigStepItem } from './step-items/MetadataTooBigStepItem';
import { PreviewCollectionStepItem } from './step-items/PreviewCollectionStepItem';
import { SetCollectionMetadataStepItem } from './step-items/SetCollectionMetadataStepItem';
import { SetBadgeMetadataStepItem } from './step-items/SetBadgeMetadata';
import { TransferabilitySelectStepItem } from './step-items/TransferabilitySelectStepItem';
import { UpdatableMetadataSelectStepItem } from './step-items/UpdatableMetadataSelectStepItem';
import { CanUpdateBalancesStepItem } from './step-items/CanUpdateBytesStepItem';

//See TxTimeline for explanations and documentation

export function MintCollectionTimeline({
  txTimelineProps
}: {
  txTimelineProps: MsgNewCollectionProps
}) {
  const handledPermissions = txTimelineProps.handledPermissions;
  const updatePermissions = txTimelineProps.updatePermissions;
  const addMethod = txTimelineProps.addMethod;
  const setAddMethod = txTimelineProps.setAddMethod;
  const distributionMethod = txTimelineProps.distributionMethod;
  const setDistributionMethod = txTimelineProps.setDistributionMethod;
  const metadataSize = txTimelineProps.metadataSize;
  const badgeSupplys = txTimelineProps.badgeSupplys;
  const setBadgeSupplys = txTimelineProps.setBadgeSupplys;
  const claims = txTimelineProps.claims;
  const setClaims = txTimelineProps.setClaims;
  const transfers = txTimelineProps.transfers;
  const setTransfers = txTimelineProps.setTransfers;
  const existingCollectionId = txTimelineProps.existingCollectionId;

  //All mint timeline step items
  const ChooseBadgeType = ChooseBadgeTypeStepItem(distributionMethod, setDistributionMethod);
  const ConfirmManager = ConfirmManagerStepItem();
  const BadgeSupplySelectStep = BadgeSupplySelectStepItem(badgeSupplys, setBadgeSupplys);
  // const TransferableSelectStep = TransferableSelectStepItem(msg, setMsg);
  const FreezeSelectStep = FreezeSelectStepItem(handledPermissions, updatePermissions);
  const CanManagerBeTransferredStep = CanManagerBeTransferredStepItem(handledPermissions, updatePermissions);
  const MetadataStorageSelectStep = MetadataStorageSelectStepItem(addMethod, setAddMethod);
  const UpdatableMetadataSelectStep = UpdatableMetadataSelectStepItem(handledPermissions, updatePermissions, addMethod);
  const SetCollectionMetadataStep = SetCollectionMetadataStepItem(addMethod, existingCollectionId);
  const SetBadgeMetadataStep = SetBadgeMetadataStepItem(addMethod, existingCollectionId, false);
  const DistributionMethodStep = DistributionMethodStepItem(distributionMethod, setDistributionMethod, badgeSupplys);
  const CreateClaims = CreateClaimsStepItem(transfers, setTransfers, claims, setClaims, distributionMethod);
  const CreateCollectionStep = CreateCollectionStepItem(claims, transfers, badgeSupplys, addMethod, distributionMethod);
  const ManagerApprovedSelect = ManagerApprovedTransfersStepItem();
  const CanCreateMoreStep = CanCreateMoreStepItem(handledPermissions, updatePermissions);
  const CanDeleteStep = CanDeleteStepItem(handledPermissions, updatePermissions);
  const CollectionPreviewStep = PreviewCollectionStepItem();
  const MetadataTooLargeStep = MetadataTooBigStepItem(metadataSize);
  const TransferabilityStep = TransferabilitySelectStepItem();

  // const UserBalancesStep = UserBalancesSelectStepItem(userBalances, setUserBalances);
  const CanUpdateBytesStep = CanUpdateBalancesStepItem(handledPermissions, updatePermissions);

  const items: TimelineItem[] = [ChooseBadgeType];

  const isOffChainBalances = distributionMethod === DistributionMethod.OffChainBalances;

  if (!isOffChainBalances) {
    items.push(
      ConfirmManager,
      BadgeSupplySelectStep,
      CanCreateMoreStep,
      TransferabilityStep,
      FreezeSelectStep,
      CanManagerBeTransferredStep,
      CanDeleteStep,
      ManagerApprovedSelect,
      MetadataStorageSelectStep,
      UpdatableMetadataSelectStep,
      SetCollectionMetadataStep,
      addMethod === MetadataAddMethod.Manual
        ? SetBadgeMetadataStep : EmptyStepItem,
      MetadataTooLargeStep,
      DistributionMethodStep,
      // distributionMethod === DistributionMethod.Whitelist
      //   ? ManualSendSelect : EmptyStepItem,
      distributionMethod !== DistributionMethod.Unminted && distributionMethod !== DistributionMethod.JSON
        ? CreateClaims : EmptyStepItem,
      // distributionMethod === DistributionMethod.JSON
      //   ? CustomJSONStep : EmptyStepItem,
      addMethod === MetadataAddMethod.Manual ?
        CollectionPreviewStep : EmptyStepItem, //In the future, we can support this but we need to pass updateMetadataForBadgeIdsDirectlyFromUriIfAbsent everywhere :/
      //Will also need to support distribution method === JSON (see line 220 TxTimeline with createCollectionFromMsgNewCollection and manualSend)
      CreateCollectionStep
    );
  } else {
    items.push(
      ConfirmManager,
      BadgeSupplySelectStep,
      CanCreateMoreStep,
      CanManagerBeTransferredStep,
      CanDeleteStep,
      MetadataStorageSelectStep,
      UpdatableMetadataSelectStep,
      SetCollectionMetadataStep,
      addMethod === MetadataAddMethod.Manual
        ? SetBadgeMetadataStep : EmptyStepItem,
      MetadataTooLargeStep,
      CanUpdateBytesStep,
      CreateClaims,
      addMethod === MetadataAddMethod.Manual ?
        CollectionPreviewStep : EmptyStepItem, //In the future, we can support this but we need to pass updateMetadataForBadgeIdsDirectlyFromUriIfAbsent everywhere :/
      CreateCollectionStep
    );
  }

  return (
    <>
      <FormTimeline
        items={items}
      />
    </>
  );
}
