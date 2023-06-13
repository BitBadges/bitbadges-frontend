/* eslint-disable react-hooks/exhaustive-deps */
import { IdRange, convertIdRange } from 'bitbadgesjs-proto';
import { AnnouncementInfo, BadgeMetadataDetails, BalanceInfo, BigIntify, BitBadgesCollection, ClaimInfoWithDetails, CollectionMap, CollectionViewKey, ErrorMetadata, GetCollectionBatchRouteRequestBody, GetMetadataForCollectionRequestBody, MetadataFetchOptions, NumberType, ReviewInfo, TransferActivityInfo, getBadgeIdsForMetadataId, getMetadataIdForBadgeId, getMetadataIdForUri, getUrisForMetadataIds, removeIdsFromIdRange, updateBadgeMetadata } from 'bitbadgesjs-utils';
import Joi from 'joi';
import { createContext, useContext, useState } from 'react';
import { MSG_PREVIEW_ID } from '../../components/tx-timelines/TxTimeline';
import { DesiredNumberType, fetchMetadataDirectly, getBadgeBalanceByAddress, getCollections, refreshMetadata } from '../api';
import { useAccountsContext } from './AccountsContext';

export type CollectionsContextType = {
  getCollection: (collectionId: DesiredNumberType) => BitBadgesCollection<DesiredNumberType> | undefined,
  updateCollection: (collection: BitBadgesCollection<DesiredNumberType>, fromTxTimeline?: boolean) => BitBadgesCollection<DesiredNumberType>,


  //The base fetchCollections will fetch the bare minimum (collection details and collection metadata). 
  //Useful for when you want to fetch a collection but don't care about all the extra details (e.g. search dropdown).
  //The fetchCollectionWithOptions will allow you to specify exactly what you want to fetch. 
  //You can also use fetchNextForViews for a specific paginated view
  fetchCollections: (collectionsToFetch: DesiredNumberType[], forceful?: boolean) => Promise<BitBadgesCollection<DesiredNumberType>[]>,
  fetchCollectionsWithOptions: (
    collectionsToFetch: (
      { collectionId: DesiredNumberType } & GetMetadataForCollectionRequestBody & { viewsToFetch: { viewKey: CollectionViewKey, bookmark: string }[] }
    )[],
    forceful?: boolean
  ) => Promise<BitBadgesCollection<DesiredNumberType>[]>,

  //Add to refresh queue
  triggerMetadataRefresh: (collectionId: DesiredNumberType) => Promise<void>,

  //Custom fetch functions (not paginated views)
  fetchAndUpdateMetadata: (collectionId: DesiredNumberType, fetchOptions: MetadataFetchOptions) => Promise<BitBadgesCollection<DesiredNumberType>[]>,
  fetchBalanceForUser: (collectionId: DesiredNumberType, addressOrUsername: string, forceful?: boolean) => Promise<BalanceInfo<DesiredNumberType>>,

  //Custom fetch functions (paginated views). This handles all pagination logic for you. Just pass in the viewKeys you want to fetch and it will fetch the next page for each of them.
  fetchNextForViews: (collectionId: DesiredNumberType, viewKeys: CollectionViewKey[]) => Promise<BitBadgesCollection<DesiredNumberType>>,

  //Helper functions for views
  viewHasMore: (collectionId: DesiredNumberType, viewKey: CollectionViewKey) => boolean,

  getMetadataView: (collectionId: DesiredNumberType, viewKey: CollectionViewKey) => BadgeMetadataDetails<DesiredNumberType>[],
  getActivityView: (collectionId: DesiredNumberType, viewKey: CollectionViewKey) => TransferActivityInfo<DesiredNumberType>[],
  getAnnouncementsView: (collectionId: DesiredNumberType, viewKey: CollectionViewKey) => AnnouncementInfo<DesiredNumberType>[],
  getReviewsView: (collectionId: DesiredNumberType, viewKey: CollectionViewKey) => ReviewInfo<DesiredNumberType>[],
  getBalancesView: (collectionId: DesiredNumberType, viewKey: CollectionViewKey) => BalanceInfo<DesiredNumberType>[],
  getClaimsView: (collectionId: DesiredNumberType, viewKey: CollectionViewKey) => ClaimInfoWithDetails<DesiredNumberType>[],
}

