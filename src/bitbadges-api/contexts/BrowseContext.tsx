import { GetBrowseCollectionsRouteSuccessResponse } from 'bitbadgesjs-sdk';
import { createContext, useContext, useState } from 'react';
import { DesiredNumberType, getBrowseCollections } from '../api';
import { updateAccount } from './accounts/AccountsContext';
import { updateCollection } from './collections/CollectionsContext';

export interface BrowseContextType {
  browse: GetBrowseCollectionsRouteSuccessResponse<DesiredNumberType> | undefined;
  updateBrowse: () => Promise<GetBrowseCollectionsRouteSuccessResponse<DesiredNumberType> | undefined>;
}

const BrowseContext = createContext<BrowseContextType>({
  browse: undefined,
  updateBrowse: async () => {
    return undefined;
  }
});

interface Props {
  children?: React.ReactNode;
}

export const BrowseContextProvider: React.FC<Props> = ({ children }) => {
  const [browse, setBrowse] = useState<GetBrowseCollectionsRouteSuccessResponse<DesiredNumberType>>();

  async function updateCollectionsAndAccounts(browseInfo: GetBrowseCollectionsRouteSuccessResponse<DesiredNumberType>) {
    const updatedIds = new Set<bigint>();
    const updatedAccounts = new Set<string>();

    for (const category of Object.keys(browseInfo.collections)) {
      if (!browseInfo.collections[category]) continue;

      for (const collection of browseInfo.collections[category]) {
        if (!updatedIds.has(collection.collectionId)) {
          updateCollection(collection);
          updatedIds.add(collection.collectionId);
        }
      }
    }

    for (const category of Object.keys(browseInfo.profiles)) {
      if (!browseInfo.profiles[category]) continue;

      for (const profile of browseInfo.profiles[category]) {
        if (!updatedAccounts.has(profile.cosmosAddress)) {
          updateAccount(profile);
          updatedAccounts.add(profile.cosmosAddress);
        }
      }
    }
  }

  async function getCollectionsAndUpdateBrowse() {
    const browseInfo = await getBrowseCollections();

    await updateCollectionsAndAccounts(browseInfo);
    setBrowse(browseInfo);

    return browseInfo;
  }

  const updateBrowse = async () => {
    const browseInfo = await getCollectionsAndUpdateBrowse();
    return browseInfo;
  };

  const browseContext: BrowseContextType = {
    browse,
    updateBrowse
  };

  return <BrowseContext.Provider value={browseContext}>{children}</BrowseContext.Provider>;
};

export const useBrowseContext = () => useContext(BrowseContext);
