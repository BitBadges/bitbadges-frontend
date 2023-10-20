import { BroadcastMode, TxToSend, generatePostBodyBroadcast } from "bitbadgesjs-provider";
import { broadcastTx } from "../bitbadges-api/api";
import { DEV_MODE } from "../constants";



// Broadcasts a transaction to the blockchain. Uses NODE_URL from constants.ts.
export async function broadcastTransaction(txRaw: TxToSend) {
  if (DEV_MODE) console.log("Broadcasting Tx...")
  let res = await broadcastTx(
    generatePostBodyBroadcast(txRaw, BroadcastMode.Block),
  )

  // let res = broadcastPost.data;
  if (DEV_MODE) console.log("Tx Response:", res)

  if (res.tx_response.code !== 0 && res.tx_response.codespace !== 'badges') {
    throw {
      message: `Code ${res.tx_response.code} from \"${res.tx_response.codespace}\": ${res.tx_response.raw_log}`,
      tx_response: res.tx_response,
    };
  }

  return res;
}

