import { CollectionPermissions } from "bitbadgesjs-proto";
import { BitBadgesCollection, DesiredNumberType, GetAdditionalCollectionDetailsRequestBody, GetMetadataForCollectionRequestBody } from "bitbadgesjs-utils";

export const updateCollectionsRedux = (newCollection: Partial<BitBadgesCollection<DesiredNumberType> | { collectionPermissions?: Partial<CollectionPermissions<bigint>> }> & { collectionId: DesiredNumberType }, onlyUpdateProvidedFields: boolean) => ({
  type: 'UPDATE_COLLECTIONS',
  payload: {
    newCollection,
    onlyUpdateProvidedFields
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
