import { SupportedChain } from "bitbadges-sdk";

export const NODE_URL = 'http://146.190.197.77:1317';
export const BACKEND_URL = 'http://146.190.197.77:3001';
export const FAUCET_URL = 'http://146.190.197.77:4500';

export const WEBSITE_HOSTNAME = 'http://localhost:3000'

export const DEV_MODE = false;

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