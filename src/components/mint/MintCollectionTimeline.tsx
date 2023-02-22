import { MessageMsgNewCollection } from 'bitbadgesjs-transactions';
import { useEffect, useState } from 'react';
import { createCollectionFromMsgNewCollection } from '../../bitbadges-api/badges';
import { GetPermissionNumberValue, GetPermissions, Permissions, UpdatePermissions } from '../../bitbadges-api/permissions';
import { BadgeMetadata, ClaimItem, DistributionMethod, MetadataAddMethod } from '../../bitbadges-api/types';
import { useChainContext } from '../../chain/ChainContext';
import { DefaultPlaceholderMetadata } from '../../constants';
import { FormTimeline } from '../common/FormTimeline';
import { BadgeSupplySelectStepItem } from './step-items/BadgeSupplySelectStepItem';
import { CanManagerBeTransferredStepItem } from './step-items/CanManagerBeTransferredStepItem';
import { ChooseBadgeTypeStepItem } from './step-items/ChooseBadgeTypeStepItem';
import { ConfirmManagerStepItem } from './step-items/ConfirmManagerStepItem';
import { CreateClaimsStepItem } from './step-items/CreateClaimsStepItem';
import { CreateCollectionStepItem } from './step-items/CreateCollectionStepItem';
import { DistributionMethodStepItem } from './step-items/DistributionMethodStepItem';
import { DownloadCodesStepItem } from './step-items/DownloadCodesStepItem';
import { FirstComeFirstServeSelectStepItem } from './step-items/FirstComeFirstServeSelectItem';
import { FreezeSelectStepItem } from './step-items/FreezeSelectStepItem';
import { FungibleSelectStepItem } from './step-items/FungibleSelectStepItem';
import { ManualSendSelectStepItem } from './step-items/ManualSendSelectStepItem';
import { MetadataStorageSelectStepItem } from './step-items/MetadataStorageSelectStepItem';
import { SetCollectionMetadataStepItem } from './step-items/SetCollectionMetadataStepItem';
import { SetIndividualBadgeMetadataStepItem } from './step-items/SetIndividualBadgeMetadata';
import { TransferableSelectStepItem } from './step-items/TransferableSelectStepItem';
import { UpdatableMetadataSelectStepItem } from './step-items/UpdatableMetadataSelectStepItem';
import { ManagerApprovedTransfersStepItem } from './step-items/ManagerApprovedTransfersStepItem';

export const EmptyStepItem = {
    title: '',
    description: '',
    node: <></>,
    doNotDisplay: true,
}

//TODO: add more badges to collection later
//TODO: add semi-fungible and random assortments of supplys / amounts support, make badgeSupplys dynamic
//TODO: bytes and updateBytes
//TODO: more metadata!!!!!
//TODO: previews and cnfirmations
//TODO: confirmations
//TODO: add other common customizable options for transferability, managerApprovedTransfers, freeze

