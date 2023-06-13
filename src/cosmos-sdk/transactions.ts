import { CHAIN_DETAILS, DEV_MODE } from "../constants";
import { ChainContextType } from "../bitbadges-api/contexts/ChainContext";
import { getSenderInformation } from "./broadcast";
import { AccountsContextType } from "../bitbadges-api/contexts/AccountsContext";


export async function fetchDefaultTxDetails(chain: ChainContextType, accounts: AccountsContextType, gasPrice: bigint) {
  const sender = await getSenderInformation(chain, accounts);

  const gasLimit = 200000n; //default - simulates and sets later
  const amount = gasLimit * gasPrice;

  const fee = {
    amount: `${amount}`,
    denom: 'badge',
    gas: `${gasLimit}`,
  }
  const memo = '';

  const txDetails = {
    chain: CHAIN_DETAILS,
    sender, fee, memo
  }
  if (DEV_MODE) console.log("Fetched Default Tx Details: ", txDetails)
  return txDetails;
}

export async function formatAndCreateGenericTx(createTxFunction: any, txDetails: any, msg: any) {
  let txMsg = createTxFunction(
    txDetails.chain,
    txDetails.sender,
    txDetails.fee,
    txDetails.memo,
    msg
  )

  return txMsg;
}