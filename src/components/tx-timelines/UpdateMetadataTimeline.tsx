import { MetadataAddMethod } from 'bitbadgesjs-utils';
import { FormTimeline } from '../navigation/FormTimeline';
import { EmptyStepItem, MsgUpdateUrisProps } from './TxTimeline';
import { MetadataStorageSelectStepItem } from './step-items/MetadataStorageSelectStepItem';
import { PreviewCollectionStepItem } from './step-items/PreviewCollectionStepItem';
import { SetBadgeMetadataStepItem } from './step-items/SetBadgeMetadata';
import { SetCollectionMetadataStepItem } from './step-items/SetCollectionMetadataStepItem';

//See TxTimeline for explanations and documentation

export function UpdateMetadataTimeline({
  txTimelineProps
}: {
  txTimelineProps: MsgUpdateUrisProps
}) {
  const addMethod = txTimelineProps.addMethod;
  const setAddMethod = txTimelineProps.setAddMethod;
  const existingCollectionId = txTimelineProps.existingCollectionId;

  //All mint timeline step items
  const MetadataStorageSelectStep = MetadataStorageSelectStepItem(addMethod, setAddMethod);

  const SetCollectionMetadataStep = SetCollectionMetadataStepItem(addMethod, existingCollectionId);
  const SetBadgeMetadataStep = SetBadgeMetadataStepItem(addMethod, existingCollectionId, false);
  const CollectionPreviewStep = PreviewCollectionStepItem();

  return (
    <FormTimeline
      items={[
        MetadataStorageSelectStep,
        SetCollectionMetadataStep,
        addMethod === MetadataAddMethod.Manual
          ? SetBadgeMetadataStep : EmptyStepItem,
        addMethod === MetadataAddMethod.Manual
          ? CollectionPreviewStep : EmptyStepItem,
      ]}
      onFinish={() => {
        if (txTimelineProps.onFinish) txTimelineProps.onFinish(txTimelineProps);
      }}
    />
  );
}
