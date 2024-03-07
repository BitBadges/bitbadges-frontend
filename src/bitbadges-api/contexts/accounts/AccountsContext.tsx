import {
  AccountFetchDetails,
  AccountViewKey,
  BigIntify,
  BitBadgesUserInfo,
  NumberType,
  UpdateAccountInfoRouteRequestBody,
  convertToCosmosAddress,
  iBatchBadgeDetails,
  isAddressValid
} from 'bitbadgesjs-sdk';
import { useSelector } from 'react-redux';
import { AccountReducerState, GlobalReduxState, dispatch, store } from '../../../pages/_app';
import { DesiredNumberType, updateAccountInfo } from '../../api';
import { deleteAccountsRedux, fetchAccountsRedux, updateAccountsRedux } from './reducer';

export function useAccount(addressOrUsername = '') {
  addressOrUsername = addressOrUsername.trim();

  const key = reservedNames.includes(addressOrUsername)
    ? addressOrUsername
    : isAddressValid(addressOrUsername)
      ? convertToCosmosAddress(addressOrUsername)
      : store.getState().accounts.cosmosAddressesByUsernames[addressOrUsername];
  const accountToReturn = useSelector((state: GlobalReduxState) => state.accounts.accounts[key]);
  return accountToReturn;
}

export const reservedNames = ['Mint', 'Total', 'All'];

export const initialState: AccountReducerState = {
  accounts: {
    Mint: BitBadgesUserInfo.MintAccount(),
    Total: new BitBadgesUserInfo({
      ...BitBadgesUserInfo.MintAccount(),
      address: 'Total',
      cosmosAddress: 'Total'
    }),
    All: new BitBadgesUserInfo({
      ...BitBadgesUserInfo.MintAccount(),
      address: 'All',
      cosmosAddress: 'All'
    })
  },
  cosmosAddressesByUsernames: {}
};

export const getAccount = (addressOrUsername: string, forcefulRefresh?: boolean) => {
  const key = reservedNames.includes(addressOrUsername)
    ? addressOrUsername
    : isAddressValid(addressOrUsername)
      ? convertToCosmosAddress(addressOrUsername)
      : store.getState().accounts.cosmosAddressesByUsernames[addressOrUsername];
  const accountToReturn = store.getState().accounts.accounts[key];
  if (forcefulRefresh) return undefined;
  return accountToReturn;
};

export const updateAccounts = (userInfos: Array<BitBadgesUserInfo<DesiredNumberType>>, forcefulRefresh?: boolean) => {
  if (forcefulRefresh) {
    dispatch(deleteAccountsRedux(userInfos.map((x) => x.address || x.username) as string[]));
  }

  dispatch(updateAccountsRedux(userInfos, forcefulRefresh));
};

export const updateAccount = (account: BitBadgesUserInfo<DesiredNumberType>, forcefulRefresh?: boolean) => {
  updateAccounts([account], forcefulRefresh);
};

//IMPORTANT: addressOrUsername must be the user's current signed in address or username, or else this will not work
export const updateProfileInfo = async (addressOrUsername: string, newProfileInfo: UpdateAccountInfoRouteRequestBody) => {
  const account = getAccount(addressOrUsername);
  if (!account) throw new Error(`Account ${addressOrUsername} not found`);

  await updateAccountInfo(newProfileInfo);
  const newAccount = new BitBadgesUserInfo<NumberType>({
    ...account,
    ...newProfileInfo,
    seenActivity: newProfileInfo.seenActivity ? BigInt(newProfileInfo.seenActivity) : account.seenActivity
  }).convert(BigIntify);

  updateAccount(newAccount);
  return newAccount;
};

export const fetchAccounts = async (addressesOrUsernames: string[], forcefulRefresh?: boolean) => {
  await fetchAccountsWithOptions(
    addressesOrUsernames.map((addressOrUsername) => {
      return {
        address: isAddressValid(addressOrUsername) ? addressOrUsername : undefined,
        username: isAddressValid(addressOrUsername) ? undefined : addressOrUsername,
        fetchSequence: false,
        fetchBalance: false,
        viewsToFetch: []
      };
    }),
    forcefulRefresh
  );
};

export const fetchAccountsWithOptions = async (accountsToFetch: AccountFetchDetails[], forcefulRefresh?: boolean) => {
  if (accountsToFetch.length === 0) return;

  if (forcefulRefresh) {
    dispatch(deleteAccountsRedux(accountsToFetch.map((x) => x.address || x.username) as string[]));
  }

  dispatch(fetchAccountsRedux(accountsToFetch));
};

export async function fetchNextForAccountViews(
  addressOrUsername: string,
  viewType: AccountViewKey,
  viewId: string,
  specificCollections?: Array<iBatchBadgeDetails<NumberType>>,
  specificLists?: string[],
  oldestFirst?: boolean
) {
  const account = getAccount(addressOrUsername);
  if (!account?.viewHasMore(viewId)) return;

  await fetchAccountsWithOptions([
    {
      address: isAddressValid(addressOrUsername) ? addressOrUsername : undefined,
      username: isAddressValid(addressOrUsername) ? undefined : addressOrUsername,
      viewsToFetch: [
        {
          viewId: viewId,
          specificLists,
          viewType,
          specificCollections,
          oldestFirst,
          bookmark: account?.getViewBookmark(viewId) ?? ''
        }
      ]
    }
  ]);
}

export const setPublicKey = (addressOrUsername: string, publicKey: string) => {
  const account = getAccount(addressOrUsername);

  if (account) {
    const newAccount = account.clone();
    newAccount.publicKey = publicKey;
    updateAccount(newAccount);
  } else {
    throw new Error(`Account ${addressOrUsername} not found`);
  }
};
