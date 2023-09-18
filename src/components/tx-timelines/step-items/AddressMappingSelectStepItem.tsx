import { isAddressMappingEmpty } from "bitbadgesjs-utils";
import { useTxTimelineContext } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { AddressMappingSelect } from "../form-items/AddressMappingSelect";

export function AddressMappingSelectStepItem() {
  const txTimelineContext = useTxTimelineContext();
  const addressMapping = txTimelineContext.addressMapping;
  const setAddressMapping = txTimelineContext.setAddressMapping;

  return {
    title: 'Select Users',
    description: ``,
    node: <AddressMappingSelect addressMapping={addressMapping} setAddressMapping={setAddressMapping} />,
    disabled: isAddressMappingEmpty(addressMapping)
  }
}