import { isAddressMappingEmpty } from "bitbadgesjs-utils";
import { useTxTimelineContext } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { AddressMappingSelect } from "../../address/AddressMappingSelect";
import { GenericFormStepWrapper } from "../form-items/GenericFormStepWrapper";
import { InformationDisplayCard } from "../../display/InformationDisplayCard";

export function AddressMappingSelectStepItem() {
  const txTimelineContext = useTxTimelineContext();
  const addressMapping = txTimelineContext.addressMapping;
  const setAddressMapping = txTimelineContext.setAddressMapping;

  return {
    title: 'Select Users',
    description: txTimelineContext.isUpdateAddressMapping ? <></> : <></>,
    node: () => <GenericFormStepWrapper
      documentationLink="https://docs.bitbadges.io/overview/how-it-works/badges-vs-address-lists#address-lists"
      node={() => <div className='flex-center full-width'>
        <InformationDisplayCard title='' md={12} sm={24} xs={24} >
          <div className='flex-center full-width'>
            
        <AddressMappingSelect 
          addressMapping={addressMapping} 
          setAddressMapping={setAddressMapping} 
          autoGenerateMappingId={!txTimelineContext.isUpdateAddressMapping} 
        /></div>
      </InformationDisplayCard>
      </div>
      }
    />,
    disabled: isAddressMappingEmpty(addressMapping)
  }
}