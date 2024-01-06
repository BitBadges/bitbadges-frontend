import { BigIntify, CollectionPermissions, UintRange, deepCopy } from "bitbadgesjs-proto";
import { BadgeMetadataDetails, BitBadgesCollection, ErrorMetadata, GetAdditionalCollectionDetailsRequestBody, GetCollectionBatchRouteRequestBody, GetMetadataForCollectionRequestBody, MetadataFetchOptions, batchUpdateBadgeMetadata, convertBitBadgesCollection, getBadgeIdsForMetadataId, getMetadataDetailsForBadgeId, getMetadataIdForBadgeId, getMetadataIdsForUri, pruneMetadataToFetch, removeUintRangeFromUintRange, updateBadgeMetadata } from "bitbadgesjs-utils";
import Joi from "joi";
import { ThunkAction } from "redux-thunk";
import { AppDispatch, CollectionReducerState, GlobalReduxState } from "../../../pages/_app";
import { compareObjects } from "../../../utils/compare";
import { DesiredNumberType, fetchMetadataDirectly, getCollections } from "../../api";
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
const DELETE_COLLECTION = 'DELETE_COLLECTION';

interface FetchCollectionsSuccessAction {
  type: typeof FETCH_COLLECTIONS_SUCCESS;
  payload: CollectionRequestParams[];
}

