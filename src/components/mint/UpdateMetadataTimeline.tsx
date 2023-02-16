import { MessageMsgNewCollection } from 'bitbadgesjs-transactions';
import { useEffect, useState } from 'react';
import { BadgeMetadata, BitBadgeCollection, MetadataAddMethod } from '../../bitbadges-api/types';
import { useChainContext } from '../../chain/ChainContext';
import { FormTimeline } from '../common/FormTimeline';
import { MetadataStorageSelectStepItem } from './step-items/MetadataStorageSelectStepItem';
import { SetCollectionMetadataStepItem } from './step-items/SetCollectionMetadataStepItem';
import { SetIndividualBadgeMetadataStepItem } from './step-items/SetIndividualBadgeMetadata';
import { UpdateUrisStepItem } from './step-items/UpdateUrisStepItem';

export const EmptyStepItem = {
    title: '',
    description: '',
    node: <></>,
    doNotDisplay: true,
}

export function UpdateMetadataTimeline({
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

    //The method used to add metadata to the collection and individual badges
    const [addMethod, setAddMethod] = useState<MetadataAddMethod>(MetadataAddMethod.None);

    //Very bad code to force a re-render when the badge metadata is updated
    const [hackyUpdatedFlag, setHackyUpdatedFlag] = useState<boolean>(false);

    const setCollectionMetadata = (metadata: BadgeMetadata) => {
        setCollection({
            ...collection,
            collectionMetadata: metadata,
        });
    }

    const setIndividualBadgeMetadata = (metadata: BadgeMetadata[]) => {
        setCollection({
            ...collection,
            badgeMetadata: metadata,
        });
        setHackyUpdatedFlag(!hackyUpdatedFlag);
    }


    //All mint timeline step items
    const MetadataStorageSelectStep = MetadataStorageSelectStepItem(addMethod, setAddMethod);
    const SetCollectionMetadataStep = SetCollectionMetadataStepItem(newCollectionMsg, setNewCollectionMsg, addMethod, setAddMethod, collection.collectionMetadata, setCollectionMetadata);
    const SetIndividualBadgeMetadataStep = SetIndividualBadgeMetadataStepItem(newCollectionMsg, setNewCollectionMsg, collection, collection.badgeMetadata, setIndividualBadgeMetadata, collection.collectionMetadata, addMethod, setAddMethod, hackyUpdatedFlag);
    const UpdateMetadataStep = UpdateUrisStepItem(collection, setCollection, newCollectionMsg, addMethod);


    return (
        <FormTimeline
            items={[
                MetadataStorageSelectStep,
                SetCollectionMetadataStep,
                addMethod === MetadataAddMethod.Manual
                    ? SetIndividualBadgeMetadataStep : EmptyStepItem,
                UpdateMetadataStep
            ]}
        />
    );
}
