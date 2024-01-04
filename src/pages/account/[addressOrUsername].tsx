import {
  CloseCircleOutlined,
  InfoCircleOutlined,
  MinusOutlined,
  PlusOutlined
} from "@ant-design/icons"
import {
  Col,
  Divider,
  Dropdown,
  Empty,
  Input,
  Layout,
  Spin,
  Tag,
  Tooltip,
  Typography,
  notification
} from "antd"
import { UintRange, deepCopy } from "bitbadgesjs-proto"
import {
  AccountViewKey,
  AddressMappingWithMetadata,
  Numberify,
  getMaxBadgeIdForCollection,
  getMetadataForBadgeId,
  isFullUintRanges,
  removeUintRangeFromUintRange,
  sortUintRangesAndMergeIfNecessary,
} from "bitbadgesjs-utils"
import { SHA256 } from "crypto-js"
import { useRouter } from "next/router"
import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react"
import InfiniteScroll from "react-infinite-scroll-component"
import { getAddressMappings } from "../../bitbadges-api/api"
import { useChainContext } from "../../bitbadges-api/contexts/ChainContext"
import {
  fetchAccounts,
  fetchNextForAccountViews,
  getAccountActivityView,
  getAccountAddressMappingsView,
  getAccountBalancesView,
  getAccountListsActivityView,
  updateAccount,
  updateProfileInfo,
  useAccount,
} from "../../bitbadges-api/contexts/accounts/AccountsContext"
import {
  fetchBalanceForUser,
  getCollection,
} from "../../bitbadges-api/contexts/collections/CollectionsContext"
import { AccountHeader } from "../../components/badges/AccountHeader"
import { AddressListCard } from "../../components/badges/AddressListCard"
import { BadgeAvatar } from "../../components/badges/BadgeAvatar"
import { MultiCollectionBadgeDisplay } from "../../components/badges/MultiCollectionBadgeDisplay"
import { BlockinDisplay } from "../../components/blockin/BlockinDisplay"
import { SelectWithOptions } from "../../components/collection-page/BadgesTab"
import { ListActivityTab } from "../../components/collection-page/ListActivityDisplay"
import { ReputationTab } from "../../components/collection-page/ReputationTab"
import { ActivityTab } from "../../components/collection-page/TransferActivityDisplay"
import { DevMode } from "../../components/common/DevMode"
import IconButton from "../../components/display/IconButton"
import { InformationDisplayCard } from "../../components/display/InformationDisplayCard"
import { SearchDropdown } from "../../components/navigation/SearchDropdown"
import { Tabs } from "../../components/navigation/Tabs"
import { ReportedWrapper } from "../../components/wrappers/ReportedWrapper"
import { INFINITE_LOOP_MODE } from "../../constants"
import { compareObjects } from "../../utils/compare"
import { GO_MAX_UINT_64 } from "../../utils/dates"


const { Content } = Layout

export interface BatchBadgeDetails {
  collectionId: bigint
  badgeIds: UintRange<bigint>[]
}

export const addToArray = (
  arr: BatchBadgeDetails[],
  badgeIdObjsToAdd: BatchBadgeDetails[]
) => {
  for (const badgeIdObj of badgeIdObjsToAdd) {
    const badgeIdsToAdd = badgeIdObj.badgeIds
    const existingIdx = arr.findIndex(
      (x) => x.collectionId == badgeIdObj.collectionId
    )
    if (existingIdx != -1) {
      arr[existingIdx].badgeIds = sortUintRangesAndMergeIfNecessary(
        [...arr[existingIdx].badgeIds, ...badgeIdsToAdd],
        true
      )
    } else {
      arr.push({
        collectionId: badgeIdObj.collectionId,
        badgeIds: badgeIdsToAdd,
      })
    }
  }

  return arr.filter((x) => x.badgeIds.length > 0)
}

export const removeFromArray = (
  arr: BatchBadgeDetails[],
  badgeIdObjsToRemove: BatchBadgeDetails[]
) => {
  for (const badgeIdObj of badgeIdObjsToRemove) {
    const badgeIdsToRemove = badgeIdObj.badgeIds

    const existingIdx = arr.findIndex(
      (x) => x.collectionId == badgeIdObj.collectionId
    )
    if (existingIdx != -1) {
      const [remaining] = removeUintRangeFromUintRange(
        badgeIdsToRemove,
        arr[existingIdx].badgeIds
      )
      arr[existingIdx].badgeIds = remaining
    }
  }

  return arr.filter((x) => x.badgeIds.length > 0)
}

export const ListFilterSearchBar = ({
  searchValue,
  setSearchValue,
  onSearch,
}: {
  searchValue: string
  setSearchValue: (searchValue: string) => void
  onSearch: (
    searchValue: any,
    isAccount?: boolean | undefined,
    isCollection?: boolean | undefined,
    isBadge?: boolean | undefined
  ) => Promise<void>
}) => {
  const SearchBar = (
    <Input
      defaultValue=""
      placeholder="Filter by searching a list"
      value={searchValue}
      onChange={async (e) => {
        setSearchValue(e.target.value)
      }}
      className="form-input rounded-lg p-1 px-2"
      //styled-button-normal rounded-lg p-1 focus:outline-none focus:ring-2 focus:border-transparent cursor-pointer
      style={{ height: 38 }}
    />
  )

  const FilterSearchDropdown = (
    <Dropdown
      open={searchValue !== ""}
      placement="bottom"
      overlay={
        <SearchDropdown
          onlyLists
          onSearch={onSearch}
          searchValue={searchValue}
        />
      }
      overlayClassName="primary-text inherit-bg"
      className="inherit-bg"
      trigger={["hover", "click"]}
    >
      {SearchBar}
    </Dropdown>
  )

  return FilterSearchDropdown
}

export const CollectionsFilterSearchBar = ({
  specificCollectionId,
  searchValue,
  setSearchValue,
  onSearch,
}: {
  specificCollectionId?: bigint
  searchValue: string
  setSearchValue: (searchValue: string) => void
  onSearch: (
    searchValue: any,
    isAccount?: boolean | undefined,
    isCollection?: boolean | undefined,
    isBadge?: boolean | undefined
  ) => Promise<void>
}) => {
  const SearchBar = (
    <Input
      defaultValue=""
      placeholder={
        specificCollectionId
          ? "Filter by name or ID"
          : "Filter by name or ID"
      }
      value={searchValue}
      onChange={async (e) => {
        setSearchValue(e.target.value)
      }}
      className="form-input rounded-lg p-1 px-2"
      style={{ height: 38 }}
    />
  )

  const FilterSearchDropdown = (
    <Dropdown
      open={searchValue !== ""}
      placement="bottom"
      overlay={
        <SearchDropdown
          onlyCollections
          onSearch={onSearch}
          searchValue={searchValue}
          specificCollectionId={specificCollectionId}
        />
      }
      overlayClassName="primary-text inherit-bg"
      className="inherit-bg"
      trigger={["hover", "click"]}
    >
      {SearchBar}
    </Dropdown>
  )

  return FilterSearchDropdown
}

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
            <b className="primary-text" style={{}}>
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
            <b className="primary-text" style={{}}>
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

