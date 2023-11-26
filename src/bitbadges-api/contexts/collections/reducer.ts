import { BigIntify, CollectionPermissions, NumberType, UintRange, convertUintRange, deepCopy } from "bitbadgesjs-proto";
import { BadgeMetadataDetails, BitBadgesCollection, CollectionViewKey, ErrorMetadata, GetAdditionalCollectionDetailsRequestBody, GetCollectionBatchRouteRequestBody, GetMetadataForCollectionRequestBody, MetadataFetchOptions, batchUpdateBadgeMetadata, convertBitBadgesCollection, getBadgeIdsForMetadataId, getMetadataDetailsForBadgeId, getMetadataIdForBadgeId, getMetadataIdsForUri, getUrisForMetadataIds, removeUintRangeFromUintRange, sortUintRangesAndMergeIfNecessary, updateBadgeMetadata } from "bitbadgesjs-utils";
import Joi from "joi";
import { ThunkAction } from "redux-thunk";
import { AppDispatch, CollectionReducerState, GlobalReduxState } from "../../../pages/_app";
import { compareObjects } from "../../../utils/compare";
import { fetchMetadataDirectly, getCollections, DesiredNumberType } from "../../api";
import { getCurrentMetadata } from "../../utils/metadata";
import { NEW_COLLECTION_ID } from "../TxTimelineContext";
import { initialState } from "./CollectionsContext";

export type CollectionRequestParams = { collectionId: DesiredNumberType } & GetMetadataForCollectionRequestBody & { forcefulFetchTrackers?: boolean } & GetAdditionalCollectionDetailsRequestBody;

interface UpdateCollectionsReduxAction {
  type: typeof UPDATE_COLLECTIONS;
  payload: {
    newCollection: Partial<BitBadgesCollection<DesiredNumberType> | { collectionPermissions?: Partial<CollectionPermissions<bigint>> }> & { collectionId: DesiredNumberType },
    onlyUpdateProvidedFields?: boolean;
  }
}

interface SetCollectionReduxAction {
  type: typeof SET_COLLECTION;
  payload: Partial<BitBadgesCollection<DesiredNumberType> | { collectionPermissions?: Partial<CollectionPermissions<bigint>> }> & { collectionId: DesiredNumberType }
}

const UPDATE_COLLECTIONS = 'UPDATE_COLLECTIONS';
const FETCH_COLLECTIONS_REQUEST = 'FETCH_COLLECTIONS_REQUEST';
const FETCH_COLLECTIONS_START = 'FETCH_COLLECTIONS_START';
const FETCH_COLLECTIONS_FAILURE = 'FETCH_COLLECTIONS_FAILURE';
const FETCH_COLLECTIONS_SUCCESS = 'FETCH_COLLECTIONS_SUCCESS';
const SET_COLLECTION = 'SET_COLLECTION';

interface FetchCollectionsSuccessAction {
  type: typeof FETCH_COLLECTIONS_SUCCESS;
  payload: CollectionRequestParams[];
}


interface FetchCollectionsRequestAction {
  type: typeof FETCH_COLLECTIONS_REQUEST;
  payload: CollectionRequestParams[]
}

interface FetchCollectionsStartAction {
  type: typeof FETCH_COLLECTIONS_START;
  payload: CollectionRequestParams[];
}

interface FetchCollectionsFailureAction {
  type: typeof FETCH_COLLECTIONS_FAILURE;
  payload: string; // Error message
}

type CollectionsActionTypes =
  | FetchCollectionsRequestAction
  | FetchCollectionsStartAction
  | FetchCollectionsFailureAction
  | UpdateCollectionsReduxAction
  | FetchCollectionsSuccessAction
  | SetCollectionReduxAction;

export const setCollectionRedux = (newCollection: Partial<BitBadgesCollection<DesiredNumberType> | { collectionPermissions?: Partial<CollectionPermissions<bigint>> }> & { collectionId: DesiredNumberType }): SetCollectionReduxAction => ({
  type: SET_COLLECTION,
  payload: newCollection
});


export const updateCollectionsRedux = (newCollection: Partial<BitBadgesCollection<DesiredNumberType> | { collectionPermissions?: Partial<CollectionPermissions<bigint>> }> & { collectionId: DesiredNumberType }, onlyUpdateProvidedFields: boolean): UpdateCollectionsReduxAction => ({
  type: UPDATE_COLLECTIONS,
  payload: {
    newCollection,
    onlyUpdateProvidedFields
  }
});

