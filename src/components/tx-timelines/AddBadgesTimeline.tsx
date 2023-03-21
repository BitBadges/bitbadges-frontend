import { DistributionMethod, MetadataAddMethod } from '../../bitbadges-api/types';
import { FormTimeline } from '../navigation/FormTimeline';
import { EmptyStepItem, TxTimelineProps } from './TxTimeline';
import { BadgeSupplySelectStepItem } from './step-items/BadgeSupplySelectStepItem';
import { CreateClaimsStepItem } from './step-items/CreateClaimsStepItem';
import { DistributionMethodStepItem } from './step-items/DistributionMethodStepItem';
import { DownloadCodesStepItem } from './step-items/DownloadCodesStepItem';
import { ManualSendSelectStepItem } from './step-items/ManualSendSelectStepItem';
import { MetadataStorageSelectStepItem } from './step-items/MetadataStorageSelectStepItem';
import { PreviewCollectionStepItem } from './step-items/PreviewCollectionStepItem';
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


    //All mint timeline step items
    const BadgeSupplySelectStep = BadgeSupplySelectStepItem(newCollectionMsg, setNewCollectionMsg, simulatedCollection, existingCollection);
    const MetadataStorageSelectStep = MetadataStorageSelectStepItem(addMethod, setAddMethod);
    // const SetCollectionMetadataStep = SetCollectionMetadataStepItem(newCollectionMsg, setNewCollectionMsg, addMethod, collectionMetadata, setCollectionMetadata);
    const SetIndividualBadgeMetadataStep = SetIndividualBadgeMetadataStepItem(newCollectionMsg, setNewCollectionMsg, simulatedCollection, individualBadgeMetadata, setIndividualBadgeMetadata, collectionMetadata, addMethod, existingCollection, true);
    const DistributionMethodStep = DistributionMethodStepItem(distributionMethod, setDistributionMethod, fungible, nonFungible);
    const CreateClaims = CreateClaimsStepItem(simulatedCollection, newCollectionMsg, setNewCollectionMsg, distributionMethod, claimItems, setClaimItems, manualSend);
    const DownloadCodesStep = DownloadCodesStepItem(claimItems, collectionMetadata, simulatedCollection, 1);
    const ManualSendSelect = ManualSendSelectStepItem(newCollectionMsg, setNewCollectionMsg, manualSend, setManualSend, claimItems);
    const CollectionPreviewStep = PreviewCollectionStepItem(simulatedCollection);

    return (
        <FormTimeline
            items={[
                BadgeSupplySelectStep,
                MetadataStorageSelectStep,
                // SetCollectionMetadataStep,
                addMethod === MetadataAddMethod.Manual
                    ? SetIndividualBadgeMetadataStep : EmptyStepItem,
                DistributionMethodStep,
                distributionMethod === DistributionMethod.Whitelist
                    ? ManualSendSelect : EmptyStepItem,
                distributionMethod !== DistributionMethod.Unminted
                    ? CreateClaims : EmptyStepItem,
                claimItems.length > 0 && claimItems.find((claimItem) => claimItem.codes.length > 0 || claimItem.hasPassword)
                    ? DownloadCodesStep : EmptyStepItem,
                CollectionPreviewStep
            ]}
            onFinish={() => {
                if (txTimelineProps.onFinish) txTimelineProps.onFinish(txTimelineProps);
            }}
        />
    );
}
