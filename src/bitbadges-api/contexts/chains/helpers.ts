import { AccountViewKey } from "bitbadgesjs-sdk";
import { fetchAccountsWithOptions } from "../accounts/AccountsContext";

export async function fetchDefaultViews(address: string, loggedIn: boolean) {
  const DefaultViewsToFetch: { viewType: AccountViewKey; viewId: string, bookmark: string; }[] = [{
    viewType: 'badgesCollected',
    viewId: 'badgesCollected',
    bookmark: '',
  }, {
    viewType: 'transferActivity',
    viewId: 'transferActivity',
    bookmark: '',
  }, {
    viewType: 'listsActivity',
    viewId: 'listsActivity',
    bookmark: '',
  }, {
    viewType: 'reviews',
    viewId: 'reviews',
    bookmark: '',
  }, {
    viewType: 'allLists',
    viewId: 'allLists',
    bookmark: '',
  }, {
    viewType: 'whitelists',
    viewId: 'whitelists',
    bookmark: ''
  },
  {
    viewType: 'blacklists',
    viewId: 'blacklists',
    bookmark: ''
  }]
  const viewsToFetch = DefaultViewsToFetch.slice();

  if (loggedIn) {
    viewsToFetch.push({
      viewType: 'claimAlerts',
      viewId: 'claimAlerts',
      bookmark: '',
    }, {
      viewType: 'authCodes',
      viewId: 'authCodes',
      bookmark: '',
    })
  }

  await fetchAccountsWithOptions([{
    address: address,
    fetchSequence: true,
    fetchBalance: true,
    viewsToFetch
  }]);

}