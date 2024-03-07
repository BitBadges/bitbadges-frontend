import { useTxTimelineContext } from '../../../bitbadges-api/contexts/TxTimelineContext';
import { AddressListSelect } from '../../address/AddressListsSelect';
import { GenericFormStepWrapper } from '../form-items/GenericFormStepWrapper';
import { InformationDisplayCard } from '../../display/InformationDisplayCard';
import { BitBadgesAddressList } from 'bitbadgesjs-sdk';

export function AddressListSelectStepItem() {
  const txTimelineContext = useTxTimelineContext();
  const addressList = txTimelineContext.addressList;
  const setAddressList = txTimelineContext.setAddressList;

  return {
    title: 'Select Users',
    description: txTimelineContext.isUpdateAddressList ? <></> : <></>,
    node: () => (
      <GenericFormStepWrapper
        documentationLink="https://docs.bitbadges.io/overview/how-it-works/badges-vs-address-lists#address-lists"
        node={() => (
          <div className="flex-center full-width">
            <InformationDisplayCard title="" md={12} sm={24} xs={24}>
              <div className="flex-center full-width">
                <AddressListSelect
                  addressList={addressList}
                  setAddressList={(coreList) => {
                    setAddressList(
                      new BitBadgesAddressList<bigint>({
                        ...addressList,
                        ...coreList
                      })
                    );
                  }}
                  autoGenerateListId={!txTimelineContext.isUpdateAddressList}
                />
              </div>
            </InformationDisplayCard>
          </div>
        )}
      />
    )
  };
}
