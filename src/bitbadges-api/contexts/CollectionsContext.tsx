import { UintRange, convertUintRange, deepCopy } from 'bitbadgesjs-proto';
import { AnnouncementInfo, ApprovalsTrackerInfo, BadgeMetadataDetails, BalanceInfo, BigIntify, BitBadgesCollection, CollectionMap, CollectionViewKey, ErrorMetadata, GetAdditionalCollectionDetailsRequestBody, GetCollectionBatchRouteRequestBody, GetMetadataForCollectionRequestBody, MerkleChallengeInfo, MetadataFetchOptions, NumberType, ReviewInfo, TransferActivityInfo, getBadgeIdsForMetadataId, getMetadataIdForBadgeId, getMetadataIdsForUri, getUrisForMetadataIds, removeUintRangeFromUintRange, sortUintRangesAndMergeIfNecessary, updateBadgeMetadata } from 'bitbadgesjs-utils';
import Joi from 'joi';
import { createContext, useContext, useState } from 'react';
import { compareObjects } from '../../utils/compare';
import { DesiredNumberType, fetchMetadataDirectly, getBadgeBalanceByAddress, getCollections, refreshMetadata } from '../api';
import { getCurrentMetadata } from '../utils/metadata';
import { useAccountsContext } from './AccountsContext';
import { MSG_PREVIEW_ID } from './TxTimelineContext';

export type CollectionsContextType = {
  collections: CollectionMap<DesiredNumberType>,

  // getCollection: (collectionId: DesiredNumberType) => BitBadgesCollection<DesiredNumberType> | undefined,
  updateCollection: (collection: BitBadgesCollection<DesiredNumberType>, fromTxTimeline?: boolean) => BitBadgesCollection<DesiredNumberType>,


  //The base fetchCollections will fetch the bare minimum (collection details and collection metadata). 
  //Useful for when you want to fetch a collection but don't care about all the extra details (e.g. search dropdown).
  //The fetchCollectionWithOptions will allow you to specify exactly what you want to fetch. 
  //You can also use fetchNextForViews for a specific paginated view
  fetchCollections: (collectionsToFetch: DesiredNumberType[], forceful?: boolean) => Promise<BitBadgesCollection<DesiredNumberType>[]>,
  fetchCollectionsWithOptions: (
    collectionsToFetch: (
      { collectionId: DesiredNumberType } & GetMetadataForCollectionRequestBody & GetAdditionalCollectionDetailsRequestBody
    )[],
    forceful?: boolean
  ) => Promise<BitBadgesCollection<DesiredNumberType>[]>,

  //Add to refresh queue
  triggerMetadataRefresh: (collectionId: DesiredNumberType) => Promise<void>,
  batchFetchAndUpdateMetadata(requests: { collectionId: DesiredNumberType, metadataToFetch: MetadataFetchOptions }[]): Promise<BitBadgesCollection<DesiredNumberType>[]>,

  //Custom fetch functions (not paginated views)
  fetchAndUpdateMetadata: (collectionId: DesiredNumberType, fetchOptions: MetadataFetchOptions, fetchDirectly?: boolean) => Promise<BitBadgesCollection<DesiredNumberType>[]>,

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
  getMerkleChallengeTrackersView: (collectionId: DesiredNumberType, viewKey: CollectionViewKey) => MerkleChallengeInfo<DesiredNumberType>[],
  getApprovalTrackersView: (collectionId: DesiredNumberType, viewKey: CollectionViewKey) => ApprovalsTrackerInfo<DesiredNumberType>[],
}

