import { CloseOutlined, PlusOutlined, WarningOutlined } from "@ant-design/icons";
import { Input, Switch } from "antd";
import { AddressMapping } from "bitbadgesjs-proto";
import { isAddressMappingEmpty } from "bitbadgesjs-utils";
import { useState } from "react";
import { getReservedMappingId } from "../../bitbadges-api/utils/mappings";
import IconButton from "../display/IconButton";
import { AddressDisplayList } from "./AddressDisplayList";
import { AddressListSelect } from "./AddressListSelect";


export const addMappingId = (addressMapping: AddressMapping, autoGenerateMappingId: boolean): AddressMapping => {
  if (!autoGenerateMappingId) return addressMapping;

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
  allowMintSearch,
  isIdSelect,
  autoGenerateMappingId = true
}: {
  addressMapping: AddressMapping,
  setAddressMapping: (addressMapping: AddressMapping) => void,
  disabled?: boolean,
  showErrorOnEmpty?: boolean,
  allowMintSearch?: boolean,
  isIdSelect?: boolean,
  autoGenerateMappingId?: boolean,
}) {
  const [visible, setVisible] = useState(false);

  const [currId, setCurrId] = useState("");

  //Will need to change this in the future, but autoGenerateMappingId is currently only used for the AddressMappingSelectStepItem and is false for updates (not creates)
  const disableListTypeChange = !autoGenerateMappingId;
  

  return <div className="primary-text full-width flex-column" style={{ width: '100%', maxWidth: 500, }}>
    <div >

      <br />
      <div style={{ textAlign: 'center' }}><b>
        <Switch
          disabled={disabled || disableListTypeChange}
          checked={addressMapping.includeAddresses}
          checkedChildren={"Whitelist"}
          unCheckedChildren={"Blacklist"}
          onChange={(e) => {
            setAddressMapping(addMappingId({
              ...addressMapping,
              includeAddresses: e,
            }, autoGenerateMappingId));
          }}
          className="primary-text inherit-bg"
        ></Switch> - {isIdSelect ? 'IDs' : 'Addresses'} ({addressMapping.addresses.length})</b></div>
      <div style={{ textAlign: 'center' }}>
        {/* Any inputted addresses have been {addressMapping.includeAddresses ? 'whitelisted' : 'blacklisted'}.
        {addressMapping.includeAddresses ? ' ' : ' All other addresses will be valid.'} */}

        {showErrorOnEmpty && isAddressMappingEmpty(addressMapping) && <>
          <br /><span style={{ color: 'red' }}> <WarningOutlined /> Whitelists must have at least one address.</span></>}
      </div>
      <br />
      {<div className='flex-center'>
        <AddressDisplayList
          trackerIdList={isIdSelect}
          users={addressMapping.addresses}
          allExcept={!addressMapping.includeAddresses}
          setUsers={(users) => {
            setAddressMapping(addMappingId({
              ...addressMapping,
              addresses: users,
            }, autoGenerateMappingId));
          }}
          hideIcons={disabled}
        /></div>
      }

    </div>


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

    {!disabled && visible && !isIdSelect && <>
      <AddressListSelect
        users={addressMapping.addresses}
        setUsers={(users) => {
          setAddressMapping(addMappingId({
            ...addressMapping,
            addresses: users,
          }, autoGenerateMappingId));
          setVisible(false);
        }}
        hideAddresses
        disabled={disabled}
        allowMintSearch={allowMintSearch}
      />
    </>}

    {!disabled && visible && isIdSelect && <>
      <Input
        placeholder="Enter ID"
        value={currId}
        onChange={(e) => {
          setCurrId(e.target.value);
        }}
      />
      <br />

      <button className="landing-button"
        style={{ width: '100%' }}
        onClick={() => {
          console.log(currId);
          setAddressMapping(addMappingId({
            ...addressMapping,
            addresses: [...addressMapping.addresses, currId],
          }, autoGenerateMappingId));
          console.log(addressMapping);
          setCurrId("");
          setVisible(false);
        }}>Add</button>
    </>}

    <br />
  </div>
}