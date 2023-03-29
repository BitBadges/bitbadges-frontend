import { DistributionMethod, MetadataAddMethod } from '../../bitbadges-api/types';
import { FormTimeline } from '../navigation/FormTimeline';
import { EmptyStepItem, TxTimelineProps } from './TxTimeline';
import { BadgeSupplySelectStepItem } from './step-items/BadgeSupplySelectStepItem';
import { CanCreateMoreStepItem } from './step-items/CanCreateMoreStepItem';
import { CanManagerBeTransferredStepItem } from './step-items/CanManagerBeTransferredStepItem';
import { ChooseBadgeTypeStepItem } from './step-items/ChooseBadgeTypeStepItem';
import { ConfirmManagerStepItem } from './step-items/ConfirmManagerStepItem';
import { CreateClaimsStepItem } from './step-items/CreateClaimsStepItem';
import { CreateCollectionStepItem } from './step-items/CreateCollectionStepItem';
import { DistributionMethodStepItem } from './step-items/DistributionMethodStepItem';
import { FreezeSelectStepItem } from './step-items/FreezeSelectStepItem';
import { ManagerApprovedTransfersStepItem } from './step-items/ManagerApprovedTransfersStepItem';
import { ManualSendSelectStepItem } from './step-items/ManualSendSelectStepItem';
import { MetadataStorageSelectStepItem } from './step-items/MetadataStorageSelectStepItem';
import { MetadataTooBigStepItem } from './step-items/MetadataTooBigStepItem';
import { PreviewCollectionStepItem } from './step-items/PreviewCollectionStepItem';
import { SetCollectionMetadataStepItem } from './step-items/SetCollectionMetadataStepItem';
import { SetIndividualBadgeMetadataStepItem } from './step-items/SetIndividualBadgeMetadata';
import { TransferabilitySelectStepItem } from './step-items/TransferabilitySelectStepItem';
import { UpdatableMetadataSelectStepItem } from './step-items/UpdatableMetadataSelectStepItem';

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
    const managerApprovedTransfersWithUnregisteredUsers = txTimelineProps.managerApprovedTransfersWithUnregisteredUsers;
    const setManagerApprovedTransfersWithUnregisteredUsers = txTimelineProps.setManagerApprovedTransfersWithUnregisteredUsers;
    const disallowedTransfersWithUnregisteredUsers = txTimelineProps.disallowedTransfersWithUnregisteredUsers;
    const setDisallowedTransfersWithUnregisteredUsers = txTimelineProps.setDisallowedTransfersWithUnregisteredUsers;
    const updateMetadataForManualUris = txTimelineProps.updateMetadataForManualUris;
    const updateMetadataForBadgeIds = txTimelineProps.updateMetadataForBadgeIds;

    //All mint timeline step items
    const ChooseBadgeType = ChooseBadgeTypeStepItem(newCollectionMsg);
    const ConfirmManager = ConfirmManagerStepItem();
    const BadgeSupplySelectStep = BadgeSupplySelectStepItem(newCollectionMsg, setNewCollectionMsg, simulatedCollection)
    // const TransferableSelectStep = TransferableSelectStepItem(newCollectionMsg, setNewCollectionMsg);
    const FreezeSelectStep = FreezeSelectStepItem(newCollectionMsg, handledPermissions, updatePermissions);
    const CanManagerBeTransferredStep = CanManagerBeTransferredStepItem(newCollectionMsg, handledPermissions, updatePermissions);
    const MetadataStorageSelectStep = MetadataStorageSelectStepItem(addMethod, setAddMethod);
    const UpdatableMetadataSelectStep = UpdatableMetadataSelectStepItem(newCollectionMsg, handledPermissions, updatePermissions, addMethod);
    const SetCollectionMetadataStep = SetCollectionMetadataStepItem(newCollectionMsg, setNewCollectionMsg, addMethod, collectionMetadata, setCollectionMetadata, individualBadgeMetadata, setIndividualBadgeMetadata, simulatedCollection, existingCollection, updateMetadataForManualUris, updateMetadataForBadgeIds);
    const SetIndividualBadgeMetadataStep = SetIndividualBadgeMetadataStepItem(newCollectionMsg, setNewCollectionMsg, simulatedCollection, individualBadgeMetadata, setIndividualBadgeMetadata, collectionMetadata, addMethod, existingCollection);
    const DistributionMethodStep = DistributionMethodStepItem(distributionMethod, setDistributionMethod, fungible, nonFungible);
    const CreateClaims = CreateClaimsStepItem(simulatedCollection, newCollectionMsg, setNewCollectionMsg, distributionMethod, claimItems, setClaimItems, manualSend, undefined, updateMetadataForBadgeIds);
    const CreateCollectionStep = CreateCollectionStepItem(newCollectionMsg, setNewCollectionMsg, addMethod, claimItems, setClaimItems, collectionMetadata, individualBadgeMetadata, distributionMethod, manualSend, managerApprovedTransfersWithUnregisteredUsers, disallowedTransfersWithUnregisteredUsers);
    const ManualSendSelect = ManualSendSelectStepItem(newCollectionMsg, setNewCollectionMsg, manualSend, setManualSend, claimItems);
    const ManagerApprovedSelect = ManagerApprovedTransfersStepItem(managerApprovedTransfersWithUnregisteredUsers, setManagerApprovedTransfersWithUnregisteredUsers);
    const CanCreateMoreStep = CanCreateMoreStepItem(newCollectionMsg, handledPermissions, updatePermissions);
    const CollectionPreviewStep = PreviewCollectionStepItem(simulatedCollection, updateMetadataForBadgeIds);
    const MetadataTooLargeStep = MetadataTooBigStepItem(metadataSize);
    const TransferabilityStep = TransferabilitySelectStepItem(disallowedTransfersWithUnregisteredUsers, setDisallowedTransfersWithUnregisteredUsers);

    return (
        <FormTimeline
            items={[
                ChooseBadgeType,
                ConfirmManager,
                BadgeSupplySelectStep,
                CanCreateMoreStep,
                TransferabilityStep,
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
                distributionMethod === DistributionMethod.Whitelist
                    ? ManualSendSelect : EmptyStepItem,
                distributionMethod !== DistributionMethod.Unminted
                    ? CreateClaims : EmptyStepItem,
                addMethod === MetadataAddMethod.Manual ?

                    CollectionPreviewStep : EmptyStepItem, //In the future, we can support this but we need to pass updateMetadataForBadgeIds everywhere :/
                CreateCollectionStep
            ]}
        />
    );
}
