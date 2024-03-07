import { AccountFetchDetails, BitBadgesUserInfo, GetAccountsRouteRequestBody, convertToCosmosAddress, isAddressValid } from 'bitbadgesjs-sdk';
import { ThunkAction } from 'redux-thunk';
import { AccountReducerState, AppDispatch, GlobalReduxState } from '../../../pages/_app';
import { DesiredNumberType, getAccounts } from '../../api';
import { initialState, reservedNames } from './AccountsContext';

interface UpdateAccountsReduxAction {
  type: typeof UPDATE_ACCOUNTS;
  payload: {
    userInfos: Array<BitBadgesUserInfo<DesiredNumberType>>;
    forcefulRefresh: boolean;
  };
}

const UPDATE_ACCOUNTS = 'UPDATE_ACCOUNTS';
const FETCH_ACCOUNTS_REQUEST = 'FETCH_ACCOUNTS_REQUEST';
const FETCH_ACCOUNTS_START = 'FETCH_ACCOUNTS_START';
const FETCH_ACCOUNTS_SUCCESS = 'FETCH_ACCOUNTS_SUCCESS';
const DELETE_ACCOUNTS = 'DELETE_ACCOUNTS';

interface FetchAccountsSuccessAction {
  type: typeof FETCH_ACCOUNTS_SUCCESS;
  payload: AccountFetchDetails[];
}

interface DeleteAccountsAction {
  type: typeof DELETE_ACCOUNTS;
  payload: string[];
}

interface FetchAccountsRequestAction {
  type: typeof FETCH_ACCOUNTS_REQUEST;
  payload: AccountFetchDetails[];
}

interface FetchAccountsStartAction {
  type: typeof FETCH_ACCOUNTS_START;
  payload: AccountFetchDetails[];
}

export type AccountsActionTypes =
  | FetchAccountsRequestAction
  | FetchAccountsStartAction
  | UpdateAccountsReduxAction
  | FetchAccountsSuccessAction
  | DeleteAccountsAction;

export const updateAccountsRedux = (
  userInfos: Array<BitBadgesUserInfo<DesiredNumberType>> = [],
  forcefulRefresh: boolean = false
): UpdateAccountsReduxAction => ({
  type: UPDATE_ACCOUNTS,
  payload: {
    userInfos,
    forcefulRefresh
  }
});

export const deleteAccountsRedux = (accountsToDelete: string[]): DeleteAccountsAction => ({
  type: DELETE_ACCOUNTS,
  payload: accountsToDelete
});

// Define your action creators
export const fetchAccountsRequest = (accountsToFetch: AccountFetchDetails[]): FetchAccountsRequestAction => ({
  type: FETCH_ACCOUNTS_REQUEST,
  payload: accountsToFetch
});

const getAccount = (state: AccountReducerState, addressOrUsername: string) => {
  if (reservedNames.includes(addressOrUsername))
    return new BitBadgesUserInfo({
      ...BitBadgesUserInfo.MintAccount(),
      address: addressOrUsername,
      cosmosAddress: addressOrUsername
    });

  let accountToReturn;
  const accounts = state.accounts;
  const cosmosAddressesByUsernames = state.cosmosAddressesByUsernames;

  if (isAddressValid(addressOrUsername)) {
    const cosmosAddress = convertToCosmosAddress(addressOrUsername);
    accountToReturn = accounts[cosmosAddress];
  } else {
    accountToReturn = accounts[cosmosAddressesByUsernames[addressOrUsername]];
  }
  return accountToReturn;
};

export const fetchAccountsRedux =
  (accountsToFetch: AccountFetchDetails[]): ThunkAction<void, GlobalReduxState, unknown, AccountsActionTypes> =>
  async (dispatch: AppDispatch, getState: () => GlobalReduxState) => {
    const state = getState().accounts;

    try {
      const batchRequestBody: GetAccountsRouteRequestBody = { accountsToFetch: [] };

      //Iterate through and see which accounts + info we actually need to fetch versus which we already have enough information for

      for (const accountToFetch of accountsToFetch) {
        const addressOrUsername = accountToFetch.address || accountToFetch.username || '';
        if (!addressOrUsername) continue;
        if (reservedNames.includes(addressOrUsername)) continue;
        const cachedAccount = getAccount(state, addressOrUsername);

        if (cachedAccount === undefined) {
          //If we don't have the account at all, fetch everything
          batchRequestBody.accountsToFetch.push(accountToFetch);
        } else {
          if (accountToFetch.address) accountToFetch.address = cachedAccount.address;
          if (accountToFetch.username) accountToFetch.username = cachedAccount.username;
          if (!cachedAccount.isRedundantRequest(accountToFetch)) {
            batchRequestBody.accountsToFetch.push(cachedAccount.pruneRequestBody(accountToFetch));
          }
        }
      }

      // Dispatch success action with fetched data
      if (batchRequestBody.accountsToFetch.length > 0) {
        const res = await getAccounts(batchRequestBody);
        console.log('ACCOUNTS RES', batchRequestBody, res);
        dispatch(updateAccountsRedux(res.accounts, false));
      }
    } catch (error: any) {
      console.log('failure', error);
    }

    return true;
  };

