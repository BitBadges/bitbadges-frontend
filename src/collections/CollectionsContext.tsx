/* eslint-disable react-hooks/exhaustive-deps */
import { createContext, useContext, useState } from 'react';
import { getBadgeCollection, updateMetadata } from '../bitbadges-api/api';
import { BitBadgeCollection } from '../bitbadges-api/types';

export type CollectionsContextType = {
    collections: {
        [collectionId: string]: BitBadgeCollection;
    }
    fetchCollections: (collectionIds: number[]) => Promise<void>,
    refreshCollection: (collectionId: number) => Promise<void>,
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

    //TODO: batch collections
    const fetchCollections = async (collectionIds: number[]) => {
        const collectionsToFetch = [];

        for (const collectionId of collectionIds) {
            if (collections[`${collectionId}`] === undefined) {
                collectionsToFetch.push(collectionId);
            }
        }

        for (const collectionId of collectionsToFetch) {
            const collection = await getBadgeCollection(collectionId);
            if (collection.collection) {
                setCollections({
                    ...collections,
                    [`${collectionId}`]: collection.collection
                });
            }
        }
    }

    async function refreshCollection(collectionIdNumber: number) {
        await new Promise(r => setTimeout(r, 3000));

        const res = await getBadgeCollection(collectionIdNumber);
        if (res.collection) {
            setCollections({
                ...collections,
                [`${collectionIdNumber}`]: res.collection
            });
        }
    }

    async function updateCollectionMetadata(collectionId: number, startBadgeId: number) {
        if (!collections[`${collectionId}`]) return;
        const collection = collections[`${collectionId}`];
        const newCollection = await updateMetadata(collection, startBadgeId);
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