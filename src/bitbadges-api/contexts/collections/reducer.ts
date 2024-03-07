import {
  BadgeMetadataDetails,
  BitBadgesCollection,
  GetAdditionalCollectionDetailsRequestBody,
  GetCollectionBatchRouteRequestBody,
  GetMetadataForCollectionRequestBody,
  Metadata,
  MetadataFetchOptions,
  UintRangeArray,
  getBadgeIdsForMetadataId,
  getMetadataIdForBadgeId,
  getMetadataIdsForUri,
  iBitBadgesCollection,
  iCollectionPermissions
} from 'bitbadgesjs-sdk';
import Joi from 'joi';
import { ThunkAction } from 'redux-thunk';
import { AppDispatch, CollectionReducerState, GlobalReduxState } from '../../../pages/_app';
import { compareObjects } from '../../../utils/compare';
import { DesiredNumberType, fetchMetadataDirectly, getCollections } from '../../api';
import { getCurrentMetadata } from '../../utils/metadata';
import { NEW_COLLECTION_ID } from '../TxTimelineContext';
import { deepFreeze } from '../accounts/reducer';
import { initialState } from './CollectionsContext';

const { getMetadataDetailsForBadgeId, updateBadgeMetadata } = BadgeMetadataDetails;

export type CollectionRequestParams = {
  collectionId: DesiredNumberType;
} & GetMetadataForCollectionRequestBody & {
    forcefulFetchTrackers?: boolean;
  } & GetAdditionalCollectionDetailsRequestBody;

interface UpdateCollectionsReduxAction {
  type: typeof UPDATE_COLLECTIONS;
  payload: {
    newCollection: Partial<iBitBadgesCollection<DesiredNumberType> | { collectionPermissions?: Partial<iCollectionPermissions<bigint>> }> & {
      collectionId: DesiredNumberType;
    };
    onlyUpdateProvidedFields?: boolean;
  };
}