const CollectionsContext = createContext<CollectionsContextType>({
  getCollection: () => undefined,
  updateCollection: () => { return {} as BitBadgesCollection<DesiredNumberType> },
  fetchCollections: async () => { return [] },
  fetchCollectionsWithOptions: async () => { return [] },
  triggerMetadataRefresh: async () => { },
  fetchAndUpdateMetadata: async () => { return [] },
  fetchNextForViews: async () => { return {} as BitBadgesCollection<DesiredNumberType> },
  getMetadataView: () => [],
  getActivityView: () => [],
  getAnnouncementsView: () => [],
  getReviewsView: () => [],
  getBalancesView: () => [],
  getClaimsView: () => [],
  viewHasMore: () => false,
  fetchBalanceForUser: async () => { return {} as BalanceInfo<DesiredNumberType> },
});

type Props = {
  children?: React.ReactNode
};

export const CollectionsContextProvider: React.FC<Props> = ({ children }) => {
  const [collections, setCollections] = useState<CollectionMap<DesiredNumberType>>({});

  const accounts = useAccountsContext();

  const getCollection = (collectionId: DesiredNumberType) => {
    return collections[`${collectionId}`];
  }

  const updateCollection = (newCollection: BitBadgesCollection<DesiredNumberType>, fromTxTimeline = false) => {
    const collectionsMap = collections;
    if (newCollection.managerInfo) {
      accounts.updateAccount(newCollection.managerInfo);
    }

    let cachedCollection = collectionsMap[`${newCollection.collectionId}`];
    const cachedCollectionCopy = JSON.stringify(newCollection);
    if (cachedCollection) {
      let newBadgeMetadata = cachedCollection?.badgeMetadata || [];
      for (const badgeMetadata of newCollection.badgeMetadata) {
        newBadgeMetadata = updateBadgeMetadata(newBadgeMetadata, badgeMetadata);
      }

      const newViews = cachedCollection?.views || {};

      for (const [key, val] of Object.entries(newCollection.views)) {
        if (!val) continue;

        newViews[key] = {
          ids: [...(newViews[key]?.ids || []), ...(val.ids || [])],
          pagination: {
            ...val.pagination,
            total: val.pagination?.total || newViews[key]?.pagination?.total || undefined,
          },
          type: val.type
        }
      }

      if (cachedCollection && newCollection.collectionId === MSG_PREVIEW_ID && !fromTxTimeline) {
        //Check to see if we are updating one of the forbidden fields for TxTimeline (see top of TxTimeline) for more info
        if (newCollection.nextBadgeId !== cachedCollection.nextBadgeId
          || newCollection.nextClaimId !== cachedCollection.nextClaimId
          || newCollection.unmintedSupplys.some(x => cachedCollection?.unmintedSupplys.find(y => JSON.stringify(x) === JSON.stringify(y)) === undefined)
          || newCollection.maxSupplys.some(x => cachedCollection?.maxSupplys.find(y => JSON.stringify(x) === JSON.stringify(y)) === undefined)
          || newCollection.claims.some(x => cachedCollection?.claims.find(y => JSON.stringify(x) === JSON.stringify(y)) === undefined)
        ) {
          throw new Error("You are updating a forbidden field for preview collections. See top of TxTimeline for more information");
        }
      }

      //Update details accordingly. Note that there are certain fields which are always returned like collectionId, collectionUri, badgeUris, etc. We just ...spread these from the new response.
      cachedCollection = {
        ...newCollection,
        collectionMetadata: newCollection.collectionMetadata || cachedCollection?.collectionMetadata,
        badgeMetadata: newBadgeMetadata,
        reviews: [...(cachedCollection?.reviews || []), ...(newCollection.reviews || [])],
        announcements: [...(cachedCollection?.announcements || []), ...(newCollection.announcements || [])],
        activity: [...(cachedCollection?.activity || []), ...(newCollection.activity || [])],
        owners: [...(cachedCollection?.owners || []), ...(newCollection.owners || [])],
        claims: [...(cachedCollection?.claims || []), ...(newCollection.claims || [])],
        views: newViews,
      };

      //Filter duplicates
      cachedCollection.reviews = cachedCollection.reviews.filter((val, index, self) => self.findIndex(x => x._id === val._id) === index);
      cachedCollection.announcements = cachedCollection.announcements.filter((val, index, self) => self.findIndex(x => x._id === val._id) === index);
      cachedCollection.activity = cachedCollection.activity.filter((val, index, self) => self.findIndex(x => x._id === val._id) === index);
      cachedCollection.owners = cachedCollection.owners.filter((val, index, self) => self.findIndex(x => x._id === val._id) === index);
      cachedCollection.claims = cachedCollection.claims.filter((val, index, self) => self.findIndex(x => x._id === val._id) === index);

      //Attempt to update the account balances for each of the owners (if we find an account)
      //For now, if we do not find an account, we just carry on. 
      //Can look to fetch all accounts as well in the future but would require async logic whereas this is intended to be synchronous
      for (const balance of cachedCollection.owners) {
        const account = accounts.getAccount(balance.cosmosAddress);
        if (account) {
          accounts.updateAccount({
            ...account,
            collected: [...(account.collected || []), balance]
          });
        }
      }

      collectionsMap[`${newCollection.collectionId}`] = cachedCollection;

      //Only update if anything has changed
      if (JSON.stringify(cachedCollection) !== cachedCollectionCopy) {
        setCollections(collectionsMap);
      }
      return cachedCollection;
    } else {
      collectionsMap[`${newCollection.collectionId}`] = newCollection;
      if (JSON.stringify(newCollection) !== cachedCollectionCopy) {
        setCollections(collectionsMap);
      }
      return newCollection;
    }
  }

  const fetchBalanceForUser = async (collectionId: DesiredNumberType, addressOrUsername: string, forceful?: boolean) => {
    const collectionsRes = await fetchCollections([collectionId]);
    const collection = collectionsRes[0];
    if (!collection) throw new Error('Collection does not exist');

    const accountsRes = await accounts.fetchAccounts([addressOrUsername]);
    const account = accountsRes[0];
    if (!account) throw new Error('Account is not in the cache');

    let res;
    if (forceful) {
      res = await getBadgeBalanceByAddress(collectionId, account.cosmosAddress);
    } else {
      const cachedBalance = collection.owners.find(x => x.cosmosAddress === account.cosmosAddress);
      if (cachedBalance) {
        return cachedBalance;
      } else {
        res = await getBadgeBalanceByAddress(collectionId, account.cosmosAddress);
      }
    }

    updateCollection({
      ...collection,
      owners: [...(collection.owners || []), res.balance]
    });

    accounts.updateAccount({
      ...account,
      collected: [...(account.collected || []), res.balance]
    });

    return res.balance;
  }

  const fetchCollections = async (collectionsToFetch: DesiredNumberType[], forcefulRefresh?: boolean) => {
    if (collectionsToFetch.some(x => x === MSG_PREVIEW_ID)) {
      throw new Error('Cannot fetch preview collection ID === 0');
    }

    return await fetchCollectionsWithOptions(collectionsToFetch.map(x => {
      return {
        collectionId: x,
        viewsToFetch: [],
      }
    }), forcefulRefresh);
  }

  //Check existing cached collection and see what metadata we already have
  //Return the new request body with only the metadata we need to fetch
  const pruneMetadataToFetch = (collectionId: DesiredNumberType, metadataFetchReq?: MetadataFetchOptions) => {
    const cachedCollection = getCollection(collectionId);
    if (!cachedCollection) throw new Error('Collection does not exist');


    const metadataToFetch: MetadataFetchOptions = {
      doNotFetchCollectionMetadata: cachedCollection.collectionMetadata !== undefined || metadataFetchReq?.doNotFetchCollectionMetadata,
    };

    if (metadataFetchReq) {
      //See if we already have the metadata corresponding to the uris
      if (metadataFetchReq.uris) {
        for (const uri of metadataFetchReq.uris) {
          if (cachedCollection.badgeMetadata.find(x => x.uri === uri) === undefined) {
            metadataToFetch.uris = metadataToFetch.uris || [];
            metadataToFetch.uris.push(uri);
          }
        }
      }

      //See if we already have the metadata corresponding to the metadataIds
      if (metadataFetchReq.metadataIds) {
        for (const metadataId of metadataFetchReq.metadataIds) {
          const metadataIdCastedAsIdRange = metadataId as IdRange<NumberType>;
          const metadataIdCastedAsNumber = metadataId as NumberType;

          if (typeof metadataIdCastedAsNumber === 'object' && metadataIdCastedAsIdRange.start && metadataIdCastedAsIdRange.end) {
            const idRange = convertIdRange(metadataIdCastedAsIdRange, BigIntify);
            for (let i = idRange.start; i <= idRange.end; i++) {
              const existingMetadata = cachedCollection.badgeMetadata.find(x => x.metadataId === i);
              if (!existingMetadata) {
                metadataToFetch.uris = metadataToFetch.uris || [];
                const uris = getUrisForMetadataIds([BigInt(i)], cachedCollection.collectionUri, cachedCollection.badgeUris);
                if (!uris[0]) throw new Error('Metadata does not have a uri'); //Shouldn't happen but just in case and for TS
                metadataToFetch.uris.push(uris[0]);
              }
            }
          } else {
            const uris = getUrisForMetadataIds([BigInt(metadataIdCastedAsNumber)], cachedCollection.collectionUri, cachedCollection.badgeUris);
            for (const uri of uris) {
              const existingMetadata = cachedCollection.badgeMetadata.find(x => x.uri === uri && x.metadataId === metadataId);
              if (!existingMetadata) {
                if (cachedCollection.badgeMetadata.find(x => x.uri === uri) === undefined) {
                  metadataToFetch.uris = metadataToFetch.uris || [];
                  metadataToFetch.uris.push(uri);
                }
              }
            }
          }
        }
      }

      //Check if we have all metadata corresponding to the badgeIds
      if (metadataFetchReq.badgeIds) {
        for (const badgeId of metadataFetchReq.badgeIds) {
          const badgeIdCastedAsIdRange = badgeId as IdRange<DesiredNumberType>;
          const badgeIdCastedAsNumber = badgeId as DesiredNumberType;
          if (typeof badgeIdCastedAsNumber === 'object' && badgeIdCastedAsIdRange.start && badgeIdCastedAsIdRange.end) {
            const badgeIdsLeft = [convertIdRange(badgeIdCastedAsIdRange, BigIntify)]

            //While we still have badgeIds to handle
            while (badgeIdsLeft.length > 0) {
              const currBadgeIdRange = badgeIdsLeft.pop();
              if (!currBadgeIdRange) continue;


              const metadataId = getMetadataIdForBadgeId(BigInt(currBadgeIdRange.start), cachedCollection.badgeUris);
              if (metadataId === -1) throw new Error('Badge does not exist');

              const uris = getUrisForMetadataIds([BigInt(metadataId)], cachedCollection.collectionUri, cachedCollection.badgeUris);
              for (const uri of uris) {
                const existingMetadata = cachedCollection.badgeMetadata.find(x => x.uri === uri && x.metadataId === metadataId);
                if (!existingMetadata) {
                  metadataToFetch.uris = metadataToFetch.uris || [];
                  metadataToFetch.uris.push(uri);
                }
              }

              //Remove other badgeIds that map to the same metadataId and add any remaining back to the queue
              const otherMatchingBadgeIdRanges = getBadgeIdsForMetadataId(BigInt(metadataId), cachedCollection.badgeUris);
              for (const badgeIdRange of otherMatchingBadgeIdRanges) {
                const updatedBadgeIdRanges = removeIdsFromIdRange(badgeIdRange, currBadgeIdRange);
                if (updatedBadgeIdRanges.length > 0) {
                  badgeIdsLeft.push(...updatedBadgeIdRanges);
                }
              }
            }
          } else {
            const metadataId = getMetadataIdForBadgeId(BigInt(badgeIdCastedAsNumber), cachedCollection.badgeUris);
            if (metadataId === -1) throw new Error('Badge does not exist');

            const uris = getUrisForMetadataIds([BigInt(metadataId)], cachedCollection.collectionUri, cachedCollection.badgeUris);
            for (const uri of uris) {
              const existingMetadata = cachedCollection.badgeMetadata.find(x => x.uri === uri && x.metadataId === metadataId);
              if (!existingMetadata) {
                metadataToFetch.uris = metadataToFetch.uris || [];
                metadataToFetch.uris.push(uri);
              }
            }
          }
        }
      }
    }

    return metadataToFetch;
  }

  const fetchCollectionsWithOptions = async (collectionsToFetch: (
    { collectionId: DesiredNumberType }
    & GetMetadataForCollectionRequestBody
    & {
      viewsToFetch: { viewKey: CollectionViewKey, bookmark: string }[]
    })[], forcefulRefresh?: boolean) => {
    //Check cache for collections. If non existent, fetch with all parameters
    //If existent, fetch with only the parameters that are missing / we do not have yet
    //metadata, activity, announcements, reviews, owners, claims
    //If we already have everything, don't fetch and return cached value

    const batchRequestBody: GetCollectionBatchRouteRequestBody = {
      collectionsToFetch: []
    };
    for (const collectionToFetch of collectionsToFetch) {
      if (forcefulRefresh) {
        collections[`${collectionToFetch.collectionId}`] = undefined;
      }

      const cachedCollection = collections[`${collectionToFetch.collectionId}`];
      //If we don't have the collection, add it to the batch request. Fetch requested details
      if (cachedCollection === undefined) {
        batchRequestBody.collectionsToFetch.push({
          collectionId: collectionToFetch.collectionId,
          metadataToFetch: collectionToFetch.metadataToFetch,
          viewsToFetch: collectionToFetch.viewsToFetch,
        });
      } else {
        const prunedMetadataToFetch: MetadataFetchOptions = pruneMetadataToFetch(collectionToFetch.collectionId, collectionToFetch.metadataToFetch);
        const shouldFetchMetadata = (prunedMetadataToFetch.uris && prunedMetadataToFetch.uris.length > 0) || !prunedMetadataToFetch.doNotFetchCollectionMetadata;
        const viewsToFetch: { viewKey: CollectionViewKey, bookmark: string }[] = collectionToFetch.viewsToFetch || [];

        if (shouldFetchMetadata || viewsToFetch.length > 0) {
          batchRequestBody.collectionsToFetch.push({
            collectionId: collectionToFetch.collectionId,
            metadataToFetch: prunedMetadataToFetch,
            viewsToFetch,
          });
        }
      }
    }

    if (batchRequestBody.collectionsToFetch.length === 0) {
      //Note we do not use getCollection here because there is no guarantee that the collections have been updated yet in state
      const collectionsToReturn = [];
      for (const collectionToFetch of collectionsToFetch) {
        const collection = collections[`${collectionToFetch.collectionId}`];
        collectionsToReturn.push(collection ? collection : {} as BitBadgesCollection<DesiredNumberType>); //HACK: should never be undefined
      }

      return collectionsToReturn;
    }

    const res = await getCollections(batchRequestBody);

    //Update collections map
    const collectionsMap = collections;
    for (let i = 0; i < res.collections.length; i++) {
      collectionsMap[`${res.collections[i].collectionId}`] = updateCollection(res.collections[i]);
    }

    //Note we do not use getCollection here because there is no guarantee that the collections have been updated yet in React state
    const collectionsToReturn = [];
    for (const collectionToFetch of collectionsToFetch) {
      const collection = collectionsMap[`${collectionToFetch.collectionId}`];
      collectionsToReturn.push(collection ? collection : {} as BitBadgesCollection<DesiredNumberType>); //HACK: should never be undefined
    }

    return collectionsToReturn;
  }

  async function triggerMetadataRefresh(collectionId: DesiredNumberType) {
    await refreshMetadata(collectionId);
  }

  async function fetchAndUpdateMetadata(collectionId: DesiredNumberType, metadataToFetch: MetadataFetchOptions, fetchDirectly = false) {
    //This is only supported with badgeIDs and metadataIDs (no generic uris)
    if (fetchDirectly) {
      const updatedCollection = getCollection(collectionId);
      if (!updatedCollection) throw new Error('Collection does not exist');

      //Fetch collection metadata if we don't have it
      if (!metadataToFetch.doNotFetchCollectionMetadata) {
        const collectionUri = getCollection(collectionId)?.collectionUri || '';
        if (Joi.string().uri().validate(collectionUri).error) {
          updatedCollection.collectionMetadata = ErrorMetadata;
        } else {
          const collectionMetadataRes = await fetchMetadataDirectly({ uri: collectionUri });
          updatedCollection.collectionMetadata = collectionMetadataRes.metadata;
        }
      }

      //Check if we have all metadata corresponding to the badgeIds. If not, fetch directly.
      const prunedMetadataToFetch: MetadataFetchOptions = pruneMetadataToFetch(collectionId, metadataToFetch);
      for (const uri of prunedMetadataToFetch.uris || []) {
        const metadataRes = await fetchMetadataDirectly({ uri: uri });
        const metadataId = getMetadataIdForUri(uri, updatedCollection.badgeUris);
        if (metadataId === -1) throw new Error(`Error getting metadataId for uri ${uri}`);

        const badgeIds = getBadgeIdsForMetadataId(BigInt(metadataId), updatedCollection.badgeUris);
        updatedCollection.badgeMetadata = updateBadgeMetadata(updatedCollection.badgeMetadata, { uri: uri, metadata: metadataRes.metadata, metadataId: metadataId, badgeIds: badgeIds });
      }

      return [updatedCollection];
    }


    return await fetchCollectionsWithOptions([{
      collectionId: collectionId,
      metadataToFetch: metadataToFetch,
      viewsToFetch: []
    }]);
  }

  function viewHasMore(collectionId: DesiredNumberType, viewKey: CollectionViewKey) {
    const collection = getCollection(collectionId);
    if (!collection) return true;

    return collection.views[viewKey]?.pagination?.hasMore || true;
  }

  async function fetchNextForViews(collectionId: DesiredNumberType, viewKeys: CollectionViewKey[]) {
    const collections = await fetchCollectionsWithOptions([{
      collectionId: collectionId,
      viewsToFetch: viewKeys.map(x => {
        return {
          viewKey: x,
          bookmark: getCollection(collectionId)?.views[x]?.pagination?.bookmark || ''
        }
      })
    }]);

    return collections[0];
  }

  //Note we use metadataId instead of _id here. 
  //This is okay because we will only be using views when metadataId is defined 
  //(i.e. no need for a view with just editing the metadata in TxTimeline which has no metadataId)
  function getMetadataView(collectionId: DesiredNumberType, viewKey: CollectionViewKey) {
    const collection = getCollection(collectionId);
    if (!collection) return [];

    return collection.views[viewKey]?.ids.map(x => {
      return collection.badgeMetadata.find(y => y.metadataId && y.metadataId?.toString() === x);
    }) as BadgeMetadataDetails<DesiredNumberType>[];
  }

  function getActivityView(collectionId: DesiredNumberType, viewKey: CollectionViewKey) {
    const collection = getCollection(collectionId);
    if (!collection) return [];

    return collection.views[viewKey]?.ids.map(x => {
      return collection.activity.find(y => y._id === x);
    }) as TransferActivityInfo<DesiredNumberType>[];
  }

  function getReviewsView(collectionId: DesiredNumberType, viewKey: CollectionViewKey) {
    const collection = getCollection(collectionId);
    if (!collection) return [];

    return collection.views[viewKey]?.ids.map(x => {
      return collection.reviews.find(y => y._id === x);
    }) as ReviewInfo<DesiredNumberType>[];
  }

  function getAnnouncementsView(collectionId: DesiredNumberType, viewKey: CollectionViewKey) {
    const collection = getCollection(collectionId);
    if (!collection) return [];

    return collection.views[viewKey]?.ids.map(x => {
      return collection.announcements.find(y => y._id === x);
    }) as AnnouncementInfo<DesiredNumberType>[];
  }

  function getBalancesView(collectionId: DesiredNumberType, viewKey: CollectionViewKey) {
    const collection = getCollection(collectionId);
    if (!collection) return [];

    return collection.views[viewKey]?.ids.map(x => {
      return collection.owners.find(y => y._id === x);
    }) as BalanceInfo<DesiredNumberType>[];
  }

  function getClaimsView(collectionId: DesiredNumberType, viewKey: CollectionViewKey) {
    const collection = getCollection(collectionId);
    if (!collection) return [];

    return collection.views[viewKey]?.ids.map(x => {
      return collection.claims.find(y => y._id === x);
    }) as ClaimInfoWithDetails<DesiredNumberType>[];
  }


  const collectionsContext: CollectionsContextType = {
    getCollection,
    updateCollection,
    fetchCollections,
    fetchCollectionsWithOptions,
    triggerMetadataRefresh,
    fetchAndUpdateMetadata,
    fetchNextForViews,
    getMetadataView,
    getReviewsView,
    getActivityView,
    getBalancesView,
    getAnnouncementsView,
    getClaimsView,
    viewHasMore,
    fetchBalanceForUser,
  };

  return <CollectionsContext.Provider value={collectionsContext}>
    {children}
  </CollectionsContext.Provider>;
}


export const useCollectionsContext = () => useContext(CollectionsContext);