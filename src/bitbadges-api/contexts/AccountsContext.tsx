/* eslint-disable react-hooks/exhaustive-deps */
import { AccountMap, AccountViewKey, AddressMappingWithMetadata, AnnouncementInfo, BLANK_USER_INFO, BalanceInfo, BitBadgesUserInfo, ClaimAlertInfo, GetAccountsRouteRequestBody, MINT_ACCOUNT, ReviewInfo, TransferActivityInfo, UpdateAccountInfoRouteRequestBody, convertToCosmosAddress, isAddressValid } from 'bitbadgesjs-utils';
import { createContext, useContext, useState } from 'react';
import { useCookies } from 'react-cookie';
import { DesiredNumberType, getAccounts, getBadgeBalanceByAddress, updateAccountInfo } from '../api';
import { deepCopy } from 'bitbadgesjs-proto';
import { compareObjects } from '../../utils/compare';

export type AccountsContextType = {
  accounts: AccountMap<DesiredNumberType>,
  getAccount: (addressOrUsername: string) => BitBadgesUserInfo<DesiredNumberType> | undefined,
  updateAccount: (userInfo: BitBadgesUserInfo<DesiredNumberType>) => BitBadgesUserInfo<DesiredNumberType>,
  updateAccounts: (userInfos: BitBadgesUserInfo<DesiredNumberType>[]) => BitBadgesUserInfo<DesiredNumberType>[],

  fetchAccounts: (addressesOrUsernames: string[], forcefulRefresh?: boolean) => Promise<BitBadgesUserInfo<DesiredNumberType>[]>,
  fetchAccountsWithOptions: (accountsToFetch: {
    address?: string,
    username?: string,
    fetchSequence?: boolean,
    fetchBalance?: boolean,
    viewsToFetch?: {
      viewKey: AccountViewKey,
      bookmark: string
    }[],
  }[], forcefulRefresh?: boolean) => Promise<BitBadgesUserInfo<DesiredNumberType>[]>,


  //Custom fetch functions (not paginated views)
  updateProfileInfo: (addressOrUsername: string, newProfileInfo: UpdateAccountInfoRouteRequestBody<DesiredNumberType>) => Promise<BitBadgesUserInfo<DesiredNumberType>>,
  fetchBalanceForUser: (collectionId: DesiredNumberType, addressOrUsername: string, forceful?: boolean) => Promise<BalanceInfo<DesiredNumberType>>,


  //Custom fetch functions (paginated views). This handles all pagination logic for you. Just pass in the viewKeys you want to fetch and it will fetch the next page for each of them.
  fetchNextForViews: (addressOrUsername: string, viewKeys: AccountViewKey[], fetchHidden?: boolean) => Promise<BitBadgesUserInfo<DesiredNumberType>>

  //Helper functions for views
  viewHasMore: (addressOrUsername: string, viewKey: AccountViewKey) => boolean,

  getActivityView: (addressOrUsername: string, viewKey: AccountViewKey) => TransferActivityInfo<DesiredNumberType>[],
  getAnnouncementsView: (addressOrUsername: string, viewKey: AccountViewKey) => AnnouncementInfo<DesiredNumberType>[],
  getReviewsView: (addressOrUsername: string, viewKey: AccountViewKey) => ReviewInfo<DesiredNumberType>[],
  getBalancesView: (addressOrUsername: string, viewKey: AccountViewKey) => BalanceInfo<DesiredNumberType>[],
  getAddressMappingsView: (addressOrUsername: string, viewKey: AccountViewKey) => AddressMappingWithMetadata<DesiredNumberType>[],
  getClaimAlertsView: (addressOrUsername: string, viewKey: AccountViewKey) => ClaimAlertInfo<DesiredNumberType>[],

  //Other helpers
  incrementSequence: (addressOrUsername: string) => void,
  setPublicKey: (addressOrUsername: string, publicKey: string) => void,
}

const AccountsContext = createContext<AccountsContextType>({
  accounts: {},
  fetchAccountsWithOptions: async () => { return [] },
  fetchAccounts: async () => { return [] },
  fetchNextForViews: async () => { return BLANK_USER_INFO },
  fetchBalanceForUser: async () => {
    return {
      balances: [],
      approvedIncomingTransfersTimeline: [],
      approvedOutgoingTransfersTimeline: [],
      userPermissions: {
        canUpdateApprovedIncomingTransfers: [],
        canUpdateApprovedOutgoingTransfers: [],
      },
      collectionId: -1n, onChain: false, cosmosAddress: '', _id: '',
      updateHistory: [],
    }
  },
  updateAccount: () => { return BLANK_USER_INFO },
  updateAccounts: () => { return [] },
  getAccount: () => BLANK_USER_INFO,
  incrementSequence: () => { },
  setPublicKey: () => { },
  getActivityView: () => [],
  getAnnouncementsView: () => [],
  getClaimAlertsView: () => [],
  getReviewsView: () => [],
  getBalancesView: () => [],
  getAddressMappingsView: () => [],
  viewHasMore: () => false,
  updateProfileInfo: async () => { return BLANK_USER_INFO },
});

