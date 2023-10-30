import { BitBadgesCollection, DesiredNumberType, batchUpdateBadgeMetadata, convertBitBadgesCollection } from "bitbadgesjs-utils";
import { compareObjects } from "../../../utils/compare";
import { NEW_COLLECTION_ID } from "../TxTimelineContext";
import { CollectionReducerState, initialState } from "./CollectionsContext";
import { BigIntify, Stringify, deepCopy } from "bitbadgesjs-proto";

// const setCollection = (state = initialState, newCollection: BitBadgesCollection<DesiredNumberType>) => {
//   const collections = state.collections;
//   return { ...state, collections: { ...collections, [`${newCollection.collectionId}`]: newCollection } };
// }


const updateCollection = (state = initialState, newCollection: BitBadgesCollection<DesiredNumberType>, isUpdate: boolean) => {
  const collections = state.collections;
  const currCollectionState = collections[`${newCollection.collectionId}`];

  let cachedCollection = currCollectionState ? deepCopy(convertBitBadgesCollection(currCollectionState, BigIntify)) : undefined;

  const cachedCollectionCopy = deepCopy(cachedCollection);

  // console.log("newCollection", newCollection);


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

export const collectionReducer = (state = initialState, action: { type: string; payload: any }): CollectionReducerState => {
  switch (action.type) {
    case 'UPDATE_COLLECTIONS':
      const currCollection = state.collections[`${action.payload.newCollection.collectionId}`];
      const onlyUpdateProvidedFields = !!currCollection;

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
    default:
      return state;
  }
};

