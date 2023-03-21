import { COSMOS, ethToCosmos } from "bitbadgesjs-address-converter";
import { SupportedChain } from "./types";
import { COSMOS_LOGO, ETH_LOGO, MINT_ACCOUNT } from "../constants";
import { ethers } from "ethers";

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

export function convertToCosmosAddress(address: string) {
    let bech32Address = '';
    try {
        COSMOS.decoder(address);
        bech32Address = address;
    } catch {
        if (ethers.utils.isAddress(address)) {
            bech32Address = ethToCosmos(address);
        }
    }

    return bech32Address;
}

export function getChainForAddress(address: string) {
    try {
        COSMOS.decoder(address);
        return SupportedChain.COSMOS;
    } catch {
        if (ethers.utils.isAddress(address)) {
            return SupportedChain.ETH;
        }

    }

    if (address.startsWith('0x')) {
        return SupportedChain.ETH;
    } else if (address.startsWith('cosmos')) {
        return SupportedChain.COSMOS;
    }

    return SupportedChain.UNKNOWN;
}

export function getAbbreviatedAddress(address: string) {
    let isMintAddress = address === MINT_ACCOUNT.address;
    if (isMintAddress) return 'Mint';
    if (address.length == 0) return '...';
    if (address.length < 20) return address;

    return address.substring(0, 8) + '...' + address.substring(address.length - 4, address.length);
}

export function isAddressValid(address: string, chain?: string) {
    let isValidAddress = true;

    if (chain == undefined || chain == SupportedChain.UNKNOWN) {
        chain = getChainForAddress(address);
    }

    switch (chain) {
        case SupportedChain.ETH:
        case SupportedChain.UNKNOWN:
            isValidAddress = ethers.utils.isAddress(address);
            break;
        case SupportedChain.COSMOS:
            try {
                COSMOS.decoder(address);
            } catch {
                isValidAddress = false;
            }
            break;
        default:
            isValidAddress = false;
            break;
    }

    if (address === MINT_ACCOUNT.address) {
        isValidAddress = true;
    }

    return isValidAddress;
}

export function doesChainMatchName(chain: SupportedChain, name?: string) {
    if (chain === SupportedChain.ETH && name?.endsWith('.eth')) {
        return true;
    }
}