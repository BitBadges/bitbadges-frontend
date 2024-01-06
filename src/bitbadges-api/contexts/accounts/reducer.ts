import { deepCopy } from 'bitbadgesjs-proto';
import {
  AccountFetchDetails,
  AccountMap,
  BigIntify,
  BitBadgesUserInfo,
  GetAccountsRouteRequestBody,
  MINT_ACCOUNT,
  convertBitBadgesUserInfo,
  convertToCosmosAddress,
  isAddressValid,
} from 'bitbadgesjs-utils';
import { ThunkAction } from 'redux-thunk';
import {
  AccountReducerState,
  AppDispatch,
  GlobalReduxState,
} from '../../../pages/_app';
import { compareObjects } from '../../../utils/compare';
import { DesiredNumberType, getAccounts } from '../../api';
import { initialState, reservedNames } from './AccountsContext';

interface UpdateAccountsReduxAction {
  type: typeof UPDATE_ACCOUNTS;
  payload: {
    userInfos: BitBadgesUserInfo<DesiredNumberType>[];
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
  userInfos: BitBadgesUserInfo<DesiredNumberType>[] = [],
  forcefulRefresh: boolean = false
): UpdateAccountsReduxAction => ({
  type: UPDATE_ACCOUNTS,
  payload: {
    userInfos,
    forcefulRefresh,
  },
});

export const deleteAccountsRedux = (
  accountsToDelete: string[]
): DeleteAccountsAction => ({
  type: DELETE_ACCOUNTS,
  payload: accountsToDelete,
});

// Define your action creators
export const fetchAccountsRequest = (
  accountsToFetch: AccountFetchDetails[]
): FetchAccountsRequestAction => ({
  type: FETCH_ACCOUNTS_REQUEST,
  payload: accountsToFetch,
});


const getAccount = (
  state: AccountReducerState,
  addressOrUsername: string,
) => {
  if (reservedNames.includes(addressOrUsername))
    return {
      ...MINT_ACCOUNT,
      address: addressOrUsername,
      cosmosAddress: addressOrUsername,
    };

  let accountToReturn;
  let accounts = state.accounts;
  let cosmosAddressesByUsernames = state.cosmosAddressesByUsernames;

  if (isAddressValid(addressOrUsername)) {
    const cosmosAddress = convertToCosmosAddress(addressOrUsername);
    accountToReturn = accounts[cosmosAddress];
  } else {
    accountToReturn = accounts[cosmosAddressesByUsernames[addressOrUsername]];
  }
  return accountToReturn;
};

export const fetchAccountsRedux = (
  accountsToFetch: AccountFetchDetails[]
): ThunkAction<void, GlobalReduxState, unknown, AccountsActionTypes> =>
  async (dispatch: AppDispatch, getState: () => GlobalReduxState) => {
    const state = getState().accounts;

    try {
      const batchRequestBody: GetAccountsRouteRequestBody = { accountsToFetch: [], };

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

          //Do not fetch views where hasMore is false (i.e. we alreay have everything)
          const viewsToFetch = accountToFetch.viewsToFetch?.filter((x) => {
            if (x.bookmark == 'nil') return false; //TODO: Think this is legacy CouchDB code? 

            const currPagination = cachedAccount.views[x.viewId]?.pagination;
            if (!currPagination) return true;
            else return currPagination.hasMore;
          });

          //Check if we need to fetch anything at all
          const needToFetch = (accountToFetch.fetchSequence && cachedAccount.sequence === undefined) ||
            (accountToFetch.fetchBalance && cachedAccount.balance === undefined) ||
            viewsToFetch?.length || !cachedAccount.fetchedProfile;

          if (needToFetch) {
            batchRequestBody.accountsToFetch.push(accountToFetch);
          }
        }
      }

      // Dispatch success action with fetched data
      if (batchRequestBody.accountsToFetch.length > 0) {
        const res = await getAccounts(batchRequestBody);
        // console.log('ACCOUNTS RES', batchRequestBody, res);

        dispatch(updateAccountsRedux(res.accounts, false));
      }
    } catch (error: any) {
      console.log('failure', error);
    }

    return true;
  };


