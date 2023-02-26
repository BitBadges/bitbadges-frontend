/* eslint-disable react-hooks/exhaustive-deps */
import { createContext, useContext, useState } from 'react';
import { getBadgeCollection, getCollections, updateMetadata } from '../bitbadges-api/api';
import { BitBadgeCollection } from '../bitbadges-api/types';

export type CollectionsContextType = {
    collections: {
        [collectionId: string]: BitBadgeCollection;
    }
    fetchCollections: (collectionIds: number[], fetchAllMetadata?: boolean) => Promise<void>,
    refreshCollection: (collectionId: number, fetchAllMetadata?: boolean) => Promise<void>,
    updateCollectionMetadata: (collectionId: number, startBadgeId: number) => Promise<void>,
}

const CollectionsContext = createContext<CollectionsContextType>({
    collections: {},
    fetchCollections: async () => { },
    refreshCollection: async () => { },
    updateCollectionMetadata: async () => { },
});

type Props = {
    children?: React.ReactNode
};

export const CollectionsContextProvider: React.FC<Props> = ({ children }) => {
    const [collections, setCollections] = useState<{ [collectionId: string]: BitBadgeCollection }>({});

    const fetchCollections = async (collectionIds: number[], fetchAllMetadata?: boolean) => {
        const collectionsToFetch = [];

        for (const collectionId of collectionIds) {
            if (collections[`${collectionId}`] === undefined) {
                collectionsToFetch.push(collectionId);
            }
        }

        const fetchedCollections = await getCollections(collectionsToFetch, fetchAllMetadata);
        for (const collection of fetchedCollections) {
            setCollections({
                ...collections,
                [`${collection.collectionId}`]: collection
            });
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

    async function updateCollectionMetadata(collectionId: number, startBadgeId: number) {
        if (!collections[`${collectionId}`]) return;
        const collection = collections[`${collectionId}`];
        const newCollection = await updateMetadata(collection, startBadgeId < 1 ? 1 : startBadgeId);
        setCollections({
            ...collections,
            [`${collectionId}`]: newCollection
        });
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