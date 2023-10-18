import { BadgeMetadataDetails, BitBadgesCollection, DesiredNumberType, removeUintRangeFromUintRange, sortUintRangesAndMergeIfNecessary } from "bitbadgesjs-utils";
import { SHA256 } from "crypto-js";
import { compareObjects } from "../../../utils/compare";
import { MSG_PREVIEW_ID } from "../TxTimelineContext";
import { CollectionReducerState, initialState } from "./CollectionsContext";

export function deepCopy<T>(obj: T): T {
  return deepCopyWithBigInts(obj);
}

function deepCopyWithBigInts<T>(obj: T): T {
  if (typeof obj !== 'object' || obj === null) {
    // Base case: return primitive values as-is
    return obj;
  }

  if (typeof obj === 'bigint') {
    return BigInt(obj) as unknown as T;
  }

  if (Array.isArray(obj)) {
    // Create a deep copy of an array
    return obj.map((item) => deepCopyWithBigInts(item)) as unknown as T;
  }

  const copiedObj: Record<string, any> = {};

  // Deep copy each property of the object
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      copiedObj[key] = deepCopyWithBigInts(obj[key]);
    }
  }

  return copiedObj as unknown as T;
}


const batchUpdateBadgeMetadata = (currBadgeMetadata: BadgeMetadataDetails<bigint>[], newBadgeMetadataDetailsArr: BadgeMetadataDetails<bigint>[]) => {

  const allBadgeIds = sortUintRangesAndMergeIfNecessary(deepCopy(newBadgeMetadataDetailsArr.map(x => x.badgeIds).flat()))



  for (let i = 0; i < currBadgeMetadata.length; i++) {
    const val = currBadgeMetadata[i];
    if (!val) continue; //For TS
    const [remaining, _] = removeUintRangeFromUintRange(allBadgeIds, val.badgeIds);
    val.badgeIds = remaining;
  }

  currBadgeMetadata = currBadgeMetadata.filter((val) => val && val.badgeIds.length > 0);


  const hashTable = new Map<string, number>();
  for (let i = 0; i < currBadgeMetadata.length; i++) {
    const metadataDetails = currBadgeMetadata[i];
    const hashedMetadata = SHA256(JSON.stringify(metadataDetails.metadata)).toString();
    hashTable.set(hashedMetadata, i);
  }


  for (const newBadgeMetadataDetails of newBadgeMetadataDetailsArr) {
    let currentMetadata = newBadgeMetadataDetails.metadata;
    for (const badgeUintRange of newBadgeMetadataDetails.badgeIds) {

      const startBadgeId = badgeUintRange.start;
      const endBadgeId = badgeUintRange.end;

      //If the metadata we are updating is already in the array (with matching uri and id), we can just insert the badge IDs
      let currBadgeMetadataExists = false;
      const idx = hashTable.get(SHA256(JSON.stringify(currentMetadata)).toString());
      if (idx) {
        const val = currBadgeMetadata[idx];
        if (!val) continue; //For TS

        if (val.uri === newBadgeMetadataDetails.uri && val.metadataId === newBadgeMetadataDetails.metadataId && val.customData === newBadgeMetadataDetails.customData && val.toUpdate === newBadgeMetadataDetails.toUpdate && compareObjects(val.metadata, currentMetadata)) {
          currBadgeMetadataExists = true;
          if (val.badgeIds.length > 0) {
            val.badgeIds = [...val.badgeIds, { start: startBadgeId, end: endBadgeId }];
            val.badgeIds = sortUintRangesAndMergeIfNecessary(val.badgeIds);
          } else {
            val.badgeIds = [{ start: startBadgeId, end: endBadgeId }];
          }
        }
      }

      //Recreate the array with the updated badge IDs
      //If some metadata object no longer has any corresponding badge IDs, we can remove it from the array

      //If we did not find the metadata in the array and metadata !== undefined, we need to add it
      if (!currBadgeMetadataExists) {
        currBadgeMetadata.push({
          metadata: { ...currentMetadata },
          badgeIds: [{
            start: startBadgeId,
            end: endBadgeId,
          }],
          uri: newBadgeMetadataDetails.uri,
          metadataId: newBadgeMetadataDetails.metadataId,
          customData: newBadgeMetadataDetails.customData,
          toUpdate: newBadgeMetadataDetails.toUpdate,
        })

        const hashedMetadata = SHA256(JSON.stringify(newBadgeMetadataDetails.metadata)).toString();
        hashTable.set(hashedMetadata, currBadgeMetadata.length - 1);
      }
    }
  }

  currBadgeMetadata = currBadgeMetadata.filter((val) => val && val.badgeIds.length > 0);
  return currBadgeMetadata;
}

const updateCollection = (state = initialState, newCollection: BitBadgesCollection<DesiredNumberType>) => {
  const collections = state.collections;

  let cachedCollection = collections[`${newCollection.collectionId}`];

  const cachedCollectionCopy = deepCopy(cachedCollection);

  if (cachedCollection) {

    //TODO: No idea why the deep copy is necessary but it breaks the timeline batch updates for existing collections if not
    //      One place to look: somehow, I think that the indivudal elements in .badgeIds are the same object (cached[0].badgeIds === new[0].badgeIds)
    //      I think the cachedCollection deepCopy is the important one, but I'm not sure
    let newBadgeMetadata = batchUpdateBadgeMetadata(deepCopy(cachedCollection.cachedBadgeMetadata), deepCopy(newCollection.cachedBadgeMetadata));
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

    if (cachedCollection.collectionId === MSG_PREVIEW_ID) {
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

    //Only update if anything has changed
    if (!compareObjects(cachedCollectionCopy, cachedCollection)) {
      return { ...state, collections: { ...collections, [`${newCollection.collectionId}`]: cachedCollection } };
    }

    return state;
  } else {
    return { ...state, collections: { ...collections, [`${newCollection.collectionId}`]: newCollection } };
  }
}

export const collectionReducer = (state = initialState, action: { type: string; payload: any }): CollectionReducerState => {
  switch (action.type) {
    case 'UPDATE_COLLECTIONS':
      const newCollection = action.payload.newCollection as BitBadgesCollection<DesiredNumberType>;
      return updateCollection(state, newCollection);
    default:
      return state;
  }
};

