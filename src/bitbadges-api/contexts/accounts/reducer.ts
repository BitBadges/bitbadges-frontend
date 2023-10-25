import { deepCopy } from "bitbadgesjs-proto";
import { AccountMap, BigIntify, BitBadgesUserInfo, DesiredNumberType, MINT_ACCOUNT, Stringify, convertBitBadgesUserInfo } from "bitbadgesjs-utils";
import { compareObjects } from "../../../utils/compare";
import { AccountReducerState, initialState, reservedNames } from "./AccountsContext";

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
    default:
      return state;
  }
};
