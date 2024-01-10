import { SubmitMsgCreateAddressList } from "../form-items/SubmitMsgCreateAdressLists";

export function CreateAddressListStepItem() {
  return {
    title: 'Submit Transaction',
    description: '',
    node: () => <SubmitMsgCreateAddressList />
  }
}