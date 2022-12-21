import { generateEndpointBroadcast, generatePostBodyBroadcast } from "bitbadgesjs-provider"
import { DEV_MODE, NODE_URL } from "../constants"
import { getAccountInformation } from "./api"
import store from '../redux/store';
import { userActions } from "../redux/userSlice";




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

    //Need to reupdate account information (e.g. new nonce / sequence)
    getAccountInformation('cosmos1uqxan5ch2ulhkjrgmre90rr923932w38tn33gu', true) //TODO: should we await here? increment just sequence? async mempool txs listener to update upon finalization

    return res;
}

// Gets the sender information in a consistent format. If the public key is not stored in the redux store, 
// it will be fetched by having the user sign a message.
export async function getSenderInformation(getPublicKey: (cosmosAddress: string) => Promise<string>) {
    const currState = store.getState();
    const accountInformation = currState.user;
    let publicKey = accountInformation.publicKey;


    if (accountInformation.address && !publicKey) {
        publicKey = await getPublicKey(accountInformation.address);
        //TODO: store in local storage
        store.dispatch(userActions.setPublicKey(publicKey));
    } else if (!accountInformation.address) {
        return Promise.reject("No address found");
    }

    return {
        accountAddress: accountInformation.address,
        sequence: accountInformation.sequence,
        accountNumber: accountInformation.accountNumber,
        pubkey: publicKey
    }
}

