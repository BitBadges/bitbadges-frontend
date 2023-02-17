import { MessageMsgNewCollection } from 'bitbadgesjs-transactions';
import { useEffect, useState } from 'react';
import { BadgeMetadata, BitBadgeCollection, MetadataAddMethod } from '../../bitbadges-api/types';
import { useChainContext } from '../../chain/ChainContext';
import { FormTimeline } from '../common/FormTimeline';
import { MetadataStorageSelectStepItem } from './step-items/MetadataStorageSelectStepItem';
import { SetCollectionMetadataStepItem } from './step-items/SetCollectionMetadataStepItem';
import { SetIndividualBadgeMetadataStepItem } from './step-items/SetIndividualBadgeMetadata';
import { UpdateUrisStepItem } from './step-items/UpdateUrisStepItem';
import { TransferableSelectStepItem } from './step-items/TransferableSelectStepItem';
import { UpdateDisallowedStepItem } from './step-items/UpdateDisallowedStepItem';

export const EmptyStepItem = {
    title: '',
    description: '',
    node: <></>,
    doNotDisplay: true,
}

export function UpdateDisallowedTimeline({
    collection, //collection is the information about the actual badge collection that is being distributed/minted
    setCollection,
}: {
    collection: BitBadgeCollection;
    setCollection: (collection: BitBadgeCollection) => void;
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

    //All mint timeline step items
    const UpdateDisallowedStep = UpdateDisallowedStepItem(newCollectionMsg, setNewCollectionMsg, collection);

    const TransferableSelectStep = TransferableSelectStepItem(newCollectionMsg, setNewCollectionMsg);

    return (
        <FormTimeline
            items={[
                TransferableSelectStep,
                UpdateDisallowedStep
            ]}
        />
    );
}
