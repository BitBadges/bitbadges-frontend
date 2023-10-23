import { deepCopy } from "bitbadgesjs-proto";
import { AccountMap, BitBadgesUserInfo, DesiredNumberType, MINT_ACCOUNT } from "bitbadgesjs-utils";
import { compareObjects } from "../../../utils/compare";
import { AccountReducerState, initialState, reservedNames } from "./AccountsContext";

const updateAccounts = (state = initialState, userInfos: BitBadgesUserInfo<DesiredNumberType>[] = [], forcefulRefresh: boolean = false, cookies: { [key: string]: string } = {}) => {
  let accounts = state.accounts;
  let cosmosAddressesByUsernames = state.cosmosAddressesByUsernames;

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

      accountsToReturn.push({ account: newAccount, needToCompare: true, ignore: false, cachedAccountCopy });
    }
  }

  //Update the accounts map
  const newUpdates: AccountMap<bigint> = {};
  const newUsernameUpdates: { [username: string]: string } = {};
  for (const accountToReturn of accountsToReturn) {
    if (accountToReturn.ignore) continue;
    //Only trigger a rerender if the account has changed or we haev to
    console.log(compareObjects(accountToReturn.account, accountToReturn.cachedAccountCopy), console.log(accountToReturn.cachedAccountCopy));
    if ((accountToReturn.needToCompare && !compareObjects(accountToReturn.account, accountToReturn.cachedAccountCopy)) || !accountToReturn.needToCompare) {
      newUpdates[accountToReturn.account.cosmosAddress] = accountToReturn.account;
      if (accountToReturn.account.username) {
        newUsernameUpdates[accountToReturn.account.username] = accountToReturn.account.cosmosAddress;
      }
    }
  }

  if (Object.keys(newUpdates).length > 0) {
    accounts = { ...accounts, ...newUpdates };
  }

  if (Object.keys(newUsernameUpdates).length > 0) {
    cosmosAddressesByUsernames = { ...cosmosAddressesByUsernames, ...newUsernameUpdates };
  }

  return {
    ...state, accounts, cosmosAddressesByUsernames
  }
}


export const accountReducer = (state = initialState, action: { type: string; payload: any }): AccountReducerState => {
  switch (action.type) {
    case 'UPDATE_ACCOUNTS':
      const userInfos = action.payload.userInfos as BitBadgesUserInfo<DesiredNumberType>[];
      const cookies = action.payload.cookies as { [key: string]: string };
      const forcefulRefresh = action.payload.forcefulRefresh as boolean;
      return updateAccounts(state, userInfos, forcefulRefresh, cookies);
    default:
      return state;
  }
};
