import { MerkleTree } from 'merkletreejs';
import SHA256 from 'crypto-js/sha256';

const CryptoJS = require("crypto-js");

// export const NODE_URL = 'https://bit-badges.herokuapp.com';
export const NODE_URL = 'http://localhost:1317';
export const BACKEND_URL = 'http://localhost:3000';

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

// export const ETH_LOGO =
//     'https://e7.pngegg.com/pngimages/407/710/png-clipart-ethereum-cryptocurrency-bitcoin-cash-smart-contract-bitcoin-blue-angle-thumbnail.png';

export const CHAIN_DETAILS = {
    chainId: 1,
    cosmosChainId: 'bitbadges_1-1',
}

export const SampleMerkleTreeLeaves = ['cosmos1jmjfq0tplp9tmx4v9uemw72y4d2wa5nr3xn9d3', 'cosmos1xyxs3skf3f4jfqeuv89yyaqvjc6lffavxqhc8g', 'cosmos1e0w5t53nrq7p66fye6c8p0ynyhf6y24l4yuxd7', 'cosmos1e0w5t53nrq7p66fye6c8p0ynyhf6y24l4yuxd7'];
export const SampleMerkleTreeLeafHashes = SampleMerkleTreeLeaves.map(x => SHA256(x))

export const SampleMerkleTreeObject = new MerkleTree(SampleMerkleTreeLeafHashes, SHA256, { duplicateOdd: true })
export const SampleMerkleTreeRoot = SampleMerkleTreeObject.getRoot().toString('hex')



// export const _leaf = CryptoJS.enc.Hex.stringify(SampleMerkleTreeLeafHashes[0]);
// export const _proof = SampleMerkleTreeObject.getProof(_leaf)

