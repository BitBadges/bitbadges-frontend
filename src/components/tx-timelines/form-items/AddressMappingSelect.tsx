import { InfoCircleOutlined } from "@ant-design/icons";
import { Checkbox } from "antd";
import { AddressMapping } from "bitbadgesjs-proto";
import { AddressDisplayList } from "../../address/AddressDisplayList";
import { AddressListSelect } from "../../address/AddressListSelect";

export function AddressMappingSelect({
  addressMapping,
  setAddressMapping,

}: {
  addressMapping: AddressMapping,
  setAddressMapping: (addressMapping: AddressMapping) => void,
}) {
  return <div className="flex-center flex-column primary-text">
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
          className="primary-text inherit-bg"
        >
          <div className='primary-text inherit-bg' style={{ fontSize: 14 }}>
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

  </div>
}