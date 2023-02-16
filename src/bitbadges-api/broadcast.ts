import { BroadcastMode, generateEndpointBroadcast, generatePostBodyBroadcast } from "bitbadgesjs-provider"
import { DEV_MODE, NODE_URL } from "../constants"
import { ChainContextType } from "../chain/ChainContext"



// Broadcasts a transaction to the blockchain. Uses NODE_URL from constants.ts.
export async function broadcastTransaction(txRaw: any) {
    const postOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: generatePostBodyBroadcast(txRaw, BroadcastMode.Block),
    }

    let broadcastPost = await fetch(
        `${NODE_URL}${generateEndpointBroadcast()}`,
        postOptions,
    )

    if (DEV_MODE) console.log("Broadcasting Tx...")
    let res = await broadcastPost.json()
    if (DEV_MODE) console.log("Tx Response:", res)

    if (res.tx_response.code !== 0 && res.tx_response.codespace !== 'badges') {
        throw {
            message: `Code ${res.tx_response.code} from \"${res.tx_response.codespace}\": ${res.tx_response.raw_log}`,
            tx_response: res.tx_response,
        };
    }

    return res;
}

// Gets the sender information in a consistent format. If the public key is not stored in the redux store, 
// it will be fetched by having the user sign a message.
export async function getSenderInformation(chain: ChainContextType) {
    let publicKey = chain.publicKey;

    if (chain.cosmosAddress && !publicKey) {
        publicKey = await chain.getPublicKey(chain.cosmosAddress);
        chain.setPublicKey(publicKey);
    } else if (!chain.cosmosAddress) {
        return Promise.reject("No address found");
    }

    return {
        accountAddress: chain.cosmosAddress,
        sequence: chain.sequence,
        accountNumber: chain.accountNumber,
        pubkey: publicKey
    }
}