export const fetchCollectionsSuccess = (collections: CollectionRequestParams[]): FetchCollectionsSuccessAction => ({
  type: FETCH_COLLECTIONS_SUCCESS,
  payload: collections
});

// Define your action creators
export const fetchCollectionsRequest = (accountsToFetch: CollectionRequestParams[]): FetchCollectionsRequestAction => ({
  type: FETCH_COLLECTIONS_REQUEST,
  payload: accountsToFetch,
});

export const fetchCollectionsStart = (fetching: CollectionRequestParams[]): FetchCollectionsStartAction => ({
  type: FETCH_COLLECTIONS_START,
  payload: fetching,
});

const fetchCollectionsFailure = (error: string): FetchCollectionsFailureAction => ({
  type: FETCH_COLLECTIONS_FAILURE,
  payload: error,
});

export const pruneMetadataToFetch = (cachedCollection: BitBadgesCollection<bigint>, metadataFetchReq?: MetadataFetchOptions) => {
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

const updateCollection = (state = initialState, newCollection: BitBadgesCollection<DesiredNumberType>, isUpdate: boolean) => {
  const collections = state.collections;
  const currCollectionState = collections[`${newCollection.collectionId}`];

  let cachedCollection = currCollectionState ? deepCopy(convertBitBadgesCollection(currCollectionState, BigIntify)) : undefined;


  const cachedCollectionCopy = deepCopy(cachedCollection);


  if (cachedCollection) {


    //TODO: No idea why the deep copy is necessary but it breaks the timeline batch updates for existing collections if not
    //      One place to look: somehow, I think that the indivudal elements in .badgeIds are the same object (cached[0].badgeIds === new[0].badgeIds)
    //      I think the cachedCollection deepCopy is the important one, but I'm not sure

    let newBadgeMetadata = newCollection.cachedBadgeMetadata
      ? !isUpdate ? deepCopy(newCollection.cachedBadgeMetadata) : batchUpdateBadgeMetadata(cachedCollection.cachedBadgeMetadata, deepCopy(newCollection.cachedBadgeMetadata))
      : cachedCollection.cachedBadgeMetadata;


    const newViews = cachedCollection?.views || {};
    if (newCollection.views) {
      for (const [key, val] of Object.entries(newCollection.views)) {
        if (!val) continue;

        newViews[key] = {
          ids: [...(val?.ids || []), ...(newViews[key]?.ids || []),].filter((val, index, self) => self.findIndex(x => x === val) === index),
          pagination: {
            ...val.pagination,
            total: val.pagination?.total || newViews[key]?.pagination?.total || undefined,
          },
          type: val.type
        }

      }
    }

    //Update details accordingly. Note that there are certain fields which are always returned like collectionId, collectionUri, badgeUris, etc. We just ...spread these from the new response.
    cachedCollection = {
      ...cachedCollection,
      ...newCollection,
      cachedCollectionMetadata: !isUpdate ? newCollection.cachedCollectionMetadata : newCollection.cachedCollectionMetadata || cachedCollection?.cachedCollectionMetadata,
      cachedBadgeMetadata: newBadgeMetadata,
      reviews: [...(newCollection?.reviews || []), ...(cachedCollection.reviews || [])],
      announcements: [...(newCollection?.announcements || []), ...(cachedCollection.announcements || [])],
      activity: [...(newCollection?.activity || []), ...(cachedCollection.activity || [])],
      owners: [...(newCollection?.owners || []), ...(cachedCollection.owners || [])],
      merkleChallenges: [...(newCollection?.merkleChallenges || []), ...(cachedCollection.merkleChallenges || [])],
      approvalsTrackers: [...(newCollection?.approvalsTrackers || []), ...(cachedCollection.approvalsTrackers || [])],
      views: newViews,
    };

    if (cachedCollection.collectionId === NEW_COLLECTION_ID) {
      //Filter out fetchedAt and fetchedAtBlock 
      delete cachedCollection.cachedCollectionMetadata?.fetchedAt;
      delete cachedCollection.cachedCollectionMetadata?.fetchedAtBlock;

      for (const metadataDetails of cachedCollection.cachedBadgeMetadata) {
        delete metadataDetails.metadata?.fetchedAt;
        delete metadataDetails.metadata?.fetchedAtBlock;
      }
    }

    //Filter duplicates (but prioritize the new ones)
    cachedCollection.reviews = cachedCollection.reviews.filter((val, index, self) => self.findIndex(x => x._id === val._id) === index);
    cachedCollection.announcements = cachedCollection.announcements.filter((val, index, self) => self.findIndex(x => x._id === val._id) === index);
    cachedCollection.activity = cachedCollection.activity.filter((val, index, self) => self.findIndex(x => x._id === val._id) === index);
    cachedCollection.owners = cachedCollection.owners.filter((val, index, self) => self.findIndex(x => x._id === val._id) === index);
    cachedCollection.merkleChallenges = cachedCollection.merkleChallenges.filter((val, index, self) => self.findIndex(x => x._id === val._id) === index);
    cachedCollection.approvalsTrackers = cachedCollection.approvalsTrackers.filter((val, index, self) => self.findIndex(x => x._id === val._id) === index);

    //Sort activity, history etc
    cachedCollection.activity = cachedCollection.activity.sort((a, b) => b.timestamp - a.timestamp > 0 ? -1 : 1);
    cachedCollection.reviews = cachedCollection.reviews.sort((a, b) => b.timestamp - a.timestamp > 0 ? -1 : 1);
    cachedCollection.announcements = cachedCollection.announcements.sort((a, b) => b.timestamp - a.timestamp > 0 ? -1 : 1);
    cachedCollection.updateHistory = cachedCollection.updateHistory.sort((a, b) => b.blockTimestamp - a.blockTimestamp > 0 ? -1 : 1)

    //Only update if anything has changed
    if (!compareObjects(cachedCollectionCopy, cachedCollection)) {
      return {
        ...state,
        collections: {
          ...collections,
          [`${newCollection.collectionId}`]: cachedCollection
        }
      };
    }

    return state;

  } else {
    return { ...state, collections: { ...collections, [`${newCollection.collectionId}`]: newCollection } };
  }
}

const getCollection = (state: CollectionReducerState, collectionId: DesiredNumberType): BitBadgesCollection<bigint> | undefined => {
  const collection = state.collections[`${collectionId}`];
  if (!collection) return undefined;
  return convertBitBadgesCollection(collection, BigIntify)
}

export const fetchAndUpdateMetadataRedux = (collectionId: DesiredNumberType, metadataToFetch: MetadataFetchOptions, fetchDirectly = false): ThunkAction<
  void,
  GlobalReduxState,
  unknown,
  CollectionsActionTypes
> => async (
  dispatch: AppDispatch,
  getState: () => GlobalReduxState
) => {

    const state = getState().collections;



    if (!fetchDirectly) {
      //IMPORTANT: These are just the fetchedCollections so potentially have incomplete cachedCollectionMetadata or cachedBadgeMetadata
      await dispatch(fetchCollectionsRedux([{
        collectionId: collectionId,
        metadataToFetch: metadataToFetch,
        fetchTotalAndMintBalances: true,
        handleAllAndAppendDefaults: true,
        viewsToFetch: []
      }]));

    } else {
      //Only should be used in the case of minting and we need to client-side fetch the metadata for sanity checks

      const _updatedCollection = getCollection(state, collectionId);
      if (!_updatedCollection) throw new Error('Collection does not exist');
      const updatedCollection = deepCopy(_updatedCollection) as BitBadgesCollection<DesiredNumberType>;
      await dispatch(fetchAndUpdateMetadataDirectlyFromCollectionRedux(updatedCollection.collectionId, metadataToFetch));
    }
  }

export const fetchAndUpdateMetadataDirectlyFromCollectionRedux = (collectionId: bigint, metadataToFetch: MetadataFetchOptions): ThunkAction<
  void,
  GlobalReduxState,
  unknown,
  CollectionsActionTypes
> => async (
  dispatch: AppDispatch,
  getState: () => GlobalReduxState
) => {
    const updatedCollection = getCollection(getState().collections, collectionId);
    if (!updatedCollection) throw new Error('Collection does not exist');

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

    dispatch(updateCollectionsRedux(updatedCollection, true));
  }

export const fetchMetadataForPreviewRedux = (existingCollectionId: DesiredNumberType | undefined, badgeIdsToDisplay: UintRange<bigint>[], performUpdate: boolean): ThunkAction<
  void,
  GlobalReduxState,
  unknown,
  CollectionsActionTypes
> => async (
  dispatch: AppDispatch,
  getState: () => GlobalReduxState
) => {
    const state = getState().collections;

    //We only fetch if undefined
    const currPreviewCollection = getCollection(state, NEW_COLLECTION_ID);
    if (!currPreviewCollection) throw new Error('Collection does not exist');

    if (!existingCollectionId || badgeIdsToDisplay.length === 0) return [];

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

          await dispatch(fetchAndUpdateMetadataRedux(existingCollectionId, { badgeIds: next250Badges }));

          const res = getCollection(getState().collections, existingCollectionId);
          if (!res) throw new Error('Collection does not exist');



          //Just a note for the future: I had a lot of trouble with synchronizing existing and preview metadata
          //especially since sometimes we prune and do not even fetch all the metadata so the backend fetch didn't
          //have all metadata in the cachedBadgeMetadata response. 
          //Within fetchAndUpdateMetadata, I appenda any prev metadata cached with any newly fetched to create the resMetadata, but if there is an error, 
          //check this first w/ synchronization issues.
          let resMetadata = deepCopy(res.cachedBadgeMetadata);


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
          dispatch(updateCollectionsRedux({
            ...currPreviewCollection,
            cachedBadgeMetadata: badgeMetadataToReturn
          }, true));
        }
      }
    }

    return badgeMetadataToReturn;
  }



