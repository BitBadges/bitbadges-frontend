/* eslint-disable react-hooks/exhaustive-deps */
import { createContext, useContext, useState } from 'react';
import { getCollections, updateMetadata } from '../bitbadges-api/api';
import { BitBadgeCollection, CollectionMap } from '../bitbadges-api/types';
import { notification } from 'antd';

export type CollectionsContextType = {
    collections: CollectionMap,
    fetchCollections: (collectionIds: number[], fetchAllMetadata?: boolean) => Promise<BitBadgeCollection[]>,
    refreshCollection: (collectionId: number, fetchAllMetadata?: boolean) => Promise<void>,
    updateCollectionMetadata: (collectionId: number, startBadgeId: number) => Promise<void>,
}

const CollectionsContext = createContext<CollectionsContextType>({
    collections: {},
    fetchCollections: async () => { return [] },
    refreshCollection: async () => { },
    updateCollectionMetadata: async () => { },
});

type Props = {
    children?: React.ReactNode
};

export const CollectionsContextProvider: React.FC<Props> = ({ children }) => {
    const [collections, setCollections] = useState<CollectionMap>({});

    const fetchCollections = async (collectionIds: number[], fetchAllMetadata?: boolean) => {
        const collectionsToReturn: BitBadgeCollection[] = [];
        try {
            collectionIds = [...new Set(collectionIds)]; //remove duplicates
            const collectionsToFetch = [];
            for (const collectionId of collectionIds) {
                if (collections[`${collectionId}`] === undefined || fetchAllMetadata) {
                    collectionsToFetch.push(collectionId);
                }
            }

            let fetchedCollections: BitBadgeCollection[] = [];
            if (collectionsToFetch.length > 0) {
                fetchedCollections = await getCollections(collectionsToFetch, fetchAllMetadata);
                for (const collection of fetchedCollections) {
                    setCollections({
                        ...collections,
                        [`${collection.collectionId}`]: collection
                    });
                }
            }

            for (const collectionId of collectionIds) {
                if (collections[`${collectionId}`]) {
                    collectionsToReturn.push(collections[`${collectionId}`]);
                } else {
                    const fetchedCollection = fetchedCollections.find(c => c.collectionId === collectionId);
                    if (fetchedCollection) collectionsToReturn.push(fetchedCollection);
                }
            }
            return collectionsToReturn;
        } catch (e: any) {
            notification.error({
                message: 'Oops! We ran into an error fetching the collection.',
                // description: e.message
            });
            return [];
        }


    }

    async function refreshCollection(collectionIdNumber: number, fetchAllMetadata?: boolean) {
        const res = await getCollections([collectionIdNumber], fetchAllMetadata);
        if (res && res[0]) {
            setCollections({
                ...collections,
                [`${collectionIdNumber}`]: res[0]
            });
        }
    }

    async function updateCollectionMetadata(collectionId: number, startBatchId: number) {
        try {

            if (!collections[`${collectionId}`]) return;
            const collection = collections[`${collectionId}`];
            const newCollection = await updateMetadata(collection, startBatchId < 0 ? 0 : startBatchId);
            setCollections({
                ...collections,
                [`${collectionId}`]: newCollection
            });
        } catch (e: any) {
            notification.error({
                message: 'Oops! We ran into an error fetching the collection metadata.',
                description: e.message
            });
        }
    }

    const collectionsContext: CollectionsContextType = {
        collections,
        fetchCollections,
        refreshCollection,
        updateCollectionMetadata,
    };

    return <CollectionsContext.Provider value={collectionsContext}>
        {children}
    </CollectionsContext.Provider>;
}


export const useCollectionsContext = () => useContext(CollectionsContext);