const CollectionsContext = createContext<CollectionsContextType>({
  collections: {},
  // getCollection: () => undefined,
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
  getMerkleChallengeTrackersView: () => [],
  getApprovalTrackersView: () => [],
  viewHasMore: () => false,
  fetchBalanceForUser: async () => { return {} as BalanceInfo<DesiredNumberType> },
  batchFetchAndUpdateMetadata: async () => { return [] },
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

  const updateCollection = (newCollection: BitBadgesCollection<DesiredNumberType>) => {
    let cachedCollection = collections[`${newCollection.collectionId}`];
    const cachedCollectionCopy = deepCopy(cachedCollection);

    if (cachedCollection) {
      let newBadgeMetadata = cachedCollection?.cachedBadgeMetadata || [];
      console.log(newBadgeMetadata, cachedCollection?.cachedBadgeMetadata);
      for (const badgeMetadata of newCollection.cachedBadgeMetadata) {
        newBadgeMetadata = updateBadgeMetadata(newBadgeMetadata, badgeMetadata);
      }

      console.log(newBadgeMetadata);

      const newViews = cachedCollection?.views || {};

      for (const [key, val] of Object.entries(newCollection.views)) {
        if (!val) continue;

        newViews[key] = {
          ids: [...(newViews[key]?.ids || []), ...(val?.ids || []),],
          pagination: {
            ...val.pagination,
            total: val.pagination?.total || newViews[key]?.pagination?.total || undefined,
          },
          type: val.type
        }
        console.log("newViews[key]", newViews[key])
      }

      //Update details accordingly. Note that there are certain fields which are always returned like collectionId, collectionUri, badgeUris, etc. We just ...spread these from the new response.
      cachedCollection = {
        ...newCollection,
        cachedCollectionMetadata: newCollection.cachedCollectionMetadata || cachedCollection?.cachedCollectionMetadata,
        cachedBadgeMetadata: newBadgeMetadata,
        reviews: [...(newCollection?.reviews || []), ...(cachedCollection.reviews || [])],
        announcements: [...(newCollection?.announcements || []), ...(cachedCollection.announcements || [])],
        activity: [...(newCollection?.activity || []), ...(cachedCollection.activity || [])],
        owners: [...(newCollection?.owners || []), ...(cachedCollection.owners || [])],
        merkleChallenges: [...(newCollection?.merkleChallenges || []), ...(cachedCollection.merkleChallenges || [])],
        approvalsTrackers: [...(newCollection?.approvalsTrackers || []), ...(cachedCollection.approvalsTrackers || [])],
        views: newViews,
      };

      //Filter duplicates (but prioritize the new ones)
      cachedCollection.reviews = cachedCollection.reviews.filter((val, index, self) => self.findIndex(x => x._id === val._id) === index);
      cachedCollection.announcements = cachedCollection.announcements.filter((val, index, self) => self.findIndex(x => x._id === val._id) === index);
      cachedCollection.activity = cachedCollection.activity.filter((val, index, self) => self.findIndex(x => x._id === val._id) === index);
      cachedCollection.owners = cachedCollection.owners.filter((val, index, self) => self.findIndex(x => x._id === val._id) === index);
      cachedCollection.merkleChallenges = cachedCollection.merkleChallenges.filter((val, index, self) => self.findIndex(x => x._id === val._id) === index);
      cachedCollection.approvalsTrackers = cachedCollection.approvalsTrackers.filter((val, index, self) => self.findIndex(x => x._id === val._id) === index);


      //Attempt to update the account balances for each of the owners (if we find an account)
      //For now, if we do not find an account, we just carry on. 
      //Can look to fetch all accounts as well in the future but would require async logic whereas this is intended to be synchronous
      accounts.updateAccounts(cachedCollection.owners.map(x => {
        const account = accounts.getAccount(x.cosmosAddress);

        if (account) {
          return {
            ...account,
            collected: [...(account.collected || []), x]
          }
        } else {
          return account;
        }
      }).filter(x => x !== undefined) as any);

      console.log(cachedCollectionCopy, cachedCollection);
      console.log(compareObjects(cachedCollectionCopy, cachedCollection));
      //Only update if anything has changed
      if (!compareObjects(cachedCollectionCopy, cachedCollection)) {
        console.log("Updating collection", cachedCollection);
        setCollections(collections => {
          return {
            ...collections,
            [`${newCollection.collectionId}`]: cachedCollection
          }
        });
      }
      return cachedCollection;
    } else {
      // if (!compareObjects(cachedCollectionCopy, newCollection)) {
      setCollections(collections => {
        return {
          ...collections,
          [`${newCollection.collectionId}`]: newCollection
        }
      });
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
        fetchTotalAndMintBalances: true,
        handleAllAndAppendDefaults: true,
      }
    }), forcefulRefresh);
  }

  //Check existing cached collection and see what metadata we already have
  //Return the new request body with only the metadata we need to fetch
  const pruneMetadataToFetch = (collectionId: DesiredNumberType, metadataFetchReq?: MetadataFetchOptions) => {
    const cachedCollection = getCollection(collectionId);
    if (!cachedCollection) throw new Error('Collection does not exist');


    const metadataToFetch: MetadataFetchOptions = {
      doNotFetchCollectionMetadata: cachedCollection.cachedCollectionMetadata !== undefined || metadataFetchReq?.doNotFetchCollectionMetadata,
    };

    if (metadataFetchReq) {
      //See if we already have the metadata corresponding to the uris
      if (metadataFetchReq.uris) {
        for (const uri of metadataFetchReq.uris) {
          if (cachedCollection.cachedBadgeMetadata.find(x => x.uri === uri) === undefined) {
            metadataToFetch.uris = metadataToFetch.uris || [];
            metadataToFetch.uris.push(uri);
          }
        }
      }

      //See if we already have the metadata corresponding to the metadataIds
      if (metadataFetchReq.metadataIds) {
        for (const metadataId of metadataFetchReq.metadataIds) {
          const metadataIdCastedAsUintRange = metadataId as UintRange<NumberType>;
          const metadataIdCastedAsNumber = metadataId as NumberType;


          if (typeof metadataIdCastedAsNumber === 'object' && metadataIdCastedAsUintRange.start && metadataIdCastedAsUintRange.end) {
            //Is a UintRange
            const uintRange = convertUintRange(metadataIdCastedAsUintRange, BigIntify);
            for (let i = uintRange.start; i <= uintRange.end; i++) {
              const existingMetadata = cachedCollection.cachedBadgeMetadata.find(x => x.metadataId === i);
              if (!existingMetadata) {
                metadataToFetch.uris = metadataToFetch.uris || [];
                const { collectionMetadata, badgeMetadata } = getCurrentMetadata(cachedCollection);

                const uris = getUrisForMetadataIds([BigInt(i)], collectionMetadata?.uri || '', badgeMetadata);
                if (!uris[0]) throw new Error('Metadata does not have a uri'); //Shouldn't happen but just in case and for TS
                metadataToFetch.uris.push(uris[0]);
              }
            }
          } else {
            const { collectionMetadata, badgeMetadata } = getCurrentMetadata(cachedCollection);
            const uris = getUrisForMetadataIds([BigInt(metadataIdCastedAsNumber)], collectionMetadata?.uri || '', badgeMetadata);
            for (const uri of uris) {
              const existingMetadata = cachedCollection.cachedBadgeMetadata.find(x => x.uri === uri && x.metadataId === metadataId);
              if (!existingMetadata) {
                if (cachedCollection.cachedBadgeMetadata.find(x => x.uri === uri) === undefined) {
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
          const badgeIdCastedAsUintRange = badgeId as UintRange<DesiredNumberType>;
          const badgeIdCastedAsNumber = badgeId as DesiredNumberType;
          if (typeof badgeIdCastedAsNumber === 'object' && badgeIdCastedAsUintRange.start && badgeIdCastedAsUintRange.end) {
            let badgeIdsLeft = [convertUintRange(badgeIdCastedAsUintRange, BigIntify)]


            //Intutition: check singular, starting badge ID. If it is same as others, handle all together. Else, just handle that and continue
            console.log(badgeIdsLeft, collectionId);
            while (badgeIdsLeft.length > 0) {
              console.log(badgeIdsLeft);
              const currBadgeUintRange = badgeIdsLeft[0];

              const { collectionMetadata, badgeMetadata } = getCurrentMetadata(cachedCollection);

              const metadataId = getMetadataIdForBadgeId(BigInt(currBadgeUintRange.start), badgeMetadata);
              if (metadataId === -1) break

              const uris = getUrisForMetadataIds([BigInt(metadataId)], collectionMetadata?.uri || '', badgeMetadata);
              for (const uri of uris) {
                const existingMetadata = cachedCollection.cachedBadgeMetadata.find(x => x.uri === uri && x.metadataId === metadataId);
                if (!existingMetadata) {
                  metadataToFetch.uris = metadataToFetch.uris || [];
                  metadataToFetch.uris.push(uri);
                }
              }

              //Remove other badgeIds that map to the same metadataId and add any remaining back to the queue
              const otherMatchingBadgeUintRanges = getBadgeIdsForMetadataId(BigInt(metadataId), badgeMetadata);
              const [remaining,] = removeUintRangeFromUintRange(otherMatchingBadgeUintRanges, badgeIdsLeft);
              badgeIdsLeft = remaining
              console.log(badgeIdsLeft);
              badgeIdsLeft = sortUintRangesAndMergeIfNecessary(badgeIdsLeft);
            }
          } else {
            //Is a singular badgeId
            const { collectionMetadata, badgeMetadata } = getCurrentMetadata(cachedCollection);
            const metadataId = getMetadataIdForBadgeId(BigInt(badgeIdCastedAsNumber), badgeMetadata);
            if (metadataId === -1) break

            const uris = getUrisForMetadataIds([BigInt(metadataId)], collectionMetadata?.uri || '', badgeMetadata);
            for (const uri of uris) {
              const existingMetadata = cachedCollection.cachedBadgeMetadata.find(x => x.uri === uri && x.metadataId === metadataId);
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
    & GetAdditionalCollectionDetailsRequestBody)[], forcefulRefresh?: boolean) => {
    if (collectionsToFetch.some(x => x.collectionId === MSG_PREVIEW_ID)) {
      throw new Error('Cannot fetch preview collection ID === 0');
    }


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
          fetchTotalAndMintBalances: collectionToFetch.fetchTotalAndMintBalances,
          merkleChallengeIdsToFetch: collectionToFetch.merkleChallengeIdsToFetch,
          approvalsTrackerIdsToFetch: collectionToFetch.approvalsTrackerIdsToFetch,
          handleAllAndAppendDefaults: collectionToFetch.handleAllAndAppendDefaults,
        });
      } else {
        const prunedMetadataToFetch: MetadataFetchOptions = pruneMetadataToFetch(collectionToFetch.collectionId, collectionToFetch.metadataToFetch);
        const shouldFetchMetadata = (prunedMetadataToFetch.uris && prunedMetadataToFetch.uris.length > 0) || !prunedMetadataToFetch.doNotFetchCollectionMetadata;
        const viewsToFetch: { viewKey: CollectionViewKey, bookmark: string }[] = collectionToFetch.viewsToFetch || [];
        const hasTotalAndMint = cachedCollection.owners.find(x => x.cosmosAddress === "Mint") && cachedCollection.owners.find(x => x.cosmosAddress === "Total") && collectionToFetch.fetchTotalAndMintBalances;
        const shouldFetchTotalAndMint = !hasTotalAndMint && collectionToFetch.fetchTotalAndMintBalances;
        const shouldFetchMerkleChallengeIds = (collectionToFetch.merkleChallengeIdsToFetch ?? []).find(x => {
          const match = cachedCollection.merkleChallenges.find(y => y.challengeId === x.challengeId && x.approverAddress === y.approverAddress && x.collectionId === y.collectionId && x.challengeLevel === y.challengeLevel)
          return !match;
        }) !== undefined;

        const shouldFetchApprovalTrackerIds = (collectionToFetch.approvalsTrackerIdsToFetch ?? []).find(x => {
          const match = cachedCollection.approvalsTrackers.find(y => y.approvalTrackerId === x.approvalTrackerId && x.approverAddress === y.approverAddress && x.collectionId === y.collectionId && y.approvedAddress === x.approvedAddress && y.trackerType === x.trackerType)
          return !match;
        }) !== undefined;

        if (shouldFetchMetadata || viewsToFetch.length > 0 || shouldFetchTotalAndMint || shouldFetchMerkleChallengeIds || shouldFetchApprovalTrackerIds) {
          batchRequestBody.collectionsToFetch.push({
            collectionId: collectionToFetch.collectionId,
            metadataToFetch: prunedMetadataToFetch,
            viewsToFetch,
            fetchTotalAndMintBalances: collectionToFetch.fetchTotalAndMintBalances,
            merkleChallengeIdsToFetch: collectionToFetch.merkleChallengeIdsToFetch,
            approvalsTrackerIdsToFetch: collectionToFetch.approvalsTrackerIdsToFetch,
            handleAllAndAppendDefaults: collectionToFetch.handleAllAndAppendDefaults,
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
    for (let i = 0; i < res.collections.length; i++) {
      collections[`${res.collections[i].collectionId}`] = updateCollection(res.collections[i]);
    }

    //Note we do not use getCollection here because there is no guarantee that the collections have been updated yet in React state
    const collectionsToReturn = [];
    for (const collectionToFetch of collectionsToFetch) {
      const collection = collections[`${collectionToFetch.collectionId}`];
      collectionsToReturn.push(collection ? collection : {} as BitBadgesCollection<DesiredNumberType>); //HACK: should never be undefined
    }

    return collectionsToReturn;
  }

  async function triggerMetadataRefresh(collectionId: DesiredNumberType) {
    await refreshMetadata(collectionId);
  }

  async function batchFetchAndUpdateMetadata(requests: { collectionId: DesiredNumberType, metadataToFetch: MetadataFetchOptions }[]) {
    return await fetchCollectionsWithOptions(requests.map(x => {
      return {
        collectionId: x.collectionId,
        metadataToFetch: x.metadataToFetch,
        fetchTotalAndMintBalances: true,
        handleAllAndAppendDefaults: true,
        viewsToFetch: []
      }
    }));
  }


  async function fetchAndUpdateMetadata(collectionId: DesiredNumberType, metadataToFetch: MetadataFetchOptions, fetchDirectly = false) {
    //This is only supported with badgeIDs and metadataIDs (no generic uris)
    if (!fetchDirectly) {
      return await fetchCollectionsWithOptions([{
        collectionId: collectionId,
        metadataToFetch: metadataToFetch,
        fetchTotalAndMintBalances: true,
        handleAllAndAppendDefaults: true,
        viewsToFetch: []
      }]);
    } else {
      //Only should be used in the case of minting and we need to client-side fetch the metadata for sanity checks

      const _updatedCollection = getCollection(collectionId);
      if (!_updatedCollection) throw new Error('Collection does not exist');

      const updatedCollection = deepCopy(_updatedCollection);

      //Fetch collection metadata if we don't have it
      if (!metadataToFetch.doNotFetchCollectionMetadata) {
        const { collectionMetadata } = getCurrentMetadata(updatedCollection);
        const collectionUri = collectionMetadata?.uri || '';
        if (Joi.string().uri().validate(collectionUri).error) {
          updatedCollection.cachedCollectionMetadata = ErrorMetadata;
        } else {
          const collectionMetadataRes = await fetchMetadataDirectly({ uris: [collectionUri] });
          updatedCollection.cachedCollectionMetadata = collectionMetadataRes.metadata[0];
        }
      }

      //Check if we have all metadata corresponding to the badgeIds. If not, fetch directly.
      const prunedMetadataToFetch: MetadataFetchOptions = pruneMetadataToFetch(collectionId, metadataToFetch);
      const hasInvalidUris = prunedMetadataToFetch.uris?.some(x => Joi.string().uri().validate(x).error);
      if (hasInvalidUris) {
        for (const uri of prunedMetadataToFetch.uris || []) {

          const { badgeMetadata } = getCurrentMetadata(updatedCollection);
          const metadataRes = ErrorMetadata;
          const metadataIds = getMetadataIdsForUri(uri, badgeMetadata);

          for (const metadataId of metadataIds) {
            const badgeIds = getBadgeIdsForMetadataId(BigInt(metadataId), badgeMetadata);
            updatedCollection.cachedBadgeMetadata = updateBadgeMetadata(updatedCollection.cachedBadgeMetadata, { uri: uri, metadata: metadataRes, metadataId: metadataId, badgeIds: badgeIds });
          }
        }
      } else {
        const metadataResponses = await fetchMetadataDirectly({ uris: prunedMetadataToFetch.uris || [] });

        let i = 0;
        for (const uri of prunedMetadataToFetch.uris || []) {

          const { badgeMetadata } = getCurrentMetadata(updatedCollection);

          const isValidUri = !Joi.string().uri().validate(uri).error;
          // const badgeMetadataRes = await fetchMetadataDirectly({ uris: [uri] });
          const metadataRes = isValidUri ? metadataResponses.metadata[i] : ErrorMetadata;
          const metadataIds = getMetadataIdsForUri(uri, badgeMetadata);

          for (const metadataId of metadataIds) {
            const badgeIds = getBadgeIdsForMetadataId(BigInt(metadataId), badgeMetadata);
            updatedCollection.cachedBadgeMetadata = updateBadgeMetadata(updatedCollection.cachedBadgeMetadata, { uri: uri, metadata: metadataRes, metadataId: metadataId, badgeIds: badgeIds });
          }

          i++;
        }
      }

      updateCollection(updatedCollection);

      return [updatedCollection];
    }
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
      return collection.cachedBadgeMetadata.find(y => y.metadataId && y.metadataId?.toString() === x);
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

  function getMerkleChallengeTrackersView(collectionId: DesiredNumberType, viewKey: CollectionViewKey) {
    const collection = getCollection(collectionId);
    if (!collection) return [];

    return collection.views[viewKey]?.ids.map(x => {
      return collection.merkleChallenges.find(y => y._id === x);
    }) as MerkleChallengeInfo<DesiredNumberType>[];
  }

  function getApprovalTrackersView(collectionId: DesiredNumberType, viewKey: CollectionViewKey) {
    const collection = getCollection(collectionId);
    if (!collection) return [];

    return collection.views[viewKey]?.ids.map(x => {
      return collection.approvalsTrackers.find(y => y._id === x);
    }) as ApprovalsTrackerInfo<DesiredNumberType>[];
  }


  const collectionsContext: CollectionsContextType = {
    collections,
    updateCollection,
    fetchCollections,
    fetchCollectionsWithOptions,
    triggerMetadataRefresh,
    batchFetchAndUpdateMetadata,
    fetchAndUpdateMetadata,
    fetchNextForViews,
    getMetadataView,
    getReviewsView,
    getActivityView,
    getBalancesView,
    getAnnouncementsView,
    getMerkleChallengeTrackersView,
    viewHasMore,
    fetchBalanceForUser,
    getApprovalTrackersView
  };

  return <CollectionsContext.Provider value={collectionsContext}>
    {children}
  </CollectionsContext.Provider>;
}


export const useCollectionsContext = () => useContext(CollectionsContext);