const updateAccounts = (
  state = initialState,
  userInfos: BitBadgesUserInfo<DesiredNumberType>[] = []
) => {
  let accounts = state.accounts;
  let cosmosAddressesByUsernames = state.cosmosAddressesByUsernames;

  const accountsToReturn: {
    account: BitBadgesUserInfo<DesiredNumberType>;
    needToCompare: boolean;
    ignore: boolean;
    cachedAccountCopy?: BitBadgesUserInfo<DesiredNumberType>;
  }[] = [];
  for (const account of userInfos) {
    if (reservedNames.includes(account.cosmosAddress)) {
      accountsToReturn.push({
        account: {
          ...MINT_ACCOUNT,
          address: account.cosmosAddress,
          cosmosAddress: account.cosmosAddress,
        },
        ignore: true,
        needToCompare: false,
      });
      continue;
    }

    let accountInMap = accounts[account.cosmosAddress];
    let cachedAccount = !accountInMap ? undefined : deepCopy(convertBitBadgesUserInfo(accountInMap, BigIntify));
    if (cachedAccount == undefined) {
      accountsToReturn.push({
        account,
        needToCompare: false,
        ignore: false,
      });
      continue;
    } else {
      const cachedAccountCopy = deepCopy(cachedAccount);

      let publicKey = cachedAccount?.publicKey ? cachedAccount.publicKey : account.publicKey ? account.publicKey : '';

      //Append all views to the existing views
      const views = cachedAccount?.views || {};
      for (const [key, newVal] of Object.entries(account.views)) {
        if (!newVal) continue;
        const oldVal = views[key];
        
        views[key] = {
          ids: [
            ...new Set([
              ...(oldVal?.ids || []),
              ...(newVal?.ids || []),
            ]),
          ].filter((x, index, self) => index === self.findIndex((t) => t === x)),
          pagination: newVal.pagination,
          type: newVal.type,
        };
      }

      //Merge the rest
      const newAccount = {
        ...cachedAccount,
        ...account,

        reviews: [...(cachedAccount?.reviews || []), ...(account.reviews || [])],
        collected: [...(cachedAccount?.collected || []), ...(account.collected || [])],
        activity: [...(cachedAccount?.activity || []), ...(account.activity || []),],
        announcements: [...(cachedAccount?.announcements || []), ...(account.announcements || []),],
        addressMappings: [...(cachedAccount?.addressMappings || []), ...(account.addressMappings || []),],
        claimAlerts: [...(cachedAccount?.claimAlerts || []), ...(account.claimAlerts || []),],
        authCodes: [...(cachedAccount?.authCodes || []), ...(account.authCodes || []),],
        listsActivity: [...(cachedAccount?.listsActivity || []), ...(account.listsActivity || []),],
        views: views,
        publicKey,
        airdropped: account.airdropped ? account.airdropped : cachedAccount?.airdropped ? cachedAccount.airdropped : false,
        sequence: account.sequence ?? cachedAccount?.sequence ?? 0n,
        accountNumber:
          account &&
            account.accountNumber !== undefined &&
            account.accountNumber >= 0n
            ? account.accountNumber
            : cachedAccount &&
              cachedAccount.accountNumber !== undefined &&
              cachedAccount.accountNumber >= 0n
              ? cachedAccount.accountNumber
              : -1n,
        resolvedName: account.resolvedName
          ? account.resolvedName
          : cachedAccount?.resolvedName
            ? cachedAccount.resolvedName
            : '',
      };

      //Filter duplicates
      newAccount.reviews = newAccount.reviews.filter(
        (x, index, self) =>
          index === self.findIndex((t) => t._legacyId === x._legacyId)
      );
      newAccount.collected = newAccount.collected.filter(
        (x, index, self) =>
          index === self.findIndex((t) => t._legacyId === x._legacyId)
      );
      newAccount.activity = newAccount.activity.filter(
        (x, index, self) =>
          index === self.findIndex((t) => t._legacyId === x._legacyId)
      );
      newAccount.announcements = newAccount.announcements.filter(
        (x, index, self) =>
          index === self.findIndex((t) => t._legacyId === x._legacyId)
      );
      newAccount.addressMappings = newAccount.addressMappings.filter(
        (x, index, self) =>
          index === self.findIndex((t) => t.mappingId === x.mappingId)
      );
      newAccount.claimAlerts = newAccount.claimAlerts.filter(
        (x, index, self) =>
          index === self.findIndex((t) => t._legacyId === x._legacyId)
      );
      newAccount.authCodes = newAccount.authCodes.filter(
        (x, index, self) =>
          index === self.findIndex((t) => t._legacyId === x._legacyId)
      );
      newAccount.listsActivity = newAccount.listsActivity.filter(
        (x, index, self) =>
          index === self.findIndex((t) => t._legacyId === x._legacyId)
      );

      //sort in descending order
      newAccount.activity = newAccount.activity.sort((a, b) =>
        b.timestamp - a.timestamp > 0 ? -1 : 1
      );
      newAccount.announcements = newAccount.announcements.sort((a, b) =>
        b.timestamp - a.timestamp > 0 ? -1 : 1
      );
      newAccount.reviews = newAccount.reviews.sort((a, b) =>
        b.timestamp - a.timestamp > 0 ? -1 : 1
      );
      newAccount.claimAlerts = newAccount.claimAlerts.sort((a, b) =>
        b.createdTimestamp - a.createdTimestamp > 0 ? -1 : 1
      );
      newAccount.authCodes = newAccount.authCodes.sort((a, b) =>
        b.createdAt - a.createdAt > 0 ? -1 : 1
      );
      newAccount.listsActivity = newAccount.listsActivity.sort((a, b) =>
        b.timestamp - a.timestamp > 0 ? -1 : 1
      );

      accountsToReturn.push({
        account: newAccount,
        needToCompare: true,
        ignore: false,
        cachedAccountCopy,
      });
    }
  }

  //Update the accounts map
  const newUpdates: AccountMap<bigint> = {};
  const newUsernameUpdates: { [username: string]: string } = {};
  for (const accountToReturn of accountsToReturn) {
    if (accountToReturn.ignore) continue;
    //Only trigger a rerender if the account has changed or we haev to
    if (
      (accountToReturn.needToCompare && !compareObjects(
        accountToReturn.account,
        accountToReturn.cachedAccountCopy
      )) || !accountToReturn.needToCompare
    ) {
      newUpdates[accountToReturn.account.cosmosAddress] = accountToReturn.account;
      if (accountToReturn.account.username) {
        newUsernameUpdates[accountToReturn.account.username] = accountToReturn.account.cosmosAddress;
      }
    }
  }

  return {
    ...state,
    accounts: { ...accounts, ...newUpdates },
    cosmosAddressesByUsernames: {
      ...cosmosAddressesByUsernames,
      ...newUsernameUpdates,
    },
  };
};

export const accountReducer = (
  state = initialState,
  action: { type: string; payload: any }
): AccountReducerState => {
  switch (action.type) {
    case 'UPDATE_ACCOUNTS':
      const userInfos = action.payload
        .userInfos as BitBadgesUserInfo<DesiredNumberType>[];
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
