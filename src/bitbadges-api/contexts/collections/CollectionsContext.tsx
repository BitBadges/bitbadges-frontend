import {
  GetAdditionalCollectionDetailsRequestBody,
  GetMetadataForCollectionRequestBody,
  MetadataFetchOptions,
  NumberType,
  UintRangeArray,
  iBitBadgesCollection,
  iCollectionPermissions,
  iCollectionPermissionsWithDetails
} from 'bitbadgesjs-sdk';
import { useSelector } from 'react-redux';
import { CollectionReducerState, GlobalReduxState, dispatch, store } from '../../../pages/_app';
import { BitBadgesApi, DesiredNumberType, getBadgeBalanceByAddress, refreshMetadata } from '../../api';
import { NEW_COLLECTION_ID } from '../TxTimelineContext';
import { getAccount, updateAccount } from '../accounts/AccountsContext';
import {
  deleteCollectionRedux,
  fetchAndUpdateMetadataDirectlyFromCollectionRedux,
  fetchAndUpdateMetadataRedux,
  fetchCollectionsRedux,
  fetchMetadataForPreviewRedux,
  setCollectionRedux,
  updateCollectionsRedux
} from './reducer';

// Custom hook to fetch and convert a collection based on collectionIdNumber
export function useCollection(collectionIdNumber?: NumberType) {
  const str = collectionIdNumber !== undefined ? BigInt(collectionIdNumber).toString() : '';
  const collection = useSelector((state: GlobalReduxState) => state.collections.collections[`${str}`]);
  return collection;
}

export const initialState: CollectionReducerState = {
  collections: {}
};

//Export reusable dispatch functions
export const getCollection = (collectionId: DesiredNumberType) => {
  const collection = store.getState().collections.collections[`${collectionId}`];
  return collection;
};

export const setCollection = (
  collection: Partial<iBitBadgesCollection<DesiredNumberType> | { collectionPermissions?: Partial<iCollectionPermissions<bigint>> }> & {
    collectionId: DesiredNumberType;
  }
) => {
  dispatch(setCollectionRedux(collection));
};

export const updateCollection = (
  newCollection: Partial<iBitBadgesCollection<DesiredNumberType> | { collectionPermissions?: Partial<iCollectionPermissionsWithDetails<bigint>> }> & {
    collectionId: DesiredNumberType;
  }
) => {
  dispatch(updateCollectionsRedux(newCollection, true));
};

export const updateCollectionAndFetchMetadataDirectly = async (
  newCollection: Partial<iBitBadgesCollection<DesiredNumberType> | { collectionPermissions?: Partial<iCollectionPermissions<bigint>> }> & {
    collectionId: DesiredNumberType;
  },
  fetchOptions: MetadataFetchOptions
) => {
  setCollection(newCollection);
  console.log('fetchng directly from collection');

  await dispatch(fetchAndUpdateMetadataDirectlyFromCollectionRedux(newCollection.collectionId, fetchOptions));
};

export const fetchBalanceForUser = async (collectionId: DesiredNumberType, addressOrUsername: string, forceful?: boolean) => {
  let collection = getCollection(collectionId);
  if (!collection) {
    collection = await BitBadgesApi.getCollections({ collectionsToFetch: [{ collectionId }] }).then((x) => x.collections[0]);
  }
  if (!collection) throw new Error('Collection does not exist');

  const account = getAccount(addressOrUsername);
  if (!account) throw new Error('Account does not exist');

  let res;
  if (forceful || collection.balancesType === 'Off-Chain - Non-Indexed') {
    res = await getBadgeBalanceByAddress(collectionId, account.cosmosAddress);
    if (collection.balancesType === 'Off-Chain - Non-Indexed') {
      return res;
    }
  } else {
    const cachedBalance = collection.getBadgeBalanceInfo(account.cosmosAddress);
    if (cachedBalance) {
      return cachedBalance;
    } else {
      res = await getBadgeBalanceByAddress(collectionId, account.cosmosAddress);
    }
  }

  updateCollection({
    ...collection,
    owners: [...(collection.owners || []), res]
  });

  const newAccount = account.clone();
  newAccount.collected = [...(account.collected || []), res];
  updateAccount(newAccount);

  return res;
};

export const fetchCollections = async (collectionsToFetch: DesiredNumberType[], forceful?: boolean) => {
  if (collectionsToFetch.some((x) => x === NEW_COLLECTION_ID)) {
    throw new Error('Cannot fetch preview collection ID === 0');
  }

  return await fetchCollectionsWithOptions(
    collectionsToFetch.map((x) => {
      return {
        collectionId: x,
        viewsToFetch: [],
        fetchTotalAndMintBalances: true,
        handleAllAndAppendDefaults: true
      };
    }),
    forceful
  );
};

export const fetchMetadataForPreview = async (
  existingCollectionId: DesiredNumberType | undefined,
  badgeIdsToDisplay: UintRangeArray<bigint>,
  performUpdate: boolean
) => {
  await dispatch(fetchMetadataForPreviewRedux(existingCollectionId, badgeIdsToDisplay.clone(), performUpdate));

  const updatedState = store.getState().collections;
  return updatedState.collections[`${existingCollectionId}`]?.cachedBadgeMetadata ?? [];
};

export const fetchCollectionsWithOptions = async (
  collectionsToFetch: Array<
    { collectionId: DesiredNumberType } & GetMetadataForCollectionRequestBody & {
        forcefulFetchTrackers?: boolean;
      } & GetAdditionalCollectionDetailsRequestBody
  >,
  forceful?: boolean
) => {
  if (collectionsToFetch.length === 0) return [];

  if (forceful) {
    for (const collectionToFetch of collectionsToFetch) {
      dispatch(deleteCollectionRedux(collectionToFetch.collectionId));
    }
  }
  //Could check here to see if it really needs a fetch as well but don't this
  await dispatch(fetchCollectionsRedux(collectionsToFetch));

  const updatedState = store.getState().collections;

  return collectionsToFetch.map((x) => {
    return updatedState.collections[`${x.collectionId}`]!;
  });
};

export async function triggerMetadataRefresh(collectionId: DesiredNumberType) {
  await refreshMetadata(collectionId);
}

export async function batchFetchAndUpdateMetadata(requests: Array<{ collectionId: DesiredNumberType; metadataToFetch: MetadataFetchOptions }>) {
  await fetchCollectionsWithOptions(
    requests.map((x) => {
      return {
        collectionId: x.collectionId,
        metadataToFetch: x.metadataToFetch,
        fetchTotalAndMintBalances: true,
        handleAllAndAppendDefaults: true,
        viewsToFetch: []
      };
    })
  );
}

export async function fetchAndUpdateMetadata(collectionId: DesiredNumberType, metadataToFetch: MetadataFetchOptions, fetchDirectly = false) {
  await dispatch(fetchAndUpdateMetadataRedux(collectionId, metadataToFetch, fetchDirectly));

  return store.getState().collections.collections[`${collectionId}`]!;
}
