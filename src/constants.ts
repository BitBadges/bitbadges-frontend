import { SupportedChain, MAINNET_CHAIN_DETAILS, BETANET_CHAIN_DETAILS } from "bitbadgesjs-utils";
import getConfig from 'next/config';

const { publicRuntimeConfig } = getConfig();
export const HOSTNAME = publicRuntimeConfig.HOSTNAME;
export const BACKEND_PORT = publicRuntimeConfig.BACKEND_PORT;

export const CHAIN_DETAILS = publicRuntimeConfig.MAINNET ? MAINNET_CHAIN_DETAILS : BETANET_CHAIN_DETAILS;

export const NODE_URL = `http://${HOSTNAME}:1317`;
export const BACKEND_URL = `https://${HOSTNAME}${BACKEND_PORT}`;

export const WEBSITE_HOSTNAME = `https://${HOSTNAME}`;

export const DEV_MODE = false;
export const INFINITE_LOOP_MODE = true;

export const PRIMARY_BLUE = '#001529';
export const SECONDARY_BLUE = '#3e83f8';
export const TERTIARY_BLUE = '#192c3e';
export const FOURTH_BLUE = '#304151';

export const PRIMARY_PINK = '#Ea1795';
export const PRIMARY_TEXT = 'white';
export const SECONDARY_TEXT = '#dedede';
export const LINK_COLOR = '#0000EE';

export const ETH_LOGO = '/images/ethereum-logo.png';
export const COSMOS_LOGO = '/images/cosmos-logo.png';

export const BLANK_USER_INFO = {
  accountNumber: -1,
  address: '',
  cosmosAddress: '',
  chain: SupportedChain.UNKNOWN,
}

export function getChainLogo(chain: string) {
  let chainLogo = '';

  switch (chain) {
    case SupportedChain.ETH:
    case SupportedChain.UNKNOWN:
      chainLogo = ETH_LOGO;
      break;
    case SupportedChain.COSMOS:
      chainLogo = COSMOS_LOGO;
      break;
    default:
      chainLogo = ETH_LOGO;
      break;
  }

  return chainLogo;
}