type Props = {
  children?: React.ReactNode
};

export const AccountsContextProvider: React.FC<Props> = ({ children }) => {
  const [accounts, setAccountsMap] = useState<AccountMap<DesiredNumberType>>({ 'Mint': MINT_ACCOUNT, 'Total': MINT_ACCOUNT, 'All': MINT_ACCOUNT, 'All Other': MINT_ACCOUNT });
  const [cosmosAddressesByUsernames, setCosmosAddressesByUsernames] = useState<{ [username: string]: string }>({});
  const [cookies] = useCookies(['blockincookie', 'pub_key']);
  const reservedNames = ['Mint', 'Total', 'All', 'All Other', '', ' '];

  const getAccount = (addressOrUsername: string, forcefulRefresh?: boolean) => {
    if (reservedNames.includes(addressOrUsername)) return { ...MINT_ACCOUNT, address: addressOrUsername, cosmosAddress: addressOrUsername };

    let accountToReturn;

    if (isAddressValid(addressOrUsername)) {
      const cosmosAddress = convertToCosmosAddress(addressOrUsername);
      if (forcefulRefresh) accountToReturn = undefined;
      else accountToReturn = accounts[cosmosAddress];
    } else {
      accountToReturn = accounts[cosmosAddressesByUsernames[addressOrUsername]];
    }
    return accountToReturn;
  }

  const updateAccounts = (userInfos: BitBadgesUserInfo<DesiredNumberType>[], forcefulRefresh?: boolean) => {
    const accountsToReturn: { account: BitBadgesUserInfo<DesiredNumberType>, needToCompare: boolean, ignore: boolean, cachedAccountCopy?: BitBadgesUserInfo<DesiredNumberType> }[] = [];
    for (const account of userInfos) {
      if (reservedNames.includes(account.cosmosAddress)) {
        accountsToReturn.push({ account: { ...MINT_ACCOUNT, address: account.cosmosAddress, cosmosAddress: account.cosmosAddress }, ignore: true, needToCompare: false })
        continue;
      }

      if (forcefulRefresh) {
        accounts[account.cosmosAddress] = undefined;
      }


      let cachedAccount = accounts[`${account.cosmosAddress}`];
      if (cachedAccount == undefined) {
        accountsToReturn.push({ account, needToCompare: false, ignore: false });
        continue;
      } else {
        const cachedAccountCopy = deepCopy(cachedAccount);

        let publicKey = cachedAccount?.publicKey ? cachedAccount.publicKey : account.publicKey ? account.publicKey : '';
        //If we have stored the public key in cookies, use that instead (for Ethereum)
        if (cookies.pub_key && cookies.pub_key.split('-')[0] === account.address) {
          publicKey = cookies.pub_key.split('-')[1];
        }

        //Append all views to the existing views
        const newViews = cachedAccount?.views || {};
        for (const [key, val] of Object.entries(account.views)) {
          if (!val) continue;

          newViews[key] = {
            ids: [...new Set([...(newViews[key]?.ids || []), ...(val.ids || [])])],
            pagination: {
              ...val.pagination,
              total: val.pagination?.total || newViews[key]?.pagination?.total || undefined,
            },
            type: val.type
          }
        }

        //Merge the rest
        const newAccount = {
          ...cachedAccount,
          ...account,
          reviews: [...(cachedAccount?.reviews || []), ...(account.reviews || [])],
          collected: [...(cachedAccount?.collected || []), ...(account.collected || [])],
          activity: [...(cachedAccount?.activity || []), ...(account.activity || [])],
          announcements: [...(cachedAccount?.announcements || []), ...(account.announcements || [])],
          addressMappings: [...(cachedAccount?.addressMappings || []), ...(account.addressMappings || [])],
          claimAlerts: [...(cachedAccount?.claimAlerts || []), ...(account.claimAlerts || [])],
          views: newViews,
          publicKey,
          airdropped: account.airdropped ? account.airdropped : cachedAccount?.airdropped ? cachedAccount.airdropped : false,
          sequence: account && account.sequence !== undefined && account.sequence > 0n ? account.sequence : cachedAccount && cachedAccount.sequence !== undefined && cachedAccount.sequence > 0n ? cachedAccount.sequence : undefined,
          accountNumber: account && account.accountNumber !== undefined && account.accountNumber >= 0n ? account.accountNumber : cachedAccount && cachedAccount.accountNumber !== undefined && cachedAccount.accountNumber >= 0n ? cachedAccount.accountNumber : -1n,
          resolvedName: account.resolvedName ? account.resolvedName : cachedAccount?.resolvedName ? cachedAccount.resolvedName : "",
        };

        console.log(newAccount.collected);

        //Filter duplicates
        newAccount.reviews = newAccount.reviews.filter((x, index, self) => index === self.findIndex((t) => (t._id === x._id)))
        newAccount.collected = newAccount.collected.filter((x, index, self) => index === self.findIndex((t) => (t._id === x._id)))
        newAccount.activity = newAccount.activity.filter((x, index, self) => index === self.findIndex((t) => (t._id === x._id)))
        newAccount.announcements = newAccount.announcements.filter((x, index, self) => index === self.findIndex((t) => (t._id === x._id)))
        newAccount.addressMappings = newAccount.addressMappings.filter((x, index, self) => index === self.findIndex((t) => (t.mappingId === x.mappingId)))
        newAccount.claimAlerts = newAccount.claimAlerts.filter((x, index, self) => index === self.findIndex((t) => (t._id === x._id)))


        console.log(newAccount);
        accountsToReturn.push({ account: newAccount, needToCompare: true, ignore: false, cachedAccountCopy });
      }
    }

    //Update the accounts map
    const newUpdates: AccountMap<bigint> = {};
    const newUsernameUpdates: { [username: string]: string } = {};
    for (const accountToReturn of accountsToReturn) {
      if (accountToReturn.ignore) continue;
      //Only trigger a rerender if the account has changed or we haev to
      console.log(compareObjects(accountToReturn.account, accountToReturn.cachedAccountCopy));
      if ((accountToReturn.needToCompare && !compareObjects(accountToReturn.account, accountToReturn.cachedAccountCopy)) || !accountToReturn.needToCompare) {
        newUpdates[accountToReturn.account.cosmosAddress] = accountToReturn.account;
        if (accountToReturn.account.username) {
          newUsernameUpdates[accountToReturn.account.username] = accountToReturn.account.cosmosAddress;
        }
      }
    }

    if (Object.keys(newUpdates).length > 0) {
      console.log(newUpdates);
      setAccountsMap(accounts => {
        return {
          ...accounts,
          ...newUpdates
        }
      });
    }

    if (Object.keys(newUsernameUpdates).length > 0) {
      setCosmosAddressesByUsernames(cosmosAddressesByUsernames => {
        return {
          ...cosmosAddressesByUsernames,
          ...newUsernameUpdates
        }
      });
    }


    return accountsToReturn.map(x => x.account);
  }


  const updateAccount = (account: BitBadgesUserInfo<DesiredNumberType>, forcefulRefresh?: boolean) => {
    return updateAccounts([account], forcefulRefresh)[0];
  }

  //Note if you want to update balances both in collections and accounts, you should use fetchBalanceForUser in CollectionsContext
  //This is because the AccountsContext is accessible from CollectionsContext, but not vice versa
  const fetchBalanceForUser = async (collectionId: DesiredNumberType, addressOrUsername: string, forceful?: boolean) => {
    const account = getAccount(addressOrUsername);
    if (!account) throw new Error('Account does not exist');

    const address = convertToCosmosAddress(addressOrUsername);
    const currentBalance = account.collected.find(x => x.collectionId === collectionId);
    if (currentBalance && !forceful) return currentBalance;

    const res = await getBadgeBalanceByAddress(collectionId, address);
    updateAccount({
      ...account,
      collected: [...(account.collected || []), res.balance]
    });
    return res.balance;
  }

  //IMPORTANT: addressOrUsername must be the user's current signed in address or username, or else this will not work
  const updateProfileInfo = async (addressOrUsername: string, newProfileInfo: UpdateAccountInfoRouteRequestBody<bigint>) => {
    const account = getAccount(addressOrUsername);
    if (!account) throw new Error(`Account ${addressOrUsername} not found`);

    await updateAccountInfo(newProfileInfo);
    const newAccount: BitBadgesUserInfo<bigint> = {
      ...account,
      ...newProfileInfo,
      seenActivity: newProfileInfo.seenActivity ? BigInt(newProfileInfo.seenActivity) : account.seenActivity,
    };

    updateAccount(newAccount);
    return newAccount;
  }


  const fetchAccounts = async (addressesOrUsernames: string[], forcefulRefresh?: boolean) => {
    return await fetchAccountsWithOptions(addressesOrUsernames.map(addressOrUsername => {
      return {
        address: isAddressValid(addressOrUsername) ? addressOrUsername : undefined,
        username: isAddressValid(addressOrUsername) ? undefined : addressOrUsername,
        fetchSequence: false,
        fetchBalance: false,
        viewsToFetch: []
      }
    }), forcefulRefresh);
  }

  const fetchAccountsWithOptions = async (accountsToFetch: {
    address?: string,
    username?: string,
    fetchSequence?: boolean,
    fetchBalance?: boolean,
    fetchHidden?: boolean,
    viewsToFetch?: {
      viewKey: AccountViewKey,
      bookmark: string
    }[],
    noExternalCalls?: boolean,
  }[], forcefulRefresh?: boolean) => {


    const batchRequestBody: GetAccountsRouteRequestBody = {
      accountsToFetch: []
    };

    //Iterate through and see which accounts + info we actually need to fetch versus which we already have enough for
    for (const accountToFetch of accountsToFetch) {
      // if (accountToFetch.address) accountToFetch.address = convertToCosmosAddress(accountToFetch.address);
      accountToFetch.viewsToFetch = accountToFetch.viewsToFetch?.filter(x => x.bookmark != 'nil') || [];

      const cachedAccount = getAccount(accountToFetch.address || accountToFetch.username || '', forcefulRefresh);
      if (cachedAccount === undefined) {
        batchRequestBody.accountsToFetch.push({
          address: accountToFetch.address,
          username: accountToFetch.username,
          fetchSequence: accountToFetch.fetchSequence,
          fetchBalance: accountToFetch.fetchBalance,

          viewsToFetch: accountToFetch.viewsToFetch,
          noExternalCalls: accountToFetch.noExternalCalls,
        });
      } else {
        //Do not fetch views where hasMore is false
        accountToFetch.viewsToFetch = accountToFetch.viewsToFetch?.filter(x => {
          const currPagination = cachedAccount.views[x.viewKey]?.pagination;
          if (!currPagination) return true;
          else return currPagination.hasMore
        });

        //Check if we need to fetch anything
        const needToFetch =
          (accountToFetch.fetchSequence && cachedAccount.sequence === undefined) ||
          (accountToFetch.fetchBalance && cachedAccount.balance === undefined) ||
          (accountToFetch.viewsToFetch?.length) ||
          !cachedAccount.fetchedProfile

        if (needToFetch) {
          batchRequestBody.accountsToFetch.push({
            address: accountToFetch.address,
            username: accountToFetch.username,
            viewsToFetch: accountToFetch.viewsToFetch,
            fetchSequence: accountToFetch.fetchSequence,
            fetchBalance: accountToFetch.fetchBalance,
            noExternalCalls: accountToFetch.noExternalCalls,
          });
        }
      }
    }

    if (batchRequestBody.accountsToFetch.length === 0) {
      //If we get here, we have already fetched and cached all the accounts we need. 
      //Now we just need to return them in the same order as the input.
      //Note that we implement this by using our accounts map and not getAccount because there is no guarantee that the state is updated yet
      const accountsToReturn: BitBadgesUserInfo<DesiredNumberType>[] = [];
      for (const account of accountsToFetch) {
        if (account.address) {
          const cachedAccount = accounts[convertToCosmosAddress(account.address)];
          accountsToReturn.push(cachedAccount ? cachedAccount : BLANK_USER_INFO); //Should never return BLANK_USER_INFO here
        } else {
          const cachedAccount = accounts[cosmosAddressesByUsernames[account.username || '']];
          accountsToReturn.push(cachedAccount ? cachedAccount : BLANK_USER_INFO); //Should never return BLANK_USER_INFO here
        }
      }

      return accountsToReturn;
    }

    const res = await getAccounts(batchRequestBody);

    const accountsToReturn: BitBadgesUserInfo<DesiredNumberType>[] = [];
    for (const account of res.accounts) {
      updateAccount(account, forcefulRefresh);
      accountsToReturn.push(account);
    }

    for (const account of accountsToFetch) {
      const fetchedAccount = getAccount(account.address || account.username || '', forcefulRefresh);
      if (accountsToReturn.find(x => x.cosmosAddress === fetchedAccount?.cosmosAddress)) continue;
      else {
        accountsToReturn.push(fetchedAccount ? fetchedAccount : BLANK_USER_INFO); //Should never return BLANK_USER_INFO here
      }
    }

    return accountsToReturn;
  }

  function viewHasMore(addressOrUsername: string, viewKey: AccountViewKey) {
    const account = getAccount(addressOrUsername);
    if (!account) return true;

    return account.views[viewKey]?.pagination?.hasMore || true;
  }

  async function fetchNextForViews(addressOrUsername: string, viewKeys: AccountViewKey[], fetchHidden?: boolean) {
    const accounts = await fetchAccountsWithOptions([{
      address: isAddressValid(addressOrUsername) ? addressOrUsername : undefined,
      username: isAddressValid(addressOrUsername) ? undefined : addressOrUsername,
      fetchHidden,
      viewsToFetch: viewKeys.map(x => {
        const currPagination = getAccount(addressOrUsername)?.views[x]?.pagination;
        if (!currPagination) return {
          viewKey: x,
          bookmark: ''
        };
        else return {
          viewKey: x,
          bookmark: getAccount(addressOrUsername)?.views[x]?.pagination.hasMore ? getAccount(addressOrUsername)?.views[x]?.pagination?.bookmark || '' : 'nil'
        }
      })
    }]);

    return accounts[0];
  }

  function getActivityView(addressOrUsername: string, viewKey: AccountViewKey) {
    const account = getAccount(addressOrUsername);
    if (!account) return [];

    return account.views[viewKey]?.ids.map(x => {
      return account.activity.find(y => y._id === x);
    }) as TransferActivityInfo<DesiredNumberType>[];
  }

  function getReviewsView(addressOrUsername: string, viewKey: AccountViewKey) {
    const account = getAccount(addressOrUsername);
    if (!account) return [];

    return account.views[viewKey]?.ids.map(x => {
      return account.reviews.find(y => y._id === x);
    }) as ReviewInfo<DesiredNumberType>[];
  }

  function getAnnouncementsView(addressOrUsername: string, viewKey: AccountViewKey) {
    const account = getAccount(addressOrUsername);
    if (!account) return [];

    return account.views[viewKey]?.ids.map(x => {
      return account.announcements.find(y => y._id === x);
    }) as AnnouncementInfo<DesiredNumberType>[];
  }

  function getBalancesView(addressOrUsername: string, viewKey: AccountViewKey) {
    const account = getAccount(addressOrUsername);
    if (!account) return [];

    return account.views[viewKey]?.ids.map(x => {
      return account.collected.find(y => y._id === x);
    }) as BalanceInfo<DesiredNumberType>[];
  }

  function getAddressMappingsView(addressOrUsername: string, viewKey: AccountViewKey) {
    const account = getAccount(addressOrUsername);
    if (!account) return [];

    return account.views[viewKey]?.ids.map(x => {
      return account.addressMappings.find(y => y.mappingId === x);
    }) as AddressMappingWithMetadata<DesiredNumberType>[];
  }

  function getClaimAlertsView(addressOrUsername: string, viewKey: AccountViewKey) {
    const account = getAccount(addressOrUsername);
    if (!account) return [];

    return account.views[viewKey]?.ids.map(x => {
      return account.claimAlerts.find(y => y._id === x);
    }) as ClaimAlertInfo<DesiredNumberType>[];
  }


  const incrementSequence = (addressOrUsername: string) => {
    const account = getAccount(addressOrUsername);
    if (account) {
      account.sequence = account.sequence ? account.sequence + 1n : 1n;
    } else {
      throw new Error(`Account ${addressOrUsername} not found`);
    }

    updateAccount(account);
  }

  const setPublicKey = (addressOrUsername: string, publicKey: string) => {
    const account = getAccount(addressOrUsername);
    if (account) {
      account.publicKey = publicKey;
    } else {
      throw new Error(`Account ${addressOrUsername} not found`);
    }

    setAccountsMap(accounts);
  }

  const accountsContext: AccountsContextType = {
    accounts,
    fetchAccountsWithOptions,
    fetchAccounts,
    fetchBalanceForUser,
    updateAccount,
    updateAccounts,
    fetchNextForViews,
    getAccount,
    incrementSequence,
    setPublicKey,
    getReviewsView,
    getActivityView,
    getClaimAlertsView,
    getBalancesView,
    getAnnouncementsView,
    getAddressMappingsView,
    viewHasMore,
    updateProfileInfo,
  };

  return <AccountsContext.Provider value={accountsContext}>
    {children}
  </AccountsContext.Provider>;
}


export const useAccountsContext = () => useContext(AccountsContext);