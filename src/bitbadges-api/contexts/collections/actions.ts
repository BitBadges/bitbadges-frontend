import { BitBadgesCollection, DesiredNumberType, GetAdditionalCollectionDetailsRequestBody, GetMetadataForCollectionRequestBody } from "bitbadgesjs-utils";

export const updateCollectionsRedux = (newCollection: BitBadgesCollection<DesiredNumberType>) => ({
  type: 'UPDATE_COLLECTIONS',
  payload: {
    newCollection
  }
});

export const fetchCollectionsRedux = (collectionsToFetch: (
  { collectionId: DesiredNumberType }
  & GetMetadataForCollectionRequestBody
  & { forcefulFetchTrackers?: boolean }
  & GetAdditionalCollectionDetailsRequestBody)[], forcefulRefresh?: boolean) => ({
    type: 'FETCH_COLLECTIONS',
    payload: {
      collectionsToFetch,
      forcefulRefresh
    }
  });