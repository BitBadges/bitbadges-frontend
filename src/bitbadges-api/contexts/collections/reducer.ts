import { BitBadgesCollection, CollectionViewKey, DesiredNumberType, GetAdditionalCollectionDetailsRequestBody, GetCollectionBatchRouteRequestBody, GetMetadataForCollectionRequestBody, MetadataFetchOptions, batchUpdateBadgeMetadata, convertBitBadgesCollection, getBadgeIdsForMetadataId, getMetadataIdForBadgeId, getUrisForMetadataIds, removeUintRangeFromUintRange, sortUintRangesAndMergeIfNecessary } from "bitbadgesjs-utils";
import { compareObjects } from "../../../utils/compare";
import { NEW_COLLECTION_ID } from "../TxTimelineContext";
import { CollectionReducerState, initialState } from "./CollectionsContext";
import { BigIntify, CollectionPermissions, NumberType, Stringify, UintRange, convertUintRange, deepCopy } from "bitbadgesjs-proto";
import { Dispatch } from "react";
import { ThunkAction } from "redux-thunk";
import { GlobalReduxState } from "../../../pages/_app";
import { getCollections } from "../../api";
import { AccountsActionTypes, fetchAccountsRedux, fetchAccountsRequest } from "../accounts/reducer";
import { getCurrentMetadata } from "../../utils/metadata";

export type CollectionRequestParams = { collectionId: DesiredNumberType } & GetMetadataForCollectionRequestBody & { forcefulFetchTrackers?: boolean } & GetAdditionalCollectionDetailsRequestBody;

interface UpdateCollectionsReduxAction {
  type: typeof UPDATE_COLLECTIONS;
  payload: {
    newCollection: Partial<BitBadgesCollection<DesiredNumberType> | { collectionPermissions?: Partial<CollectionPermissions<bigint>> }> & { collectionId: DesiredNumberType },
    onlyUpdateProvidedFields?: boolean;
  }
}


const UPDATE_COLLECTIONS = 'UPDATE_COLLECTIONS';
const FETCH_COLLECTIONS_REQUEST = 'FETCH_COLLECTIONS_REQUEST';
const FETCH_COLLECTIONS_SUCCESS = 'FETCH_COLLECTIONS_SUCCESS';
const FETCH_COLLECTIONS_FAILURE = 'FETCH_COLLECTIONS_FAILURE';


interface FetchCollectionsRequestAction {
  type: typeof FETCH_COLLECTIONS_REQUEST;
  payload: CollectionRequestParams[]
}

interface FetchCollectionsSuccessAction {
  type: typeof FETCH_COLLECTIONS_SUCCESS;
}

interface FetchCollectionsFailureAction {
  type: typeof FETCH_COLLECTIONS_FAILURE;
  payload: string; // Error message
}

type CollectionsActionTypes =
  | FetchCollectionsRequestAction
  | FetchCollectionsSuccessAction
  | FetchCollectionsFailureAction
  | UpdateCollectionsReduxAction

export const updateCollectionsRedux = (newCollection: Partial<BitBadgesCollection<DesiredNumberType> | { collectionPermissions?: Partial<CollectionPermissions<bigint>> }> & { collectionId: DesiredNumberType }, onlyUpdateProvidedFields: boolean): UpdateCollectionsReduxAction => ({
  type: UPDATE_COLLECTIONS,
  payload: {
    newCollection,
    onlyUpdateProvidedFields
  }
});

// Define your action creators
export const fetchCollectionsRequest = (accountsToFetch: CollectionRequestParams[]): FetchCollectionsRequestAction => ({
  type: FETCH_COLLECTIONS_REQUEST,
  payload: accountsToFetch,
});

const fetchCollectionsSuccess = (): FetchCollectionsSuccessAction => ({
  type: FETCH_COLLECTIONS_SUCCESS,
});

const fetchCollectionsFailure = (error: string): FetchCollectionsFailureAction => ({
  type: FETCH_COLLECTIONS_FAILURE,
  payload: error,
});

