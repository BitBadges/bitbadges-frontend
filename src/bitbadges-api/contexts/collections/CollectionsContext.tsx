import { CollectionPermissions, NumberType, UintRange, deepCopy } from 'bitbadgesjs-sdk';
import { AnnouncementDoc, ApprovalTrackerDoc, BadgeMetadataDetails, BalanceDoc, BigIntify, BitBadgesCollection, CollectionPermissionsWithDetails, CollectionViewKey, DefaultPlaceholderMetadata, GetAdditionalCollectionDetailsRequestBody, GetMetadataForCollectionRequestBody, MerkleChallengeDoc, MetadataFetchOptions, ReviewDoc, TransferActivityDoc, convertBitBadgesCollection } from 'bitbadgesjs-sdk';
import { useSelector } from 'react-redux';
import { CollectionReducerState, GlobalReduxState, dispatch, store } from '../../../pages/_app';
import { DesiredNumberType, getBadgeBalanceByAddress, refreshMetadata } from '../../api';
import { NEW_COLLECTION_ID } from '../TxTimelineContext';
import { getAccount, updateAccount } from '../accounts/AccountsContext';
import { deleteCollectionRedux, fetchAndUpdateMetadataDirectlyFromCollectionRedux, fetchAndUpdateMetadataRedux, fetchCollectionsRedux, fetchMetadataForPreviewRedux, setCollectionRedux, updateCollectionsRedux } from './reducer';

const replaceWithPlaceholderIfReported = (collection?: BitBadgesCollection<DesiredNumberType>) => {
  if (!collection) return collection;
  if (!collection.reported) return collection;


  return {
    ...deepCopy(collection),
    cachedBadgeMetadata: collection.cachedBadgeMetadata?.map(x => {
      return {
        ...x,
        metadata: DefaultPlaceholderMetadata,
      }
    }),
    cachedCollectionMetadata: DefaultPlaceholderMetadata,
    collectionApprovals: collection.collectionApprovals?.map(x => {
      return {
        ...x,
        details: x.details ? {
          ...x.details,
          name: '',
          description: '',
        } : undefined,
      }
    })
  }
}

// Custom hook to fetch and convert a collection based on collectionIdNumber
export function useCollection(collectionIdNumber?: NumberType) {
  const str = collectionIdNumber !== undefined ? BigInt(collectionIdNumber).toString() : '';
  const _collection = useSelector((state: GlobalReduxState) => state.collections.collections[`${str}`]);

  // Replace all metadata with placeholder if marked as reported
  const collection = replaceWithPlaceholderIfReported(_collection);

  return collection;
}

export const initialState: CollectionReducerState = {
  collections: {},
};

//Export reusable dispatch functions
export const getCollection = (collectionId: DesiredNumberType) => {
  const collection = store.getState().collections.collections[`${collectionId}`];
  if (!collection) return undefined;
  return replaceWithPlaceholderIfReported(convertBitBadgesCollection(collection, BigIntify));
}

export const setCollection = (collection: Partial<BitBadgesCollection<DesiredNumberType> | { collectionPermissions?: Partial<CollectionPermissions<bigint>> }> & { collectionId: DesiredNumberType }) => {
  dispatch(setCollectionRedux(collection));
}

export const updateCollection = (newCollection: Partial<BitBadgesCollection<DesiredNumberType> | { collectionPermissions?: Partial<CollectionPermissionsWithDetails<bigint>> }> & { collectionId: DesiredNumberType }) => {
  dispatch(updateCollectionsRedux(newCollection, true));
}

export const updateCollectionAndFetchMetadataDirectly = async (newCollection: Partial<BitBadgesCollection<DesiredNumberType> | { collectionPermissions?: Partial<CollectionPermissions<bigint>> }> & { collectionId: DesiredNumberType }, fetchOptions: MetadataFetchOptions) => {
  setCollection(newCollection);

  await dispatch(fetchAndUpdateMetadataDirectlyFromCollectionRedux(newCollection.collectionId, fetchOptions));
}


export const fetchBalanceForUser = async (collectionId: DesiredNumberType, addressOrUsername: string, forceful?: boolean) => {
  const collection = getCollection(collectionId)
  if (!collection) throw new Error('Collection does not exist');

  const account = await getAccount(addressOrUsername);
  if (!account) throw new Error('Account does not exist');

  let res;
  if (forceful || collection.balancesType === "Off-Chain - Non-Indexed") {
    res = await getBadgeBalanceByAddress(collectionId, account.cosmosAddress);
    if (collection.balancesType === "Off-Chain - Non-Indexed") {
      return res.balance
    }
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

  updateAccount({
    ...account,
    collected: [...(account.collected || []), res.balance]
  });

  return res.balance;
}

export const fetchCollections = async (collectionsToFetch: DesiredNumberType[], forceful?: boolean) => {
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
  }), forceful);
}

export const fetchMetadataForPreview = async (existingCollectionId: DesiredNumberType | undefined, badgeIdsToDisplay: UintRange<bigint>[], performUpdate: boolean) => {
  await dispatch(fetchMetadataForPreviewRedux(existingCollectionId, deepCopy(badgeIdsToDisplay), performUpdate));

  const updatedState = store.getState().collections;
  return updatedState.collections[`${existingCollectionId}`]?.cachedBadgeMetadata ?? [];
}

