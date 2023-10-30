import { CollectionPermissions, UintRange, convertUintRange, deepCopy } from 'bitbadgesjs-proto';
import { AnnouncementInfo, ApprovalsTrackerInfo, BadgeMetadataDetails, BalanceInfo, BalanceInfoWithDetails, BigIntify, BitBadgesCollection, CollectionMap, CollectionViewKey, ErrorMetadata, GetAdditionalCollectionDetailsRequestBody, GetCollectionBatchRouteRequestBody, GetMetadataForCollectionRequestBody, MerkleChallengeInfo, MetadataFetchOptions, NumberType, ReviewInfo, TransferActivityInfo, batchUpdateBadgeMetadata, convertBitBadgesCollection, getBadgeIdsForMetadataId, getMetadataDetailsForBadgeId, getMetadataIdForBadgeId, getMetadataIdsForUri, getUrisForMetadataIds, removeUintRangeFromUintRange, sortUintRangesAndMergeIfNecessary, updateBadgeMetadata } from 'bitbadgesjs-utils';
import Joi from 'joi';
import { createContext, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DesiredNumberType, fetchMetadataDirectly, getBadgeBalanceByAddress, getCollections, refreshMetadata } from '../../api';
import { getCurrentMetadata } from '../../utils/metadata';
import { NEW_COLLECTION_ID } from '../TxTimelineContext';
import { useAccountsContext } from '../accounts/AccountsContext';
import { updateCollectionsRedux } from './actions';
import { GlobalReduxState } from '../../../pages/_app';
import { compareObjects } from '../../../utils/compare';

export type CollectionsContextType = {
  getCollection: (collectionId: DesiredNumberType) => Readonly<BitBadgesCollection<DesiredNumberType>> | undefined,

  // getCollection: (collectionId: DesiredNumberType) => BitBadgesCollection<DesiredNumberType> | undefined,
  updateCollection: (newCollection: Partial<BitBadgesCollection<DesiredNumberType> | { collectionPermissions?: Partial<CollectionPermissions<bigint>> }> & { collectionId: DesiredNumberType }) => void,
  setCollection: (collection: BitBadgesCollection<DesiredNumberType>) => void,

  updateCollectionAndFetchMetadataDirectly(newCollection: Partial<BitBadgesCollection<DesiredNumberType> | { collectionPermissions?: Partial<CollectionPermissions<bigint>> }> & { collectionId: DesiredNumberType }, fetchOptions: MetadataFetchOptions, fetchDirectly?: boolean): Promise<Readonly<BitBadgesCollection<DesiredNumberType>>>,

  //The base fetchCollections will fetch the bare minimum (collection details and collection metadata). 
  //Useful for when you want to fetch a collection but don't care about all the extra details (e.g. search dropdown).
  //The fetchCollectionWithOptions will allow you to specify exactly what you want to fetch. 
  //You can also use fetchNextForViews for a specific paginated view
  fetchCollections: (collectionsToFetch: DesiredNumberType[], forceful?: boolean) => Promise<Readonly<BitBadgesCollection<DesiredNumberType>>[]>,
  fetchCollectionsWithOptions: (
    collectionsToFetch: (
      { collectionId: DesiredNumberType } & GetMetadataForCollectionRequestBody & GetAdditionalCollectionDetailsRequestBody
      & { forcefulFetchTrackers?: boolean }
    )[],
    forceful?: boolean
  ) => Promise<Readonly<BitBadgesCollection<DesiredNumberType>>[]>,

  triggerMetadataRefresh: (collectionId: DesiredNumberType) => Promise<void>,
  batchFetchAndUpdateMetadata(requests: { collectionId: DesiredNumberType, metadataToFetch: MetadataFetchOptions }[]): Promise<Readonly<BitBadgesCollection<DesiredNumberType>>[]>,
  fetchAndUpdateMetadata: (collectionId: DesiredNumberType, fetchOptions: MetadataFetchOptions, fetchDirectly?: boolean) => Promise<Readonly<BitBadgesCollection<DesiredNumberType>>[]>,

  fetchBalanceForUser: (collectionId: DesiredNumberType, addressOrUsername: string, forceful?: boolean) => Promise<Readonly<BalanceInfoWithDetails<DesiredNumberType>>>,

  fetchNextForViews: (collectionId: DesiredNumberType, viewKeys: CollectionViewKey[]) => Promise<Readonly<BitBadgesCollection<DesiredNumberType>>>,

  viewHasMore: (collectionId: DesiredNumberType, viewKey: CollectionViewKey) => boolean,

  getMetadataView: (collectionId: DesiredNumberType, viewKey: CollectionViewKey) => Readonly<BadgeMetadataDetails<DesiredNumberType>>[],
  getActivityView: (collectionId: DesiredNumberType, viewKey: CollectionViewKey) => Readonly<TransferActivityInfo<DesiredNumberType>>[],
  getAnnouncementsView: (collectionId: DesiredNumberType, viewKey: CollectionViewKey) => Readonly<AnnouncementInfo<DesiredNumberType>>[],
  getReviewsView: (collectionId: DesiredNumberType, viewKey: CollectionViewKey) => Readonly<ReviewInfo<DesiredNumberType>>[],
  getBalancesView: (collectionId: DesiredNumberType, viewKey: CollectionViewKey) => Readonly<BalanceInfo<DesiredNumberType>>[],
  getMerkleChallengeTrackersView: (collectionId: DesiredNumberType, viewKey: CollectionViewKey) => Readonly<MerkleChallengeInfo<DesiredNumberType>>[],
  getApprovalTrackersView: (collectionId: DesiredNumberType, viewKey: CollectionViewKey) => Readonly<ApprovalsTrackerInfo<DesiredNumberType>>[],

  fetchMetadataForPreview: (existingCollectionId: DesiredNumberType, badgeIds: UintRange<bigint>[], performUpdate: boolean) => Promise<BadgeMetadataDetails<DesiredNumberType>[]>,

}