export const BatchBadgeDetailsTag = ({
  badgeIdObj,
  onClose,
}: {
  badgeIdObj: BatchBadgeDetails
  onClose?: () => void
}) => {
  const collection = getCollection(badgeIdObj.collectionId)
  const metadata = isFullUintRanges(badgeIdObj.badgeIds)
    ? collection?.cachedCollectionMetadata
    : getMetadataForBadgeId(
      badgeIdObj.badgeIds[0].start,
      collection?.cachedBadgeMetadata ?? []
    )
  return (
    <Tag
      className="primary-text inherit-bg flex-between"
      style={{ alignItems: "center", marginBottom: 8 }}
      closable
      closeIcon={
        onClose ? (
          <CloseCircleOutlined
            className="primary-text styled-button-normal flex-center"
            style={{
              border: "none",
              fontSize: 16,
              alignContent: "center",
              marginLeft: 5,
            }}
            size={100}
          />
        ) : (
          <></>
        )
      }
      onClose={onClose}
    >
      <div
        className="primary-text inherit-bg"
        style={{ alignItems: "center", marginRight: 4, maxWidth: 280 }}
      >
        <div
          className="flex-center"
          style={{ alignItems: "center", maxWidth: 280 }}
        >
          <div>
            <BadgeAvatar
              size={30}
              noHover
              collectionId={badgeIdObj.collectionId}
              metadataOverride={metadata}
            />
          </div>
          <Typography.Text
            className="primary-text"
            style={{
              fontSize: 16,
              fontWeight: "bold",
              margin: 4,
              overflowWrap: "break-word",
            }}
          >
            <Tooltip title={`Collection ID: ${badgeIdObj.collectionId}\n\n${isFullUintRanges(badgeIdObj.badgeIds) ? "All" : `Badge IDs: ${badgeIdObj.badgeIds.map((x) => x.start === x.end ? `${x.start}` : `${x.start}-${x.end}`).join(", ")}`}`}>
              <div style={{}}>{metadata?.name}</div>
            </Tooltip>
            <div style={{ fontSize: 12 }}>
              {/* Collection ID: {badgeIdObj.collectionId.toString()}
              <br />
              {isFullUintRanges(badgeIdObj.badgeIds)
                ? "All"
                : `Badge IDs: ${badgeIdObj.badgeIds
                  .map((x) =>
                    x.start === x.end ? `${x.start}` : `${x.start}-${x.end}`
                  )
                  .join(", ")}`} */}
            </div>
          </Typography.Text>
        </div>
      </div>
      <br />
    </Tag>
  )
}

