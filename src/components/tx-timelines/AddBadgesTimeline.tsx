import { DistributionMethod, MetadataAddMethod } from 'bitbadgesjs-utils';
import { FormTimeline } from '../navigation/FormTimeline';
import { EmptyStepItem, MsgMintAndDistriubteBadgesProps } from './TxTimeline';
import { BadgeSupplySelectStepItem } from './step-items/BadgeSupplySelectStepItem';
import { CreateClaimsStepItem } from './step-items/CreateClaimsStepItem';
import { DistributionMethodStepItem } from './step-items/DistributionMethodStepItem';
import { MetadataStorageSelectStepItem } from './step-items/MetadataStorageSelectStepItem';
import { PreviewCollectionStepItem } from './step-items/PreviewCollectionStepItem';
import { SetBadgeMetadataStepItem } from './step-items/SetBadgeMetadata';
import { SetCollectionMetadataStepItem } from './step-items/SetCollectionMetadataStepItem';

//See TxTimeline for explanations and documentation

export function AddBadgesTimeline({
  txTimelineProps
}: {
  txTimelineProps: MsgMintAndDistriubteBadgesProps
}) {
  const addMethod = txTimelineProps.addMethod;
  const setAddMethod = txTimelineProps.setAddMethod;
  const distributionMethod = txTimelineProps.distributionMethod;
  const setDistributionMethod = txTimelineProps.setDistributionMethod;
  const badgeSupplys = txTimelineProps.badgeSupplys;
  const setBadgeSupplys = txTimelineProps.setBadgeSupplys;
  const existingCollectionId = txTimelineProps.existingCollectionId;
  const transfers = txTimelineProps.transfers;
  const setTransfers = txTimelineProps.setTransfers;
  const claims = txTimelineProps.claims;
  const setClaims = txTimelineProps.setClaims;

  //All mint timeline step items
  const BadgeSupplySelectStep = BadgeSupplySelectStepItem(badgeSupplys, setBadgeSupplys);
  const MetadataStorageSelectStep = MetadataStorageSelectStepItem(addMethod, setAddMethod);
  const SetCollectionMetadataStep = SetCollectionMetadataStepItem(addMethod, existingCollectionId, true);
  const SetBadgeMetadataStep = SetBadgeMetadataStepItem(addMethod, existingCollectionId, true);
  const DistributionMethodStep = DistributionMethodStepItem(distributionMethod, setDistributionMethod, badgeSupplys);
  const CreateClaims = CreateClaimsStepItem(transfers, setTransfers, claims, setClaims, distributionMethod);
  const CollectionPreviewStep = PreviewCollectionStepItem();

  return (
    <FormTimeline
      items={[
        BadgeSupplySelectStep,
        MetadataStorageSelectStep,
        addMethod === MetadataAddMethod.UploadUrl
          ? SetCollectionMetadataStep : EmptyStepItem,
        addMethod === MetadataAddMethod.Manual
          ? SetBadgeMetadataStep : EmptyStepItem,

        DistributionMethodStep,
        distributionMethod !== DistributionMethod.Unminted && distributionMethod !== DistributionMethod.JSON
          ? CreateClaims : EmptyStepItem,
        addMethod === MetadataAddMethod.Manual
          ? CollectionPreviewStep : EmptyStepItem,
      ]}
      onFinish={() => {
        if (txTimelineProps.onFinish) txTimelineProps.onFinish(txTimelineProps);
      }}
    />
  );
}
