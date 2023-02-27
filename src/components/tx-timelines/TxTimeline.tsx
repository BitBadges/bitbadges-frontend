import { MessageMsgNewCollection } from 'bitbadgesjs-transactions';
import { useEffect, useState } from 'react';
import { createCollectionFromMsgNewCollection } from '../../bitbadges-api/badges';
import { GetPermissionNumberValue, GetPermissions, Permissions, UpdatePermissions } from '../../bitbadges-api/permissions';
import { BadgeMetadata, BadgeMetadataMap, BitBadgeCollection, ClaimItem, DistributionMethod, MetadataAddMethod } from '../../bitbadges-api/types';
import { useChainContext } from '../../contexts/ChainContext';
import { DefaultPlaceholderMetadata } from '../../constants';
import { AddBadgesTimeline } from './AddBadgesTimeline';
import { DistributeTimeline } from './DistributeUnmintedTimeline';
import { MintCollectionTimeline } from './NewCollectionTimeline';
import { UpdateDisallowedTimeline } from './UpdateDisallowedTimeline';
import { UpdateMetadataTimeline } from './UpdateMetadataTimeline';
import { useCollectionsContext } from '../../contexts/CollectionsContext';

export const EmptyStepItem = {
    title: '',
    description: '',
    node: <></>,
    doNotDisplay: true,
}

//For the MsgNewCollection, MsgMintBadge, MsgUpdateUris, and MsgUpdateDisallowedTransfers transactions, we use this TxTimeline component. 
//We use the txType prop to determine which timeline compoennt to use.
//Each timeline makes use of the necessary, reusable components in the step-items and form-items folders.
//The step-items are the individual steps in the timeline, and the form-items are the helper components that are displayed in each step.
//For reusability purposes, we treat everything as a MessageMsgNewCollection, even if it's not, because that Msg has all the necessary fields for all transactions.
//We then convert the Msg to the appropriate transaction type at the end.

//NewCollection: Creates a new badge collection
//UpdateMetadata: Updates the metadata URIs of a badge collection
//UpdateDisallowed: Updates the disallowed transfers of a badge collection
//DistributeBadges: Distributes the unminted badges of a badge collection
//AddBadges: Adds new badges to a badge collection

export interface TxTimelineProps {
    txType: 'NewCollection' | 'UpdateMetadata' | 'UpdateDisallowed' | 'DistributeBadges' | 'AddBadges'
    existingCollection: BitBadgeCollection
    newCollectionMsg: MessageMsgNewCollection
    setNewCollectionMsg: (msg: MessageMsgNewCollection) => void
    collectionMetadata: BadgeMetadata
    setCollectionMetadata: (metadata: BadgeMetadata) => void
    individualBadgeMetadata: BadgeMetadataMap
    setIndividualBadgeMetadata: (metadata: BadgeMetadataMap) => void
    addMethod: MetadataAddMethod
    setAddMethod: (method: MetadataAddMethod) => void
    distributionMethod: DistributionMethod
    setDistributionMethod: (method: DistributionMethod) => void
    claimItems: ClaimItem[]
    setClaimItems: (items: ClaimItem[]) => void
    manualSend: boolean
    setManualSend: (manualSend: boolean) => void
    handledPermissions: Permissions
    updatePermissions: (digit: number, value: boolean) => void
    hackyUpdatedFlag: boolean
    setHackyUpdatedFlag: (flag: boolean) => void
    fungible: boolean,
    nonFungible: boolean,
    simulatedCollection: BitBadgeCollection,
    onFinish?: (txState: TxTimelineProps) => void
}


