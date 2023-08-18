import { InfoCircleOutlined } from "@ant-design/icons";
import { Checkbox } from "antd";
import { AddressMapping } from "bitbadgesjs-proto";
import { AddressDisplayList } from "../../address/AddressDisplayList";
import { AddressListSelect } from "../../address/AddressListSelect";

export function AddressMappingSelectStepItem(
  addressMapping: AddressMapping,
  setAddressMapping: (addressMapping: AddressMapping) => void,
) {

  return {
    title: 'Select Users',
    description: ``,
    node: <div className="flex-center flex-column primary-text">
      <div style={{ maxWidth: 500, minWidth: 360 }}>

        <AddressListSelect
          users={addressMapping.addresses}
          setUsers={(users) => {
            setAddressMapping({
              ...addressMapping,
              addresses: users,
            });
          }}
          hideAddresses

        />
        <br />
        <br />
        <div className="flex-center">
          <Checkbox
            checked={addressMapping.includeAddresses}
            onChange={(e) => {
              setAddressMapping({
                ...addressMapping,
                includeAddresses: e.target.checked,
              });
            }}
            className="primary-text primary-blue-bg"
          >
            <div className='primary-text primary-blue-bg' style={{ fontSize: 14 }}>
              Include Addresses
            </div>
          </Checkbox>

        </div>
        <br />
        <div style={{ textAlign: 'center' }}>
          <InfoCircleOutlined style={{ marginRight: 4 }} />
          You have {addressMapping.includeAddresses ? 'selected' : 'excluded'} the following addresses.
          {addressMapping.includeAddresses ? ' ' : ' All other addresses will be included in the list.'}
        </div>
        <br />
        <br />
        <div style={{ textAlign: 'center' }}><b>Selected Addresses</b></div>
        <AddressDisplayList
          users={addressMapping.addresses}
          allExcept={!addressMapping.includeAddresses}
          setUsers={(users) => {
            setAddressMapping({
              ...addressMapping,
              addresses: users,
            });
          }}
          fontColor="white"
        /></div>

    </div>,
    disabled: (addressMapping.addresses.length === 0 && addressMapping.includeAddresses == true),
  }
}