/* eslint-disable react-hooks/exhaustive-deps */
import { notification } from 'antd';
import { BitBadgeCollection, CollectionMap } from 'bitbadgesjs-utils';
import { createContext, useContext, useState } from 'react';
import { getCollections, fetchNextActivityForCollection, fetchNextAnnouncementsForCollection, fetchNextReviewsForCollection } from '../bitbadges-api/api';
import { updateMetadata } from '../bitbadges-api/helpers';

export type CollectionsContextType = {
  collections: CollectionMap,
  fetchCollections: (collectionIds: number[], fetchAllMetadata?: boolean) => Promise<BitBadgeCollection[]>,
  refreshCollection: (collectionId: number, fetchAllMetadata?: boolean) => Promise<void>,
  updateCollectionMetadata: (collectionId: number, startBatchIds: number[]) => Promise<void>,
  fetchNextActivity: (collectionId: number) => Promise<void>,
  fetchNextAnnouncements: (collectionId: number) => Promise<void>,
  fetchNextReviews: (collectionId: number) => Promise<void>,
}

const CollectionsContext = createContext<CollectionsContextType>({
  collections: {},
  fetchCollections: async () => { return [] },
  refreshCollection: async () => { },
  updateCollectionMetadata: async () => { },
  fetchNextActivity: async () => { },
  fetchNextAnnouncements: async () => { },
  fetchNextReviews: async () => { },
});

type Props = {
  children?: React.ReactNode
};

export const CollectionsContextProvider: React.FC<Props> = ({ children }) => {
  const [collections, setCollections] = useState<CollectionMap>({});

  const fetchCollections = async (_collectionIds: number[], fetchAllMetadata?: boolean) => {
    const collectionIds = [...new Set(_collectionIds)].filter(id => id > 0);
    if (collectionIds.length === 0) return [];

    const collectionsToReturn: BitBadgeCollection[] = [];
    try {
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

  async function fetchNextReviews(collectionId: number) {
    try {
      if (!collections[`${collectionId}`]) return;
      const collection = collections[`${collectionId}`];
      if (!collection) return;

      const res = await fetchNextReviewsForCollection(collection.collection.collectionId, collection.pagination.reviews.bookmark);
      const newCollection = {
        ...collection.collection,
        reviews: [...collection.collection.reviews, ...res.reviews]
      };

      const newPagination = res.pagination;
      setCollections({
        ...collections,
        [`${collectionId}`]: {
          collection: newCollection,
          pagination: {
            ...collection.pagination,
            reviews: newPagination.reviews
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

  async function fetchNextAnnouncements(collectionId: number) {
    try {
      if (!collections[`${collectionId}`]) return;
      const collection = collections[`${collectionId}`];
      if (!collection) return;

      const res = await fetchNextAnnouncementsForCollection(collection.collection.collectionId, collection.pagination.announcements.bookmark);
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

      const res = await fetchNextActivityForCollection(collection.collection.collectionId, collection.pagination.activity.bookmark);
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
    fetchNextAnnouncements,
    fetchNextReviews
  };

  return <CollectionsContext.Provider value={collectionsContext}>
    {children}
  </CollectionsContext.Provider>;
}


export const useCollectionsContext = () => useContext(CollectionsContext);