const CollectionsContext = createContext<CollectionsContextType>({
  getCollection: () => undefined,
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
  fetchBalanceForUser: async () => { return {} as BalanceInfoWithDetails<DesiredNumberType> },
  batchFetchAndUpdateMetadata: async () => { return [] },
  fetchMetadataForPreview: async () => { return [] },
  setCollection: () => { },
  updateCollectionAndFetchMetadataDirectly: async () => { return {} as BitBadgesCollection<DesiredNumberType> },
});

type Props = {
  children?: React.ReactNode
};



export interface CollectionReducerState {
  collections: CollectionMap<string>,
}

export const initialState: CollectionReducerState = {
  collections: {},
};

export const CollectionsContextProvider: React.FC<Props> = ({ children }) => {
  const collections = useSelector((state: GlobalReduxState) => state.collections.collections);
  const accounts = useAccountsContext();
  const dispatch = useDispatch();

  const getCollection = (collectionId: DesiredNumberType) => {
    const collection = collections[`${collectionId}`];
    if (!collection) return undefined;
    return convertBitBadgesCollection(collection, BigIntify)
  }

  const setCollection = (collection: BitBadgesCollection<DesiredNumberType>) => {
    dispatch(updateCollectionsRedux(collection, false));
  }

  const updateCollection = (newCollection: Partial<BitBadgesCollection<DesiredNumberType> | { collectionPermissions?: Partial<CollectionPermissions<bigint>> }> & { collectionId: DesiredNumberType }) => {
    dispatch(updateCollectionsRedux(newCollection, true));
    return getCollection(newCollection.collectionId) as BitBadgesCollection<DesiredNumberType>; //Just set it so shouldn't be undefined
  }

  const updateCollectionAndFetchMetadataDirectly = async (newCollection: Partial<BitBadgesCollection<DesiredNumberType>> & { collectionId: DesiredNumberType }, fetchOptions: MetadataFetchOptions) => {
    const collection = updateCollection(newCollection);

    const fetchedColl = await fetchAndUpdateMetadataDirectlyFromCollection({
      ...collection,
      ...newCollection,
    }, fetchOptions);

    //Note this is the fetched collection, not the updated collection, so may be incomplete
    return fetchedColl[0];
  }

  const fetchBalanceForUser = async (collectionId: DesiredNumberType, addressOrUsername: string, forceful?: boolean) => {

    const collection = await getCollection(collectionId);
    if (!collection) throw new Error('Collection does not exist');

    const account = await accounts.getAccount(addressOrUsername);
    if (!account) throw new Error('Account does not exist');

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
    if (collectionsToFetch.some(x => x === NEW_COLLECTION_ID)) {
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

  const fetchMetadataForPreview = async (existingCollectionId: DesiredNumberType | undefined, badgeIdsToDisplay: UintRange<bigint>[], performUpdate: boolean) => {
    //We only fetch if undefined

    const currPreviewCollection = getCollection(NEW_COLLECTION_ID);
    if (!currPreviewCollection) throw new Error('Collection does not exist');

    if (!existingCollectionId) return [];

    //We don't want to overwrite any edited metadata
    //Should prob do this via a range implementation but badgeIdsToDisplay should only be max len of pageSize
    let badgeIdsToFetch = deepCopy(badgeIdsToDisplay);
    for (const badgeIdRange of badgeIdsToDisplay) {
      for (let i = badgeIdRange.start; i <= badgeIdRange.end; i++) {
        const badgeId = i;
        const currMetadata = getMetadataDetailsForBadgeId(badgeId, currPreviewCollection.cachedBadgeMetadata);

        if (currMetadata) {
          //We have edited this badge and it is not a placeholder (bc it would have "Placeholder" as URI)
          //Remove badgeId from badgeIdsToFetch
          const [remaining,] = removeUintRangeFromUintRange([{ start: badgeId, end: badgeId }], badgeIdsToFetch);
          badgeIdsToFetch = remaining;
        }
      }
    }

    let badgeMetadataToReturn: BadgeMetadataDetails<bigint>[] = [];
    if (badgeIdsToFetch.length > 0) {
      if (existingCollectionId) {

        const prevMetadata = currPreviewCollection.cachedBadgeMetadata;

        while (badgeIdsToFetch.length > 0) {
          let next250Badges: UintRange<bigint>[] = [];
          for (let i = 0; i < 250; i++) {
            if (badgeIdsToFetch.length === 0) break;

            const badgeIdRange = badgeIdsToFetch.shift();
            if (badgeIdRange) {
              const badgeId = badgeIdRange.start;
              next250Badges.push({ start: badgeId, end: badgeId });
              next250Badges = sortUintRangesAndMergeIfNecessary(next250Badges, true);

              if (badgeIdRange.start != badgeIdRange.end) {
                badgeIdsToFetch = [{ start: badgeId + 1n, end: badgeIdRange.end }, ...badgeIdsToFetch];
              }
            }
          }

          //IMPORTANT: res is only the return value of the fetched collection and may not be consistent with the cache
          const res = await fetchAndUpdateMetadata(existingCollectionId, { badgeIds: next250Badges });

          //Just a note for the future: I had a lot of trouble with synchronizing existing and preview metadata
          //especially since sometimes we prune and do not even fetch all the metadata so the backend fetch didn't
          //have all metadata in the cachedBadgeMetadata response. 
          //Within fetchAndUpdateMetadata, I appenda any prev metadata cached with any newly fetched to create the resMetadata, but if there is an error, 
          //check this first w/ synchronization issues.
          let resMetadata = deepCopy(res[0].cachedBadgeMetadata);


          if (resMetadata && !compareObjects(resMetadata, prevMetadata)) {
            for (const metadata of resMetadata) {
              const [, removed] = removeUintRangeFromUintRange(next250Badges, metadata.badgeIds);
              metadata.badgeIds = removed;
            }
            resMetadata = resMetadata.filter(metadata => metadata.badgeIds.length > 0);
            badgeMetadataToReturn.push(...deepCopy(resMetadata));
          }
        }

        if (currPreviewCollection && performUpdate) {
          updateCollection({
            ...currPreviewCollection,
            cachedBadgeMetadata: badgeMetadataToReturn
          });
        }
      }
    }

    return badgeMetadataToReturn;
  }

  //Check existing cached collection and see what metadata we already have
  //Return the new request body with only the metadata we need to fetch
  const pruneMetadataToFetch = (cachedCollection: BitBadgesCollection<bigint>, metadataFetchReq?: MetadataFetchOptions) => {
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
            while (badgeIdsLeft.length > 0) {
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
              badgeIdsLeft = sortUintRangesAndMergeIfNecessary(badgeIdsLeft, true)
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

    return {
      ...metadataToFetch,
      uris: metadataToFetch.uris ?? [],
    };
  }

  const fetchCollectionsWithOptions = async (collectionsToFetch: (
    { collectionId: DesiredNumberType }
    & GetMetadataForCollectionRequestBody
    & { forcefulFetchTrackers?: boolean }
    & GetAdditionalCollectionDetailsRequestBody)[], forcefulRefresh?: boolean) => {


    if (collectionsToFetch.some(x => x.collectionId === NEW_COLLECTION_ID)) {
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
        const prunedMetadataToFetch: MetadataFetchOptions = pruneMetadataToFetch(convertBitBadgesCollection(cachedCollection, BigIntify), collectionToFetch.metadataToFetch);

        console.log('prunedMetadataToFetch', prunedMetadataToFetch, collectionsToFetch);

        const shouldFetchMetadata = (prunedMetadataToFetch.uris && prunedMetadataToFetch.uris.length > 0) || !prunedMetadataToFetch.doNotFetchCollectionMetadata;
        const viewsToFetch: { viewKey: CollectionViewKey, bookmark: string }[] = collectionToFetch.viewsToFetch || [];
        const hasTotalAndMint = cachedCollection.owners.find(x => x.cosmosAddress === "Mint") && cachedCollection.owners.find(x => x.cosmosAddress === "Total") && collectionToFetch.fetchTotalAndMintBalances;
        const shouldFetchTotalAndMint = !hasTotalAndMint && collectionToFetch.fetchTotalAndMintBalances;
        const shouldFetchMerkleChallengeIds = collectionToFetch.forcefulFetchTrackers || (collectionToFetch.merkleChallengeIdsToFetch ?? []).find(x => {
          const match = cachedCollection.merkleChallenges.find(y => y.challengeId === x.challengeId && x.approverAddress === y.approverAddress && x.collectionId === y.collectionId && x.challengeLevel === y.challengeLevel)
          return !match;
        }) !== undefined;

        const shouldFetchAmountTrackerIds = collectionToFetch.forcefulFetchTrackers || (collectionToFetch.approvalsTrackerIdsToFetch ?? []).find(x => {
          const match = cachedCollection.approvalsTrackers.find(y => y.amountTrackerId === x.amountTrackerId && x.approverAddress === y.approverAddress && x.collectionId === y.collectionId && y.approvedAddress === x.approvedAddress && y.trackerType === x.trackerType)
          return !match;
        }) !== undefined;

        if (shouldFetchMetadata || viewsToFetch.length > 0 || shouldFetchTotalAndMint || shouldFetchMerkleChallengeIds || shouldFetchAmountTrackerIds) {
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
        const collection = getCollection(collectionToFetch.collectionId);
        collectionsToReturn.push(collection ? collection : {} as BitBadgesCollection<DesiredNumberType>); //HACK: should never be undefined
      }

      return collectionsToReturn.map(x => Object.freeze(x));
    }

    const res = await getCollections(batchRequestBody);
    console.log("RES", batchRequestBody, res);

    //Update collections map
    for (let i = 0; i < res.collections.length; i++) {
      if (getCollection(res.collections[i].collectionId)) {
        updateCollection(res.collections[i]);
      } else {
        setCollection(res.collections[i]);
      }
    }

    //Note we do not use getCollection here because there is no guarantee that the collections have been updated yet in React state
    const collectionsToReturn = [];
    for (const collectionToFetch of collectionsToFetch) {
      if (batchRequestBody.collectionsToFetch.find(x => x.collectionId === collectionToFetch.collectionId) === undefined) {
        collectionsToReturn.push(getCollection(collectionToFetch.collectionId) || {} as BitBadgesCollection<DesiredNumberType>); //HACK: should never be undefined
      } else {
        collectionsToReturn.push(
          //This is only the return value
          res.collections.find(x => x.collectionId === collectionToFetch.collectionId)
        );
      }
    }

    return collectionsToReturn.map(x => Object.freeze(x)) as Readonly<BitBadgesCollection<DesiredNumberType>>[];
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

  async function fetchAndUpdateMetadataDirectlyFromCollection(updatedCollection: BitBadgesCollection<DesiredNumberType>, metadataToFetch: MetadataFetchOptions) {
    const collectionId = updatedCollection.collectionId;


    //Check if we have all metadata corresponding to the badgeIds. If not, fetch directly.
    const prunedMetadataToFetch: MetadataFetchOptions = pruneMetadataToFetch(updatedCollection, metadataToFetch);
    const fetchingNothing = !prunedMetadataToFetch.uris || prunedMetadataToFetch.uris.length === 0 && prunedMetadataToFetch.doNotFetchCollectionMetadata;
    if (fetchingNothing) {
      return [updatedCollection];
    }

    //Fetch collection metadata if we don't have it
    if (!prunedMetadataToFetch.doNotFetchCollectionMetadata) {
      const { collectionMetadata } = getCurrentMetadata(updatedCollection);
      const collectionUri = collectionMetadata?.uri || '';
      if (Joi.string().uri().validate(collectionUri).error) {
        updatedCollection.cachedCollectionMetadata = ErrorMetadata;
      } else {
        const collectionMetadataRes = await fetchMetadataDirectly({ uris: [collectionUri] });
        updatedCollection.cachedCollectionMetadata = collectionMetadataRes.metadata[0];
      }
    }

    if (prunedMetadataToFetch.uris && prunedMetadataToFetch.uris.length > 0) {

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
    }

    updateCollection({
      collectionId: collectionId,
      cachedBadgeMetadata: updatedCollection.cachedBadgeMetadata,
      cachedCollectionMetadata: updatedCollection.cachedCollectionMetadata
    });

    return [updatedCollection];
  }

  async function fetchAndUpdateMetadata(collectionId: DesiredNumberType, metadataToFetch: MetadataFetchOptions, fetchDirectly = false) {
    if (!fetchDirectly) {
      //IMPORTANT: These are just the fetchedCollections so potentially have incomplete cachedCollectionMetadata or cachedBadgeMetadata
      const fetchedCollections = await fetchCollectionsWithOptions([{
        collectionId: collectionId,
        metadataToFetch: metadataToFetch,
        fetchTotalAndMintBalances: true,
        handleAllAndAppendDefaults: true,
        viewsToFetch: []
      }]);

      return fetchedCollections.map(x => {
        //Basically, here we get the cached collection for any unhandled metadata and update it for the return values
        //Not perfect since the cache is updated asynchronously via dispatch but should be fine since we really only need any previous metadata for the return values

        const coll = getCollection(x.collectionId);
        return {
          ...x,
          cachedBadgeMetadata: batchUpdateBadgeMetadata(coll?.cachedBadgeMetadata ?? [], x.cachedBadgeMetadata),
        }
      });
    } else {
      //Only should be used in the case of minting and we need to client-side fetch the metadata for sanity checks

      const _updatedCollection = getCollection(collectionId);
      if (!_updatedCollection) throw new Error('Collection does not exist');
      const updatedCollection = deepCopy(_updatedCollection) as BitBadgesCollection<DesiredNumberType>;
      return await fetchAndUpdateMetadataDirectlyFromCollection(updatedCollection, metadataToFetch);
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
    getCollection,
    updateCollection,
    setCollection,
    fetchMetadataForPreview,
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
    getApprovalTrackersView,
    updateCollectionAndFetchMetadataDirectly: updateCollectionAndFetchMetadataDirectly
  };

  return <CollectionsContext.Provider value={collectionsContext}>
    {children}
  </CollectionsContext.Provider>;
}


export const useCollectionsContext = () => useContext(CollectionsContext);