export const CustomizeAddRemoveListFromPage = ({
  addressOrUsername,
  onAdd,
  onRemove,
}: {
  addressOrUsername: string
  onAdd: (mappingId: string) => Promise<void>
  onRemove: (mappingId: string) => Promise<void>
}) => {
  const accountInfo = useAccount(addressOrUsername)

  const [customizeSearchListValue, setCustomizeSearchListValue] =
    useState<string>("")
  const [selectedList, setSelectedList] = useState<string>("")
  const [selectedListMapping, setSelectedListMapping] =
    useState<AddressMappingWithMetadata<bigint> | null>(null)

  useEffect(() => {
    if (!selectedList) return
    async function fetchAddressMapping() {
      const mappingRes = await getAddressMappings({
        mappingIds: [selectedList],
      })
      if (mappingRes.addressMappings.length > 0) {
        setSelectedListMapping(mappingRes.addressMappings[0])
      }
    }

    fetchAddressMapping()
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
      style={{}}
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
      title=""
      md={12}
      xs={24}
      style={{ marginBottom: 8 }}
      noBorder={!selectedList}
      inheritBg={!selectedList}
    >
      <div className="flex">{CustomizeSearchListDropdown}</div>

      {selectedList && selectedListMapping && (
        <>
          <br />
          <div className="flex-center">
            <AddressListCard
              addressMapping={selectedListMapping}
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
  onAdd: (badgeIdObj: BatchBadgeDetails) => Promise<void>
  onRemove: (badgeIdObj: BatchBadgeDetails) => Promise<void>
}) => {
  const [selectedBadge, setSelectedBadge] = useState<BatchBadgeDetails | null>(
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
      style={{}}
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
        title=""
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

export const OptionsSelects = ({
  editMode,
  setEditMode,
  cardView,
  setCardView,
  groupByCollection,
  setGroupByCollection,
  addressOrUsername,
  isListsSelect,
  searchValue,
  setSearchValue,
  filteredCollections,
  setFilteredCollections,
  filteredLists,
  setFilteredLists,
}: {
  editMode: boolean
  setEditMode: (editMode: boolean) => void
  cardView: boolean
  setCardView: (cardView: boolean) => void
  groupByCollection: boolean
  setGroupByCollection: (groupByCollection: boolean) => void
  addressOrUsername: string
  isListsSelect?: boolean
  searchValue: string
  setSearchValue: (searchValue: string) => void
  filteredCollections: BatchBadgeDetails[]
  setFilteredCollections: (filteredCollections: BatchBadgeDetails[]) => void
  filteredLists: string[]
  setFilteredLists: (filteredLists: string[]) => void
}) => {
  const chain = useChainContext()
  const accountInfo = useAccount(addressOrUsername)

  if (!accountInfo) return <></>

  const CustomizeSelect = (
    <>
      {chain.address === accountInfo.address && (
        <SelectWithOptions title='Mode' value={editMode ? 'edit' : 'none'} setValue={(e) => {
          setEditMode(e === 'edit')
          setCardView(true)
        }} options={[{ label: 'Normal', value: 'none' }, {
          label: 'Customize', value: 'edit',
          disabledReason: !chain.loggedIn ? 'Please sign in to go into customize mode' : undefined,
          disabled: !chain.loggedIn
        },]} />
      )}
    </>
  )

  const FilterSearchDropdown = (
    <CollectionsFilterSearchBar
      onSearch={async (
        searchValue: any,
        _isAccount?: boolean | undefined,
        isCollection?: boolean | undefined,
        isBadge?: boolean | undefined
      ) => {
        if (typeof searchValue === "string") {
          if (isCollection) {
            setFilteredCollections([
              ...filteredCollections,
              {
                collectionId: BigInt(searchValue),
                badgeIds: [{ start: 1n, end: GO_MAX_UINT_64 }],
              },
            ])
          } else if (isBadge) {
            const collectionId = BigInt(searchValue.split("/")[0])
            const badgeId = BigInt(searchValue.split("/")[1])

            setFilteredCollections([
              ...filteredCollections,
              {
                collectionId,
                badgeIds: [{ start: badgeId, end: badgeId }],
              },
            ])
          }

          setSearchValue("")
        }
      }}
      searchValue={searchValue}
      setSearchValue={setSearchValue}
    />
  )

  const ListSearchDropdown = (
    <ListFilterSearchBar
      searchValue={searchValue}
      setSearchValue={setSearchValue}
      onSearch={async (searchValue: any) => {
        if (typeof searchValue === "string") {
          setFilteredLists([...filteredLists, searchValue])
          setSearchValue("")
          //TODO: Roundabout way without context
          const mappingRes = await getAddressMappings({
            mappingIds: [searchValue],
          })

          updateAccount({
            ...accountInfo,
            addressMappings: [
              ...accountInfo.addressMappings,
              ...mappingRes.addressMappings,
            ],
          })
        }
      }}
    />
  )
  return (
    <>
      <div
        className="flex-wrap full-width flex"
        style={{ flexDirection: "row-reverse", alignItems: "flex-end", marginTop: 12 }}
      >
        {CustomizeSelect}

        {!isListsSelect && (
          <SelectWithOptions
            title='Group By'
            value={groupByCollection ? 'collection' : 'none'}
            setValue={(e) => {
              setGroupByCollection(e === 'collection');
            }}
            options={[{ label: 'None', value: 'none' }, { label: 'Collection', value: 'collection' }]}
          // style={{ flexGrow: 1 }} // Add this style to make it grow
          />
        )}

        {!editMode && !isListsSelect && (
          <SelectWithOptions
            title='View'
            value={cardView ? 'card' : 'image'}
            setValue={(e) => {
              setCardView(e === 'card');
            }}
            options={[{ label: 'Card', value: 'card' }, { label: 'Image', value: 'image' }]}
          // style={{ flexGrow: 1 }} // Add this style to make it grow
          />
        )}

        {(
          <div style={{ marginBottom: 4, flexGrow: 1 }}> {/* Add this style to make it grow */}
            {!isListsSelect && FilterSearchDropdown}
            {isListsSelect && ListSearchDropdown}
          </div>
        )}
      </div>

    </>
  )
}

export const ListInfiniteScroll = ({
  fetchMore,
  hasMore,
  listsView,
  addressOrUsername,
  showInclusionDisplay,
}: {
  addressOrUsername: string
  showInclusionDisplay?: boolean
  fetchMore: () => Promise<void>
  hasMore: boolean
  listsView: AddressMappingWithMetadata<bigint>[]
}) => {
  return (
    <div className="flex-center flex-wrap">
      <InfiniteScroll
        dataLength={listsView.length}
        next={fetchMore}
        hasMore={hasMore}
        loader={
          <div>
            <br />
            <Spin size={"large"} />
            <br />
            <br />
          </div>
        }
        scrollThreshold={"300px"}
        endMessage={<></>}
        initialScrollY={0}
        style={{ width: "100%", overflow: "hidden" }}
      >
        <div className="full-width flex-center flex-wrap">
          {listsView.map((addressMapping, idx) => {
            return (
              <AddressListCard
                key={idx}
                addressMapping={addressMapping}
                addressOrUsername={addressOrUsername}
                hideInclusionDisplay={!showInclusionDisplay}
              />
            )
          })}
        </div>
      </InfiniteScroll>

      {listsView.length === 0 && !hasMore && (
        <Empty
          className="primary-text"
          description={<span>No lists found.</span>}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )}
    </div>
  )
}

export const BadgeInfiniteScroll = ({
  addressOrUsername,
  badgesToShow,
  cardView,
  editMode,
  hasMore,
  fetchMore,
  groupByCollection,
  isWatchlist,
  sortBy,
}: {
  addressOrUsername: string
  badgesToShow: BatchBadgeDetails[]
  cardView: boolean
  editMode: boolean
  hasMore: boolean
  fetchMore: () => Promise<void>
  groupByCollection: boolean
  isWatchlist?: boolean
  sortBy?: "oldest" | "newest" | undefined
}) => {
  const [numBadgesDisplayed, setNumBadgesDisplayed] = useState<number>(25)
  const accountInfo = useAccount(addressOrUsername)

  const numTotalBadges = useMemo(() => {
    //Calculate total number of badge IDs
    let total = 0n
    for (const obj of badgesToShow) {
      //TODO: Will this be weird if we have not fetched the collection yet.
      const collection = getCollection(obj.collectionId)
      if (!collection) continue

      //Filter out > max badge ID
      const maxBadgeId = getMaxBadgeIdForCollection(collection)

      const [remaining, _] = removeUintRangeFromUintRange(
        [{ start: maxBadgeId + 1n, end: GO_MAX_UINT_64 }],
        obj.badgeIds
      )
      obj.badgeIds = remaining

      for (const range of obj.badgeIds) {
        const numBadgesInRange = range.end - range.start + 1n
        total += numBadgesInRange
      }
    }

    return Numberify(total)
  }, [badgesToShow])

  const totalNumToShow = groupByCollection
    ? badgesToShow.length
    : numTotalBadges

  if (groupByCollection) {
    badgesToShow = badgesToShow.slice(0, numBadgesDisplayed)
  }

  hasMore = hasMore || numBadgesDisplayed < totalNumToShow

  return (
    <>
      <InfiniteScroll
        dataLength={numBadgesDisplayed}
        next={async () => {
          await fetchMore()
          setNumBadgesDisplayed(numBadgesDisplayed + 25)
        }}
        hasMore={hasMore}
        loader={
          <div>
            <br />
            <Spin size={"large"} />
            <br />
            <br />
          </div>
        }
        scrollThreshold={"300px"}
        endMessage={<></>}
        initialScrollY={0}
        style={{ width: "100%", overflow: "hidden" }}
      >
        <MultiCollectionBadgeDisplay
          collectionIds={badgesToShow.map(
            (collection) => collection.collectionId
          )}
          addressOrUsernameToShowBalance={accountInfo?.address}
          cardView={cardView}
          customPageBadges={badgesToShow}
          groupByCollection={groupByCollection}
          defaultPageSize={numBadgesDisplayed}
          hidePagination={true}
          showCustomizeButtons={editMode}
          isWatchlist={isWatchlist}
          sortBy={sortBy}
        />
      </InfiniteScroll>

      {badgesToShow.every((collection) => collection.badgeIds.length === 0) &&
        !hasMore && (
          <Empty
            className="primary-text"
            description={<span>No badges found.</span>}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
    </>
  )
}

function PortfolioPage() {
  const router = useRouter()

  const chain = useChainContext()

  const { addressOrUsername } = router.query
  const accountInfo = useAccount(addressOrUsername as string)
  const [tab, setTab] = useState("collected")
  const [addPageIsVisible, setAddPageIsVisible] = useState(false)
  const [warned, setWarned] = useState(false)

  useEffect(() => {
    if (
      accountInfo?.cosmosAddress === chain.cosmosAddress &&
      !chain.loggedIn &&
      chain.cosmosAddress &&
      !warned
    ) {
      notification.info({
        message: "You must sign in to customize your portfolio.",
      })
      setWarned(true)
    }
  }, [accountInfo, chain, warned])

  const [badgeTab, setBadgeTab] = useState("All")

  useEffect(() => {
    if (badgeTab !== "") {
      setAddPageIsVisible(false)
    }
  }, [badgeTab])

  const [cardView, setCardView] = useState(true)
  const [filteredCollections, setFilteredCollections] = useState<
    {
      collectionId: bigint
      badgeIds: UintRange<bigint>[]
    }[]
  >([])
  const [filteredLists, setFilteredLists] = useState<string[]>([])
  const [groupByCollection, setGroupByCollection] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [listsTab, setListsTab] = useState<string>("addressMappings")
  const [searchValue, setSearchValue] = useState<string>("")

  useEffect(() => {
    if (listsTab !== "") {
      setAddPageIsVisible(false)
    }
  }, [listsTab])

  const tabInfo = []
  // const isAliasAccount = !!accountInfo?.alias

  tabInfo.push(
    { key: "collected", content: "Badges", disabled: false },
    { key: "lists", content: "Lists" },
    { key: "activity", content: "Activity", disabled: false },
    { key: "reputation", content: "Reviews" },
    // !isAliasAccount ? { key: "protocols", content: "Protocols" } : undefined
  )

  const badgePageTabInfo = [
    { key: "collected", content: "All", disabled: false },
  ]

  if (accountInfo?.customPages) {
    for (const customPage of accountInfo?.customPages) {
      badgePageTabInfo.push({
        key: customPage.title,
        content: customPage.title,
        disabled: false,
      })
    }
  }

  useEffect(() => {
    if (!accountInfo?.address) return

    for (const id of filteredCollections) {
      fetchBalanceForUser(id.collectionId, accountInfo?.address)
    }
  }, [filteredCollections, accountInfo?.address])

  const [customViewId, setCustomViewId] = useState<string>("")
  const [customListViewId, setCustomListViewId] = useState<string>("")

  const currViewWithoutFiltered = !accountInfo
    ? undefined
    : accountInfo?.views[
    badgeTab === "Managing"
      ? "managing"
      : badgeTab === "Created"
        ? "createdBy"
        : "badgesCollected"
    ]


  const currViewId = customViewId && currViewWithoutFiltered?.pagination.hasMore
    ? customViewId : badgeTab === "Managing" ? "managing" : badgeTab === "Created" ? "createdBy"
      : "badgesCollected"

  let currView = !accountInfo ? undefined : accountInfo?.views[currViewId]
  let badgesToShow = useMemo(() => {
    let badgesToShow = getAccountBalancesView(accountInfo, "badgesCollected")

    let allBadgeIds: {
      collectionId: bigint
      badgeIds: UintRange<bigint>[]
    }[] = []
    if (badgeTab === "Hidden") {
      allBadgeIds.push(...deepCopy(accountInfo?.hiddenBadges ?? []))
    } else if (
      badgeTab === "All" ||
      badgeTab === "Managing" ||
      badgeTab === "Created"
    ) {
      if (badgeTab === "All") {
        for (const balanceInfo of badgesToShow) {
          if (!balanceInfo) {
            continue
          }

          allBadgeIds.push(
            deepCopy({
              badgeIds:
                balanceInfo.balances
                  .map((balance) => balance.badgeIds)
                  .flat() || [],
              collectionId: balanceInfo.collectionId,
            })
          )
        }
      } else {
        const badgesToAdd =
          (currView?.ids
            .map((id) => {
              const collectionId = getCollection(BigInt(id))?.collectionId
              if (!collectionId) return null

              return {
                collectionId,
                badgeIds: [{ start: 1n, end: GO_MAX_UINT_64 }],
              }
            })
            .filter((x) => x) as BatchBadgeDetails[]) ?? []

        allBadgeIds.push(...badgesToAdd)
      }
    } else {
      allBadgeIds.push(
        ...deepCopy(
          accountInfo?.customPages?.find((x) => x.title === badgeTab)?.badges ??
          []
        )
      )
    }

    if (filteredCollections.length > 0) {
      const filtered = []
      for (const badgeIdObj of allBadgeIds) {
        for (const filteredCollection of filteredCollections) {
          const collectionId = filteredCollection.collectionId
          if (badgeIdObj.collectionId === collectionId) {
            const [_, removed] = removeUintRangeFromUintRange(
              badgeIdObj.badgeIds,
              filteredCollection.badgeIds
            )
            badgeIdObj.badgeIds = removed

            filtered.push(badgeIdObj)
          }
        }
      }
      allBadgeIds = filtered
    }

    for (const badgeIdObj of allBadgeIds) {
      const collection = getCollection(badgeIdObj.collectionId)
      if (!collection) continue
      const maxBadgeId = getMaxBadgeIdForCollection(collection)
      const [remaining] = removeUintRangeFromUintRange(
        [{ start: maxBadgeId + 1n, end: GO_MAX_UINT_64 }],
        badgeIdObj.badgeIds
      )
      badgeIdObj.badgeIds = remaining
    }

    return allBadgeIds.filter((x) => x.badgeIds.length > 0)
  }, [accountInfo, badgeTab, filteredCollections, currView?.ids])

  const fetchMoreCollected = useCallback(
    async (address: string) => {
      await fetchNextForAccountViews(
        address,
        editMode ? "badgesCollectedWithHidden" : "badgesCollected",
        editMode ? "badgesCollectedWithHidden" : "badgesCollected"
      )
    },
    [editMode]
  )

  const fetchMoreLists = useCallback(
    async (address: string, viewType: AccountViewKey) => {
      await fetchNextForAccountViews(address, viewType, viewType)
    }, []
  )

  const fetchMoreCreatedBy = useCallback(
    async (address: string, viewType: AccountViewKey) => {
      await fetchNextForAccountViews(address, viewType, viewType)
    },
    []
  )

  const fetchMoreManaging = useCallback(
    async (address: string, viewType: AccountViewKey) => {
      console.log("fetchMoreManaging", address, viewType)
      await fetchNextForAccountViews(address, viewType, viewType)
    },
    []
  )

  const fetchMoreWithFiltered = useCallback(
    async (
      address: string,
      viewType: AccountViewKey,
      filteredCollections: {
        collectionId: bigint
        badgeIds: UintRange<bigint>[]
      }[]
    ) => {
      const newViewId =
        viewType + ":" + SHA256(JSON.stringify(filteredCollections)).toString()
      await fetchNextForAccountViews(
        address,
        viewType,
        newViewId,
        filteredCollections
      )
      setCustomViewId(newViewId)
    },
    []
  )

  const fetchMoreListsWithFiltered = useCallback(
    async (
      address: string,
      viewType: AccountViewKey,
      filteredLists: string[]
    ) => {
      const newViewId =
        viewType + ":" + SHA256(JSON.stringify(filteredLists)).toString()
      await fetchNextForAccountViews(
        address,
        viewType,
        newViewId,
        undefined,
        filteredLists
      )
      setCustomListViewId(newViewId)
    },
    []
  )

  useEffect(() => {
    if (filteredCollections.length > 0) {
      const currViewId =
        badgeTab === "Managing"
          ? "managing"
          : badgeTab === "Created"
            ? "createdBy"
            : "badgesCollected"

      const newViewId = currViewId + ":" +
        SHA256(JSON.stringify(filteredCollections)).toString()
      setCustomViewId(newViewId)
    } else {
      setCustomViewId("")
    }
  }, [filteredCollections, badgeTab])

  useEffect(() => {
    if (filteredLists.length > 0) {
      const newViewId = listsTab + ":" + SHA256(JSON.stringify(filteredLists)).toString()
      setCustomListViewId(newViewId)
    } else {
      setCustomListViewId("")
    }
  }, [filteredLists, listsTab])

  const isPresetList =
    listsTab === "addressMappings" ||
    listsTab === "explicitlyIncludedAddressMappings" ||
    listsTab === "explicitlyExcludedAddressMappings" ||
    listsTab === "privateLists" ||
    listsTab === "createdLists"

  const [customView, setCustomView] = useState<
    AddressMappingWithMetadata<bigint>[]
  >([])

  useEffect(() => {
    if (isPresetList) return

    async function getCustomView() {
      const idsToFetch = []
      if (listsTab === "Hidden") {
        idsToFetch.push(...(accountInfo?.hiddenLists ?? []))
      } else {
        idsToFetch.push(
          ...(accountInfo?.customListPages?.find((x) => x.title === listsTab)
            ?.mappingIds ?? [])
        )
      }

      const res = await getAddressMappings({ mappingIds: idsToFetch })
      setCustomView(res.addressMappings)
    }

    getCustomView()
  }, [
    listsTab,
    accountInfo?.customListPages,
    isPresetList,
    accountInfo?.hiddenLists,
  ])

  const listViewwithoutFiltered = !accountInfo
    ? undefined
    : accountInfo?.views[`${listsTab}`]
  const currListViewId = customListViewId && (listViewwithoutFiltered?.pagination.hasMore ?? true)
    ? customListViewId
    : listsTab
  const listsView = !accountInfo ? [] : (
    isPresetList
      ? getAccountAddressMappingsView(accountInfo, currListViewId)
      : customView
  ).filter((x) => !filteredLists.includes(x.mappingId))

  const collectedHasMore = editMode
    ? accountInfo?.views["badgesCollectedWithHidden"]?.pagination?.hasMore ??
    true
    : accountInfo?.views["badgesCollected"]?.pagination?.hasMore ?? true
  const hasMoreAddressMappings =
    accountInfo?.views[`${listsTab}`]?.pagination?.hasMore ?? true
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log("useEffect: fetch more collected")

    //Fetch on tab change but only if empty and has more
    const collectedIsEmpty = !accountInfo?.views["badgesCollected"]?.ids.length
    const listsIsEmpty = !accountInfo?.views[`${listsTab}`]?.ids.length
    const createdByIsEmpty = !accountInfo?.views["createdBy"]?.ids.length
    const managingIsEmpty = !accountInfo?.views["managing"]?.ids.length
    const hasMoreAddressMappings =
      accountInfo?.views[`${listsTab}`]?.pagination?.hasMore ?? true

    if (!accountInfo || !accountInfo.address) return
    if (tab === "collected") {
      if (
        badgeTab === "All" &&
        collectedIsEmpty &&
        (accountInfo?.views["badgesCollected"]?.pagination?.hasMore ?? true)
      ) {
        fetchMoreCollected(accountInfo?.address ?? "")
      } else if (
        badgeTab === "Managing" &&
        (accountInfo?.views["managing"]?.pagination?.hasMore ?? true) &&
        managingIsEmpty
      ) {
        fetchMoreManaging(accountInfo?.address ?? "", "managing")
      } else if (
        badgeTab === "Created" &&
        (accountInfo?.views["createdBy"]?.pagination?.hasMore ?? true) &&
        createdByIsEmpty
      ) {
        fetchMoreCreatedBy(accountInfo?.address ?? "", "createdBy")
      }
    } else if (tab === "lists" && hasMoreAddressMappings && listsIsEmpty) {
      if (isPresetList) {
        if (listsTab === "privateLists" && !chain.loggedIn) return
        fetchMoreLists(accountInfo?.address ?? "", listsTab)
      }
    }
  }, [
    tab,
    accountInfo,
    fetchMoreLists,
    fetchMoreCreatedBy,
    fetchMoreManaging,
    fetchMoreCollected,
    listsTab,
    isPresetList,
    badgeTab,
    chain.loggedIn,
  ])

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log("useEffect: get portfolio info")
    async function getPortfolioInfo() {
      //Check if addressOrUsername is an address or account number and fetch portfolio accordingly
      if (!addressOrUsername) return

      await fetchAccounts([addressOrUsername as string])
    }
    getPortfolioInfo()
  }, [addressOrUsername])

  const [activityTab, setActivityTab] = useState("badges")

  if (!accountInfo) {
    return <></>
  }

  return (
    <ReportedWrapper
      reported={!!accountInfo?.reported ?? false}
      node={
        <>
          <Content
            style={{
              textAlign: "center",
              minHeight: "100vh",
            }}
          >
            <div
              style={{
                marginLeft: "3vw",
                marginRight: "3vw",
                paddingLeft: "1vw",
                paddingRight: "1vw",
                paddingTop: "20px",
              }}
            >
              {/* Overview and Tabs */}
              {accountInfo && (
                <AccountHeader addressOrUsername={accountInfo.address} />
              )}




              <Tabs tabInfo={tabInfo} tab={tab} setTab={setTab} fullWidth />

              {(tab === "collected") && (
                <>
                  <OptionsSelects
                    searchValue={searchValue}
                    setSearchValue={setSearchValue}
                    filteredCollections={filteredCollections}
                    setFilteredCollections={setFilteredCollections}
                    editMode={editMode}
                    setEditMode={setEditMode}
                    filteredLists={filteredLists}
                    setFilteredLists={setFilteredLists}
                    cardView={cardView}
                    setCardView={setCardView}
                    groupByCollection={groupByCollection}
                    setGroupByCollection={setGroupByCollection}
                    addressOrUsername={addressOrUsername as string}
                  />
                  <br />

                  <div className="full-width flex-center flex-wrap">
                    {filteredCollections.map((filteredCollection, idx) => {
                      return (
                        <BatchBadgeDetailsTag
                          key={idx}
                          badgeIdObj={filteredCollection}
                          onClose={() => {
                            setFilteredCollections(
                              filteredCollections.filter(
                                (x) => !compareObjects(x, filteredCollection)
                              )
                            )
                          }}
                        />
                      )
                    })}
                  </div>
                  {filteredCollections.length > 0 && <br />}
                </>
              )}

              {/* {tab === "protocols" && (
                <>
                  <FollowProtocolDisplay
                    addressOrUsername={accountInfo.address}
                  />
                </>
              )} */}

              {/* Tab Content */}
              {tab === "collected" && (
                <>
                  <div className="">
                    <div className="flex-center flex-wrap">
                      {
                        <Tabs
                          onDeleteCurrTab={
                            !editMode ||
                              badgeTab == "" ||
                              badgeTab == "All" ||
                              badgeTab == "Hidden" ||
                              badgeTab == "Managing" ||
                              badgeTab == "Created"
                              ? undefined
                              : async (badgeTab: string) => {
                                const newCustomPages = deepCopy(
                                  accountInfo.customPages ?? []
                                )
                                newCustomPages.splice(
                                  newCustomPages.findIndex(
                                    (x) => x.title === badgeTab
                                  ),
                                  1
                                )

                                await updateProfileInfo(chain.address, {
                                  customPages: newCustomPages,
                                })
                              }
                          }
                          tabInfo={[
                            {
                              key: "All",
                              content: "All",
                              disabled: false,
                            },

                            {
                              key: "Created",
                              content: "Created",
                              disabled: false,
                            },
                            {
                              key: "Managing",
                              content: "Managing",
                              disabled: false,
                            },

                            ...(editMode
                              ? [
                                {
                                  key: "Hidden",
                                  content: "Hidden",
                                  disabled: false,
                                },
                              ]
                              : []),
                            ...(accountInfo.customPages?.map((x) => {
                              return {
                                key: x.title,
                                content: x.title,
                                disabled: false,
                              }
                            }) ?? []),
                          ]}
                          tab={badgeTab}
                          setTab={setBadgeTab}
                          type={"underline"}
                        />
                      }
                      {editMode && (
                        <IconButton
                          src={
                            !addPageIsVisible ? (
                              <PlusOutlined />
                            ) : (
                              <MinusOutlined />
                            )
                          }
                          text=""
                          tooltipMessage="Add a new page to your portfolio."
                          onClick={() => {
                            setAddPageIsVisible(!addPageIsVisible)
                            setBadgeTab("") //Reset tab
                          }}
                        />
                      )}

                    </div>

                    {badgeTab === "Hidden" && (
                      <div
                        className="secondary-text"
                        style={{ marginBottom: 16, marginTop: 4 }}
                      >
                        <InfoCircleOutlined /> Hidden badges will be
                        automatically filtered out from standard views and not
                        shown by default.
                      </div>
                    )}
                    {badgeTab !== "" &&
                      accountInfo.customPages?.find((x) => x.title === badgeTab)
                        ?.description && (
                        <div
                          className="secondary-text"
                          style={{ marginBottom: 16, marginTop: 4 }}
                        >
                          {
                            accountInfo.customPages?.find(
                              (x) => x.title === badgeTab
                            )?.description
                          }
                        </div>
                      )}

                    <br />

                    {badgeTab != "All" &&
                      badgeTab != "" &&
                      badgeTab != "Created" &&
                      badgeTab != "Managing" &&
                      editMode && (
                        <>
                          <div className="flex-center">
                            <CustomizeAddRemoveBadgeFromPage
                              onAdd={async (
                                selectedBadge: BatchBadgeDetails
                              ) => {
                                let currCustomPageBadges =
                                  badgeTab == "Hidden"
                                    ? deepCopy(accountInfo?.hiddenBadges ?? [])
                                    : deepCopy(
                                      accountInfo?.customPages?.find(
                                        (x) => x.title === badgeTab
                                      )?.badges ?? []
                                    )
                                currCustomPageBadges = addToArray(
                                  currCustomPageBadges,
                                  [selectedBadge]
                                )

                                if (badgeTab == "Hidden") {
                                  await updateProfileInfo(chain.address, {
                                    hiddenBadges: currCustomPageBadges,
                                  })
                                } else {
                                  const currCustomPage =
                                    accountInfo?.customPages?.find(
                                      (x) => x.title === badgeTab
                                    )
                                  if (!currCustomPage) return

                                  await updateProfileInfo(chain.address, {
                                    customPages: accountInfo?.customPages?.map(
                                      (x) =>
                                        x.title === badgeTab
                                          ? {
                                            ...currCustomPage,
                                            badges: currCustomPageBadges,
                                          }
                                          : x
                                    ),
                                  })
                                }
                              }}
                              onRemove={async (
                                selectedBadge: BatchBadgeDetails
                              ) => {
                                let currCustomPageBadges =
                                  badgeTab == "Hidden"
                                    ? deepCopy(accountInfo?.hiddenBadges ?? [])
                                    : deepCopy(
                                      accountInfo?.customPages?.find(
                                        (x) => x.title === badgeTab
                                      )?.badges ?? []
                                    )
                                currCustomPageBadges = removeFromArray(
                                  currCustomPageBadges,
                                  [selectedBadge]
                                )

                                if (badgeTab == "Hidden") {
                                  await updateProfileInfo(chain.address, {
                                    hiddenBadges: currCustomPageBadges,
                                  })
                                } else {
                                  const currCustomPage =
                                    accountInfo?.customPages?.find(
                                      (x) => x.title === badgeTab
                                    )
                                  if (!currCustomPage) return

                                  await updateProfileInfo(chain.address, {
                                    customPages: accountInfo?.customPages?.map(
                                      (x) =>
                                        x.title === badgeTab
                                          ? {
                                            ...currCustomPage,
                                            badges: currCustomPageBadges,
                                          }
                                          : x
                                    ),
                                  })
                                }
                              }}
                            />
                          </div>
                        </>
                      )}
                    <NewPageInputForm
                      visible={addPageIsVisible}
                      setVisible={setAddPageIsVisible}
                      onAddPage={async (
                        newPageTitle: string,
                        newPageDescription: string
                      ) => {
                        const newCustomPages = deepCopy(
                          accountInfo.customPages ?? []
                        )
                        newCustomPages.push({
                          title: newPageTitle,
                          description: newPageDescription,
                          badges: [],
                        })

                        await updateProfileInfo(chain.address, {
                          customPages: newCustomPages,
                        })

                        setBadgeTab(newPageTitle)
                      }}
                    />

                    {badgeTab !== "" && (
                      <>
                        {/* // badgeTab !== 'Managing' && badgeTab !== 'Created' && <> */}
                        <BadgeInfiniteScroll
                          addressOrUsername={addressOrUsername as string}
                          badgesToShow={badgesToShow}
                          cardView={cardView}
                          editMode={editMode}
                          hasMore={
                            badgeTab === "All"
                              ? collectedHasMore
                              : badgeTab === "Managing"
                                ? accountInfo?.views["managing"]?.pagination?.hasMore ?? true
                                : badgeTab === "Created"
                                  ? accountInfo?.views["createdBy"]?.pagination
                                    ?.hasMore ?? true
                                  : false
                          }
                          fetchMore={async () => {
                            const hasMore =
                              badgeTab === "All"
                                ? collectedHasMore
                                : badgeTab === "Managing"
                                  ? accountInfo?.views["managing"]?.pagination
                                    ?.hasMore ?? true
                                  : badgeTab === "Created"
                                    ? accountInfo?.views["createdBy"]?.pagination
                                      ?.hasMore ?? true
                                    : false

                            if (filteredCollections.length > 0 && hasMore) {
                              //If we have a view where we havent fetched everything plus have specific filters, we need to fetch more with filters
                              //Else, we can just filter client side
                              if (badgeTab === "All") {
                                await fetchMoreWithFiltered(
                                  accountInfo?.address ?? "",
                                  "badgesCollected",
                                  filteredCollections
                                )
                              } else if (badgeTab === "Managing") {
                                await fetchMoreWithFiltered(
                                  accountInfo?.address ?? "",
                                  "managing",
                                  filteredCollections
                                )
                              } else if (badgeTab === "Created") {
                                await fetchMoreWithFiltered(
                                  accountInfo?.address ?? "",
                                  "createdBy",
                                  filteredCollections
                                )
                              }
                            } else {
                              if (badgeTab === "All") {
                                await fetchMoreCollected(
                                  accountInfo?.address ?? ""
                                )
                              } else if (badgeTab === "Managing") {
                                await fetchMoreManaging(
                                  accountInfo?.address ?? "",
                                  "managing"
                                )
                              } else if (badgeTab === "Created") {
                                await fetchMoreCreatedBy(
                                  accountInfo?.address ?? "",
                                  "createdBy"
                                )
                              }
                            }
                          }}
                          groupByCollection={groupByCollection}
                        />
                      </>
                    )}
                  </div>
                </>
              )}

              {tab === "lists" && (
                <>
                  <OptionsSelects
                    isListsSelect
                    filteredLists={filteredLists}
                    setFilteredLists={setFilteredLists}
                    searchValue={searchValue}
                    setSearchValue={setSearchValue}
                    filteredCollections={filteredCollections}
                    setFilteredCollections={setFilteredCollections}
                    editMode={editMode}
                    setEditMode={setEditMode}
                    cardView={cardView}
                    setCardView={setCardView}
                    groupByCollection={groupByCollection}
                    setGroupByCollection={setGroupByCollection}
                    addressOrUsername={addressOrUsername as string}
                  />
                  <br />

                  <div className="full-width flex-center flex-wrap">
                    {filteredLists.map((mappingId, idx) => {
                      const metadata = accountInfo.addressMappings?.find(
                        (x) => x.mappingId === mappingId
                      )?.metadata

                      return (
                        <Tag
                          key={idx}
                          className="primary-text inherit-bg flex-between"
                          style={{ alignItems: "center", marginBottom: 8 }}
                          closable
                          closeIcon={
                            <CloseCircleOutlined
                              className="primary-text styled-button-normal flex-center"
                              style={{
                                border: "none",
                                fontSize: 16,
                                alignContent: "center",
                                marginLeft: 5,
                              }}
                              size={100}
                            />
                          }
                          onClose={() => {
                            setFilteredLists(
                              filteredLists.filter((x) => x !== mappingId)
                            )
                          }}
                        >
                          <div
                            className="primary-text inherit-bg"
                            style={{
                              alignItems: "center",
                              marginRight: 4,
                              maxWidth: 280,
                            }}
                          >
                            <div
                              className="flex-center"
                              style={{ alignItems: "center", maxWidth: 280 }}
                            >
                              <div>
                                <BadgeAvatar
                                  size={30}
                                  noHover
                                  collectionId={0n}
                                  metadataOverride={
                                    accountInfo.addressMappings?.find(
                                      (x) => x.mappingId === mappingId
                                    )?.metadata
                                  }
                                />
                              </div>
                              <Typography.Text
                                className="primary-text"
                                style={{
                                  alignItems: "center",
                                  fontSize: 16,
                                  fontWeight: "bold",
                                  margin: 4,
                                  overflowWrap: "break-word",
                                }}
                              >
                                <div style={{}}>{metadata?.name}</div>
                              </Typography.Text>
                            </div>
                          </div>
                          <br />
                        </Tag>
                      )
                    })}
                  </div>

                  <div className="flex-center">
                    <Tabs
                      onDeleteCurrTab={
                        !editMode ||
                          listsTab == "" ||
                          listsTab == "addressMappings" ||
                          listsTab == "Hidden" ||
                          listsTab == "explicitlyIncludedAddressMappings" ||
                          listsTab == "explicitlyExcludedAddressMappings" ||
                          listsTab == "privateLists" ||
                          listsTab == "createdLists"
                          ? undefined
                          : async (listsTab: string) => {
                            const newCustomPages = deepCopy(
                              accountInfo.customListPages ?? []
                            )
                            newCustomPages.splice(
                              newCustomPages.findIndex(
                                (x) => x.title === listsTab
                              ),
                              1
                            )

                            await updateProfileInfo(chain.address, {
                              customListPages: newCustomPages,
                            })
                          }
                      }
                      tabInfo={[
                        {
                          key: "addressMappings",
                          content: "All",
                          disabled: false,
                        },
                        {
                          key: "explicitlyIncludedAddressMappings",
                          content: "Included",
                          disabled: false,
                        },
                        {
                          key: "explicitlyExcludedAddressMappings",
                          content: "Excluded",
                          disabled: false,
                        },
                        {
                          key: "createdLists",
                          content: "Created",
                          disabled: false,
                        },
                        chain.cosmosAddress &&
                          chain.cosmosAddress === accountInfo.cosmosAddress
                          ? {
                            key: "privateLists",
                            content: "Private",
                            disabled: false,
                          }
                          : undefined,
                        ...(editMode
                          ? [
                            {
                              key: "Hidden",
                              content: "Hidden",
                              disabled: false,
                            },
                          ]
                          : []),
                        ...(accountInfo.customListPages?.map((customPage) => {
                          return {
                            key: customPage.title,
                            content: customPage.title,
                            disabled: false,
                          }
                        }) ?? []),
                      ]}
                      tab={listsTab}
                      setTab={(e) => {
                        setListsTab(e as AccountViewKey)
                      }}
                      type="underline"
                    />

                    {editMode && (
                      <IconButton
                        src={
                          !addPageIsVisible ? (
                            <PlusOutlined />
                          ) : (
                            <MinusOutlined />
                          )
                        }
                        text=""
                        tooltipMessage="Add a new page to your portfolio."
                        onClick={() => {
                          setAddPageIsVisible(!addPageIsVisible)
                          setListsTab("") //Reset tab
                        }}
                      />
                    )}
                  </div>
                  {listsTab === "Hidden" && (
                    <div
                      className="secondary-text"
                      style={{ marginBottom: 16, marginTop: 4 }}
                    >
                      <InfoCircleOutlined /> Hidden lists will be automatically
                      filtered out from standard views and not shown by default.
                    </div>
                  )}
                  {listsTab === "All" && (
                    <div
                      className="secondary-text"
                      style={{ marginBottom: 16, marginTop: 4 }}
                    >
                      <InfoCircleOutlined /> These results only include
                      whitelists where the address is included and blacklists
                      where the address is excluded.
                    </div>
                  )}
                  {listsTab === "explicitlyIncludedAddressMappings" && (
                    <div
                      className="secondary-text"
                      style={{ marginBottom: 16, marginTop: 4 }}
                    >
                      <InfoCircleOutlined /> These results only include
                      whitelists where the address is included.
                    </div>
                  )}
                  {listsTab === "explicitlyExcludedAddressMappings" && (
                    <div
                      className="secondary-text"
                      style={{ marginBottom: 16, marginTop: 4 }}
                    >
                      <InfoCircleOutlined /> These results only include
                      blacklists where the address is excluded.
                    </div>
                  )}
                  {listsTab === "createdLists" && (
                    <div
                      className="secondary-text"
                      style={{ marginBottom: 16, marginTop: 4 }}
                    >
                      <InfoCircleOutlined /> These results include lists created
                      by this user.
                    </div>
                  )}
                  {listsTab === "privateLists" && (
                    <div
                      className="secondary-text"
                      style={{ marginBottom: 16, marginTop: 4 }}
                    >
                      <InfoCircleOutlined /> These results include private lists
                      created by you and are only visible to you.
                    </div>
                  )}
                  {listsTab !== "" && (
                    <div
                      className="secondary-text"
                      style={{ marginBottom: 16, marginTop: 4 }}
                    >
                      {
                        accountInfo.customListPages?.find(
                          (x) => x.title === badgeTab
                        )?.description
                      }
                    </div>
                  )}

                  {!isPresetList && listsTab != "" && editMode && (
                    <>
                      <div className="flex-center">
                        <CustomizeAddRemoveListFromPage
                          addressOrUsername={accountInfo.address}
                          onAdd={async (selectedList: string) => {
                            let currCustomPageLists =
                              listsTab == "Hidden"
                                ? deepCopy(accountInfo?.hiddenLists ?? [])
                                : deepCopy(
                                  accountInfo?.customListPages?.find(
                                    (x) => x.title === listsTab
                                  )?.mappingIds ?? []
                                )

                            currCustomPageLists = currCustomPageLists.concat([
                              selectedList,
                            ])

                            if (listsTab == "Hidden") {
                              await updateProfileInfo(chain.address, {
                                hiddenLists: currCustomPageLists,
                              })
                            } else {
                              const currCustomPage =
                                accountInfo?.customListPages?.find(
                                  (x) => x.title === listsTab
                                )
                              if (!currCustomPage) return

                              await updateProfileInfo(chain.address, {
                                customListPages:
                                  accountInfo?.customListPages?.map((x) =>
                                    x.title === listsTab
                                      ? {
                                        ...currCustomPage,
                                        mappingIds: currCustomPageLists,
                                      }
                                      : x
                                  ),
                              })
                            }
                          }}
                          onRemove={async (selectedList: string) => {
                            let currCustomPageLists =
                              listsTab == "Hidden"
                                ? deepCopy(accountInfo?.hiddenLists ?? [])
                                : deepCopy(
                                  accountInfo?.customListPages?.find(
                                    (x) => x.title === listsTab
                                  )?.mappingIds ?? []
                                )
                            currCustomPageLists = currCustomPageLists.filter(
                              (x) => x !== selectedList
                            )

                            if (listsTab == "Hidden") {
                              await updateProfileInfo(chain.address, {
                                hiddenLists: currCustomPageLists,
                              })
                            } else {
                              const currCustomPage =
                                accountInfo?.customListPages?.find(
                                  (x) => x.title === listsTab
                                )
                              if (!currCustomPage) return

                              await updateProfileInfo(chain.address, {
                                customListPages:
                                  accountInfo?.customListPages?.map((x) =>
                                    x.title === listsTab
                                      ? {
                                        ...currCustomPage,
                                        mappingIds: currCustomPageLists,
                                      }
                                      : x
                                  ),
                              })
                            }
                          }}
                        />
                      </div>
                    </>
                  )}

                  <NewPageInputForm
                    visible={addPageIsVisible}
                    setVisible={setAddPageIsVisible}
                    onAddPage={async (
                      newPageTitle: string,
                      newPageDescription: string
                    ) => {
                      const newCustomPages = deepCopy(
                        accountInfo.customListPages ?? []
                      )
                      newCustomPages.push({
                        title: newPageTitle,
                        description: newPageDescription,
                        mappingIds: [],
                      })

                      await updateProfileInfo(chain.address, {
                        customListPages: newCustomPages,
                      })

                      setListsTab(newPageTitle)
                    }}
                  />
                  {listsTab !== "" && (
                    <>
                      {listsTab === "privateLists" && !chain.loggedIn ? (
                        <BlockinDisplay />
                      ) : (
                        <>
                          <ListInfiniteScroll
                            fetchMore={async () => {
                              if (isPresetList) {
                                if (
                                  filteredLists.length > 0 &&
                                  isPresetList &&
                                  hasMoreAddressMappings
                                ) {
                                  await fetchMoreListsWithFiltered(
                                    accountInfo?.address ?? "",
                                    listsTab,
                                    filteredLists
                                  )
                                } else {
                                  await fetchMoreLists(
                                    accountInfo?.address ?? "",
                                    listsTab
                                  )
                                }
                              }
                            }}
                            hasMore={isPresetList && hasMoreAddressMappings}
                            listsView={listsView}
                            addressOrUsername={accountInfo?.address ?? ""}
                            showInclusionDisplay={
                              !(
                                listsTab === "privateLists" ||
                                listsTab === "createdLists"
                              )
                            }
                          />
                        </>
                      )}
                    </>
                  )}
                </>
              )}

              {tab === "reputation" && (
                <>
                  <ReputationTab
                    reviews={accountInfo?.reviews ?? []}
                    fetchMore={async () => {
                      await fetchNextForAccountViews(
                        accountInfo?.address ?? "",
                        "latestReviews",
                        "latestReviews"
                      )
                    }}
                    hasMore={
                      accountInfo?.views["latestReviews"]?.pagination
                        ?.hasMore ?? true
                    }
                    addressOrUsername={accountInfo?.address ?? ""}
                  />
                </>
              )}

              {tab === "activity" && (
                <>
                  <br />
                  <div className="flex-center">
                    <Tabs
                      type="underline"
                      tab={activityTab}
                      setTab={setActivityTab}
                      tabInfo={[
                        {
                          key: "badges",
                          content: "Badges",
                          disabled: false,
                        },
                        {
                          key: "lists",
                          content: "Lists",
                          disabled: false,
                        },
                      ]}
                    ></Tabs>
                  </div>
                  <br />
                  {activityTab === "badges" && (
                    <ActivityTab
                      activity={
                        getAccountActivityView(accountInfo, "latestActivity") ??
                        []
                      }
                      fetchMore={async () =>
                        fetchNextForAccountViews(
                          accountInfo?.address ?? "",
                          "latestActivity",
                          "latestActivity"
                        )
                      }
                      hasMore={
                        accountInfo?.views["latestActivity"]?.pagination
                          ?.hasMore ?? true
                      }
                    />
                  )}
                  {activityTab === "lists" && (
                    <ListActivityTab
                      activity={
                        getAccountListsActivityView(
                          accountInfo,
                          "listsActivity"
                        ) ?? []
                      }
                      fetchMore={async () =>
                        fetchNextForAccountViews(
                          accountInfo?.address ?? "",
                          "listsActivity",
                          "listsActivity"
                        )
                      }
                      hasMore={
                        accountInfo?.views["listsActivity"]?.pagination
                          ?.hasMore ?? true
                      }
                    />
                  )}
                </>
              )}
            </div>
            <DevMode obj={accountInfo} />
            <Divider />
          </Content>
        </>
      }
    />
  )
}

export default PortfolioPage
