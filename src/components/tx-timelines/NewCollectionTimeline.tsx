import { DistributionMethod, MetadataAddMethod } from '../../bitbadges-api/types';
import { FormTimeline } from '../navigation/FormTimeline';
import { BadgeSupplySelectStepItem } from './step-items/BadgeSupplySelectStepItem';
import { CanCreateMoreStepItem } from './step-items/CanCreateMoreStepItem';
import { CanManagerBeTransferredStepItem } from './step-items/CanManagerBeTransferredStepItem';
import { ChooseBadgeTypeStepItem } from './step-items/ChooseBadgeTypeStepItem';
import { ConfirmManagerStepItem } from './step-items/ConfirmManagerStepItem';
import { CreateClaimsStepItem } from './step-items/CreateClaimsStepItem';
import { CreateCollectionStepItem } from './step-items/CreateCollectionStepItem';
import { DistributionMethodStepItem } from './step-items/DistributionMethodStepItem';
import { DownloadCodesStepItem } from './step-items/DownloadCodesStepItem';
import { FirstComeFirstServeSelectStepItem } from './step-items/FirstComeFirstServeSelectItem';
import { FreezeSelectStepItem } from './step-items/FreezeSelectStepItem';
import { ManagerApprovedTransfersStepItem } from './step-items/ManagerApprovedTransfersStepItem';
import { ManualSendSelectStepItem } from './step-items/ManualSendSelectStepItem';
import { MetadataStorageSelectStepItem } from './step-items/MetadataStorageSelectStepItem';
import { MetadataTooBigStepItem } from './step-items/MetadataTooBigStepItem';
import { PreviewCollectionStepItem } from './step-items/PreviewCollectionStepItem';
import { SetCollectionMetadataStepItem } from './step-items/SetCollectionMetadataStepItem';
import { SetIndividualBadgeMetadataStepItem } from './step-items/SetIndividualBadgeMetadata';
import { TransferableSelectStepItem } from './step-items/TransferableSelectStepItem';
import { UpdatableMetadataSelectStepItem } from './step-items/UpdatableMetadataSelectStepItem';
import { EmptyStepItem, TxTimelineProps } from './TxTimeline';

//See TxTimeline for explanations and documentation

//TODO: bytes and updateBytes
//TODO: more metadata!!!!!
//TODO: add other common customizable options for transferability, managerApprovedTransfers, freeze

export function MintCollectionTimeline({
    txTimelineProps
}: {
    txTimelineProps: TxTimelineProps
}) {
    const newCollectionMsg = txTimelineProps.newCollectionMsg;
    const setNewCollectionMsg = txTimelineProps.setNewCollectionMsg;
    const handledPermissions = txTimelineProps.handledPermissions;
    const updatePermissions = txTimelineProps.updatePermissions;
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
    const metadataSize = txTimelineProps.metadataSize;
    const existingCollection = txTimelineProps.existingCollection;

    //All mint timeline step items
    const ChooseBadgeType = ChooseBadgeTypeStepItem(newCollectionMsg);
    const ConfirmManager = ConfirmManagerStepItem();
    const BadgeSupplySelectStep = BadgeSupplySelectStepItem(newCollectionMsg, setNewCollectionMsg, simulatedCollection)
    const TransferableSelectStep = TransferableSelectStepItem(newCollectionMsg, setNewCollectionMsg);
    const FreezeSelectStep = FreezeSelectStepItem(newCollectionMsg, handledPermissions, updatePermissions);
    const CanManagerBeTransferredStep = CanManagerBeTransferredStepItem(newCollectionMsg, handledPermissions, updatePermissions);
    const MetadataStorageSelectStep = MetadataStorageSelectStepItem(addMethod, setAddMethod);
    const UpdatableMetadataSelectStep = UpdatableMetadataSelectStepItem(newCollectionMsg, handledPermissions, updatePermissions, addMethod);
    const SetCollectionMetadataStep = SetCollectionMetadataStepItem(newCollectionMsg, setNewCollectionMsg, addMethod, collectionMetadata, setCollectionMetadata, individualBadgeMetadata, setIndividualBadgeMetadata, simulatedCollection, existingCollection);
    const SetIndividualBadgeMetadataStep = SetIndividualBadgeMetadataStepItem(newCollectionMsg, setNewCollectionMsg, simulatedCollection, individualBadgeMetadata, setIndividualBadgeMetadata, collectionMetadata, addMethod, existingCollection);
    const DistributionMethodStep = DistributionMethodStepItem(distributionMethod, setDistributionMethod, fungible, nonFungible);
    const FirstComeFirstServeSelect = FirstComeFirstServeSelectStepItem(newCollectionMsg, setNewCollectionMsg, fungible)
    const CreateClaims = CreateClaimsStepItem(simulatedCollection, newCollectionMsg, setNewCollectionMsg, distributionMethod, claimItems, setClaimItems);
    const DownloadCodesStep = DownloadCodesStepItem(claimItems, collectionMetadata, simulatedCollection, 1);
    const CreateCollectionStep = CreateCollectionStepItem(newCollectionMsg, setNewCollectionMsg, addMethod, claimItems, setClaimItems, collectionMetadata, individualBadgeMetadata, distributionMethod, manualSend);
    const ManualSendSelect = ManualSendSelectStepItem(newCollectionMsg, setNewCollectionMsg, manualSend, setManualSend, claimItems, distributionMethod);
    const ManagerApprovedSelect = ManagerApprovedTransfersStepItem(newCollectionMsg, setNewCollectionMsg);
    const CanCreateMoreStep = CanCreateMoreStepItem(newCollectionMsg, handledPermissions, updatePermissions);
    const CollectionPreviewStep = PreviewCollectionStepItem(simulatedCollection);
    const MetadataTooLargeStep = MetadataTooBigStepItem(metadataSize);

    return (
        <FormTimeline
            items={[
                ChooseBadgeType,
                ConfirmManager,
                BadgeSupplySelectStep,
                CanCreateMoreStep,
                TransferableSelectStep,
                FreezeSelectStep,
                CanManagerBeTransferredStep,
                ManagerApprovedSelect,
                MetadataStorageSelectStep,
                UpdatableMetadataSelectStep,
                SetCollectionMetadataStep,
                addMethod === MetadataAddMethod.Manual
                    ? SetIndividualBadgeMetadataStep : EmptyStepItem,
                MetadataTooLargeStep,
                DistributionMethodStep,
                distributionMethod === DistributionMethod.FirstComeFirstServe && (fungible)
                    ? FirstComeFirstServeSelect : EmptyStepItem,
                distributionMethod === DistributionMethod.Codes || distributionMethod === DistributionMethod.Whitelist
                    ? CreateClaims : EmptyStepItem,
                claimItems.length > 0 && distributionMethod === DistributionMethod.Whitelist
                    ? ManualSendSelect : EmptyStepItem,
                claimItems.length > 0 && distributionMethod === DistributionMethod.Codes
                    ? DownloadCodesStep : EmptyStepItem,
                CollectionPreviewStep,
                CreateCollectionStep
            ]}
        />
    );
}