export const fetchCollectionsRedux = (
  collectionsToFetch: CollectionRequestParams[]
): ThunkAction<
  void,
  GlobalReduxState,
  unknown,
  CollectionsActionTypes
> => async (
  dispatch: AppDispatch,
  getState: () => GlobalReduxState
) => {
    const forcefulRefresh = false;
    const state = getState().collections;
    // const accountsState = getState().accounts;

    try {
      const collections = state.collections;
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


      // const accountsToFetch = []


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
          } else {
            //We already have everything we need from the collection side, but we may still have to check the accounts
            // accountsToFetch.push({ address: cachedCollection.createdBy, viewsToFetch: [] });
            // accountsToFetch.push(...cachedCollection.managerTimeline.map(x => { return { address: x.manager, viewsToFetch: [] } }));
          }
        }
      }

      if (batchRequestBody.collectionsToFetch.length === 0) {
        // dispatch(fetchAccountsRedux(accountsToFetch));
        return;
      }

      const res = await getCollections(batchRequestBody);
      // console.log("COLLECTIONS RES", res);

      //Update collections map
      for (let i = 0; i < res.collections.length; i++) {
        dispatch(updateCollectionsRedux(res.collections[i], true));
      }

      // accountsToFetch.push(
      //   ...res.collections.map(x => { return { address: x.createdBy, viewsToFetch: [] } }),
      //   ...res.collections.map(x => x.managerTimeline.map(y => y.manager)).flat().map(x => { return { address: x, viewsToFetch: [] } })
      // );

      // dispatch(fetchAccountsRedux(accountsToFetch));
    } catch (err: any) {
      console.error(err);
      dispatch(fetchCollectionsFailure(err.message));
    }
  }


