import { MetadataAddMethod } from 'bitbadges-sdk';
import { FormTimeline } from '../navigation/FormTimeline';
import { EmptyStepItem, TxTimelineProps } from './TxTimeline';
import { MetadataStorageSelectStepItem } from './step-items/MetadataStorageSelectStepItem';
import { PreviewCollectionStepItem } from './step-items/PreviewCollectionStepItem';
import { SetCollectionMetadataStepItem } from './step-items/SetCollectionMetadataStepItem';
import { SetIndividualBadgeMetadataStepItem } from './step-items/SetIndividualBadgeMetadata';

//See TxTimeline for explanations and documentation

export function UpdateMetadataTimeline({
    txTimelineProps
}: {
    txTimelineProps: TxTimelineProps
}) {
    const newCollectionMsg = txTimelineProps.newCollectionMsg;
    const setNewCollectionMsg = txTimelineProps.setNewCollectionMsg;
    const collection = txTimelineProps.simulatedCollection;
    const addMethod = txTimelineProps.addMethod;
    const setAddMethod = txTimelineProps.setAddMethod;
    const collectionMetadata = txTimelineProps.collectionMetadata;
    const badgeMetadata = txTimelineProps.individualBadgeMetadata;
    const setCollectionMetadata = txTimelineProps.setCollectionMetadata;
    const individualBadgeMetadata = txTimelineProps.individualBadgeMetadata;
    const setIndividualBadgeMetadata = txTimelineProps.setIndividualBadgeMetadata;
    const updateMetadataForBadgeIdsDirectlyFromUriIfAbsent = txTimelineProps.updateMetadataForBadgeIdsDirectlyFromUriIfAbsent;

    //All mint timeline step items
    const MetadataStorageSelectStep = MetadataStorageSelectStepItem(addMethod, setAddMethod);

    const SetCollectionMetadataStep = SetCollectionMetadataStepItem(newCollectionMsg, setNewCollectionMsg, addMethod, collectionMetadata, setCollectionMetadata, individualBadgeMetadata, setIndividualBadgeMetadata, collection, undefined, updateMetadataForBadgeIdsDirectlyFromUriIfAbsent);
    const SetIndividualBadgeMetadataStep = SetIndividualBadgeMetadataStepItem(newCollectionMsg, setNewCollectionMsg, collection, badgeMetadata, setIndividualBadgeMetadata, collectionMetadata, addMethod);
    const CollectionPreviewStep = PreviewCollectionStepItem(collection);

    return (
        <FormTimeline
            items={[
                MetadataStorageSelectStep,
                SetCollectionMetadataStep,
                addMethod === MetadataAddMethod.Manual
                    ? SetIndividualBadgeMetadataStep : EmptyStepItem,
                addMethod === MetadataAddMethod.Manual
                    ? CollectionPreviewStep : EmptyStepItem,

            ]}
            onFinish={() => {
                if (txTimelineProps.onFinish) txTimelineProps.onFinish(txTimelineProps);
            }}
        />
    );
}
