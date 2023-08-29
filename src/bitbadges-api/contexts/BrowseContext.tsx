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

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: browse page, get collections ');
    async function getCollections() {
      const browseInfo = await getBrowseCollections();
      if (!browseInfo) return;
      const updatedIds: bigint[] = [];
      for (const category of Object.keys(browseInfo.collections)) {
        if (!browseInfo.collections[category]) continue;
        console.log(browseInfo.collections[category]);
        for (const collection of browseInfo.collections[category]) {
          console.log(collection);
          if (updatedIds.includes(collection.collectionId)) continue;
          collections.updateCollection(collection);
          updatedIds.push(collection.collectionId);
        }
      }

      const updatedAccounts: string[] = [];
      for (const category of Object.keys(browseInfo.profiles)) {
        if (!browseInfo.profiles[category]) continue;
        console.log(browseInfo.profiles[category]);
        for (const profile of browseInfo.profiles[category]) {

          if (updatedAccounts.includes(profile.cosmosAddress)) continue;
          accounts.updateAccount({
            ...profile,
          });

          updatedAccounts.push(profile.cosmosAddress);
        }
      }
      setBrowse(browseInfo);
    }
    getCollections();
  }, []);

  const updateBrowse = async () => {
    const browseInfo = await getBrowseCollections();
    if (!browseInfo) return undefined;
    setBrowse(browseInfo);
    const updatedIds: bigint[] = [];
    for (const category of Object.keys(browseInfo.collections)) {
      if (!browseInfo.collections[category]) continue;
      for (const collection of browseInfo.collections[category]) {
        console.log(collection);
        if (updatedIds.includes(collection.collectionId)) continue;
        collections.updateCollection(collection);
        updatedIds.push(collection.collectionId);
      }
    }

    const updatedAccounts: string[] = [];
    for (const category of Object.keys(browseInfo.profiles)) {
      if (!browseInfo.collections[category]) continue;
      console.log(browseInfo.collections[category]);
      for (const profile of browseInfo.profiles[category]) {

        if (updatedAccounts.includes(profile.cosmosAddress)) continue;
        accounts.updateAccount({
          ...profile,
        });

        updatedAccounts.push(profile.cosmosAddress);
      }
    }
    setBrowse(browseInfo);
    return browseInfo;
  }

  const browseContext: BrowseContextType = {
    browse,
    updateBrowse
  };

  return <BrowseContext.Provider value={browseContext}>
    {children}
  </BrowseContext.Provider>;
}

export const useBrowseContext = () => useContext(BrowseContext);