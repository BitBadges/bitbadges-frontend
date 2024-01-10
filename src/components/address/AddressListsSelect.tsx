import { CloseOutlined, PlusOutlined, WarningOutlined } from "@ant-design/icons"
import { Input, Switch } from "antd"
import { AddressList } from "bitbadgesjs-proto"
import { isAddressListEmpty } from "bitbadgesjs-utils"
import { useState } from "react"
import { generateReservedListId } from "bitbadgesjs-utils"
import IconButton from "../display/IconButton"
import { AddressDisplayList } from "./AddressDisplayList"
import { BatchAddressSelect } from "./AddressListSelect"

export const autoGenerateId = (
  addressList: AddressList,
  autoGenerateListId: boolean
): AddressList => {
  if (!autoGenerateListId) return addressList

  const listId = generateReservedListId(addressList)

  // Create a new AddressList with the calculated listId
  const updatedAddressList: AddressList = {
    ...addressList,
    listId: listId,
  }

  return updatedAddressList
}

export function AddressListSelect({
  addressList,
  setAddressList,
  disabled,
  showErrorOnEmpty,
  allowMintSearch,
  isIdSelect,
  autoGenerateListId = true,
}: {
  addressList: AddressList
  setAddressList: (addressList: AddressList) => void
  disabled?: boolean
  showErrorOnEmpty?: boolean
  allowMintSearch?: boolean
  isIdSelect?: boolean
  autoGenerateListId?: boolean
}) {
  const [visible, setVisible] = useState(false)

  const [currId, setCurrId] = useState("")

  //Will need to change this in the future, but autoGenerateListId is currently only used for the AddressListSelectStepItem and is false for updates (not creates)
  const disableListTypeChange = !autoGenerateListId

  return (
    <div
      className="primary-text full-width flex-column"
      style={{ width: "100%", maxWidth: 500 }}
    >
      <div>
        <br />
        <div style={{ textAlign: "center" }}>
          <b>
            <Switch
              disabled={disabled || disableListTypeChange}
              checked={addressList.allowlist}
              checkedChildren={"Allowlist"}
              unCheckedChildren={"Blocklist"}
              onChange={(e) => {
                setAddressList(
                  autoGenerateId(
                    {
                      ...addressList,
                      allowlist: e,
                    },
                    autoGenerateListId
                  )
                )
              }}
              className="primary-text inherit-bg"
            ></Switch>{" "}
            - {isIdSelect ? "IDs" : "Addresses"} (
            {addressList.addresses.length})
          </b>
        </div>
        <div style={{ textAlign: "center" }}>
          {showErrorOnEmpty && isAddressListEmpty(addressList) && (
            <>
              <br />
              <span style={{ color: "red" }}>
                {" "}
                <WarningOutlined /> Allowlists must have at least one address.
              </span>
            </>
          )}
        </div>
        <br />
        {
          <div className="flex-center">
            <AddressDisplayList
              trackerIdList={isIdSelect}
              users={addressList.addresses}
              allExcept={!addressList.allowlist}
              setUsers={(users) => {
                setAddressList(
                  autoGenerateId(
                    {
                      ...addressList,
                      addresses: users,
                    },
                    autoGenerateListId
                  )
                )
              }}
              hideIcons={disabled}
            />
          </div>
        }
      </div>

      {!disabled && (
        <>
          <br />
          <div className="flex-center">
            <IconButton
              src={visible ? <CloseOutlined /> : <PlusOutlined />}
              onClick={() => {
                setVisible(!visible)
              }}
              text={visible ? "Cancel" : "Add"}
            />
          </div>
        </>
      )}

      {!disabled && visible && !isIdSelect && (
        <>
          <BatchAddressSelect
            users={addressList.addresses}
            setUsers={(users) => {
              setAddressList(
                autoGenerateId(
                  {
                    ...addressList,
                    addresses: users,
                  },
                  autoGenerateListId
                )
              )
              setVisible(false)
            }}
            hideAddresses
            disabled={disabled}
            allowMintSearch={allowMintSearch}
          />
        </>
      )}

      {!disabled && visible && isIdSelect && (
        <>
          <Input
            placeholder="Enter ID"
            value={currId}
            onChange={(e) => {
              setCurrId(e.target.value)
            }}
          />
          <br />

          <button
            className="landing-button"
            style={{ width: "100%" }}
            onClick={() => {
              setAddressList(
                autoGenerateId(
                  {
                    ...addressList,
                    addresses: [...addressList.addresses, currId],
                  },
                  autoGenerateListId
                )
              )
              setCurrId("")
              setVisible(false)
            }}
          >
            Add
          </button>
        </>
      )}

      <br />
    </div>
  )
}
