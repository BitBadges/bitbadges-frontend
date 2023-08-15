import { UintRange, convertUintRange, deepCopy } from 'bitbadgesjs-proto';
import { AnnouncementInfo, ApprovalsTrackerInfo, BadgeMetadataDetails, BalanceInfo, BigIntify, BitBadgesCollection, CollectionMap, CollectionViewKey, ErrorMetadata, GetAdditionalCollectionDetailsRequestBody, GetCollectionBatchRouteRequestBody, GetMetadataForCollectionRequestBody, MerkleChallengeInfo, MetadataFetchOptions, NumberType, ReviewInfo, TransferActivityInfo, getBadgeIdsForMetadataId, getMetadataIdForBadgeId, getMetadataIdsForUri, getUrisForMetadataIds, removeUintRangeFromUintRange, sortUintRangesAndMergeIfNecessary, updateBadgeMetadata } from 'bitbadgesjs-utils';
import Joi from 'joi';
import { createContext, useContext, useState } from 'react';
import { MSG_PREVIEW_ID } from '../../components/tx-timelines/TxTimeline';
import { compareObjects } from '../../utils/compare';
import { DesiredNumberType, fetchMetadataDirectly, getBadgeBalanceByAddress, getCollections, refreshMetadata } from '../api';
import { getCurrentMetadata } from '../utils/metadata';
import { useAccountsContext } from './AccountsContext';

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
});

type Props = {
  children?: React.ReactNode
};



export const CollectionsContextProvider: React.FC<Props> = ({ children }) => {
  const [collections, setCollections] = useState<CollectionMap<DesiredNumberType>>({});
  const accounts = useAccountsContext();

  // const collectionsReducer = (collections: CollectionMap<DesiredNumberType>, action: { type: string, payload: any }) => {
  //   switch (action.type) {
  //     case 'UPDATE_COLLECTION':
  //       return {
  //         ...collections,
  //         [`${action.payload.collectionId}`]: action.payload.collection
  //       }
  //     default:
  //       return collections;
  //   }
  // }

  // const [collections, dispatch] = useReducer(collectionsReducer, {});




  const getCollection = (collectionId: DesiredNumberType) => {
    return collections[`${collectionId}`];
  }

  const updateCollection = (newCollection: BitBadgesCollection<DesiredNumberType>, fromTxTimeline = false) => {
    if (newCollection.managerInfo) {
      accounts.updateAccount(newCollection.managerInfo);
    }

    let cachedCollection = collections[`${newCollection.collectionId}`];
    // let cachedCollection = deepCopy(collections[`${newCollection.collectionId}`]);
    const cachedCollectionCopy = deepCopy(cachedCollection);

    if (cachedCollection) {
      let newBadgeMetadata = cachedCollection?.cachedBadgeMetadata || [];
      for (const badgeMetadata of newCollection.cachedBadgeMetadata) {
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
        // TODO: 
        // //Check to see if we are updating one of the forbidden fields for TxTimeline (see top of TxTimeline) for more info
        // if (newCollection.nextBadgeId !== cachedCollection.nextBadgeId
        //   || newCollection.nextMerkleChallengeTrackerId !== cachedCollection.nextMerkleChallengeTrackerId
        //   || newCollection.unmintedSupplys.some(x => cachedCollection?.unmintedSupplys.find(y => JSON.stringify(x) === JSON.stringify(y)) === undefined)
        //   || newCollection.maxSupplys.some(x => cachedCollection?.maxSupplys.find(y => JSON.stringify(x) === JSON.stringify(y)) === undefined)
        //   || newCollection.claims.some(x => cachedCollection?.claims.find(y => JSON.stringify(x) === JSON.stringify(y)) === undefined)
        // ) {
        //   throw new Error("You are updating a forbidden field for preview collections. See top of TxTimeline for more information");
        // }
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
      for (const balance of cachedCollection.owners) {
        const account = accounts.getAccount(balance.cosmosAddress);
        if (account) {
          accounts.updateAccount({
            ...account,
            collected: [...(account.collected || []), balance]
          });
        }
      }

      //Only update if anything has changed
      if (!compareObjects(cachedCollectionCopy, cachedCollection)) {
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

            //While we still have badgeIds to handle
            while (badgeIdsLeft.length > 0) {
              const currBadgeUintRange = badgeIdsLeft[0];

              const { collectionMetadata, badgeMetadata } = getCurrentMetadata(cachedCollection);

              const metadataId = getMetadataIdForBadgeId(BigInt(currBadgeUintRange.start), badgeMetadata);
              if (metadataId === -1) throw new Error('Badge does not exist');

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
              // for (const badgeUintRange of otherMatchingBadgeUintRanges) {
              //   const [updatedBadgeUintRanges, _] = removeUintsFromUintRange(badgeUintRange, currBadgeUintRange);
              //   if (updatedBadgeUintRanges.length > 0) {
              //     badgeIdsLeft.push(...updatedBadgeUintRanges);
              //   }
              // }
              badgeIdsLeft = sortUintRangesAndMergeIfNecessary(badgeIdsLeft);
            }
          } else {
            const { collectionMetadata, badgeMetadata } = getCurrentMetadata(cachedCollection);
            const metadataId = getMetadataIdForBadgeId(BigInt(badgeIdCastedAsNumber), badgeMetadata);
            if (metadataId === -1) throw new Error('Badge does not exist');

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
          const match = cachedCollection.approvalsTrackers.find(y => y.approvalId === x.approvalId && x.approverAddress === y.approverAddress && x.collectionId === y.collectionId && y.approvedAddress === x.approvedAddress && y.trackerType === x.trackerType)
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
    console.log("collection res", res);
    //Update collections map
    const accountsToFetch = [];
    for (let i = 0; i < res.collections.length; i++) {
      collections[`${res.collections[i].collectionId}`] = updateCollection(res.collections[i]);
      accountsToFetch.push(res.collections[i].createdBy)
    }

    await accounts.fetchAccounts(accountsToFetch);





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

  async function fetchAndUpdateMetadata(collectionId: DesiredNumberType, metadataToFetch: MetadataFetchOptions, fetchDirectly = false) {
    //This is only supported with badgeIDs and metadataIDs (no generic uris)
    if (fetchDirectly) {
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

      updateCollection(updatedCollection, true);

      return [updatedCollection];
    }


    return await fetchCollectionsWithOptions([{
      collectionId: collectionId,
      metadataToFetch: metadataToFetch,
      fetchTotalAndMintBalances: true,
      handleAllAndAppendDefaults: true,
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
    // getCollection,
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