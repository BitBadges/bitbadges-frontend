import { SupportedChain, MAINNET_CHAIN_DETAILS, BETANET_CHAIN_DETAILS } from "bitbadgesjs-utils";
import getConfig from 'next/config';

const { publicRuntimeConfig } = getConfig();
export const HOSTNAME = publicRuntimeConfig.HOSTNAME;
export const BACKEND_PORT = publicRuntimeConfig.BACKEND_PORT;
export const CHAIN_DETAILS = publicRuntimeConfig.MAINNET ? MAINNET_CHAIN_DETAILS : BETANET_CHAIN_DETAILS;

export const NODE_PORT = '1317';
export const NODE_API_URL = `http://${HOSTNAME !== 'localhost' ? 'api.' + HOSTNAME : HOSTNAME}:${NODE_PORT}`;
export const RPC_PORT = '26657';

const LOCAL_RPC = 'http://localhost:26657';
const DEPLOYED_RPC = 'https://api.bitbadges.io/rpc';

export const RPC_URL = `${HOSTNAME !== 'localhost' ? DEPLOYED_RPC : LOCAL_RPC}`;
export const BACKEND_URL = `https://${HOSTNAME !== 'localhost' ? 'api.' + HOSTNAME : HOSTNAME}${BACKEND_PORT}/api`;
export const WEBSITE_HOSTNAME = `https://${HOSTNAME}`;

export const DEV_MODE = process.env.PRODUCTION ? false : false;
export const INFINITE_LOOP_MODE = process.env.PRODUCTION ? false : true;

export const ETH_LOGO = '/images/ethereum-logo.png';
export const COSMOS_LOGO = '/images/cosmos-logo.png';
export const BITCOIN_LOGO = 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Bitcoin.svg/800px-Bitcoin.svg.png';
export const SOLANA_LOGO = 'https://upload.wikimedia.org/wikipedia/en/b/b9/Solana_logo.png';
export const CHAIN_LOGO = '/images/encryption-icon.svg';

export function getChainLogo(chain: string) {
  let chainLogo = '';

  switch (chain) {
    case SupportedChain.ETH:
      chainLogo = ETH_LOGO;
      break;
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