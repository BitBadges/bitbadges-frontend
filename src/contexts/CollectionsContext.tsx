/* eslint-disable react-hooks/exhaustive-deps */
import { notification } from 'antd';
import { BitBadgeCollection, CollectionMap } from 'bitbadges-sdk';
import { createContext, useContext, useState } from 'react';
import { getCollections, updateCollectionActivity, updateCollectionAnnouncements, updateMetadata } from '../bitbadges-api/api';

export type CollectionsContextType = {
    collections: CollectionMap,
    fetchCollections: (collectionIds: number[], fetchAllMetadata?: boolean) => Promise<BitBadgeCollection[]>,
    refreshCollection: (collectionId: number, fetchAllMetadata?: boolean) => Promise<void>,
    updateCollectionMetadata: (collectionId: number, startBatchIds: number[]) => Promise<void>,
    fetchNextActivity: (collectionId: number) => Promise<void>,
    fetchNextAnnouncements: (collectionId: number) => Promise<void>,
}

const CollectionsContext = createContext<CollectionsContextType>({
    collections: {},
    fetchCollections: async () => { return [] },
    refreshCollection: async () => { },
    updateCollectionMetadata: async () => { },
    fetchNextActivity: async () => { },
    fetchNextAnnouncements: async () => { },
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
                const res = await getCollections(collectionsToFetch, fetchAllMetadata);


                const collectionMap = { ...collections };
                for (let i = 0; i < res.collections.length; i++) {
                    const collection = res.collections[i];
                    const pagination = res.paginations[i];
                    collectionMap[`${collection.collectionId}`] = {
                        collection,
                        pagination
                    };
                }
                setCollections(collectionMap);
            }

            for (const collectionId of collectionIds) {
                const collection = collections[`${collectionId}`];
                if (collection && collection?.collection) {
                    collectionsToReturn.push(collection.collection);
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
        if (res) {
            setCollections({
                ...collections,
                [`${collectionIdNumber}`]: {
                    collection: res.collections[0],
                    pagination: res.paginations[0]
                }
            });
        }
    }

    async function updateCollectionMetadata(collectionId: number, startBatchIds: number[]) {
        try {
            if (!collections[`${collectionId}`]) return;
            const collection = collections[`${collectionId}`];
            if (!collection) return;

            const newCollection = await updateMetadata(collection.collection, startBatchIds);

            setCollections({
                ...collections,
                [`${collectionId}`]: {
                    collection: newCollection,
                    pagination: collection.pagination
                }
            });
        } catch (e: any) {
            notification.error({
                message: 'Oops! We ran into an error fetching the collection metadata.',
                description: e.message
            });
        }
    }

    async function fetchNextAnnouncements(collectionId: number) {
        try {
            if (!collections[`${collectionId}`]) return;
            const collection = collections[`${collectionId}`];
            if (!collection) return;

            const res = await updateCollectionAnnouncements(collection.collection.collectionId, collection.pagination.announcements.bookmark);
            const newCollection = {
                ...collection.collection,
                announcements: [...collection.collection.announcements, ...res.announcements]
            };

            const newPagination = res.pagination;
            setCollections({
                ...collections,
                [`${collectionId}`]: {
                    collection: newCollection,
                    pagination: {
                        ...collection.pagination,
                        announcements: newPagination.announcements
                    }
                }
            });

        } catch (e: any) {
            notification.error({
                message: 'Oops! We ran into an error fetching the collection activity.',
                description: e.message
            });
        }
    }

    async function fetchNextActivity(collectionId: number) {
        try {
            if (!collections[`${collectionId}`]) return;
            const collection = collections[`${collectionId}`];
            if (!collection) return;

            const res = await updateCollectionActivity(collection.collection.collectionId, collection.pagination.activity.bookmark);
            const newCollection = {
                ...collection.collection,
                activity: [...collection.collection.activity, ...res.activity]
            };

            const newPagination = res.pagination;
            setCollections({
                ...collections,
                [`${collectionId}`]: {
                    collection: newCollection,
                    pagination: {
                        ...collection.pagination,
                        activity: newPagination.activity
                    }
                }
            });

        } catch (e: any) {
            notification.error({
                message: 'Oops! We ran into an error fetching the collection activity.',
                description: e.message
            });
        }
    }

    const collectionsContext: CollectionsContextType = {
        collections,
        fetchCollections,
        refreshCollection,
        updateCollectionMetadata,
        fetchNextActivity,
        fetchNextAnnouncements
    };

    return <CollectionsContext.Provider value={collectionsContext}>
        {children}
    </CollectionsContext.Provider>;
}


export const useCollectionsContext = () => useContext(CollectionsContext);