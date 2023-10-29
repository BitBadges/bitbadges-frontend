/* eslint-disable react-hooks/exhaustive-deps */
import { Stringify } from 'bitbadgesjs-proto';
import { AccountViewKey, AddressMappingWithMetadata, AnnouncementInfo, BLANK_USER_INFO, BalanceInfo, BigIntify, BitBadgesUserInfo, ClaimAlertInfo, MINT_ACCOUNT, ReviewInfo, TransferActivityInfo, UpdateAccountInfoRouteRequestBody, convertBitBadgesUserInfo, convertToCosmosAddress, isAddressValid } from 'bitbadgesjs-utils';
import { createContext, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { GlobalReduxState } from '../../../pages/_app';
import { DesiredNumberType, getBadgeBalanceByAddress, updateAccountInfo } from '../../api';
import { updateAccountsRedux } from './actions';
import { AccountRequestParams, fetchAccountsRedux, fetchAccountsRequest } from './reducer';


export type AccountsContextType = {
  getAccount: (addressOrUsername: string) => Readonly<BitBadgesUserInfo<DesiredNumberType> | undefined>,
  updateAccount: (userInfo: BitBadgesUserInfo<DesiredNumberType>) => void,
  updateAccounts: (userInfos: BitBadgesUserInfo<DesiredNumberType>[]) => void,

  fetchAccounts: (addressesOrUsernames: string[], forcefulRefresh?: boolean) => Promise<void>,
  fetchAccountsWithOptions: (accountsToFetch: {
    address?: string,
    username?: string,
    fetchSequence?: boolean,
    fetchBalance?: boolean,
    viewsToFetch?: {
      viewKey: AccountViewKey,
      bookmark: string
    }[],
  }[], forcefulRefresh?: boolean) => Promise<void>,


  //Custom fetch functions (not paginated views)
  updateProfileInfo: (addressOrUsername: string, newProfileInfo: UpdateAccountInfoRouteRequestBody<DesiredNumberType>) => Promise<Readonly<BitBadgesUserInfo<DesiredNumberType>>>,
  fetchBalanceForUser: (collectionId: DesiredNumberType, addressOrUsername: string, forceful?: boolean) => Promise<Readonly<BalanceInfo<DesiredNumberType>>>,


  //Custom fetch functions (paginated views). This handles all pagination logic for you. Just pass in the viewKeys you want to fetch and it will fetch the next page for each of them.
  fetchNextForViews: (addressOrUsername: string, viewKeys: AccountViewKey[], fetchHidden?: boolean) => Promise<void>,

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
  fetchAccountsWithOptions: async () => { return },
  fetchAccounts: async () => { return },
  fetchNextForViews: async () => { return },
  fetchBalanceForUser: async () => {
    return {
      balances: [],
      incomingApprovals: [],
      outgoingApprovals: [],
      userPermissions: {
        canUpdateIncomingApprovals: [],
        canUpdateOutgoingApprovals: [],
        canUpdateAutoApproveSelfInitiatedIncomingTransfers: [],
        canUpdateAutoApproveSelfInitiatedOutgoingTransfers: [],
      },
      autoApproveSelfInitiatedIncomingTransfers: false,
      autoApproveSelfInitiatedOutgoingTransfers: false,
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

export interface AccountReducerState {
  accounts: Record<string, BitBadgesUserInfo<string> | undefined>;
  cosmosAddressesByUsernames: { [username: string]: string };
  loading: boolean;
  error: string | undefined;
  queue: AccountRequestParams[];

}
const defaultAccount = convertBitBadgesUserInfo(MINT_ACCOUNT, Stringify)

export const initialState: AccountReducerState = {
  accounts: { 'Mint': defaultAccount, 'Total': defaultAccount, 'All': defaultAccount, 'All Other': defaultAccount },
  cosmosAddressesByUsernames: {},
  loading: false,
  error: undefined,
  queue: [],
};

export const reservedNames = ['Mint', 'Total', 'All', 'All Other', '', ' '];

export const AccountsContextProvider: React.FC<Props> = ({ children }) => {
  const loading = useSelector((state: GlobalReduxState) => state.accounts.loading);
  const accounts = useSelector((state: GlobalReduxState) => state.accounts.accounts);
  const cosmosAddressesByUsernames = useSelector((state: GlobalReduxState) => state.accounts.cosmosAddressesByUsernames);
  const dispatch = useDispatch();

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
    return accountToReturn ? convertBitBadgesUserInfo(accountToReturn, BigIntify) : undefined;
  }

  const updateAccounts = (userInfos: BitBadgesUserInfo<DesiredNumberType>[], forcefulRefresh?: boolean) => {
    dispatch(updateAccountsRedux(userInfos, forcefulRefresh));
  }


  const updateAccount = (account: BitBadgesUserInfo<DesiredNumberType>, forcefulRefresh?: boolean) => {
    updateAccounts([account], forcefulRefresh)
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


  const fetchAccounts = async (addressesOrUsernames: string[]) => {
    return await fetchAccountsWithOptions(addressesOrUsernames.map(addressOrUsername => {
      return {
        address: isAddressValid(addressOrUsername) ? addressOrUsername : undefined,
        username: isAddressValid(addressOrUsername) ? undefined : addressOrUsername,
        fetchSequence: false,
        fetchBalance: false,
        viewsToFetch: []
      }
    }))
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
  }[]) => {
    dispatch(fetchAccountsRequest(accountsToFetch));
    dispatch(fetchAccountsRedux());
  }

  function viewHasMore(addressOrUsername: string, viewKey: AccountViewKey) {
    const account = getAccount(addressOrUsername);
    if (!account) return true;

    return account.views[viewKey]?.pagination?.hasMore || true;
  }

  async function fetchNextForViews(addressOrUsername: string, viewKeys: AccountViewKey[], fetchHidden?: boolean) {
    await fetchAccountsWithOptions([{
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
    if (!account) {
      throw new Error(`Account ${addressOrUsername} not found`);
    }

    dispatch(updateAccountsRedux([{
      ...account,
      publicKey: publicKey
    }], false))

    console.log(getAccount(addressOrUsername))
  }

  const accountsContext: AccountsContextType = {
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