interface DeleteCollectionReduxAction {
  type: typeof DELETE_COLLECTION;
  payload: DesiredNumberType;
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
  | SetCollectionReduxAction
  | DeleteCollectionReduxAction;

export const setCollectionRedux = (newCollection: Partial<BitBadgesCollection<DesiredNumberType> | { collectionPermissions?: Partial<CollectionPermissions<bigint>> }> & { collectionId: DesiredNumberType }): SetCollectionReduxAction => ({
  type: SET_COLLECTION,
  payload: newCollection
});

export const deleteCollectionRedux = (collectionId: DesiredNumberType): DeleteCollectionReduxAction => ({
  type: DELETE_COLLECTION,
  payload: collectionId
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

const updateCollection = (state = initialState, newCollection: BitBadgesCollection<DesiredNumberType>, isUpdate: boolean) => {
  const collections = state.collections;
  const currCollectionState = collections[`${newCollection.collectionId}`];
  if (newCollection.collectionId === undefined) throw new Error('Collection ID not provided');

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
        const oldVal = cachedCollection?.views[key];
        const newVal = val;

        newViews[key] = {
          ids: [...(oldVal?.ids || []), ...(newVal?.ids || [])].filter((val, index, self) => self.findIndex(x => x === val) === index),
          pagination: {
            ...val.pagination,
            total: val.pagination?.total || newViews[key]?.pagination?.total || undefined,
          },
          type: val.type
        }
      }
    }


    const reviews = cachedCollection.reviews || [];
    for (const newReview of newCollection.reviews || []) {
      //If we already have the review, replace it (we want newer data)
      const existingReview = reviews.findIndex(x => x._legacyId === newReview._legacyId);
      if (existingReview !== -1) {
        reviews[existingReview] = newReview;
      } else {
        reviews.push(newReview);
      }
    }

    const announcements = cachedCollection.announcements || [];
    for (const newAnnouncement of newCollection.announcements || []) {
      //If we already have the announcement, replace it (we want newer data)
      const existingAnnouncement = announcements.findIndex(x => x._legacyId === newAnnouncement._legacyId);
      if (existingAnnouncement !== -1) {
        announcements[existingAnnouncement] = newAnnouncement;
      } else {
        announcements.push(newAnnouncement);
      }
    }

    const activity = cachedCollection.activity || [];
    for (const newActivity of newCollection.activity || []) {
      //If we already have the activity, replace it (we want newer data)
      const existingActivity = activity.findIndex(x => x._legacyId === newActivity._legacyId);
      if (existingActivity !== -1) {
        activity[existingActivity] = newActivity;
      } else {
        activity.push(newActivity);
      }
    }

    const owners = cachedCollection.owners || [];
    for (const newOwner of newCollection.owners || []) {
      //If we already have the owner, replace it (we want newer data)
      const existingOwner = owners.findIndex(x => x._legacyId === newOwner._legacyId);
      if (existingOwner !== -1) {
        owners[existingOwner] = newOwner;
      } else {
        owners.push(newOwner);
      }
    }

    const merkleChallenges = cachedCollection.merkleChallenges || [];
    for (const newMerkleChallenge of newCollection.merkleChallenges || []) {
      //If we already have the merkleChallenge, replace it (we want newer data)
      const existingMerkleChallenge = merkleChallenges.findIndex(x => x._legacyId === newMerkleChallenge._legacyId);
      if (existingMerkleChallenge !== -1) {
        merkleChallenges[existingMerkleChallenge] = newMerkleChallenge;
      } else {
        merkleChallenges.push(newMerkleChallenge);
      }
    }

    const approvalsTrackers = cachedCollection.approvalsTrackers || [];
    for (const newApprovalsTracker of newCollection.approvalsTrackers || []) {
      //If we already have the approvalsTracker, replace it (we want newer data)
      const existingApprovalsTracker = approvalsTrackers.findIndex(x => x._legacyId === newApprovalsTracker._legacyId);
      if (existingApprovalsTracker !== -1) {
        approvalsTrackers[existingApprovalsTracker] = newApprovalsTracker;
      } else {
        approvalsTrackers.push(newApprovalsTracker);
      }
    }


    //Update details accordingly. Note that there are certain fields which are always returned like collectionId, collectionUri, badgeUris, etc. We just ...spread these from the new response.
    cachedCollection = {
      ...cachedCollection,
      ...newCollection,
      cachedCollectionMetadata: !isUpdate ? newCollection.cachedCollectionMetadata : newCollection.cachedCollectionMetadata || cachedCollection?.cachedCollectionMetadata,
      cachedBadgeMetadata: newBadgeMetadata,
      reviews,
      announcements,
      activity,
      owners,
      merkleChallenges,
      approvalsTrackers,
      views: newViews,
    };

    if (cachedCollection.collectionId === NEW_COLLECTION_ID) {
      //Filter out fetchedAt and fetchedAtBlock for preview collections
      delete cachedCollection.cachedCollectionMetadata?.fetchedAt;
      delete cachedCollection.cachedCollectionMetadata?.fetchedAtBlock;
      for (const metadataDetails of cachedCollection.cachedBadgeMetadata) {
        delete metadataDetails.metadata?.fetchedAt;
        delete metadataDetails.metadata?.fetchedAtBlock;
      }
    }


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
    return { ...state, collections: { ...collections, [`${newCollection.collectionId}`]: newCollection } }
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
    const prunedMetadataToFetch = pruneMetadataToFetch(updatedCollection, metadataToFetch);
    const fetchingNothing = !prunedMetadataToFetch.uris || prunedMetadataToFetch.uris.length === 0 && prunedMetadataToFetch.doNotFetchCollectionMetadata;
    if (fetchingNothing) {
      return [updatedCollection];
    }

    const { collectionMetadata, badgeMetadata } = getCurrentMetadata(updatedCollection);


    //Fetch collection metadata directly if we don't have it
    if (!prunedMetadataToFetch.doNotFetchCollectionMetadata) {
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
      const metadataResponses = hasInvalidUris ? undefined : await fetchMetadataDirectly({ uris: prunedMetadataToFetch.uris || [] });

      for (let i = 0; i < prunedMetadataToFetch.uris?.length; i++) {
        const uri = prunedMetadataToFetch.uris[i];
        let metadataRes;
        if (hasInvalidUris) {
          metadataRes = ErrorMetadata;
        } else {
          metadataRes = metadataResponses?.metadata[i] || ErrorMetadata;
        }

        const metadataIds = getMetadataIdsForUri(uri, badgeMetadata);
        for (const metadataId of metadataIds) {
          const badgeIds = getBadgeIdsForMetadataId(BigInt(metadataId), badgeMetadata);
          updatedCollection.cachedBadgeMetadata = updateBadgeMetadata(updatedCollection.cachedBadgeMetadata, { uri: uri, metadata: metadataRes, metadataId: metadataId, badgeIds: badgeIds });
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
    const { badgeMetadata } = getCurrentMetadata(currPreviewCollection);

    //We don't want to overwrite any previously edited metadata
    //Ignore anything we already have in the cachedBadgeMetadata of thte preview collection (0n)
    //Should prob do this via a range implementation but badgeIdsToDisplay should only be max len of pageSize
    let badgeIdsToFetch = deepCopy(badgeIdsToDisplay);
    const metadataIdsToFetch: bigint[] = [];
    for (const badgeIdRange of badgeIdsToDisplay) {
      for (let i = badgeIdRange.start; i <= badgeIdRange.end; i++) {
        const badgeId = i;
        const currMetadata = getMetadataDetailsForBadgeId(badgeId, currPreviewCollection.cachedBadgeMetadata);

        if (currMetadata) {
          //We have edited this badge and it is not a placeholder (bc it would have "Placeholder" as URI)
          //Remove badgeId from badgeIdsToFetch
          const [remaining,] = removeUintRangeFromUintRange([{ start: badgeId, end: badgeId }], badgeIdsToFetch);
          badgeIdsToFetch = remaining;
        } else {
          const metadataId = getMetadataIdForBadgeId(badgeId, badgeMetadata)
          if (metadataId >= 0n) {
            metadataIdsToFetch.push(BigInt(metadataId));
          }
        }
      }
    }


    const badgeMetadataToReturn: BadgeMetadataDetails<bigint>[] = [];
    const prevMetadata = currPreviewCollection.cachedBadgeMetadata;

    while (metadataIdsToFetch.length > 0) {

      let next250MetadataIds: bigint[] = [];
      for (let i = 0; i < 250; i++) {
        if (metadataIdsToFetch.length === 0) break;
        next250MetadataIds.push(metadataIdsToFetch.shift() || 0n);
      }

      await dispatch(fetchAndUpdateMetadataRedux(existingCollectionId, { metadataIds: next250MetadataIds }));

      const res = getCollection(getState().collections, existingCollectionId);
      if (!res) throw new Error('Collection does not exist');

      //Just a note for the future: I had a lot of trouble with synchronizing existing and preview metadata
      //especially since sometimes we prune and do not even fetch all the metadata so the backend fetch didn't
      //have all metadata in the cachedBadgeMetadata response. 
      //Within fetchAndUpdateMetadata, I appenda any prev metadata cached with any newly fetched to create the resMetadata, but if there is an error, 
      //check this first w/ synchronization issues.
      let resMetadata = deepCopy(res.cachedBadgeMetadata);


      if (resMetadata && !compareObjects(resMetadata, prevMetadata)) {
        //This step is important: only set for the badges we needed to fetch
        //We do not want to overwrite any previously edited metadata
        for (const metadata of resMetadata) {
          const [, removed] = removeUintRangeFromUintRange(badgeIdsToFetch, metadata.badgeIds);
          metadata.badgeIds = removed;
        }
        resMetadata = resMetadata.filter(metadata => metadata.badgeIds.length > 0);
        badgeMetadataToReturn.push(...deepCopy(resMetadata));
      }

      if (currPreviewCollection && performUpdate) {
        dispatch(updateCollectionsRedux({
          ...currPreviewCollection,
          cachedBadgeMetadata: badgeMetadataToReturn
        }, true));
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
    const state = getState().collections;

    try {
      const collections = state.collections;
      if (collectionsToFetch.some(x => x.collectionId === NEW_COLLECTION_ID)) {
        throw new Error('Cannot fetch preview collection ID === 0');
      }

      //Check cache for collections. If non existent, fetch with all parameters
      //If existent, fetch with only the parameters that are missing / we do not have yet
      //If we already have everything, don't fetch and return cached value

      const batchRequestBody: GetCollectionBatchRouteRequestBody = { collectionsToFetch: [] };

      for (const collectionToFetch of collectionsToFetch) {
        const cachedCollection = collections[`${collectionToFetch.collectionId}`];
        //If we don't have the collection, add it to the batch request. Fetch requested details
        if (cachedCollection === undefined) {
          batchRequestBody.collectionsToFetch.push(collectionToFetch);
        } else {
          const prunedMetadataToFetch: MetadataFetchOptions = pruneMetadataToFetch(convertBitBadgesCollection(cachedCollection, BigIntify), collectionToFetch.metadataToFetch);
          const shouldFetchMetadata = (prunedMetadataToFetch.uris && prunedMetadataToFetch.uris.length > 0) || !prunedMetadataToFetch.doNotFetchCollectionMetadata;
          const viewsToFetch = collectionToFetch.viewsToFetch || [];
          const hasTotalAndMint = cachedCollection.owners.find(x => x.cosmosAddress === "Mint") && cachedCollection.owners.find(x => x.cosmosAddress === "Total");
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
              ...collectionToFetch,
              metadataToFetch: prunedMetadataToFetch,
            });
          } else {
            //We already have everything we need from the collection
          }
        }
      }

      if (batchRequestBody.collectionsToFetch.length === 0) {
        return;
      }

      const res = await getCollections(batchRequestBody);

      //Update collections map
      for (let i = 0; i < res.collections.length; i++) {
        dispatch(updateCollectionsRedux(res.collections[i], true));
      }
    } catch (err: any) {
      console.error(err);
    }
  }


export const collectionReducer = (state = initialState, action: { type: string; payload: any }): CollectionReducerState => {
  switch (action.type) {
    case 'SET_COLLECTION':
      const newCollection = action.payload as BitBadgesCollection<DesiredNumberType>;
      return updateCollection(state, newCollection, false);
    case 'DELETE_COLLECTION':
      const collectionId = action.payload as DesiredNumberType;
      const collections = state.collections;
      delete collections[`${collectionId}`];
      return { ...state, collections };
    case 'UPDATE_COLLECTIONS':
      const currCollection = state.collections[`${action.payload.newCollection.collectionId}`];
      const hasExisting = !!currCollection;

      if (!hasExisting) {
        const newCollection = action.payload.newCollection as BitBadgesCollection<DesiredNumberType>;
        return updateCollection(state, newCollection, false);
      }

      if (currCollection && hasExisting) {
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
    default:
      return state;
  }
};