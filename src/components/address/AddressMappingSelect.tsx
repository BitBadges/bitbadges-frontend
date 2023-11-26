import { CloseOutlined, PlusOutlined, WarningOutlined } from "@ant-design/icons";
import { Switch } from "antd";
import { AddressMapping } from "bitbadgesjs-proto";
import { isAddressMappingEmpty } from "bitbadgesjs-utils";
import { useState } from "react";
import { getReservedMappingId } from "../../bitbadges-api/utils/mappings";
import IconButton from "../display/IconButton";
import { AddressDisplayList } from "./AddressDisplayList";
import { AddressListSelect } from "./AddressListSelect";


export const addMappingId = (addressMapping: AddressMapping): AddressMapping => {
  const mappingId = getReservedMappingId(addressMapping);

  // Create a new AddressMapping with the calculated mappingId
  const updatedAddressMapping: AddressMapping = {
    ...addressMapping,
    mappingId: mappingId,
  };

  return updatedAddressMapping;
};

export function AddressMappingSelect({
  addressMapping,
  setAddressMapping,
  disabled,
  showErrorOnEmpty,
  allowMintSearch
}: {
  addressMapping: AddressMapping,
  setAddressMapping: (addressMapping: AddressMapping) => void,
  disabled?: boolean,
  showErrorOnEmpty?: boolean,
  allowMintSearch?: boolean
}) {
  const [visible, setVisible] = useState(false);



  return <div className="primary-text full-width flex-column" style={{ width: '100%', maxWidth: 500, }}>
    <div >

      <br />
      <div style={{ textAlign: 'center' }}><b>
        <Switch
          disabled={disabled}
          checked={addressMapping.includeAddresses}
          checkedChildren={"Whitelist"}
          unCheckedChildren={"Blacklist"}
          onChange={(e) => {
            setAddressMapping(addMappingId({
              ...addressMapping,
              includeAddresses: e,
            }));
          }}
          className="primary-text inherit-bg"
        ></Switch> - Addresses ({addressMapping.addresses.length})</b></div>
      <div style={{ textAlign: 'center' }}>
        {/* Any inputted addresses have been {addressMapping.includeAddresses ? 'whitelisted' : 'blacklisted'}.
        {addressMapping.includeAddresses ? ' ' : ' All other addresses will be valid.'} */}

        {showErrorOnEmpty && isAddressMappingEmpty(addressMapping) && <>
          <br /><span style={{ color: 'red' }}> <WarningOutlined /> Whitelists must have at least one address.</span></>}
      </div>
      <br />
      <div className='flex-center'>
        <AddressDisplayList
          users={addressMapping.addresses}
          allExcept={!addressMapping.includeAddresses}
          setUsers={(users) => {
            setAddressMapping(addMappingId({
              ...addressMapping,
              addresses: users,
            }));
          }}
          hideIcons={disabled}
        /></div></div>
    {!disabled && <><br />
      <div className='flex-center'>

        <IconButton
          src={visible ? <CloseOutlined /> : <PlusOutlined />}
          onClick={() => {
            setVisible(!visible);
          }}
          text={visible ? 'Cancel' : 'Add'}
        />
      </div>
    </>}

    {!disabled && visible && <>
      <AddressListSelect
        users={addressMapping.addresses}
        setUsers={(users) => {
          setAddressMapping(addMappingId({
            ...addressMapping,
            addresses: users,
          }));
        }}
        hideAddresses
        disabled={disabled}
        allowMintSearch={allowMintSearch}
      />
    </>}
    <br />
  </div>
}