const getCollection = (state: CollectionReducerState, collectionId: DesiredNumberType) => {
  const collections = state.collections;
  const collection = collections[`${collectionId}`];
  if (!collection) return undefined;
  return convertBitBadgesCollection(collection, BigIntify)
}

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
          ids: [...(newViews[key]?.ids || []), ...(val?.ids || []),],
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
          [`${newCollection.collectionId}`]: convertBitBadgesCollection(cachedCollection, Stringify)
        }
      };
    }

    return state;

  } else {
    return { ...state, collections: { ...collections, [`${newCollection.collectionId}`]: convertBitBadgesCollection(newCollection, Stringify) } };
  }
}

export const fetchCollectionsRedux = (): ThunkAction<
  void,
  GlobalReduxState,
  unknown,
  CollectionsActionTypes
> => async (
  dispatch: Dispatch<CollectionsActionTypes | AccountsActionTypes>, // Use Dispatch type
  getState: () => GlobalReduxState
) => {
    const forcefulRefresh = false;
    const state = getState().collections;
    const collectionsToFetch = state.queue.filter((x, idx, self) => self.findIndex(y => JSON.stringify(x) === JSON.stringify(y)) === idx);

    try {

      dispatch(fetchCollectionsSuccess())
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
          }
        }
      }


      if (batchRequestBody.collectionsToFetch.length === 0) {
        //Note we do not use getCollection here because there is no guarantee that the collections have been updated yet in state
        const collectionsToReturn = [];
        for (const collectionToFetch of collectionsToFetch) {
          const collection = getCollection(state, collectionToFetch.collectionId);
          collectionsToReturn.push(collection ? collection : {} as BitBadgesCollection<DesiredNumberType>); //HACK: should never be undefined
        }

        return collectionsToReturn.map(x => Object.freeze(x));
      }

      const res = await getCollections(batchRequestBody);

      console.log("COLLECTIONS RES", batchRequestBody, res);

      //For each collection, we should fetch the created by address and the manager addresses
      dispatch(fetchAccountsRequest(res.collections.map(x => { return { address: x.createdBy } })));
      dispatch(fetchAccountsRequest(res.collections.map(x => x.managerTimeline.map(y => y.manager)).flat().map(x => { return { address: x } })));

      //Update collections map
      for (let i = 0; i < res.collections.length; i++) {
        if (getCollection(state, res.collections[i].collectionId)) {
          dispatch(updateCollectionsRedux(res.collections[i], true));
        } else {
          dispatch(updateCollectionsRedux(res.collections[i], false));
        }
      }


      dispatch(fetchAccountsRedux());
    } catch (err: any) {
      console.error(err);
      dispatch(fetchCollectionsFailure(err.message));
    }


  
  }


export const collectionReducer = (state = initialState, action: { type: string; payload: any }): CollectionReducerState => {
  console.log("COLLECTION REDUCER", action.type, action.payload);
  switch (action.type) {
    case 'UPDATE_COLLECTIONS':
      const onlyUpdateProvidedFields = action.payload.onlyUpdateProvidedFields as boolean;
      const currCollection = state.collections[`${action.payload.newCollection.collectionId}`];

      if (!onlyUpdateProvidedFields) {
        const newCollection = action.payload.newCollection as BitBadgesCollection<DesiredNumberType>;
        return updateCollection(state, newCollection, false);
      }

      if (currCollection && onlyUpdateProvidedFields) {
        const newCollection = {
          ...convertBitBadgesCollection(currCollection, BigIntify),
          ...action.payload.newCollection,
          collectionPermissions: {
            ...currCollection.collectionPermissions,
            ...action.payload.newCollection.collectionPermissions
          }
        };
        return updateCollection(state, deepCopy(newCollection), true);
      }
      throw new Error("Collection not found and onlyUpdateProvidedFields is true");
    case 'FETCH_COLLECTIONS_REQUEST':
      return { ...state, loading: true, error: '', queue: [...state.queue, ...action.payload] };
    case 'FETCH_COLLECTIONS_SUCCESS':
      return { ...state, loading: false, error: '', queue: [] }
    case 'FETCH_COLLECTIONS_FAILURE':
      return { ...state, loading: false, error: action.payload };

    default:
      return state;
  }
};