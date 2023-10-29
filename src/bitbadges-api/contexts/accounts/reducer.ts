import { deepCopy } from "bitbadgesjs-proto";
import { AccountMap, AccountViewKey, BigIntify, BitBadgesUserInfo, DesiredNumberType, GetAccountsRouteRequestBody, MINT_ACCOUNT, Stringify, convertBitBadgesUserInfo, convertToCosmosAddress, isAddressValid } from "bitbadgesjs-utils";
import { Dispatch } from "redux";
import { ThunkAction } from 'redux-thunk';
import { GlobalReduxState } from "../../../pages/_app";
import { compareObjects } from "../../../utils/compare";
import { getAccounts } from "../../api";
import { AccountReducerState, initialState, reservedNames } from "./AccountsContext";

interface UpdateAccountsReduxAction {
  type: typeof UPDATE_ACCOUNTS;
  payload: {
    userInfos: BitBadgesUserInfo<DesiredNumberType>[];
    forcefulRefresh: boolean;
  }
}

export interface AccountRequestParams {
  address?: string;
  username?: string;
  fetchSequence?: boolean;
  fetchBalance?: boolean;
  fetchHidden?: boolean;
  viewsToFetch?: {
    viewKey: AccountViewKey;
    bookmark: string;
  }[];
  noExternalCalls?: boolean;
}


export const updateAccountsRedux = (userInfos: BitBadgesUserInfo<DesiredNumberType>[] = [], forcefulRefresh: boolean = false): UpdateAccountsReduxAction => ({
  type: UPDATE_ACCOUNTS,
  payload: {
    userInfos,
    forcefulRefresh
  }
});

const UPDATE_ACCOUNTS = 'UPDATE_ACCOUNTS';
const FETCH_ACCOUNTS_REQUEST = 'FETCH_ACCOUNTS_REQUEST';
const FETCH_ACCOUNTS_SUCCESS = 'FETCH_ACCOUNTS_SUCCESS';
const FETCH_ACCOUNTS_FAILURE = 'FETCH_ACCOUNTS_FAILURE';


interface FetchAccountsRequestAction {
  type: typeof FETCH_ACCOUNTS_REQUEST;
  payload: AccountRequestParams[]
}

interface FetchAccountsSuccessAction {
  type: typeof FETCH_ACCOUNTS_SUCCESS;
}

interface FetchAccountsFailureAction {
  type: typeof FETCH_ACCOUNTS_FAILURE;
  payload: string; // Error message
}

export type AccountsActionTypes =
  | FetchAccountsRequestAction
  | FetchAccountsSuccessAction
  | FetchAccountsFailureAction
  | UpdateAccountsReduxAction

// Define your action creators
export const fetchAccountsRequest = (accountsToFetch: AccountRequestParams[]): FetchAccountsRequestAction => ({
  type: FETCH_ACCOUNTS_REQUEST,
  payload: accountsToFetch,
});

const fetchAccountsSuccess = (): FetchAccountsSuccessAction => ({
  type: FETCH_ACCOUNTS_SUCCESS,
});

const fetchAccountsFailure = (error: string): FetchAccountsFailureAction => ({
  type: FETCH_ACCOUNTS_FAILURE,
  payload: error,
});

const getAccount = (state: AccountReducerState, addressOrUsername: string, forcefulRefresh?: boolean) => {
  if (reservedNames.includes(addressOrUsername)) return { ...MINT_ACCOUNT, address: addressOrUsername, cosmosAddress: addressOrUsername };

  let accountToReturn;
  let accounts = state.accounts;
  let cosmosAddressesByUsernames = state.cosmosAddressesByUsernames;

  if (isAddressValid(addressOrUsername)) {
    const cosmosAddress = convertToCosmosAddress(addressOrUsername);
    if (forcefulRefresh) accountToReturn = undefined;
    else accountToReturn = accounts[cosmosAddress];
  } else {
    accountToReturn = accounts[cosmosAddressesByUsernames[addressOrUsername]];
  }
  return accountToReturn ? convertBitBadgesUserInfo(accountToReturn, BigIntify) : undefined;
}

export const fetchAccountsRedux = (): ThunkAction<
  void,
  GlobalReduxState,
  unknown,
  AccountsActionTypes
