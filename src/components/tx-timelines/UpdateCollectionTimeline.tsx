import { DistributionMethod, MetadataAddMethod } from 'bitbadgesjs-utils';
import { FormTimeline, TimelineItem } from '../navigation/FormTimeline';
import { EmptyStepItem, MsgUpdateCollectionProps } from './TxTimeline';
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
import { MetadataStorageSelectStepItem } from './step-items/MetadataStorageSelectStepItem';
import { MetadataTooBigStepItem } from './step-items/MetadataTooBigStepItem';
import { PreviewCollectionStepItem } from './step-items/PreviewCollectionStepItem';
import { SetCollectionMetadataStepItem } from './step-items/SetCollectionMetadataStepItem';
import { SetBadgeMetadataStepItem } from './step-items/SetBadgeMetadata';
import { TransferabilitySelectStepItem } from './step-items/TransferabilitySelectStepItem';
import { UpdatableMetadataSelectStepItem } from './step-items/UpdatableMetadataSelectStepItem';
import { CanUpdateBalancesStepItem } from './step-items/CanUpdateBytesStepItem';

//See TxTimeline for explanations and documentation

export function UpdateCollectionTimeline({
  txTimelineProps,
  isModal
}: {
  txTimelineProps: MsgUpdateCollectionProps,
  isModal: boolean
}) {
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

  //All mint timeline step items
  const ChooseBadgeType = ChooseBadgeTypeStepItem(distributionMethod, setDistributionMethod);
  const ConfirmManager = ConfirmManagerStepItem();
  const BadgeSupplySelectStep = BadgeSupplySelectStepItem(badgesToCreate, setBadgesToCreate);
  // const TransferableSelectStep = TransferableSelectStepItem(msg, setMsg);
  const FreezeSelectStep = FreezeSelectStepItem(handledPermissions, setHandledPermissions);
  const CanManagerBeTransferredStep = CanManagerBeTransferredStepItem(handledPermissions, setHandledPermissions);
  const MetadataStorageSelectStep = MetadataStorageSelectStepItem(addMethod, setAddMethod);
  const UpdatableMetadataSelectStep = UpdatableMetadataSelectStepItem(handledPermissions, setHandledPermissions, addMethod);
  const SetCollectionMetadataStep = SetCollectionMetadataStepItem(addMethod, existingCollectionId);
  const SetBadgeMetadataStep = SetBadgeMetadataStepItem(addMethod, existingCollectionId);
  const DistributionMethodStep = DistributionMethodStepItem(distributionMethod, setDistributionMethod, badgesToCreate);
  const CreateClaims = CreateClaimsStepItem(transfers, setTransfers, distributionMethod);
  const CreateCollectionStep = CreateCollectionStepItem(txTimelineProps, existingCollectionId);
  const CanCreateMoreStep = CanCreateMoreStepItem(handledPermissions, setHandledPermissions);
  const CanDeleteStep = CanDeleteStepItem(handledPermissions, setHandledPermissions);
  const CollectionPreviewStep = PreviewCollectionStepItem();
  const MetadataTooLargeStep = MetadataTooBigStepItem(metadataSize);
  const TransferabilityStep = TransferabilitySelectStepItem();

  // const UserBalancesStep = UserBalancesSelectStepItem(userBalances, setUserBalances);
  const CanUpdateBytesStep = CanUpdateBalancesStepItem(handledPermissions, setHandledPermissions);

  const items: TimelineItem[] = [ChooseBadgeType];

  const isOffChainBalances = distributionMethod === DistributionMethod.OffChainBalances;

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
    DistributionMethodStep,

    !isOffChainBalances ? TransferabilityStep : EmptyStepItem,
    !isOffChainBalances ? FreezeSelectStep : EmptyStepItem,
    isOffChainBalances ? CanUpdateBytesStep : EmptyStepItem,

    distributionMethod !== DistributionMethod.Unminted && distributionMethod !== DistributionMethod.JSON
      ? CreateClaims : EmptyStepItem,
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
