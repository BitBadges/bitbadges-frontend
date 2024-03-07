import { AccountViewKey, SupportedChain } from 'bitbadgesjs-sdk';
import { fetchAccountsWithOptions } from '../accounts/AccountsContext';

export const ChainDefaultState = {
  address: '',
  connected: false,
  loggedIn: false,
  loggedInExpiration: 0,
  cosmosAddress: '',
  connect: async () => {},
  disconnect: async () => {},
  signChallenge: async () => {
    return { message: '', signature: '' };
  },
  signTxn: async () => {
    return '';
  },
  getPublicKey: async () => {
    return '';
  },
  chain: SupportedChain.ETH,
  setChain: () => {},

  lastSeenActivity: 0,
  challengeParams: undefined,
  setChallengeParams: () => {}
};

export async function fetchDefaultViews(address: string, loggedIn: boolean) {
  const DefaultViewsToFetch: Array<{ viewType: AccountViewKey; viewId: string; bookmark: string }> = [
    {
      viewType: 'badgesCollected',
      viewId: 'badgesCollected',
      bookmark: ''
    },
    {
      viewType: 'transferActivity',
      viewId: 'transferActivity',
      bookmark: ''
    },
    {
      viewType: 'listsActivity',
      viewId: 'listsActivity',
      bookmark: ''
    },
    {
      viewType: 'reviews',
      viewId: 'reviews',
      bookmark: ''
    },
    {
      viewType: 'allLists',
      viewId: 'allLists',
      bookmark: ''
    },
    {
      viewType: 'whitelists',
      viewId: 'whitelists',
      bookmark: ''
    },
    {
      viewType: 'blacklists',
      viewId: 'blacklists',
      bookmark: ''
    }
  ];
  const viewsToFetch = DefaultViewsToFetch.slice();

  if (loggedIn) {
    viewsToFetch.push(
      {
        viewType: 'claimAlerts',
        viewId: 'claimAlerts',
        bookmark: ''
      },
      {
        viewType: 'authCodes',
        viewId: 'authCodes',
        bookmark: ''
      }
    );
  }

  
  await fetchAccountsWithOptions([
    {
      address: address,
      fetchSequence: true,
      fetchBalance: true,
      viewsToFetch
    }
  ]);
}
