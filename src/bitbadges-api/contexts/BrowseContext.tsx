/* eslint-disable react-hooks/exhaustive-deps */
import { GetBrowseCollectionsRouteSuccessResponse } from 'bitbadgesjs-utils';
import { createContext, useContext, useEffect, useState } from 'react';
import { INFINITE_LOOP_MODE } from '../../constants';
import { DesiredNumberType, getBrowseCollections } from '../api';
import { useCollectionsContext } from './CollectionsContext';
import { useAccountsContext } from './AccountsContext';

export type BrowseContextType = {
  browse: GetBrowseCollectionsRouteSuccessResponse<DesiredNumberType> | undefined,
  updateBrowse: () => Promise<GetBrowseCollectionsRouteSuccessResponse<DesiredNumberType> | undefined>
}

const BrowseContext = createContext<BrowseContextType>({
  browse: undefined,
  updateBrowse: async () => {
    return undefined;
  }
});

type Props = {
  children?: React.ReactNode
};

export const BrowseContextProvider: React.FC<Props> = ({ children }) => {
  const [browse, setBrowse] = useState<GetBrowseCollectionsRouteSuccessResponse<DesiredNumberType>>();
  const collections = useCollectionsContext();
  const accounts = useAccountsContext();

  async function updateCollectionsAndAccounts(browseInfo: GetBrowseCollectionsRouteSuccessResponse<DesiredNumberType>) {
    const updatedIds = new Set();
    const updatedAccounts = new Set();

    for (const category of Object.keys(browseInfo.collections)) {
      if (!browseInfo.collections[category]) continue;

      for (const collection of browseInfo.collections[category]) {
        if (!updatedIds.has(collection.collectionId)) {
          collections.updateCollection(collection);
          updatedIds.add(collection.collectionId);
        }
      }
    }

    console.log('browseInfo.profiles: ', browseInfo.profiles);
    for (const category of Object.keys(browseInfo.profiles)) {
      if (!browseInfo.profiles[category]) continue;

      for (const profile of browseInfo.profiles[category]) {
        if (!updatedAccounts.has(profile.cosmosAddress)) {
          accounts.updateAccount({
            ...profile,
          });
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

  useEffect(() => {
    if (INFINITE_LOOP_MODE) {
      console.log('useEffect: browse page, get collections');
    }
    getCollectionsAndUpdateBrowse();
  }, []);


  const updateBrowse = async () => {
    const browseInfo = await getCollectionsAndUpdateBrowse();
    return browseInfo;
  };

  const browseContext: BrowseContextType = {
    browse,
    updateBrowse
  };

  return <BrowseContext.Provider value={browseContext}>
    {children}
  </BrowseContext.Provider>;
}

export const useBrowseContext = () => useContext(BrowseContext);