import { MetadataAddMethod } from '../../bitbadges-api/types';
import { FormTimeline } from '../navigation/FormTimeline';
import { TxTimelineProps } from './TxTimeline';
import { MetadataStorageSelectStepItem } from './step-items/MetadataStorageSelectStepItem';
import { SetCollectionMetadataStepItem } from './step-items/SetCollectionMetadataStepItem';
import { SetIndividualBadgeMetadataStepItem } from './step-items/SetIndividualBadgeMetadata';

export const EmptyStepItem = {
    title: '',
    description: '',
    node: <></>,
    doNotDisplay: true,
}

export function UpdateMetadataTimeline({
    txTimelineProps
}: {
    txTimelineProps: TxTimelineProps
}) {
    const newCollectionMsg = txTimelineProps.newCollectionMsg;
    const setNewCollectionMsg = txTimelineProps.setNewCollectionMsg;
    const collection = txTimelineProps.existingCollection;
    const addMethod = txTimelineProps.addMethod;
    const setAddMethod = txTimelineProps.setAddMethod;
    const collectionMetadata = txTimelineProps.collectionMetadata;
    const badgeMetadata = txTimelineProps.individualBadgeMetadata;
    const setCollectionMetadata = txTimelineProps.setCollectionMetadata;
    const setIndividualBadgeMetadata = txTimelineProps.setIndividualBadgeMetadata;

    //All mint timeline step items
    const MetadataStorageSelectStep = MetadataStorageSelectStepItem(addMethod, setAddMethod);
    const SetCollectionMetadataStep = SetCollectionMetadataStepItem(newCollectionMsg, setNewCollectionMsg, addMethod, setAddMethod, collectionMetadata, setCollectionMetadata);
    const SetIndividualBadgeMetadataStep = SetIndividualBadgeMetadataStepItem(newCollectionMsg, setNewCollectionMsg, collection, badgeMetadata, setIndividualBadgeMetadata, collectionMetadata, addMethod);

    return (
        <FormTimeline
            items={[
                MetadataStorageSelectStep,
                SetCollectionMetadataStep,
                addMethod === MetadataAddMethod.Manual
                    ? SetIndividualBadgeMetadataStep : EmptyStepItem,
            ]}
            onFinish={() => {
                if (txTimelineProps.onFinish) txTimelineProps.onFinish(txTimelineProps);
            }}
        />
    );
}