const updateAccounts = (state = initialState, userInfos: Array<BitBadgesUserInfo<DesiredNumberType>> = []) => {
  const accounts = state.accounts;
  const cosmosAddressesByUsernames = state.cosmosAddressesByUsernames;

  const accountsToReturn: Array<{
    account: BitBadgesUserInfo<DesiredNumberType>;
    needToCompare: boolean;
    ignore: boolean;
    cachedAccountCopy?: BitBadgesUserInfo<DesiredNumberType>;
  }> = [];
  for (const account of userInfos) {
    if (reservedNames.includes(account.cosmosAddress)) {
      accountsToReturn.push({
        account: new BitBadgesUserInfo({
          ...BitBadgesUserInfo.MintAccount(),
          address: account.cosmosAddress,
          cosmosAddress: account.cosmosAddress
        }),
        ignore: true,
        needToCompare: false
      });
      continue;
    }

    const accountInMap = accounts[account.cosmosAddress];
    const cachedAccount = accountInMap?.clone();
    if (cachedAccount == undefined) {
      accountsToReturn.push({
        account,
        needToCompare: false,
        ignore: false
      });
      continue;
    } else {
      const cachedAccountCopy = cachedAccount.clone();
      cachedAccount.updateWithNewResponse(account);

      accountsToReturn.push({
        account: cachedAccount,
        needToCompare: true,
        ignore: false,
        cachedAccountCopy
      });
    }
  }

  //Update the accounts map
  const newUpdates: typeof accounts = {};
  const newUsernameUpdates: Record<string, string> = {};
  for (const accountToReturn of accountsToReturn) {
    if (accountToReturn.ignore) continue;
    const account = accountToReturn.account;

    //If the account is reported, remove the readme and profile pic
    if (account?.reported && (account.readme || account?.profilePicUrl)) {
      account.readme = undefined;
      account.profilePicUrl = undefined;
    }

    //Only trigger a rerender if the account has changed or we have to
    if ((accountToReturn.needToCompare && !accountToReturn.account.equals(accountToReturn.cachedAccountCopy)) || !accountToReturn.needToCompare) {
      newUpdates[accountToReturn.account.cosmosAddress] = deepFreeze(accountToReturn.account);
      if (accountToReturn.account.username) {
        newUsernameUpdates[accountToReturn.account.username] = accountToReturn.account.cosmosAddress;
      }
    }
  }

  const newState: AccountReducerState = {
    ...state,
    accounts: { ...accounts, ...newUpdates },
    cosmosAddressesByUsernames: {
      ...cosmosAddressesByUsernames,
      ...newUsernameUpdates
    }
  };

  return newState;
};

export function deepFreeze<T>(obj: T): Readonly<T> {
  // Retrieve the property names defined on obj
  const propNames = Object.getOwnPropertyNames(obj) as Array<keyof T>;

  // Freeze properties before freezing self
  propNames.forEach((name) => {
    const prop = obj[name];

    // Freeze prop if it's an object
    if (typeof prop === 'object' && prop !== null && !Object.isFrozen(prop)) {
      deepFreeze(prop);
    }
  });

  // Freeze self
  return Object.freeze(obj);
}

export const accountReducer = (state = initialState, action: { type: string; payload: any }): AccountReducerState => {
  switch (action.type) {
    case 'UPDATE_ACCOUNTS':
      const userInfos = action.payload.userInfos as Array<BitBadgesUserInfo<DesiredNumberType>>;
      return updateAccounts(state, userInfos);
    case 'FETCH_ACCOUNTS_REQUEST':
      return { ...state };
    case 'DELETE_ACCOUNTS':
      const accounts = state.accounts;
      const cosmosAddressesByUsernames = state.cosmosAddressesByUsernames;
      const accountsToDelete = action.payload as string[];
      for (const accountToDelete of accountsToDelete) {
        const account = getAccount(state, accountToDelete);
        if (account) {
          delete accounts[account.cosmosAddress];
          if (account.username) {
            delete cosmosAddressesByUsernames[account.username];
          }
        }
      }
      return { ...state, accounts, cosmosAddressesByUsernames };
    default:
      return state;
  }
};
