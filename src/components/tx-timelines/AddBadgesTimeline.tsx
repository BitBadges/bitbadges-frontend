import { DistributionMethod, MetadataAddMethod } from '../../bitbadges-api/types';
import { FormTimeline } from '../navigation/FormTimeline';
import { EmptyStepItem, TxTimelineProps } from './TxTimeline';
import { BadgeSupplySelectStepItem } from './step-items/BadgeSupplySelectStepItem';
import { CreateClaimsStepItem } from './step-items/CreateClaimsStepItem';
import { DistributionMethodStepItem } from './step-items/DistributionMethodStepItem';
import { DownloadCodesStepItem } from './step-items/DownloadCodesStepItem';
import { FirstComeFirstServeSelectStepItem } from './step-items/FirstComeFirstServeSelectItem';
import { ManualSendSelectStepItem } from './step-items/ManualSendSelectStepItem';
import { MetadataStorageSelectStepItem } from './step-items/MetadataStorageSelectStepItem';
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
    const existingCollection = txTimelineProps.existingCollection;
    const addMethod = txTimelineProps.addMethod;
    const setAddMethod = txTimelineProps.setAddMethod;
    const collectionMetadata = txTimelineProps.collectionMetadata;
    const setCollectionMetadata = txTimelineProps.setCollectionMetadata;
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


    //All mint timeline step items
    const BadgeSupplySelectStep = BadgeSupplySelectStepItem(newCollectionMsg, setNewCollectionMsg, simulatedCollection, true);
    const MetadataStorageSelectStep = MetadataStorageSelectStepItem(addMethod, setAddMethod);
    const SetCollectionMetadataStep = SetCollectionMetadataStepItem(newCollectionMsg, setNewCollectionMsg, addMethod, collectionMetadata, setCollectionMetadata);
    const SetIndividualBadgeMetadataStep = SetIndividualBadgeMetadataStepItem(newCollectionMsg, setNewCollectionMsg, existingCollection, individualBadgeMetadata, setIndividualBadgeMetadata, collectionMetadata, addMethod);
    const DistributionMethodStep = DistributionMethodStepItem(distributionMethod, setDistributionMethod, fungible, nonFungible);
    const FirstComeFirstServeSelect = FirstComeFirstServeSelectStepItem(newCollectionMsg, setNewCollectionMsg, fungible, nonFungible)
    const CreateClaims = CreateClaimsStepItem(existingCollection, newCollectionMsg, setNewCollectionMsg, distributionMethod, claimItems, setClaimItems, individualBadgeMetadata, collectionMetadata);
    const DownloadCodesStep = DownloadCodesStepItem(claimItems, collectionMetadata, existingCollection, 1);
    const ManualSendSelect = ManualSendSelectStepItem(newCollectionMsg, setNewCollectionMsg, manualSend, setManualSend, claimItems, distributionMethod);

    return (
        <FormTimeline
            items={[
                BadgeSupplySelectStep,
                MetadataStorageSelectStep,
                SetCollectionMetadataStep,
                addMethod === MetadataAddMethod.Manual
                    ? SetIndividualBadgeMetadataStep : EmptyStepItem,
                DistributionMethodStep,
                distributionMethod === DistributionMethod.FirstComeFirstServe && (fungible)
                    ? FirstComeFirstServeSelect : EmptyStepItem,
                distributionMethod === DistributionMethod.Codes || distributionMethod === DistributionMethod.Whitelist
                    ? CreateClaims : EmptyStepItem,
                claimItems.length > 0 && distributionMethod === DistributionMethod.Whitelist
                    ? ManualSendSelect : EmptyStepItem,
                claimItems.length > 0 && distributionMethod === DistributionMethod.Codes
                    ? DownloadCodesStep : EmptyStepItem,

            ]}
            onFinish={() => {
                if (txTimelineProps.onFinish) txTimelineProps.onFinish(txTimelineProps);
            }}
        />
    );
}
