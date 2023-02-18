import { COSMOS, ethToCosmos } from "bitbadgesjs-address-converter";
import { SupportedChain } from "./types";

export function convertToCosmosAddress(address: string) {
    let bech32Address = '';
    try {
        COSMOS.decoder(address);
        bech32Address = address;
    } catch {
        bech32Address = ethToCosmos(address);
    }

    return bech32Address;
}

export function getChainForAddress(address: string) {
    try {
        COSMOS.decoder(address);
        return SupportedChain.COSMOS;
    } catch {
        return SupportedChain.ETH;
    }
}