import { BETANET_CHAIN_DETAILS, MAINNET_CHAIN_DETAILS, SupportedChain } from "bitbadgesjs-utils";
import getConfig from 'next/config';

const { publicRuntimeConfig } = getConfig();
export const HOSTNAME = publicRuntimeConfig.HOSTNAME;
export const BACKEND_PORT = publicRuntimeConfig.BACKEND_PORT;
export const CHAIN_DETAILS = publicRuntimeConfig.MAINNET ? MAINNET_CHAIN_DETAILS : BETANET_CHAIN_DETAILS;

//These are HTTPS versions (not Tendermint HTTP port versions)
//Needed for Keplr
export const NODE_PORT = '1317';
export const NODE_API_URL = `${HOSTNAME !== 'localhost' ? 'https://node.' + HOSTNAME + '/api' : 'http://localhost:1317'}`;
export const RPC_PORT = '26657';
export const RPC_URL = `${HOSTNAME !== 'localhost' ? 'https://node.' + HOSTNAME + '/rpc' : 'http://localhost:26657'}`;
export const BACKEND_URL = `https://${HOSTNAME !== 'localhost' ? 'api.' + HOSTNAME : HOSTNAME}${BACKEND_PORT}`;
export const WEBSITE_HOSTNAME = `https://${HOSTNAME}`;
export const EXPLORER_URL = `https://explorer.${HOSTNAME}`;

export const DEV_MODE = process.env.PRODUCTION ? false : false;
export const INFINITE_LOOP_MODE = process.env.PRODUCTION ? false : true;

export const ETH_LOGO = '/images/ethereum-logo.png';
export const COSMOS_LOGO = '/images/cosmos-logo.png';
export const BITCOIN_LOGO = '/images/bitcoin-logo.png';
export const SOLANA_LOGO = '/images/solana-logo.png';
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
    case SupportedChain.SOLANA:
      chainLogo = SOLANA_LOGO;
      break;
    case SupportedChain.BTC:
      chainLogo = BITCOIN_LOGO;
      break;
    default:
      chainLogo = ETH_LOGO;
      break;
  }

  return chainLogo;
}