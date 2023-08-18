import { SubmitMsgCreateAddressMapping } from "../form-items/SubmitMsgCreateAdressMapping";
import { MsgUpdateCollectionProps } from "../TxTimeline";

export function CreateAddressMappingStepItem(
  txState: MsgUpdateCollectionProps,
) {
  return {
    title: 'Submit Transaction',
    description: '',
    node: <SubmitMsgCreateAddressMapping
      txState={txState}
    />
  }
}