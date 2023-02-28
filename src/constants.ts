import { BadgeMetadata, BitBadgesUserInfo, SupportedChain } from './bitbadges-api/types';

// export const NODE_URL = 'https://bit-badges.herokuapp.com';
export const NODE_URL = 'http://localhost:1317';
export const BACKEND_URL = 'http://localhost:3001';
export const FAUCET_URL = 'http://localhost:4500';

export const WEBSITE_HOSTNAME = 'http://localhost:3000'

export const DEV_MODE = true;

// export const PRIVATE_API_URL = 'https://bitbadges-private-api.herokuapp.com';
// export const PRIVATE_API_URL = 'https://api.circlegame.io';
// export const PRIVATE_API_URL = 'http://localhost:3000';

export const MAX_DATE_TIMESTAMP = 8640000000000000 / 1000;

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

export const GO_MAX_UINT_64 = 1000000000000000; //TODO:

export const CHAIN_DETAILS = {
    chainId: 1,
    cosmosChainId: 'bitbadges_1-1',
}

export const MINT_ACCOUNT: BitBadgesUserInfo = {
    cosmosAddress: '',
    accountNumber: -1,
    address: 'Mint',
    chain: SupportedChain.COSMOS
}

export const DefaultPlaceholderMetadata: BadgeMetadata = {
    name: 'Placeholder',
    description: '',
    image: 'https://bitbadges.web.app/img/icons/logo.png',
}
