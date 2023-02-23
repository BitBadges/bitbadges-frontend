import { MessageMsgNewCollection } from 'bitbadgesjs-transactions';
import { useEffect, useState } from 'react';
import { GetPermissionNumberValue, GetPermissions, Permissions, UpdatePermissions } from '../../bitbadges-api/permissions';
import { BadgeMetadata, BitBadgeCollection, ClaimItem, DistributionMethod, MetadataAddMethod } from '../../bitbadges-api/types';
import { useChainContext } from '../../chain/ChainContext';
import { DefaultPlaceholderMetadata } from '../../constants';
import { FormTimeline } from '../common/FormTimeline';
import { BadgeSupplySelectStepItem } from './step-items/BadgeSupplySelectStepItem';
import { CreateClaimsStepItem } from './step-items/CreateClaimsStepItem';
import { CreateCollectionStepItem } from './step-items/CreateCollectionStepItem';
import { DistributionMethodStepItem } from './step-items/DistributionMethodStepItem';
import { DownloadCodesStepItem } from './step-items/DownloadCodesStepItem';
import { FirstComeFirstServeSelectStepItem } from './step-items/FirstComeFirstServeSelectItem';
import { ManagerApprovedTransfersStepItem } from './step-items/ManagerApprovedTransfersStepItem';
import { ManualSendSelectStepItem } from './step-items/ManualSendSelectStepItem';
import { MetadataStorageSelectStepItem } from './step-items/MetadataStorageSelectStepItem';
import { SetCollectionMetadataStepItem } from './step-items/SetCollectionMetadataStepItem';
import { SetIndividualBadgeMetadataStepItem } from './step-items/SetIndividualBadgeMetadata';
import { UpdatableMetadataSelectStepItem } from './step-items/UpdatableMetadataSelectStepItem';
import { createCollectionFromMsgNewCollection } from '../../bitbadges-api/badges';
import { SubmitNewMintMsgStepItem } from './step-items/SubmitNewMintMsgStepItem';
import { SubmitMsgUpdateUris } from './form-items/SubmitMsgUpdateUris';

export const EmptyStepItem = {
    title: '',
    description: '',
    node: <></>,
    doNotDisplay: true,
}

export function AddBadgesTimeline({
    collection, //collection is the information about the actual badge collection that is being distributed/minted
}: {
    collection: BitBadgeCollection;
}) {
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
    const [collectionMetadata, setCollectionMetadata] = useState<BadgeMetadata>(collection.collectionMetadata);
    const [individualBadgeMetadata, setBadgeMetadata] = useState<{ [badgeId: string]: BadgeMetadata }>(collection.badgeMetadata);

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
    // const [fungible, setFungible] = useState(false);

    //Whether the whitelisted addresses are sent the badges manually by the manager or via a claiming process
    const [manualSend, setManualSend] = useState(false);

    //Bad code but it works and triggers a re-render
    const [hackyUpdatedFlag, setHackyUpdatedFlag] = useState(false);

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
        let nextBadgeId = collection.nextBadgeId ? collection.nextBadgeId : 1;

        if (newCollectionMsg.badgeSupplys && newCollectionMsg.badgeSupplys.length > 0) {
            let metadata: { [badgeId: string]: BadgeMetadata } = {
                ...collection.badgeMetadata
            };


            for (const badgeSupplyObj of newCollectionMsg.badgeSupplys) {
                for (let i = nextBadgeId; i <= badgeSupplyObj.amount + nextBadgeId - 1; i++) {
                    metadata[`${i}`] = DefaultPlaceholderMetadata;
                }
                nextBadgeId += badgeSupplyObj.amount;
            }

            console.log("BADGE METADATA", metadata);

            setBadgeMetadata(metadata);
        }
    }, [newCollectionMsg.badgeSupplys, collection.nextBadgeId, collection.badgeMetadata])


    //If all supply amounts are 1, it is fungible
    const fungible = newCollectionMsg.badgeSupplys.length === 1 && newCollectionMsg.badgeSupplys.every(badgeSupply => badgeSupply.amount === 1);
    const nonFungible = newCollectionMsg.badgeSupplys.every(badgeSupply => badgeSupply.supply === 1);

    const simulatedCollection = createCollectionFromMsgNewCollection(newCollectionMsg, collectionMetadata, individualBadgeMetadata, chain, collection);

    console.log("SIMULATED COLLECTION", simulatedCollection);


    //All mint timeline step items
    const BadgeSupplySelectStep = BadgeSupplySelectStepItem(newCollectionMsg, setNewCollectionMsg, simulatedCollection, true);

    const MetadataStorageSelectStep = MetadataStorageSelectStepItem(addMethod, setAddMethod);
    const SetCollectionMetadataStep = SetCollectionMetadataStepItem(newCollectionMsg, setNewCollectionMsg, addMethod, setAddMethod, collectionMetadata, setCollectionMetadata);
    const SetIndividualBadgeMetadataStep = SetIndividualBadgeMetadataStepItem(newCollectionMsg, setNewCollectionMsg, collection, individualBadgeMetadata, setIndividualBadgeMetadata, collectionMetadata, addMethod);
    const DistributionMethodStep = DistributionMethodStepItem(distributionMethod, setDistributionMethod, fungible, nonFungible);
    const FirstComeFirstServeSelect = FirstComeFirstServeSelectStepItem(newCollectionMsg, setNewCollectionMsg, fungible, nonFungible)
    const CreateClaims = CreateClaimsStepItem(collection, newCollectionMsg, setNewCollectionMsg, distributionMethod, claimItems, setClaimItems, individualBadgeMetadata, collectionMetadata);
    const DownloadCodesStep = DownloadCodesStepItem(claimItems, collectionMetadata, collection, 1);
    const SubmitStepItem = SubmitNewMintMsgStepItem(newCollectionMsg, setNewCollectionMsg, collection, collectionMetadata, individualBadgeMetadata, claimItems, setClaimItems, distributionMethod, manualSend, addMethod, true);
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
                SubmitStepItem
            ]}
        />
    );
}
