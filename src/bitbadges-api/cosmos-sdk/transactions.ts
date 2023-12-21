import { Chain, NumberType } from "bitbadgesjs-proto";

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