export const fetchCollectionsWithOptions = async (collectionsToFetch: (
  { collectionId: DesiredNumberType }
  & GetMetadataForCollectionRequestBody
  & { forcefulFetchTrackers?: boolean }
  & GetAdditionalCollectionDetailsRequestBody)[], forceful?: boolean) => {
  if (collectionsToFetch.length === 0) return [];

  if (forceful) {
    for (const collectionToFetch of collectionsToFetch) {
      dispatch(deleteCollectionRedux(collectionToFetch.collectionId));
    }
  }
  //Could check here to see if it really needs a fetch as well but don't this
  await dispatch(fetchCollectionsRedux(collectionsToFetch));

  const updatedState = store.getState().collections;

  return collectionsToFetch.map(x => {
    return updatedState.collections[`${x.collectionId}`] as BitBadgesCollection<DesiredNumberType>;
  });
}

export async function triggerMetadataRefresh(collectionId: DesiredNumberType) {
  await refreshMetadata(collectionId);
}

export async function batchFetchAndUpdateMetadata(requests: { collectionId: DesiredNumberType, metadataToFetch: MetadataFetchOptions }[]) {
  await fetchCollectionsWithOptions(requests.map(x => {
    return {
      collectionId: x.collectionId,
      metadataToFetch: x.metadataToFetch,
      fetchTotalAndMintBalances: true,
      handleAllAndAppendDefaults: true,
      viewsToFetch: []
    }
  }));
}

export async function fetchAndUpdateMetadata(collectionId: DesiredNumberType, metadataToFetch: MetadataFetchOptions, fetchDirectly = false) {
  await dispatch(fetchAndUpdateMetadataRedux(collectionId, metadataToFetch, fetchDirectly));

  return store.getState().collections.collections[`${collectionId}`] as BitBadgesCollection<DesiredNumberType>;
}


export function viewHasMore(collectionId: DesiredNumberType, viewType: CollectionViewKey) {
  const collection = getCollection(collectionId);
  if (!collection) return true;

  return collection.views[viewType]?.pagination?.hasMore || true;
}

export async function fetchNextForCollectionViews(collectionId: DesiredNumberType, viewType: CollectionViewKey, viewId: string) {
  await fetchCollectionsWithOptions([{
    collectionId: collectionId,
    viewsToFetch: [viewId].map(x => {
      return {
        viewType: viewType,
        viewId: x,
        bookmark: getCollection(collectionId)?.views[x]?.pagination?.bookmark || ''
      }
    })
  }]);
}



//Note we use metadataId instead of _docId here. 
//This is okay because we will only be using views when metadataId is defined 
//(i.e. no need for a view with just editing the metadata in TxTimeline which has no metadataId)
export function getCollectionMetadataView(collection: BitBadgesCollection<bigint>, viewType: CollectionViewKey) {
  return (collection.views[viewType]?.ids.map(x => {
    return collection.cachedBadgeMetadata.find(y => y.metadataId && y.metadataId?.toString() === x);
  }) ?? []) as BadgeMetadataDetails<bigint>[];
}

export function getCollectionActivityView(collection: BitBadgesCollection<bigint>, viewType: CollectionViewKey) {
  return (collection.views[viewType]?.ids.map(x => {
    return collection.activity.find(y => y._docId === x);
  }) ?? []) as TransferActivityDoc<bigint>[]
}

export function getCollectionReviewsView(collection: BitBadgesCollection<bigint>, viewType: CollectionViewKey) {
  return (collection.views[viewType]?.ids.map(x => {
    return collection.reviews.find(y => y._docId === x);
  }) ?? []) as ReviewDoc<bigint>[];
}

export function getCollectionAnnouncementsView(collection: BitBadgesCollection<bigint>, viewType: CollectionViewKey) {
  return (collection.views[viewType]?.ids.map(x => {
    return collection.announcements.find(y => y._docId === x);
  }) ?? []) as AnnouncementDoc<bigint>[]
}

export function getCollectionBalancesView(collection: BitBadgesCollection<bigint>, viewType: CollectionViewKey) {
  return (collection.views[viewType]?.ids.map(x => {
    return collection.owners.find(y => y._docId === x);
  }) ?? []) as BalanceDoc<bigint>[]
}

export function getCollectionMerkleChallengeTrackersView(collection: BitBadgesCollection<bigint>, viewType: CollectionViewKey) {
  return (collection.views[viewType]?.ids.map(x => {
    return collection.merkleChallenges.find(y => y._docId === x);
  }) ?? []) as MerkleChallengeDoc<bigint>[]
}

export function getCollectionApprovalTrackersView(collection: BitBadgesCollection<bigint>, viewType: CollectionViewKey) {
  return (collection.views[viewType]?.ids.map(x => {
    return collection.approvalTrackers.find(y => y._docId === x);
  }) ?? []) as ApprovalTrackerDoc<bigint>[]
}

