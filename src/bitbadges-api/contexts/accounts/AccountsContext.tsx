import { NumberType, Stringify, UintRange } from 'bitbadgesjs-proto';
import { AccountViewKey, AddressMappingDoc, AnnouncementDoc, BalanceDoc, BigIntify, BitBadgesUserInfo, BlockinAuthSignatureDoc, ClaimAlertDoc, ListActivityDoc, MINT_ACCOUNT, ReviewDoc, TransferActivityDoc, UpdateAccountInfoRouteRequestBody, convertBitBadgesUserInfo, convertToCosmosAddress, isAddressValid } from 'bitbadgesjs-utils';
import { useSelector } from 'react-redux';
import { AccountReducerState, GlobalReduxState, dispatch, store } from '../../../pages/_app';
import { DesiredNumberType, updateAccountInfo } from '../../api';
import { deleteAccountsRedux, fetchAccountsRedux, updateAccountsRedux } from './reducer';

export const defaultAccount = convertBitBadgesUserInfo(MINT_ACCOUNT, Stringify)

export function useAccount(_addressOrUsername?: string) {
  const addressOrUsername = _addressOrUsername?.trim() || '';

  const cosmosAddress = reservedNames.includes(addressOrUsername) ? addressOrUsername :
    isAddressValid(addressOrUsername) ? convertToCosmosAddress(addressOrUsername) : '';

  const accountsKey = isAddressValid(addressOrUsername) || reservedNames.includes(addressOrUsername)
    ? cosmosAddress : store.getState().accounts.cosmosAddressesByUsernames[addressOrUsername];

  const accountToReturn = useSelector((state: GlobalReduxState) => state.accounts.accounts[accountsKey]);

  if (accountToReturn?.reported) {
    const filteredAccount: BitBadgesUserInfo<bigint> = {
      ...accountToReturn,
      readme: undefined,
      profilePicUrl: undefined,
    }

    return filteredAccount;
  }

  return accountToReturn;
}


export const initialState: AccountReducerState = {
  accounts: {
    'Mint': MINT_ACCOUNT, 
    'Total': MINT_ACCOUNT, 
    'All': {
      ...MINT_ACCOUNT,
      address: 'All',
      cosmosAddress: 'All',
    },
  },
  cosmosAddressesByUsernames: {},
};

export const reservedNames = ['Mint', 'Total', 'All'];

export const getAccount = (addressOrUsername: string, forcefulRefresh?: boolean) => {
  if (reservedNames.includes(addressOrUsername)) return { ...MINT_ACCOUNT, address: addressOrUsername, cosmosAddress: addressOrUsername };

  let accountToReturn;

  const state = store.getState();
  const accounts = state.accounts.accounts;
  const cosmosAddressesByUsernames = state.accounts.cosmosAddressesByUsernames;

  if (isAddressValid(addressOrUsername)) {
    const cosmosAddress = convertToCosmosAddress(addressOrUsername);
    if (forcefulRefresh) accountToReturn = undefined;
    else accountToReturn = accounts[cosmosAddress];
  } else {
    accountToReturn = accounts[cosmosAddressesByUsernames[addressOrUsername]];
  }
  return accountToReturn ? convertBitBadgesUserInfo(accountToReturn, BigIntify) : undefined;
}

export const updateAccounts = (userInfos: BitBadgesUserInfo<DesiredNumberType>[], forcefulRefresh?: boolean) => {
  dispatch(updateAccountsRedux(userInfos, forcefulRefresh));
}


export const updateAccount = (account: BitBadgesUserInfo<DesiredNumberType>, forcefulRefresh?: boolean) => {
  updateAccounts([account], forcefulRefresh)
}

