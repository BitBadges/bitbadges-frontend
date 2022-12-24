import { generateEndpointBroadcast, generatePostBodyBroadcast } from "bitbadgesjs-provider"
import { DEV_MODE, NODE_URL } from "../constants"
import { ChainContextType } from "../chain/ChainContext"



// Broadcasts a transaction to the blockchain. Uses NODE_URL from constants.ts.
export async function broadcastTransaction(txRaw: any) {
    const postOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: generatePostBodyBroadcast(txRaw),
    }

    let broadcastPost = await fetch(
        `${NODE_URL}${generateEndpointBroadcast()}`,
        postOptions,
    )

    if (DEV_MODE) console.log("Broadcasting Tx...")
    let res = await broadcastPost.json()
    if (DEV_MODE) console.log("Tx Response:", res)

    if (res.tx_response.code !== 0) {
        throw {
            message: `Code ${res.tx_response.code}: ${res.tx_response.raw_log}`,
        };
    }



    //Need to reupdate account information (e.g. new nonce / sequence)
    //TODO: this does not work anymore
    // getAccountInformation('cosmos1uqxan5ch2ulhkjrgmre90rr923932w38tn33gu') //TODO: should we await here? increment just sequence? async mempool txs listener to update upon finalization

    return res;
}

// Gets the sender information in a consistent format. If the public key is not stored in the redux store, 
// it will be fetched by having the user sign a message.
export async function getSenderInformation(chain: ChainContextType) {
    let publicKey = chain.publicKey;

    if (chain.cosmosAddress && !publicKey) {
        publicKey = await chain.getPublicKey(chain.cosmosAddress);
        //TODO: store in local storage
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

