import { AccountViewKey } from "bitbadgesjs-utils";
import { fetchAccountsWithOptions } from "../accounts/AccountsContext";

export async function fetchDefaultViews(address: string, loggedIn: boolean) {
  const DefaultViewsToFetch: { viewType: AccountViewKey; viewId: string, bookmark: string; }[] = [{
    viewType: 'badgesCollected',
    viewId: 'badgesCollected',
    bookmark: '',
  }, {
    viewType: 'latestActivity',
    viewId: 'latestActivity',
    bookmark: '',
  }, {
    viewType: 'listsActivity',
    viewId: 'listsActivity',
    bookmark: '',
  }, {
    viewType: 'latestAnnouncements',
    viewId: 'latestAnnouncements',
    bookmark: '',
  }, {
    viewType: 'latestReviews',
    viewId: 'latestReviews',
    bookmark: '',
  }, {
    viewType: 'addressMappings',
    viewId: 'addressMappings',
    bookmark: '',
  }, {
    viewType: 'explicitlyIncludedAddressMappings',
    viewId: 'explicitlyIncludedAddressMappings',
    bookmark: ''
  },
  {
    viewType: 'explicitlyExcludedAddressMappings',
    viewId: 'explicitlyExcludedAddressMappings',
    bookmark: ''
  }]
  const viewsToFetch = DefaultViewsToFetch.slice();

  if (loggedIn) {
    viewsToFetch.push({
      viewType: 'latestClaimAlerts',
      viewId: 'latestClaimAlerts',
      bookmark: '',
    }, {
      viewType: 'latestAddressMappings',
      viewId: 'latestAddressMappings',
      bookmark: ''
    },
      {
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