interface SetCollectionReduxAction {
  type: typeof SET_COLLECTION;
  payload: Partial<iBitBadgesCollection<DesiredNumberType> | { collectionPermissions?: Partial<iCollectionPermissions<bigint>> }> & {
    collectionId: DesiredNumberType;
  };
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
  payload: CollectionRequestParams[];
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

export const setCollectionRedux = (
  newCollection: Partial<iBitBadgesCollection<DesiredNumberType> | { collectionPermissions?: Partial<iCollectionPermissions<bigint>> }> & {
    collectionId: DesiredNumberType;
  }
): SetCollectionReduxAction => ({
  type: SET_COLLECTION,
  payload: newCollection
});

export const deleteCollectionRedux = (collectionId: DesiredNumberType): DeleteCollectionReduxAction => ({
  type: DELETE_COLLECTION,
  payload: collectionId
});

export const updateCollectionsRedux = (
  newCollection: Partial<iBitBadgesCollection<DesiredNumberType> | { collectionPermissions?: Partial<iCollectionPermissions<bigint>> }> & {
    collectionId: DesiredNumberType;
  },
  onlyUpdateProvidedFields: boolean
): UpdateCollectionsReduxAction => ({
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
  payload: accountsToFetch
});

export const fetchCollectionsStart = (fetching: CollectionRequestParams[]): FetchCollectionsStartAction => ({
  type: FETCH_COLLECTIONS_START,
  payload: fetching
});

const updateCollection = (state = initialState, newCollection: BitBadgesCollection<DesiredNumberType>, isUpdate: boolean): CollectionReducerState => {
  const collections = state.collections;
  const currCollectionState = collections[`${newCollection.collectionId}`];
  if (newCollection.collectionId === undefined) throw new Error('Collection ID not provided');
  const cachedCollection = currCollectionState?.clone();
  const cachedCollectionCopy = cachedCollection?.clone();

  if (cachedCollection && isUpdate) {
    cachedCollection.updateWithNewResponse(newCollection);

    // If the collection is reported, we need to replace all metadata with placeholder
    if (cachedCollection.reported) {
      for (const badge of cachedCollection.cachedBadgeMetadata ?? []) {
        if (badge.metadata.equals(Metadata.DefaultPlaceholderMetadata())) continue;
        badge.metadata = Metadata.DefaultPlaceholderMetadata();
      }
      for (const approval of cachedCollection.collectionApprovals ?? []) {
        if (approval.details) {
          if (approval.details.name === '' && approval.details.description === '') continue;

          approval.details.name = '';
          approval.details.description = '';
        }
      }

      if (!cachedCollection.cachedCollectionMetadata?.equals(Metadata.DefaultPlaceholderMetadata())) {
        cachedCollection.cachedCollectionMetadata = Metadata.DefaultPlaceholderMetadata();
      }
    }

    //Only update if anything has changed
    if (!cachedCollection.equals(cachedCollectionCopy)) {
      return {
        ...state,
        collections: {
          ...collections,
          [`${newCollection.collectionId}`]: deepFreeze(cachedCollection)
        }
      };
    }

    return state;
  } else {
    return {
      ...state,
      collections: { ...collections, [`${newCollection.collectionId}`]: deepFreeze(newCollection) }
    };
  }
};

const getCollection = (state: CollectionReducerState, collectionId: DesiredNumberType) => {
  const collection = state.collections[`${collectionId}`];
  if (!collection) return undefined;
  return collection;
};

export const fetchAndUpdateMetadataRedux =
  (
    collectionId: DesiredNumberType,
    metadataToFetch: MetadataFetchOptions,
    fetchDirectly = false
  ): ThunkAction<void, GlobalReduxState, unknown, CollectionsActionTypes> =>
  async (dispatch: AppDispatch, getState: () => GlobalReduxState) => {
    const state = getState().collections;

    if (!fetchDirectly) {
      //IMPORTANT: These are just the fetchedCollections so potentially have incomplete cachedCollectionMetadata or cachedBadgeMetadata
      await dispatch(
        fetchCollectionsRedux([
          {
            collectionId: collectionId,
            metadataToFetch: metadataToFetch,
            fetchTotalAndMintBalances: true,
            handleAllAndAppendDefaults: true,
            viewsToFetch: []
          }
        ])
      );
    } else {
      //Only should be used in the case of minting and we need to client-side fetch the metadata for sanity checks

      const _updatedCollection = getCollection(state, collectionId);
      if (!_updatedCollection) throw new Error('Collection does not exist');
      const updatedCollection = _updatedCollection.clone();
      await dispatch(fetchAndUpdateMetadataDirectlyFromCollectionRedux(updatedCollection.collectionId, metadataToFetch));
    }
  };

export const fetchAndUpdateMetadataDirectlyFromCollectionRedux =
  (collectionId: bigint, metadataToFetch: MetadataFetchOptions): ThunkAction<void, GlobalReduxState, unknown, CollectionsActionTypes> =>
  async (dispatch: AppDispatch, getState: () => GlobalReduxState) => {
    const updatedCollection = getCollection(getState().collections, collectionId)?.clone();
    if (!updatedCollection) throw new Error('Collection does not exist');

    //Check if we have all metadata corresponding to the badgeIds. If not, fetch directly.
    const prunedMetadataToFetch = updatedCollection.pruneMetadataToFetch(metadataToFetch);
    const fetchingNothing =
      !prunedMetadataToFetch.uris || (prunedMetadataToFetch.uris.length === 0 && prunedMetadataToFetch.doNotFetchCollectionMetadata);
    if (fetchingNothing) {
      return [updatedCollection];
    }

    const { collectionMetadata, badgeMetadata } = getCurrentMetadata(updatedCollection);

    //Fetch collection metadata directly if we don't have it
    if (!prunedMetadataToFetch.doNotFetchCollectionMetadata) {
      const collectionUri = collectionMetadata?.uri || '';
      if (Joi.string().uri().validate(collectionUri).error) {
        updatedCollection.cachedCollectionMetadata = Metadata.ErrorMetadata();
      } else {
        const collectionMetadataRes = await fetchMetadataDirectly({ uris: [collectionUri] });
        updatedCollection.cachedCollectionMetadata = collectionMetadataRes.metadata[0];
      }
    }

    if (prunedMetadataToFetch.uris && prunedMetadataToFetch.uris.length > 0) {
      const hasInvalidUris = prunedMetadataToFetch.uris?.some((x) => Joi.string().uri().validate(x).error);
      const metadataResponses = hasInvalidUris ? undefined : await fetchMetadataDirectly({ uris: prunedMetadataToFetch.uris || [] });

      for (let i = 0; i < prunedMetadataToFetch.uris?.length; i++) {
        const uri = prunedMetadataToFetch.uris[i];
        let metadataRes;
        if (hasInvalidUris) {
          metadataRes = Metadata.ErrorMetadata();
        } else {
          metadataRes = metadataResponses?.metadata[i] || Metadata.ErrorMetadata();
        }

        const metadataIds = getMetadataIdsForUri(uri, badgeMetadata);
        for (const metadataId of metadataIds) {
          const badgeIds = UintRangeArray.From(getBadgeIdsForMetadataId(BigInt(metadataId), badgeMetadata));
          updatedCollection.cachedBadgeMetadata = updateBadgeMetadata(
            updatedCollection.cachedBadgeMetadata,
            new BadgeMetadataDetails({
              uri: uri,
              metadata: metadataRes,
              metadataId: metadataId,
              badgeIds: badgeIds
            })
          );
        }
      }
    }

    dispatch(updateCollectionsRedux(updatedCollection, true));
  };

export const fetchMetadataForPreviewRedux =
  (
    existingCollectionId: DesiredNumberType | undefined,
    badgeIdsToDisplay: UintRangeArray<bigint>,
    performUpdate: boolean
  ): ThunkAction<void, GlobalReduxState, unknown, CollectionsActionTypes> =>
  async (dispatch: AppDispatch, getState: () => GlobalReduxState) => {
    const state = getState().collections;

    //We only fetch if undefined
    const currPreviewCollection = getCollection(state, NEW_COLLECTION_ID);
    if (!currPreviewCollection) throw new Error('Collection does not exist');

    if (!existingCollectionId || badgeIdsToDisplay.length === 0) return [];
    const badgeMetadata = currPreviewCollection.getBadgeMetadataTimelineValue();

    //We don't want to overwrite any previously edited metadata
    //Ignore anything we already have in the cachedBadgeMetadata of thte preview collection (0n)
    //Should prob do this via a range implementation but badgeIdsToDisplay should only be max len of pageSize
    const badgeIdsToFetch = badgeIdsToDisplay.clone();
    const metadataIdsToFetch: bigint[] = [];
    for (const badgeIdRange of badgeIdsToDisplay) {
      for (let i = badgeIdRange.start; i <= badgeIdRange.end; i++) {
        const badgeId = i;
        const currMetadata = getMetadataDetailsForBadgeId(badgeId, currPreviewCollection.cachedBadgeMetadata);

        if (currMetadata) {
          //We have edited this badge and it is not a placeholder (bc it would have "Placeholder" as URI)
          //Remove badgeId from badgeIdsToFetch
          badgeIdsToFetch.remove([{ start: badgeId, end: badgeId }]);
        } else {
          const metadataId = getMetadataIdForBadgeId(badgeId, badgeMetadata);
          if (metadataId >= 0n) {
            metadataIdsToFetch.push(BigInt(metadataId));
          }
        }
      }
    }

    const badgeMetadataToReturn: Array<BadgeMetadataDetails<bigint>> = [];
    const prevMetadata = currPreviewCollection.cachedBadgeMetadata;

    while (metadataIdsToFetch.length > 0) {
      const next250MetadataIds: bigint[] = [];
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
      let resMetadata = res.cachedBadgeMetadata.map((x) => x.clone());

      if (resMetadata && !compareObjects(resMetadata, prevMetadata)) {
        //This step is important: only set for the badges we needed to fetch
        //We do not want to overwrite any previously edited metadata
        for (const metadata of resMetadata) {
          const overlaps = metadata.badgeIds.getOverlaps(badgeIdsToFetch);
          metadata.badgeIds = overlaps;
        }
        resMetadata = resMetadata.filter((metadata) => metadata.badgeIds.length > 0);
        badgeMetadataToReturn.push(...resMetadata.map((x) => x.clone()));
      }

      if (currPreviewCollection && performUpdate) {
        dispatch(
          updateCollectionsRedux(
            {
              ...currPreviewCollection,
              cachedBadgeMetadata: badgeMetadataToReturn
            },
            true
          )
        );
      }
    }

    return badgeMetadataToReturn;
  };

export const fetchCollectionsRedux =
  (collectionsToFetch: CollectionRequestParams[]): ThunkAction<void, GlobalReduxState, unknown, CollectionsActionTypes> =>
  async (dispatch: AppDispatch, getState: () => GlobalReduxState) => {
    const state = getState().collections;

    try {
      const collections = state.collections;
      if (collectionsToFetch.some((x) => x.collectionId === NEW_COLLECTION_ID)) {
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
          if (collectionToFetch.forcefulFetchTrackers) {
            const prunedOptions = cachedCollection.pruneRequestBody(collectionToFetch);
            prunedOptions.challengeTrackersToFetch = collectionToFetch.challengeTrackersToFetch;
            prunedOptions.approvalTrackersToFetch = collectionToFetch.approvalTrackersToFetch;
            batchRequestBody.collectionsToFetch.push(prunedOptions);
          } else if (!cachedCollection.isRedundantRequest(collectionToFetch)) {
            const prunedOptions = cachedCollection.pruneRequestBody(collectionToFetch);
            batchRequestBody.collectionsToFetch.push(prunedOptions);
          }
        }
      }

      if (batchRequestBody.collectionsToFetch.length === 0) {
        return;
      }

      const res = await getCollections(batchRequestBody);
      // console.log('res', res);

      //Update collections map
      for (let i = 0; i < res.collections.length; i++) {
        dispatch(updateCollectionsRedux(res.collections[i], true));
      }
    } catch (err: any) {
      console.error(err);
    }
  };

export const collectionReducer = (state = initialState, action: { type: string; payload: any }): CollectionReducerState => {
  switch (action.type) {
    case 'SET_COLLECTION':
      const newCollection = new BitBadgesCollection<DesiredNumberType>(action.payload);
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
        const newCollection = new BitBadgesCollection<DesiredNumberType>(action.payload.newCollection);
        return updateCollection(state, newCollection, false);
      }

      if (currCollection && hasExisting) {
        const newCollection = new BitBadgesCollection<DesiredNumberType>({
          ...currCollection,
          ...action.payload.newCollection,
          collectionPermissions: {
            ...currCollection.collectionPermissions,
            ...action.payload.newCollection.collectionPermissions
          }
        });
        return updateCollection(state, newCollection, true);
      }
      throw new Error('Collection not found and onlyUpdateProvidedFields is true');
    default:
      return state;
  }
};
