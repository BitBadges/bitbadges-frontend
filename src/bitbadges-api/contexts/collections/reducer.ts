import { deepCopy } from "bitbadgesjs-proto";
import { BitBadgesCollection, DesiredNumberType, updateBadgeMetadata } from "bitbadgesjs-utils";
import { compareObjects } from "../../../utils/compare";
import { CollectionReducerState, initialState } from "./CollectionsContext";

const updateCollection = (state = initialState, newCollection: BitBadgesCollection<DesiredNumberType>) => {
  const collections = state.collections;

  let cachedCollection = collections[`${newCollection.collectionId}`];

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