> => async (
  dispatch: Dispatch<AccountsActionTypes>, // Use Dispatch type
  getState: () => GlobalReduxState
) => {
    const forcefulRefresh = false;
    const state = getState().accounts;
    const accountsToFetch = state.queue.filter((x, idx, self) => self.findIndex(y => JSON.stringify(x) === JSON.stringify(y)) === idx);
    dispatch(fetchAccountsSuccess());
    //Remove duplicate

    try {
      const batchRequestBody: GetAccountsRouteRequestBody = {
        accountsToFetch: []
      };

      //Iterate through and see which accounts + info we actually need to fetch versus which we already have enough for
      for (const accountToFetch of accountsToFetch) {

        // if (accountToFetch.address) accountToFetch.address = convertToCosmosAddress(accountToFetch.address);
        accountToFetch.viewsToFetch = accountToFetch.viewsToFetch?.filter(x => x.bookmark != 'nil') || [];

        const cachedAccount = getAccount(state, accountToFetch.address || accountToFetch.username || '', forcefulRefresh);

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

          if (accountToFetch.address) accountToFetch.address = cachedAccount.address;
          if (accountToFetch.username) accountToFetch.username = cachedAccount.username;

          if (reservedNames.includes(accountToFetch.address || accountToFetch.username || '')) continue;

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

      // Dispatch success action with fetched data

      if (batchRequestBody.accountsToFetch.length > 0) {

        const res = await getAccounts(batchRequestBody);
        console.log('ACCOUNTS RES', batchRequestBody, res);

        dispatch(updateAccountsRedux(
          res.accounts,
          false
        ));
      } else {
        console.log("NONE")
      }


    } catch (error: any) {
      console.log('failure', error);
      // Dispatch failure action if there's an error
      dispatch(fetchAccountsFailure(error.message));
    }
  };


const updateAccounts = (state = initialState, userInfos: BitBadgesUserInfo<DesiredNumberType>[] = [], forcefulRefresh: boolean = false) => {

  let accounts = state.accounts;
  let cosmosAddressesByUsernames = state.cosmosAddressesByUsernames;

  const accountsToReturn: { account: BitBadgesUserInfo<DesiredNumberType>, needToCompare: boolean, ignore: boolean, cachedAccountCopy?: BitBadgesUserInfo<DesiredNumberType> }[] = [];
  for (const account of userInfos) {

    if (reservedNames.includes(account.cosmosAddress)) {
      accountsToReturn.push({ account: { ...MINT_ACCOUNT, address: account.cosmosAddress, cosmosAddress: account.cosmosAddress }, ignore: true, needToCompare: false })
      continue;
    }

    // if (forcefulRefresh) {
    //   accounts[account.cosmosAddress] = undefined;
    // }

    let accountInMap = accounts[account.cosmosAddress];
    let cachedAccount = forcefulRefresh || !accountInMap ? undefined : deepCopy(convertBitBadgesUserInfo(accountInMap, BigIntify));
    if (cachedAccount == undefined) {
      accountsToReturn.push({ account, needToCompare: false, ignore: false });
      continue;
    } else {
      const cachedAccountCopy = deepCopy(cachedAccount);

      let publicKey = cachedAccount?.publicKey ? cachedAccount.publicKey : account.publicKey ? account.publicKey : '';


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
        sequence: account.sequence ?? cachedAccount?.sequence ?? 0n,
        accountNumber: account && account.accountNumber !== undefined && account.accountNumber >= 0n ? account.accountNumber : cachedAccount && cachedAccount.accountNumber !== undefined && cachedAccount.accountNumber >= 0n ? cachedAccount.accountNumber : -1n,
        resolvedName: account.resolvedName ? account.resolvedName : cachedAccount?.resolvedName ? cachedAccount.resolvedName : "",
      };


      //Filter duplicates
      newAccount.reviews = newAccount.reviews.filter((x, index, self) => index === self.findIndex((t) => (t._id === x._id)))
      newAccount.collected = newAccount.collected.filter((x, index, self) => index === self.findIndex((t) => (t._id === x._id)))
      newAccount.activity = newAccount.activity.filter((x, index, self) => index === self.findIndex((t) => (t._id === x._id)))
      newAccount.announcements = newAccount.announcements.filter((x, index, self) => index === self.findIndex((t) => (t._id === x._id)))
      newAccount.addressMappings = newAccount.addressMappings.filter((x, index, self) => index === self.findIndex((t) => (t.mappingId === x.mappingId)))
      newAccount.claimAlerts = newAccount.claimAlerts.filter((x, index, self) => index === self.findIndex((t) => (t._id === x._id)))

      //sort in descending order
      newAccount.activity = newAccount.activity.sort((a, b) => b.timestamp - a.timestamp > 0 ? 1 : -1);
      newAccount.announcements = newAccount.announcements.sort((a, b) => b.timestamp - a.timestamp > 0 ? 1 : -1);
      newAccount.reviews = newAccount.reviews.sort((a, b) => b.timestamp - a.timestamp > 0 ? 1 : -1);
      newAccount.claimAlerts = newAccount.claimAlerts.sort((a, b) => b.createdTimestamp - a.createdTimestamp > 0 ? 1 : -1);

      accountsToReturn.push({ account: newAccount, needToCompare: true, ignore: false, cachedAccountCopy });
    }
  }

  //Update the accounts map
  const newUpdates: AccountMap<string> = {};
  const newUsernameUpdates: { [username: string]: string } = {};
  for (const accountToReturn of accountsToReturn) {
    if (accountToReturn.ignore) continue;
    //Only trigger a rerender if the account has changed or we haev to
    if ((accountToReturn.needToCompare && !compareObjects(accountToReturn.account, accountToReturn.cachedAccountCopy)) || !accountToReturn.needToCompare) {
      newUpdates[accountToReturn.account.cosmosAddress] = convertBitBadgesUserInfo(accountToReturn.account, Stringify);
      if (accountToReturn.account.username) {
        newUsernameUpdates[accountToReturn.account.username] = accountToReturn.account.cosmosAddress;
      }
    }
  }

  
  return {
    ...state,
    accounts: { ...accounts, ...newUpdates },
    cosmosAddressesByUsernames: { ...cosmosAddressesByUsernames, ...newUsernameUpdates },
  }
}


export const accountReducer = (state = initialState, action: { type: string; payload: any }): AccountReducerState => {
  switch (action.type) {
    case 'UPDATE_ACCOUNTS':
      const userInfos = action.payload.userInfos as BitBadgesUserInfo<DesiredNumberType>[];
      const forcefulRefresh = action.payload.forcefulRefresh as boolean;
      return updateAccounts(state, userInfos, forcefulRefresh);
    case 'FETCH_ACCOUNTS_REQUEST':
      return { ...state, loading: true, error: '', queue: [...state.queue, ...action.payload] };
    case 'FETCH_ACCOUNTS_SUCCESS':
      return { ...state, loading: false, error: '', queue: [] }
    case 'FETCH_ACCOUNTS_FAILURE':
      return { ...state, loading: false, error: action.payload };

    default:
      return state;
  }
};
