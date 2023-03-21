import { MessageMsgNewCollection } from 'bitbadgesjs-transactions';
import { useEffect, useState } from 'react';
import { createCollectionFromMsgNewCollection } from '../../bitbadges-api/badges';
import { InsertRangeToIdRanges } from '../../bitbadges-api/idRanges';
import { GetPermissionNumberValue, GetPermissions, Permissions, UpdatePermissions } from '../../bitbadges-api/permissions';
import { BadgeMetadata, BadgeMetadataMap, BitBadgeCollection, ClaimItem, DistributionMethod, MetadataAddMethod } from '../../bitbadges-api/types';
import { DefaultPlaceholderMetadata, GO_MAX_UINT_64 } from '../../constants';
import { useChainContext } from '../../contexts/ChainContext';
import { useCollectionsContext } from '../../contexts/CollectionsContext';
import { AddBadgesTimeline } from './AddBadgesTimeline';
import { DistributeTimeline } from './DistributeUnmintedTimeline';
import { MintCollectionTimeline } from './NewCollectionTimeline';
import { UpdateDisallowedTimeline } from './UpdateDisallowedTimeline';
import { UpdateMetadataTimeline } from './UpdateMetadataTimeline';

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
    onFinish?: (txState: TxTimelineProps) => void,
    metadataSize: number,
    existingCollection: BitBadgeCollection | undefined,
    simulatedCollectionWithoutExistingCollection: BitBadgeCollection,
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

    const [size, setSize] = useState(0);

    // Get badge collection information
    useEffect(() => {
        async function fetchCollection() {
            if (!collectionId) return;
            const fetchedCollections = await collections.fetchCollections([collectionId], true);
            const fetchedCollection = fetchedCollections[0];
            setNewCollectionMsg({
                ...newCollectionMsg,
                creator: chain.cosmosAddress,
                badgeUris: fetchedCollection.badgeUris,
                collectionUri: fetchedCollection.collectionUri,
                bytes: fetchedCollection.bytes,
                permissions: GetPermissionNumberValue(fetchedCollection.permissions),
                standard: fetchedCollection.standard,
                badgeSupplys: [],
                transfers: [],
                disallowedTransfers: fetchedCollection.disallowedTransfers,
                claims: [],
                managerApprovedTransfers: fetchedCollection.managerApprovedTransfers,
            });
        }
        fetchCollection();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [collectionId]);

    //The MsgNewCollection Cosmos message that will be sent to the chain. We use this for all TXs (for compatibility) and convert to respective Msg at the end.
    const [newCollectionMsg, setNewCollectionMsg] = useState<MessageMsgNewCollection>({
        creator: chain.cosmosAddress,
        badgeUris: [],
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
    const [collectionMetadata, setCollectionMetadata] = useState<BadgeMetadata>(DefaultPlaceholderMetadata);
    const [individualBadgeMetadata, setBadgeMetadata] = useState<BadgeMetadataMap>({
        '0': {
            metadata: DefaultPlaceholderMetadata,
            badgeIds: [{ start: 1, end: GO_MAX_UINT_64 }]
        }
    });

    //The method used to add metadata to the collection and individual badges
    const [addMethod, setAddMethod] = useState<MetadataAddMethod>(MetadataAddMethod.Manual);

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
        setSize(Buffer.from(JSON.stringify({ metadata, collectionMetadata })).length);
    }


    //This simulates a BitBadgeCollection object representing what the collection will look like after creation (used for compatibility) 
    const [simulatedCollection, setSimulatedCollection] = useState<BitBadgeCollection>(createCollectionFromMsgNewCollection(newCollectionMsg, collectionMetadata, individualBadgeMetadata, chain, claimItems, existingCollection));
    const [simulatedCollectionWithoutExistingCollection, setSimulatedCollectionWithoutExistingCollection] = useState<BitBadgeCollection>(createCollectionFromMsgNewCollection(newCollectionMsg, collectionMetadata, individualBadgeMetadata, chain, claimItems));

    useEffect(() => {
        setSimulatedCollection(createCollectionFromMsgNewCollection(newCollectionMsg, collectionMetadata, individualBadgeMetadata, chain, claimItems, existingCollection));
        setSimulatedCollectionWithoutExistingCollection(createCollectionFromMsgNewCollection(newCollectionMsg, collectionMetadata, individualBadgeMetadata, chain, claimItems));
    }, [newCollectionMsg, collectionMetadata, individualBadgeMetadata, claimItems, distributionMethod, existingCollection, hackyUpdatedFlag, chain])



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
            let origNextBadgeId = nextBadgeId;
            for (const badgeSupplyObj of newCollectionMsg.badgeSupplys) {
                // for (let i = nextBadgeId; i <= badgeSupplyObj.amount + nextBadgeId - 1; i++) {
                //     metadata[`${i}`] = DefaultPlaceholderMetadata;
                // }
                nextBadgeId += badgeSupplyObj.amount;
            }

            let currentMetadata = DefaultPlaceholderMetadata;

            const startBadgeId = origNextBadgeId
            const endBadgeId = nextBadgeId - 1;

            let keys = Object.keys(metadata);
            let values = Object.values(metadata);

            let metadataExists = false;
            for (let i = 0; i < keys.length; i++) {
                if (JSON.stringify(values[i].metadata) === JSON.stringify(currentMetadata)) {
                    metadataExists = true;
                    values[i].badgeIds = values[i].badgeIds.length > 0 ? InsertRangeToIdRanges({ start: startBadgeId, end: endBadgeId }, values[i].badgeIds) : [{ start: startBadgeId, end: endBadgeId }];
                }
            }

            let currIdx = 0;
            metadata = {};
            for (let i = 0; i < keys.length; i++) {
                if (values[i].badgeIds.length === 0) {
                    continue;
                }
                metadata[currIdx] = values[i];
                currIdx++;
            }

            if (!metadataExists) {
                metadata[Object.keys(metadata).length] = {
                    metadata: { ...currentMetadata },
                    badgeIds: [{
                        start: startBadgeId,
                        end: endBadgeId,
                    }],
                }
            }
        }

        setBadgeMetadata(metadata);
        setSize(Buffer.from(JSON.stringify({ metadata, collectionMetadata: existingCollection?.collectionMetadata })).length);
    }, [newCollectionMsg.badgeSupplys, existingCollection])

    useEffect(() => {
        setNewCollectionMsg({
            ...newCollectionMsg,
            transfers: [],
            claims: [],
        })
        setClaimItems([]);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [distributionMethod]);


    //If all supply amounts are 1, it is fungible
    const fungible = newCollectionMsg.badgeSupplys.length === 1 && newCollectionMsg.badgeSupplys.every(badgeSupply => badgeSupply.amount === 1);
    const nonFungible = newCollectionMsg.badgeSupplys.every(badgeSupply => badgeSupply.supply === 1);


    const txTimelineProps: TxTimelineProps = {
        txType,
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
        onFinish,
        metadataSize: size,
        existingCollection,
        simulatedCollectionWithoutExistingCollection
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
