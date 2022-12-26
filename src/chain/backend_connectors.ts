import { ChallengeParams } from "blockin";
import { stringify } from "../utils/preserveJson";
import { BadgeMetadata } from "../bitbadges-api/types";

/**
 * Here, we define the API function logic to call your backend.
 */

export const getChallenge = async (chain: string, address: string, assetIds: string[]) => {
    const assets = [];
    for (const assetId of assetIds) {
        assets.push('Asset ID: ' + assetId);
    }

    const message = await getChallengeFromBlockin(chain, address, assets);
    return message;
}

const getChallengeFromBlockin = async (chain: string, address: string, assetIds: string[]): Promise<string> => {
    const data = await fetch('http://localhost:3000/api/getChallenge', {
        method: 'post',
        body: JSON.stringify({
            address,
            assetIds,
            chain
        }),
        headers: { 'Content-Type': 'application/json' }
    }).then(res => res.json());

    return data.message;
}

export const getChallengeParams = async (chain: string, address: string): Promise<ChallengeParams> => {
    const data = await fetch('http://localhost:3000/api/getChallengeParams', {
        method: 'post',
        body: JSON.stringify({
            address,
            chain
        }),
        headers: { 'Content-Type': 'application/json' }
    }).then(res => res.json());

    return data;
}

export const verifyChallengeOnBackend = async (chain: string, originalBytes: Uint8Array, signatureBytes: Uint8Array) => {
    const bodyStr = stringify({ originalBytes, signatureBytes, chain }); //hack to preserve uint8 arrays
    console.log(bodyStr);

    const verificationRes = await fetch('http://localhost:3000/api/verifyChallenge', {
        method: 'post',
        body: bodyStr,
        headers: { 'Content-Type': 'application/json' }
    }).then(res => res.json());

    return verificationRes;
}

export const addToIpfs = async (collectionMetadata: BadgeMetadata, individualBadgeMetadata: BadgeMetadata[]) => {
    const bodyStr = stringify({
        collectionMetadata,
        individualBadgeMetadata
    }); //hack to preserve uint8 arrays
    console.log(bodyStr);

    const addToIpfsRes = await fetch('http://localhost:3000/api/addToIpfs', {
        method: 'post',
        body: bodyStr,
        headers: { 'Content-Type': 'application/json' }
    }).then(res => res.json());

    return addToIpfsRes;
}

export const getFromIpfs = async (cid: string, path: string) => {
    const bodyStr = stringify({ cid, path }); //hack to preserve uint8 arrays

    const addToIpfsRes = await fetch('http://localhost:3000/api/getFromIpfs', {
        method: 'post',
        body: bodyStr,
        headers: { 'Content-Type': 'application/json' }
    }).then(res => {
        return res.json()
    });

    return addToIpfsRes;
}