import { DistributionMethod, MetadataAddMethod } from 'bitbadgesjs-utils';
import { FormTimeline } from '../navigation/FormTimeline';
import { EmptyStepItem, TxTimelineProps } from './TxTimeline';
import { BadgeSupplySelectStepItem } from './step-items/BadgeSupplySelectStepItem';
import { CreateClaimsStepItem } from './step-items/CreateClaimsStepItem';
import { DistributionMethodStepItem } from './step-items/DistributionMethodStepItem';
import { ManualSendSelectStepItem } from './step-items/ManualSendSelectStepItem';
import { MetadataStorageSelectStepItem } from './step-items/MetadataStorageSelectStepItem';
import { PreviewCollectionStepItem } from './step-items/PreviewCollectionStepItem';
import { SetCollectionMetadataStepItem } from './step-items/SetCollectionMetadataStepItem';
import { SetIndividualBadgeMetadataStepItem } from './step-items/SetIndividualBadgeMetadata';

//See TxTimeline for explanations and documentation

export function AddBadgesTimeline({
  txTimelineProps
}: {
  txTimelineProps: TxTimelineProps
}) {
  const newCollectionMsg = txTimelineProps.newCollectionMsg;
  const setNewCollectionMsg = txTimelineProps.setNewCollectionMsg;
  const addMethod = txTimelineProps.addMethod;
  const setAddMethod = txTimelineProps.setAddMethod;
  const collectionMetadata = txTimelineProps.collectionMetadata;
  const individualBadgeMetadata = txTimelineProps.individualBadgeMetadata;
  const setIndividualBadgeMetadata = txTimelineProps.setIndividualBadgeMetadata;
  const distributionMethod = txTimelineProps.distributionMethod;
  const setDistributionMethod = txTimelineProps.setDistributionMethod;
  const claimItems = txTimelineProps.claimItems;
  const setClaimItems = txTimelineProps.setClaimItems;
  const manualSend = txTimelineProps.manualSend;
  const setManualSend = txTimelineProps.setManualSend;
  const fungible = txTimelineProps.fungible;
  const nonFungible = txTimelineProps.nonFungible;
  const simulatedCollection = txTimelineProps.simulatedCollection;
  const existingCollection = txTimelineProps.existingCollection;
  const setCollectionMetadata = txTimelineProps.setCollectionMetadata;
  const updateMetadataForBadgeIdsDirectlyFromUriIfAbsent = txTimelineProps.updateMetadataForBadgeIdsDirectlyFromUriIfAbsent;

  //All mint timeline step items
  const BadgeSupplySelectStep = BadgeSupplySelectStepItem(newCollectionMsg, setNewCollectionMsg, simulatedCollection, existingCollection);
  const MetadataStorageSelectStep = MetadataStorageSelectStepItem(addMethod, setAddMethod);
  const SetCollectionMetadataStep = SetCollectionMetadataStepItem(newCollectionMsg, setNewCollectionMsg, addMethod, collectionMetadata, setCollectionMetadata, individualBadgeMetadata, setIndividualBadgeMetadata, simulatedCollection, existingCollection, updateMetadataForBadgeIdsDirectlyFromUriIfAbsent, true);
  const SetIndividualBadgeMetadataStep = SetIndividualBadgeMetadataStepItem(newCollectionMsg, setNewCollectionMsg, simulatedCollection, individualBadgeMetadata, setIndividualBadgeMetadata, collectionMetadata, addMethod, existingCollection, true);
  const DistributionMethodStep = DistributionMethodStepItem(distributionMethod, setDistributionMethod, fungible, nonFungible);
  const CreateClaims = CreateClaimsStepItem(simulatedCollection, newCollectionMsg, setNewCollectionMsg, distributionMethod, claimItems, setClaimItems, manualSend, undefined, updateMetadataForBadgeIdsDirectlyFromUriIfAbsent);
  const ManualSendSelect = ManualSendSelectStepItem(newCollectionMsg, setNewCollectionMsg, manualSend, setManualSend, claimItems, simulatedCollection);
  const CollectionPreviewStep = PreviewCollectionStepItem(simulatedCollection);


  const offChainBalances = existingCollection?.standard === 1;
  //TODO: Support updating balances here for off-chain as well and on DIstributeTImeline
  //Will need to add updateBytes field to MsgMintBadge
  return (
    <FormTimeline
      items={[
        BadgeSupplySelectStep,
        MetadataStorageSelectStep,
        addMethod === MetadataAddMethod.UploadUrl
          ? SetCollectionMetadataStep : EmptyStepItem,
        addMethod === MetadataAddMethod.Manual
          ? SetIndividualBadgeMetadataStep : EmptyStepItem,

        !offChainBalances ? DistributionMethodStep : EmptyStepItem,
        !offChainBalances && distributionMethod === DistributionMethod.Whitelist
          ? ManualSendSelect : EmptyStepItem,
        !offChainBalances && distributionMethod !== DistributionMethod.Unminted && distributionMethod !== DistributionMethod.JSON
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
