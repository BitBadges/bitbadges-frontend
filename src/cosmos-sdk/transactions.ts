import { Chain, Fee, NumberType, Sender } from "bitbadgesjs-proto";

export interface TxDetails {
  chain: Chain,
  sender: {
    accountNumber: NumberType,
    sequence: NumberType,
    pubkey: string,
    accountAddress: string,
  },
  fee: {
    amount: NumberType,
    denom: NumberType,
    gas: NumberType,
  },
  memo: string
}

export async function formatAndCreateGenericTx(
  createTxFunction: (
    chain: Chain,
    sender: Sender,
    fee: Fee,
    memo: string,
    msg: object
  ) => any,
  txDetails: TxDetails,
  msg: object
) {
  let txMsg = createTxFunction(
    txDetails.chain,
    {
      ...txDetails.sender,
      sequence: Number(txDetails.sender.sequence.toString()),
      accountNumber: Number(txDetails.sender.accountNumber.toString()),
    },
    {
      amount: txDetails.fee.amount.toString(),
      denom: txDetails.fee.denom.toString(),
      gas: txDetails.fee.gas.toString(),
    },
    txDetails.memo,
    msg
  )

  return txMsg;
}