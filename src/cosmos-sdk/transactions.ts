import { CHAIN_DETAILS } from "bitbadges-sdk";
import { DEV_MODE } from "../constants";
import { getSenderInformation } from "./broadcast";
import { getStatus } from "../bitbadges-api/api";
import { ChainContextType } from "../contexts/ChainContext";


export async function fetchDefaultTxDetails(chain: ChainContextType, userGasTokenBalance: number) {
    const sender = await getSenderInformation(chain);
    const statusRes = await getStatus();
    const gasPrice = statusRes.status.gasPrice;
    const gasLimit = 200000; //TODO: simulate this
    const amount = Math.ceil(gasLimit * gasPrice);

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