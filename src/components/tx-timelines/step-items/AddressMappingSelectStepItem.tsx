import { isAddressMappingEmpty } from "bitbadgesjs-utils";
import { useTxTimelineContext } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { AddressMappingSelect } from "../../address/AddressMappingSelect";

export function AddressMappingSelectStepItem() {
  const txTimelineContext = useTxTimelineContext();
  const addressMapping = txTimelineContext.addressMapping;
  const setAddressMapping = txTimelineContext.setAddressMapping;

  return {
    title: 'Select Users',
    description: ``,
    node: <div className='flex-center full-width'>
      <AddressMappingSelect addressMapping={addressMapping} setAddressMapping={setAddressMapping} />
    </div>,
    disabled: isAddressMappingEmpty(addressMapping)
  }
}