//IMPORTANT: addressOrUsername must be the user's current signed in address or username, or else this will not work
export const updateProfileInfo = async (addressOrUsername: string, newProfileInfo: UpdateAccountInfoRouteRequestBody<bigint>) => {
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


export const fetchAccounts = async (addressesOrUsernames: string[], forcefulRefresh?: boolean) => {
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

export const fetchAccountsWithOptions = async (accountsToFetch: {
  address?: string,
  username?: string,
  fetchSequence?: boolean,
  fetchBalance?: boolean,
  viewsToFetch?: {
    viewId: string,
    viewType: AccountViewKey,
    filteredLists?: string[],
    filteredCollections?: {
      badgeIds: UintRange<NumberType>[];
      collectionId: NumberType;
    }[];
    bookmark: string
  }[],
  noExternalCalls?: boolean,
}[], forcefulRefresh?: boolean) => {
  if (accountsToFetch.length === 0) return;

  if (forcefulRefresh) {
    dispatch(deleteAccountsRedux(accountsToFetch.map(x => x.address || x.username) as string[]));
  }

  dispatch(fetchAccountsRedux(accountsToFetch));
}

export function viewHasMore(addressOrUsername: string, viewId: string) {
  const account = getAccount(addressOrUsername);
  if (!account) return true;

  return account.views[viewId]?.pagination?.hasMore || true;
}

export async function fetchNextForAccountViews(addressOrUsername: string, viewType: AccountViewKey, viewId: string, filteredCollections?: {
  collectionId: bigint,
  badgeIds: UintRange<bigint>[]
}[],
  filteredLists?: string[]) {

  await fetchAccountsWithOptions([{
    address: isAddressValid(addressOrUsername) ? addressOrUsername : undefined,
    username: isAddressValid(addressOrUsername) ? undefined : addressOrUsername,
    viewsToFetch: [viewId].map(x => {
      const currPagination = getAccount(addressOrUsername)?.views[x]?.pagination;

      if (!currPagination) return {
        viewId: viewId,
        viewType,
        bookmark: '',
        filteredCollections,
        filteredLists
      };

      else return {
        viewId: viewId,
        filteredLists,
        viewType,
        filteredCollections,
        bookmark: getAccount(addressOrUsername)?.views[viewId]?.pagination.hasMore ? getAccount(addressOrUsername)?.views[viewId]?.pagination?.bookmark || '' : 'nil'
      }
    })
  }]);
}

export function getAuthCodesView(account: BitBadgesUserInfo<bigint> | undefined, viewId: string) {
  if (!account) return [];

  return (account.views[viewId]?.ids.map(x => {
    return account.authCodes.find(y => y._legacyId === x);
  }) ?? []) as BlockinAuthSignatureDoc<bigint>[];
}


export function getAccountActivityView(account: BitBadgesUserInfo<bigint> | undefined, viewId: string) {
  if (!account) return [];

  return (account.views[viewId]?.ids.map(x => {
    return account.activity.find(y => y._legacyId === x);
  }) ?? []) as TransferActivityDoc<bigint>[];
}

export function getAccountListsActivityView(account: BitBadgesUserInfo<bigint> | undefined, viewId: string) {
  if (!account) return [];

  return (account.views[viewId]?.ids.map(x => {
    return account.listsActivity.find(y => y._legacyId === x);
  }) ?? []) as ListActivityDoc<bigint>[];
}


export function getAccountReviewsView(account: BitBadgesUserInfo<bigint> | undefined, viewId: string) {
  if (!account) return [];

  return (account.views[viewId]?.ids.map(x => {
    return account.reviews.find(y => y._legacyId === x);
  }) ?? []) as ReviewDoc<bigint>[];
}

export function getAccountAnnouncementsView(account: BitBadgesUserInfo<bigint> | undefined, viewId: string) {
  if (!account) return [];

  return (account.views[viewId]?.ids.map(x => {
    return account.announcements.find(y => y._legacyId === x);
  }) ?? []) as AnnouncementDoc<bigint>[];
}

export function getAccountBalancesView(account: BitBadgesUserInfo<bigint> | undefined, viewId: string) {
  if (!account) return [];

  return (account.views[viewId]?.ids.map(x => {
    return account.collected.find(y => y._legacyId === x)
  }) ?? []) as BalanceDoc<bigint>[];
}

export function getAccountAddressMappingsView(account: BitBadgesUserInfo<bigint> | undefined, viewId: string) {
  if (!account) return [];

  return (account.views[viewId]?.ids.map(x => {
    return account.addressMappings.find(y => y.mappingId === x);
  }) ?? []) as AddressMappingDoc<bigint>[];
}

export function getAccountClaimAlertsView(account: BitBadgesUserInfo<bigint> | undefined, viewId: string) {
  if (!account) return [];

  return (account.views[viewId]?.ids.map(x => {
    return account.claimAlerts.find(y => y._legacyId === x);
  }) ?? []) as ClaimAlertDoc<bigint>[];
}


export const incrementSequence = (addressOrUsername: string) => {
  const account = getAccount(addressOrUsername);
  if (account) {
    account.sequence = account.sequence ? account.sequence + 1n : 1n;
  } else {
    throw new Error(`Account ${addressOrUsername} not found`);
  }

  updateAccount(account);
}

export const setPublicKey = (addressOrUsername: string, publicKey: string) => {
  const account = getAccount(addressOrUsername);
  if (!account) {
    throw new Error(`Account ${addressOrUsername} not found`);
  }

  dispatch(updateAccountsRedux([{
    ...account,
    publicKey: publicKey
  }], false))
}