export function MintCollectionTimeline() {
    const chain = useChainContext();

    //The MsgNewCollection Cosmos message that will be sent to the chain
    const [newCollectionMsg, setNewCollectionMsg] = useState<MessageMsgNewCollection>({
        creator: chain.cosmosAddress,
        badgeUri: '',
        collectionUri: '',
        bytes: '',
        permissions: 0,
        standard: 0,
        badgeSupplys: [],
        transfers: [],
        disallowedTransfers: [],
        claims: [],
        managerApprovedTransfers: [],
    });

    //Metadata for the collection and individual badges
    const [collectionMetadata, setCollectionMetadata] = useState<BadgeMetadata>({} as BadgeMetadata);
    const [individualBadgeMetadata, setBadgeMetadata] = useState<{ [badgeId: string]: BadgeMetadata }>({});

    //The method used to add metadata to the collection and individual badges
    const [addMethod, setAddMethod] = useState<MetadataAddMethod>(MetadataAddMethod.None);

    //The distribution method of the badges (claim by codes, manual transfers, whitelist, etc)
    const [distributionMethod, setDistributionMethod] = useState<DistributionMethod>(DistributionMethod.None);

    //The claim items that will be used to distribute the badges (used for claim vis codes/whitelist)
    const [claimItems, setClaimItems] = useState<ClaimItem[]>([]);

    //We use this to keep track of which permissions we have handled so we can properly disable the next buttons
    const [handledPermissions, setHandledPermissions] = useState<Permissions>({
        CanCreateMoreBadges: false,
        CanManagerBeTransferred: false,
        CanUpdateDisallowed: false,
        CanUpdateUris: false,
        CanUpdateBytes: false,
    });

    //Currently, we only support non-fungible and fungible badges. We set this for ease of differentiating them.
    const [fungible, setFungible] = useState(false);

    //Whether the whitelisted addresses are sent the badges manually by the manager or via a claiming process
    const [manualSend, setManualSend] = useState(false);

    //Bad code but it works and triggers a re-render
    const [hackyUpdatedFlag, setHackyUpdatedFlag] = useState(false);

    //This simulates a BitBadgeCollection object representing the collection after creation (used for compatibility) 
    const collection = createCollectionFromMsgNewCollection(newCollectionMsg, collectionMetadata, individualBadgeMetadata, chain);

    const updatePermissions = (digit: number, value: boolean) => {
        const newPermissions = UpdatePermissions(newCollectionMsg.permissions, digit, value);
        setNewCollectionMsg({
            ...newCollectionMsg,
            permissions: newPermissions
        })

        //Note: This is a hacky way to force a re-render instead of simply doing = handledPermissions
        let handledPermissionsAsNumber = GetPermissionNumberValue(handledPermissions);
        let newHandledPermissionsNumber = UpdatePermissions(handledPermissionsAsNumber, digit, true);
        let newHandledPermissions = GetPermissions(newHandledPermissionsNumber);
        setHandledPermissions({ ...newHandledPermissions });
    }

    const setIndividualBadgeMetadata = (metadata: { [badgeId: string]: BadgeMetadata }) => {
        setBadgeMetadata(metadata);
        setHackyUpdatedFlag(!hackyUpdatedFlag);
    }

    //Upon the badge supply changing, we update the individual badge metadata with placeholders
    useEffect(() => {
        if (newCollectionMsg.badgeSupplys && newCollectionMsg.badgeSupplys[0]) {
            let metadata: { [badgeId: string]: BadgeMetadata } = {};
            for (let i = 1; i <= newCollectionMsg.badgeSupplys[0].amount; i++) {
                metadata[`${i}`] = DefaultPlaceholderMetadata;
            }
            setBadgeMetadata(metadata);
        }
    }, [newCollectionMsg.badgeSupplys])


    //All mint timeline step items
    const ChooseBadgeType = ChooseBadgeTypeStepItem(newCollectionMsg);
    const ConfirmManager = ConfirmManagerStepItem();
    const FungibleSelectStep = FungibleSelectStepItem(fungible, setFungible);
    const BadgeSupplySelectStep = BadgeSupplySelectStepItem(newCollectionMsg, setNewCollectionMsg, fungible)
    const TransferableSelectStep = TransferableSelectStepItem(newCollectionMsg, setNewCollectionMsg);
    const FreezeSelectStep = FreezeSelectStepItem(newCollectionMsg, handledPermissions, updatePermissions);
    const CanManagerBeTransferredStep = CanManagerBeTransferredStepItem(newCollectionMsg, handledPermissions, updatePermissions);
    const MetadataStorageSelectStep = MetadataStorageSelectStepItem(addMethod, setAddMethod);
    const SetCollectionMetadataStep = SetCollectionMetadataStepItem(newCollectionMsg, setNewCollectionMsg, addMethod, setAddMethod, collectionMetadata, setCollectionMetadata);
    const SetIndividualBadgeMetadataStep = SetIndividualBadgeMetadataStepItem(newCollectionMsg, setNewCollectionMsg, collection, individualBadgeMetadata, setIndividualBadgeMetadata, collectionMetadata, addMethod);
    const UpdatableMetadataSelectStep = UpdatableMetadataSelectStepItem(newCollectionMsg, handledPermissions, updatePermissions, addMethod);
    const DistributionMethodStep = DistributionMethodStepItem(distributionMethod, setDistributionMethod, fungible);
    const FirstComeFirstServeSelect = FirstComeFirstServeSelectStepItem(newCollectionMsg, setNewCollectionMsg, fungible)
    const CreateClaims = CreateClaimsStepItem(collection, newCollectionMsg, setNewCollectionMsg, distributionMethod, claimItems, setClaimItems, individualBadgeMetadata, collectionMetadata);
    const DownloadCodesStep = DownloadCodesStepItem(claimItems, collectionMetadata, collection, 1);
    const CreateCollectionStep = CreateCollectionStepItem(newCollectionMsg, setNewCollectionMsg, addMethod, claimItems, setClaimItems, collectionMetadata, individualBadgeMetadata, distributionMethod, manualSend);
    const ManualSendSelect = ManualSendSelectStepItem(newCollectionMsg, setNewCollectionMsg, manualSend, setManualSend, claimItems, distributionMethod);
    const ManagerApprovedSelect = ManagerApprovedTransfersStepItem(newCollectionMsg, setNewCollectionMsg);

    return (
        <FormTimeline
            items={[
                ChooseBadgeType,
                ConfirmManager,
                FungibleSelectStep,
                BadgeSupplySelectStep,
                TransferableSelectStep,
                FreezeSelectStep,
                CanManagerBeTransferredStep,
                ManagerApprovedSelect,
                MetadataStorageSelectStep,
                SetCollectionMetadataStep,
                addMethod === MetadataAddMethod.Manual
                    ? SetIndividualBadgeMetadataStep : EmptyStepItem,
                UpdatableMetadataSelectStep,
                DistributionMethodStep,
                distributionMethod === DistributionMethod.FirstComeFirstServe && fungible
                    ? FirstComeFirstServeSelect : EmptyStepItem,
                distributionMethod === DistributionMethod.Codes || distributionMethod === DistributionMethod.Whitelist
                    ? CreateClaims : EmptyStepItem,
                claimItems.length > 0 && distributionMethod === DistributionMethod.Whitelist
                    ? ManualSendSelect : EmptyStepItem,
                claimItems.length > 0 && distributionMethod === DistributionMethod.Codes
                    ? DownloadCodesStep : EmptyStepItem,
                CreateCollectionStep
            ]}
        />
    );
}
