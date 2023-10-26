import { CollectionPermissions } from "bitbadgesjs-proto";
import { BitBadgesCollection, DesiredNumberType } from "bitbadgesjs-utils";

export const updateCollectionsRedux = (newCollection: Partial<BitBadgesCollection<DesiredNumberType> | { collectionPermissions?: Partial<CollectionPermissions<bigint>> }> & { collectionId: DesiredNumberType }, onlyUpdateProvidedFields: boolean) => ({
  type: 'UPDATE_COLLECTIONS',
  payload: {
    newCollection,
    onlyUpdateProvidedFields
  }
});