export const collectionReducer = (state = initialState, action: { type: string; payload: any }): CollectionReducerState => {
  switch (action.type) {
    case 'SET_COLLECTION':
      const newCollection = action.payload as BitBadgesCollection<DesiredNumberType>;
      return updateCollection(state, newCollection, false);
    case 'UPDATE_COLLECTIONS':
      const currCollection = state.collections[`${action.payload.newCollection.collectionId}`];
      const onlyUpdateProvidedFields = !!currCollection;

      if (!onlyUpdateProvidedFields) {
        const newCollection = action.payload.newCollection as BitBadgesCollection<DesiredNumberType>;
        return updateCollection(state, newCollection, false);
      }

      if (currCollection && onlyUpdateProvidedFields) {
        const newCollection = {
          ...currCollection,
          ...action.payload.newCollection,
          collectionPermissions: {
            ...currCollection.collectionPermissions,
            ...action.payload.newCollection.collectionPermissions
          }
        };
        return updateCollection(state, newCollection, true);
      }
      throw new Error("Collection not found and onlyUpdateProvidedFields is true");
    case 'FETCH_COLLECTIONS_REQUEST':
      return { ...state, loading: false, error: '', queue: [...state.queue, ...action.payload] };
    case 'FETCH_COLLECTIONS_START':
    // return {
    //   ...state, loading: false, error: '',
    //   queue: state.queue.filter(x => !action.payload.find((y: any) => JSON.stringify(x) === JSON.stringify(y))),
    //   fetching: [...state.fetching, ...action.payload]
    // }
    case 'FETCH_COLLECTIONS_FAILURE':
    // return { ...state, loading: false, error: action.payload };
    case 'FETCH_COLLECTIONS_SUCCESS':
    // return state;
    // console.log('new fetching', state.fetching, state.fetching.filter(x => !action.payload.find((y: any) => JSON.stringify(x) === JSON.stringify(y))));
    // return { ...state, loading: false, error: '', fetching: state.fetching.filter(x => !action.payload.find((y: any) => JSON.stringify(x) === JSON.stringify(y))) };
    default:
      return state;
  }
};