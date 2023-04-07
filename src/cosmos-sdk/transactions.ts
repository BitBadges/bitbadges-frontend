import { CHAIN_DETAILS } from "bitbadges-sdk";
import { DEV_MODE } from "../constants";
import { getSenderInformation } from "./broadcast";

//TODO: Dynamically fetch gas and fee from chain
async function fetchDefaultTxDetails(chain: any) {
    const sender = await getSenderInformation(chain);
    const fee = {
        amount: '1',
        denom: 'token',
        gas: '200000',
    }
    const memo = '';

    const txDetails = {
        chain: CHAIN_DETAILS,
        sender, fee, memo
    }
    if (DEV_MODE) console.log("Fetched Default Tx Details: ", txDetails)
    return txDetails;
}

export async function formatAndCreateGenericTx(createTxFunction: any, chain: any, msg: any) {
    const txDetails = await fetchDefaultTxDetails(chain);
    let txMsg = createTxFunction(
        txDetails.chain,
        txDetails.sender,
        txDetails.fee,
        txDetails.memo,
        msg
    )

    return txMsg;
}