export function TxTimeline({
    txType,
    collectionId,
    onFinish,
}: {
    txType: 'NewCollection' | 'UpdateMetadata' | 'UpdateDisallowed' | 'DistributeBadges' | 'AddBadges'
    collectionId?: number,
    onFinish?: (txState: TxTimelineProps) => void
}) {
    const chain = useChainContext();
    const collections = useCollectionsContext();

    const existingCollection = collectionId ? collections.collections[collectionId] : undefined;

    // Get badge collection information
    useEffect(() => {
        async function getBadgeInformation() {
            if (!collectionId) return;
            await collections.fetchCollections([collectionId], true);
        }
        getBadgeInformation();
    }, [collectionId, collections]);

    //The MsgNewCollection Cosmos message that will be sent to the chain. We use this for all TXs (for compatibility) and convert to respective Msg at the end.
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
    const [individualBadgeMetadata, setBadgeMetadata] = useState<BadgeMetadataMap>({});

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

        return newPermissions;
    }

    const setIndividualBadgeMetadata = (metadata: BadgeMetadataMap) => {
        setBadgeMetadata(metadata);
        setHackyUpdatedFlag(!hackyUpdatedFlag);
    }

    //This simulates a BitBadgeCollection object representing what the collection will look like after creation (used for compatibility) 
    const simulatedCollection = createCollectionFromMsgNewCollection(newCollectionMsg, collectionMetadata, individualBadgeMetadata, chain, existingCollection);

    //Upon the badge supply changing, we update the individual badge metadata with placeholders
    useEffect(() => {
        if (existingCollection) {
            setCollectionMetadata(existingCollection.collectionMetadata);
        }

        let nextBadgeId = existingCollection?.nextBadgeId ? existingCollection.nextBadgeId : 1;
        let metadata: BadgeMetadataMap = {
            ...existingCollection?.badgeMetadata
        };
        if (newCollectionMsg.badgeSupplys && newCollectionMsg.badgeSupplys.length > 0) {
            for (const badgeSupplyObj of newCollectionMsg.badgeSupplys) {
                for (let i = nextBadgeId; i <= badgeSupplyObj.amount + nextBadgeId - 1; i++) {
                    metadata[`${i}`] = DefaultPlaceholderMetadata;
                }
                nextBadgeId += badgeSupplyObj.amount;
            }
        }

        setBadgeMetadata(metadata);
    }, [newCollectionMsg.badgeSupplys, existingCollection])


    //If all supply amounts are 1, it is fungible
    const fungible = newCollectionMsg.badgeSupplys.length === 1 && newCollectionMsg.badgeSupplys.every(badgeSupply => badgeSupply.amount === 1);
    const nonFungible = newCollectionMsg.badgeSupplys.every(badgeSupply => badgeSupply.supply === 1);


    const txTimelineProps: TxTimelineProps = {
        txType,
        existingCollection: existingCollection ? existingCollection : simulatedCollection,
        simulatedCollection,
        newCollectionMsg,
        setNewCollectionMsg,
        collectionMetadata,
        setCollectionMetadata,
        individualBadgeMetadata,
        setIndividualBadgeMetadata,
        addMethod,
        setAddMethod,
        distributionMethod,
        setDistributionMethod,
        claimItems,
        setClaimItems,
        manualSend,
        setManualSend,
        handledPermissions,
        updatePermissions,
        hackyUpdatedFlag,
        setHackyUpdatedFlag,
        fungible,
        nonFungible,
        onFinish
    }


    if (txType === 'NewCollection') {
        return <MintCollectionTimeline txTimelineProps={txTimelineProps} />
    }

    if (!existingCollection) return <></>;

    if (txType === 'UpdateMetadata') {
        return <UpdateMetadataTimeline txTimelineProps={txTimelineProps} />
    } else if (txType === 'UpdateDisallowed') {
        return <UpdateDisallowedTimeline txTimelineProps={txTimelineProps} />
    } else if (txType === 'DistributeBadges') {
        return <DistributeTimeline txTimelineProps={txTimelineProps} />
    } else if (txType === 'AddBadges') {
        return <AddBadgesTimeline txTimelineProps={txTimelineProps} />
    } else {
        return <></>
    }
}
