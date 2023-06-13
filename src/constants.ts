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



export const ETH_LOGO = '/images/ethereum-logo.png';
export const COSMOS_LOGO = '/images/cosmos-logo.png';

// export const BLANK_USER_INFO = {
//   accountNumber: -1,
//   address: '',
//   cosmosAddress: '',
//   chain: SupportedChain.UNKNOWN,
// }

export function getChainLogo(chain: string) {
  let chainLogo = '';

  switch (chain) {
    case SupportedChain.ETH:
    case SupportedChain.UNKNOWN:
      chainLogo = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Blue_question_mark_icon.svg/1024px-Blue_question_mark_icon.svg.png';
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