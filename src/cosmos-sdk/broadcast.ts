import { BroadcastMode, generatePostBodyBroadcast } from "bitbadgesjs-provider";
import { broadcastTx } from "../bitbadges-api/api";
import { DEV_MODE } from "../constants";
import { ChainContextType } from "../bitbadges-api/contexts/ChainContext";
import { AccountsContextType } from "../bitbadges-api/contexts/AccountsContext";



// Broadcasts a transaction to the blockchain. Uses NODE_URL from constants.ts.
export async function broadcastTransaction(txRaw: any) {
  if (DEV_MODE) console.log("Broadcasting Tx...")
  let broadcastPost = await broadcastTx(
    generatePostBodyBroadcast(txRaw, BroadcastMode.Block),
  ) as any; //TODO:

  let res = broadcastPost.data;
  if (DEV_MODE) console.log("Tx Response:", res)

  if (res.tx_response.code !== 0 && res.tx_response.codespace !== 'badges') {
    throw {
      message: `Code ${res.tx_response.code} from \"${res.tx_response.codespace}\": ${res.tx_response.raw_log}`,
      tx_response: res.tx_response,
    };
  }

  return res;
}

// Gets the sender information in a consistent format. 
//If the public key is not stored in the redux store, it will be fetched by having the user sign a message.
export async function getSenderInformation(chain: ChainContextType, accounts: AccountsContextType) {
  let account = accounts.getAccount(chain.cosmosAddress);
  if (!account) return Promise.reject("No account found");


  let publicKey = account.publicKey;



  if (chain.cosmosAddress && !publicKey) {
    publicKey = await chain.getPublicKey(chain.cosmosAddress);
    accounts.setPublicKey(chain.cosmosAddress, publicKey);
  } else if (!chain.cosmosAddress) {
    return Promise.reject("No address found");
  }

  return {
    accountAddress: account.cosmosAddress,
    sequence: account.sequence,
    accountNumber: account.accountNumber,
    pubkey: publicKey
  }
}

