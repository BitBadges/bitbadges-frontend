import { AddressMapping } from "bitbadgesjs-proto";
import { AddressMappingSelect } from "../form-items/AddressMappingSelect";

export function AddressMappingSelectStepItem(
  addressMapping: AddressMapping,
  setAddressMapping: (addressMapping: AddressMapping) => void,
) {

  return {
    title: 'Select Users',
    description: ``,
    node: <AddressMappingSelect addressMapping={addressMapping} setAddressMapping={setAddressMapping} />,
    disabled: (addressMapping.addresses.length === 0 && addressMapping.includeAddresses == true),
  }
}