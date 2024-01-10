import { Col, Input, Dropdown } from "antd"
import { AddressListWithMetadata } from "bitbadgesjs-utils"
import { useState, useEffect } from "react"
import { getAddressLists } from "../../bitbadges-api/api"
import { BatchBadgeDetails } from "bitbadgesjs-utils"
import { GO_MAX_UINT_64 } from "../../utils/dates"
import { AddressListCard } from "../badges/AddressListCard"
import { InformationDisplayCard } from "./InformationDisplayCard"
import { SearchDropdown } from "../navigation/SearchDropdown"
import { BatchBadgeDetailsTag } from "../badges/DisplayFilters"
import { useAccount } from "../../bitbadges-api/contexts/accounts/AccountsContext"

export const NewPageInputForm = ({
  visible,
  setVisible,
  onAddPage,
}: {
  visible: boolean
  setVisible: (visible: boolean) => void
  onAddPage: (newPageTitle: string, newPageDescription: string) => Promise<void>
}) => {
  const [newPageTitle, setNewPageTitle] = useState("")
  const [newPageDescription, setNewPageDescription] = useState("")

  return (
    <>
      {visible && (
        <div className="flex-center ">
          <Col md={12} xs={24} style={{ marginBottom: 8 }}>
            <b className="primary-text">
              Name
            </b>
            <br />
            <Input
              defaultValue=""
              placeholder="Title of your page"
              className="form-input"
              style={{
                marginRight: 8,
              }}
              onChange={(e) => {
                if (e) setNewPageTitle(e.target.value)
              }}
            />
            <br />
            <br />
            <b className="primary-text">
              Description
            </b>
            <br />
            <Input.TextArea
              rows={10}
              defaultValue=""
              placeholder="Give a brief description of your page."
              className="form-input"
              style={{
                marginRight: 8,
              }}
              onChange={(e) => {
                if (e) setNewPageDescription(e.target.value)
              }}
            />
            <br />
            <br />
            <div className="flex-center full-width">
              <button
                className="landing-button"
                style={{ width: "100%" }}
                onClick={async () => {
                  await onAddPage(newPageTitle, newPageDescription)

                  setVisible(false)
                  setNewPageDescription("")
                  setNewPageTitle("")
                }}
              >
                Add Page
              </button>
            </div>
          </Col>
        </div>
      )}
    </>
  )
}


export const CustomizeAddRemoveListFromPage = ({
  addressOrUsername,
  onAdd,
  onRemove,
}: {
  addressOrUsername: string
  onAdd: (listId: string) => Promise<void>
  onRemove: (listId: string) => Promise<void>
}) => {
  const accountInfo = useAccount(addressOrUsername)

  const [customizeSearchListValue, setCustomizeSearchListValue] =
    useState<string>("")
  const [selectedList, setSelectedList] = useState<string>("")
  const [selectedListList, setSelectedListList] =
    useState<AddressListWithMetadata<bigint> | null>(null)

  useEffect(() => {
    if (!selectedList) return
    async function fetchAddressList() {
      const listRes = await getAddressLists({
        listIds: [selectedList],
      })
      if (listRes.addressLists.length > 0) {
        setSelectedListList(listRes.addressLists[0])
      }
    }

    fetchAddressList()
  }, [selectedList])

  const CustomizeListSearchBar = (
    <Input
      defaultValue=""
      placeholder={"Add or remove by searching a list"}
      value={customizeSearchListValue}
      onChange={async (e) => {
        setCustomizeSearchListValue(e.target.value)
      }}
      className="form-input"

    />
  )

  const CustomizeSearchListDropdown = (
    <Dropdown
      open={customizeSearchListValue !== ""}
      placement="bottom"
      overlay={
        <SearchDropdown
          onlyLists
          onSearch={async (
            searchValue: any,
            isAccount?: boolean | undefined,
            isCollection?: boolean | undefined,
            isBadge?: boolean | undefined
          ) => {
            if (
              !isAccount &&
              !isCollection &&
              !isBadge &&
              typeof searchValue === "string"
            ) {
              setSelectedList(searchValue)
              setCustomizeSearchListValue("")
            }
          }}
          searchValue={customizeSearchListValue}
        />
      }
      overlayClassName="primary-text inherit-bg"
      className="inherit-bg"
      trigger={["hover", "click"]}
    >
      {CustomizeListSearchBar}
    </Dropdown>
  )

  if (!accountInfo) return <></>

  return (
    <InformationDisplayCard

      md={12}
      xs={24}
      style={{ marginBottom: 8 }}
      noBorder={!selectedList}
      inheritBg={!selectedList}
    >
      <div className="flex">{CustomizeSearchListDropdown}</div>

      {selectedList && selectedListList && (
        <>
          <br />
          <div className="flex-center">
            <AddressListCard
              addressList={selectedListList}
              addressOrUsername={accountInfo.address}
            />
          </div>
          <br />
        </>
      )}

      {selectedList && (
        <div className="flex-center flex-wrap">
          <button
            className="landing-button"
            onClick={async () => {
              if (!selectedList) return

              await onAdd(selectedList)

              setSelectedList("")
            }}
          >
            Add
          </button>

          <button
            className="landing-button"
            onClick={async () => {
              if (!selectedList) return

              await onRemove(selectedList)

              setSelectedList("")
            }}
          >
            Remove
          </button>
        </div>
      )}
    </InformationDisplayCard>
  )
}

