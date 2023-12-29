import { SubmitMsgCreateAddressMapping } from "../form-items/SubmitMsgCreateAdressMapping";

export function CreateAddressMappingStepItem(
) {
  return {
    title: 'Submit Transaction',
    description: '',
    node: () => <SubmitMsgCreateAddressMapping />
  }
}