export const CustomizeAddRemoveBadgeFromPage = ({
  onAdd,
  onRemove,
}: {
  onAdd: (badgeIdObj: BatchBadgeDetails<bigint>) => Promise<void>
  onRemove: (badgeIdObj: BatchBadgeDetails<bigint>) => Promise<void>
}) => {
  const [selectedBadge, setSelectedBadge] = useState<BatchBadgeDetails<bigint> | null>(
    null
  )
  const [customizeSearchValue, setCustomizeSearchValue] = useState<string>("")

  const CustomizeSearchBar = (
    <Input
      defaultValue=""
      placeholder={"Add or remove by searching a collection or badge"}
      value={customizeSearchValue}
      onChange={async (e) => {
        setCustomizeSearchValue(e.target.value)
      }}
      className="form-input"

    />
  )

  const CustomizeSearchDropdown = (
    <Dropdown
      open={customizeSearchValue !== ""}
      placement="bottom"
      overlay={
        <SearchDropdown
          onlyCollections
          onSearch={async (
            searchValue: any,
            _isAccount?: boolean | undefined,
            isCollection?: boolean | undefined,
            isBadge?: boolean | undefined
          ) => {
            if (typeof searchValue === "string") {
              if (isCollection) {
                setSelectedBadge({
                  collectionId: BigInt(searchValue),
                  badgeIds: [{ start: 1n, end: GO_MAX_UINT_64 }],
                })
              } else if (isBadge) {
                const collectionId = BigInt(searchValue.split("/")[0])
                const badgeId = BigInt(searchValue.split("/")[1])

                setSelectedBadge({
                  collectionId,
                  badgeIds: [{ start: badgeId, end: badgeId }],
                })
              }

              setCustomizeSearchValue("")
            }
          }}
          searchValue={customizeSearchValue}
        />
      }
      overlayClassName="primary-text inherit-bg"
      className="inherit-bg"
      trigger={["hover", "click"]}
    >
      {CustomizeSearchBar}
    </Dropdown>
  )

  return (
    <>
      <InformationDisplayCard

        md={12}
        xs={24}
        style={{ marginBottom: 8 }}
        noBorder={!selectedBadge}
        inheritBg={!selectedBadge}
      >
        <div className="flex">{CustomizeSearchDropdown}</div>

        {selectedBadge && (
          <>
            <br />
            <div className="flex-center">
              <BatchBadgeDetailsTag
                badgeIdObj={selectedBadge}
                onClose={() => {
                  setSelectedBadge(null)
                }}
              />
            </div>
            <br />
          </>
        )}

        {selectedBadge && (
          <div className="flex-center flex-wrap">
            <button
              className="landing-button"
              onClick={async () => {
                if (!selectedBadge) return

                await onAdd(selectedBadge)

                setSelectedBadge(null)
              }}
            >
              Add
            </button>

            <button
              className="landing-button"
              onClick={async () => {
                if (!selectedBadge) return

                await onRemove(selectedBadge)

                setSelectedBadge(null)
              }}
            >
              Remove
            </button>
          </div>
        )}
      </InformationDisplayCard>
    </>
  )
}