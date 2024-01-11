import {
  CloseCircleOutlined,
  InfoCircleOutlined,
  MinusOutlined,
  PlusOutlined
} from "@ant-design/icons"
import {
  Divider,
  Layout,
  Tag,
  Typography,
  notification
} from "antd"
import { UintRange, deepCopy } from "bitbadgesjs-proto"
import {
  AccountViewKey,
  AddressListWithMetadata,
  BatchBadgeDetails, addToBatchArray,
  getMaxBadgeIdForCollection,
  removeFromBatchArray,
  removeUintRangesFromUintRanges
} from "bitbadgesjs-utils"
import { SHA256 } from "crypto-js"
import { useRouter } from "next/router"
import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react"
import { getAddressLists } from "../../bitbadges-api/api"
import { useChainContext } from "../../bitbadges-api/contexts/ChainContext"
import {
  fetchAccounts,
  fetchNextForAccountViews,
  getAccountActivityView,
  getAccountAddressListsView,
  getAccountBalancesView,
  getAccountListsActivityView,
  updateProfileInfo,
  useAccount
} from "../../bitbadges-api/contexts/accounts/AccountsContext"
import {
  fetchBalanceForUser,
  getCollection,
} from "../../bitbadges-api/contexts/collections/CollectionsContext"
import { AccountHeader } from "../../components/badges/AccountHeader"
import { BadgeAvatar } from "../../components/badges/BadgeAvatar"
import { BadgeInfiniteScroll } from "../../components/badges/BadgeInfiniteScroll"
import { BatchBadgeDetailsTag, OptionsSelects } from "../../components/badges/DisplayFilters"
import { ListInfiniteScroll } from "../../components/badges/ListInfiniteScroll"
import { BlockinDisplay } from "../../components/blockin/BlockinDisplay"
import { ListActivityTab } from "../../components/collection-page/ListActivityDisplay"
import { ReputationTab } from "../../components/collection-page/ReputationTab"
import { ActivityTab } from "../../components/collection-page/TransferActivityDisplay"
import { DevMode } from "../../components/common/DevMode"
import { CustomizeAddRemoveBadgeFromPage, CustomizeAddRemoveListFromPage, NewPageInputForm } from "../../components/display/CustomPages"
import IconButton from "../../components/display/IconButton"
import { Tabs } from "../../components/navigation/Tabs"
import { ReportedWrapper } from "../../components/wrappers/ReportedWrapper"
import { INFINITE_LOOP_MODE } from "../../constants"
import { compareObjects } from "../../utils/compare"
import { GO_MAX_UINT_64 } from "../../utils/dates"


const { Content } = Layout

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
  const [listsTab, setListsTab] = useState<string>("allLists")
  const [searchValue, setSearchValue] = useState<string>("")

  useEffect(() => {
    if (listsTab !== "") {
      setAddPageIsVisible(false)
    }
  }, [listsTab])

  const tabInfo = []

  tabInfo.push(
    { key: "collected", content: "Badges", disabled: false },
    { key: "lists", content: "Lists" },
    { key: "activity", content: "Activity", disabled: false },
    { key: "reputation", content: "Reviews" },
  )

  const badgePageTabInfo = [
    { key: "collected", content: "All", disabled: false },
  ]

  if (accountInfo?.customPages?.badges) {
    for (const customPage of accountInfo?.customPages?.badges) {
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
      ? "managingBadges"
      : badgeTab === "Created"
        ? "createdBadges"
        : "badgesCollected"
    ]


  const currViewId = customViewId && currViewWithoutFiltered?.pagination.hasMore
    ? customViewId : badgeTab === "Managing" ? "managingBadges" : badgeTab === "Created" ? "createdBadges"
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
            .filter((x) => x) as BatchBadgeDetails<bigint>[]) ?? []

        allBadgeIds.push(...badgesToAdd)
      }
    } else {
      allBadgeIds.push(
        ...deepCopy(
          accountInfo?.customPages?.badges?.find((x) => x.title === badgeTab)?.items ??
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
            const [_, removed] = removeUintRangesFromUintRanges(
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
      const [remaining] = removeUintRangesFromUintRanges(
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
        "badgesCollected",
        "badgesCollected"
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
          ? "managingBadges"
          : badgeTab === "Created"
            ? "createdBadges"
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
    listsTab === "allLists" ||
    listsTab === "allowlists" ||
    listsTab === "blocklists" ||
    listsTab === "privateLists" ||
    listsTab === "createdLists"

  const [customView, setCustomView] = useState<
    AddressListWithMetadata<bigint>[]
  >([])

  useEffect(() => {
    if (isPresetList) return

    async function getCustomView() {
      const idsToFetch = []
      if (listsTab === "Hidden") {
        idsToFetch.push(...(accountInfo?.hiddenLists ?? []))
      } else {
        idsToFetch.push(
          ...(accountInfo?.customPages?.lists?.find((x) => x.title === listsTab)
            ?.items ?? [])
        )
      }

      const res = await getAddressLists({ listIds: idsToFetch })
      setCustomView(res.addressLists)
    }

    getCustomView()
  }, [
    listsTab,
    accountInfo?.customPages?.lists,
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
      ? getAccountAddressListsView(accountInfo, currListViewId)
      : customView
  ).filter((x) => !filteredLists.includes(x.listId))

  const collectedHasMore = accountInfo?.views["badgesCollected"]?.pagination?.hasMore ?? true
  const hasMoreAddressLists =
    accountInfo?.views[`${listsTab}`]?.pagination?.hasMore ?? true
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log("useEffect: fetch more collected")

    //Fetch on tab change but only if empty and has more
    const collectedIsEmpty = !accountInfo?.views["badgesCollected"]?.ids.length
    const listsIsEmpty = !accountInfo?.views[`${listsTab}`]?.ids.length
    const createdByIsEmpty = !accountInfo?.views["createdBadges"]?.ids.length
    const managingIsEmpty = !accountInfo?.views["managingBadges"]?.ids.length
    const hasMoreAddressLists =
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
        (accountInfo?.views["managingBadges"]?.pagination?.hasMore ?? true) &&
        managingIsEmpty
      ) {
        fetchMoreManaging(accountInfo?.address ?? "", "managingBadges")
      } else if (
        badgeTab === "Created" &&
        (accountInfo?.views["createdBadges"]?.pagination?.hasMore ?? true) &&
        createdByIsEmpty
      ) {
        fetchMoreCreatedBy(accountInfo?.address ?? "", "createdBadges")
      }
    } else if (tab === "lists" && hasMoreAddressLists && listsIsEmpty) {
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
                                  accountInfo.customPages?.badges ?? []
                                )
                                newCustomPages.splice(
                                  newCustomPages.findIndex(
                                    (x) => x.title === badgeTab
                                  ),
                                  1
                                )

                                await updateProfileInfo(chain.address, {
                                  customPages: {
                                    ...accountInfo.customPages,
                                    lists: accountInfo.customPages?.lists ?? [],
                                    badges: newCustomPages,
                                  }

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
                            ...(accountInfo.customPages?.badges.map((x) => {
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
                      accountInfo.customPages?.badges.find((x) => x.title === badgeTab)
                        ?.description && (
                        <div
                          className="secondary-text"
                          style={{ marginBottom: 16, marginTop: 4 }}
                        >
                          {
                            accountInfo.customPages?.badges.find(
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
                                selectedBadge: BatchBadgeDetails<bigint>
                              ) => {
                                let currCustomPageBadges =
                                  badgeTab == "Hidden"
                                    ? deepCopy(accountInfo?.hiddenBadges ?? [])
                                    : deepCopy(
                                      accountInfo?.customPages?.badges?.find(
                                        (x) => x.title === badgeTab
                                      )?.items ?? []
                                    )
                                currCustomPageBadges = addToBatchArray(
                                  currCustomPageBadges,
                                  [selectedBadge]
                                )

                                if (badgeTab == "Hidden") {
                                  await updateProfileInfo(chain.address, {
                                    hiddenBadges: currCustomPageBadges,
                                  })
                                } else {
                                  const currCustomPage =
                                    accountInfo?.customPages?.badges?.find(
                                      (x) => x.title === badgeTab
                                    )
                                  if (!currCustomPage) return

                                  await updateProfileInfo(chain.address, {
                                    customPages: {
                                      lists: accountInfo?.customPages?.lists ?? [],
                                      badges: accountInfo?.customPages?.badges?.map(
                                        (x) =>
                                          x.title === badgeTab
                                            ? {
                                              ...currCustomPage,
                                              badges: currCustomPageBadges,
                                            }
                                            : x
                                      ) ?? [],
                                    }
                                  })
                                }
                              }}
                              onRemove={async (
                                selectedBadge: BatchBadgeDetails<bigint>
                              ) => {
                                let currCustomPageBadges = badgeTab == "Hidden"
                                  ? deepCopy(accountInfo?.hiddenBadges ?? [])
                                  : deepCopy(
                                    accountInfo?.customPages?.badges?.find(
                                      (x) => x.title === badgeTab
                                    )?.items ?? []
                                  )
                                currCustomPageBadges = removeFromBatchArray(
                                  currCustomPageBadges,
                                  [selectedBadge]
                                )

                                if (badgeTab == "Hidden") {
                                  await updateProfileInfo(chain.address, {
                                    hiddenBadges: currCustomPageBadges,
                                  })
                                } else {
                                  const currCustomPage =
                                    accountInfo?.customPages?.badges?.find(
                                      (x) => x.title === badgeTab
                                    )
                                  if (!currCustomPage) return

                                  await updateProfileInfo(chain.address, {
                                    customPages: {
                                      lists: accountInfo?.customPages?.lists ?? [],
                                      badges: accountInfo?.customPages?.badges?.map(
                                        (x) =>
                                          x.title === badgeTab
                                            ? {
                                              ...currCustomPage,
                                              badges: currCustomPageBadges,
                                            }
                                            : x
                                      ) ?? [],
                                    }
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
                          accountInfo.customPages?.badges ?? []
                        )
                        newCustomPages.push({
                          title: newPageTitle,
                          description: newPageDescription,
                          items: [],
                        })

                        await updateProfileInfo(chain.address, {
                          customPages: {
                            lists: accountInfo.customPages?.lists ?? [],
                            badges: newCustomPages,
                          }
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
                                ? accountInfo?.views["managingBadges"]?.pagination?.hasMore ?? true
                                : badgeTab === "Created"
                                  ? accountInfo?.views["createdBadges"]?.pagination
                                    ?.hasMore ?? true
                                  : false
                          }
                          fetchMore={async () => {
                            const hasMore =
                              badgeTab === "All"
                                ? collectedHasMore
                                : badgeTab === "Managing"
                                  ? accountInfo?.views["managingBadges"]?.pagination
                                    ?.hasMore ?? true
                                  : badgeTab === "Created"
                                    ? accountInfo?.views["createdBadges"]?.pagination
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
                                  "managingBadges",
                                  filteredCollections
                                )
                              } else if (badgeTab === "Created") {
                                await fetchMoreWithFiltered(
                                  accountInfo?.address ?? "",
                                  "createdBadges",
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
                                  "managingBadges"
                                )
                              } else if (badgeTab === "Created") {
                                await fetchMoreCreatedBy(
                                  accountInfo?.address ?? "",
                                  "createdBadges"
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
                    {filteredLists.map((listId, idx) => {
                      const metadata = accountInfo.addressLists?.find(
                        (x) => x.listId === listId
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
                              filteredLists.filter((x) => x !== listId)
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
                                    accountInfo.addressLists?.find(
                                      (x) => x.listId === listId
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
                                <div>{metadata?.name}</div>
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
                          listsTab == "allLists" ||
                          listsTab == "Hidden" ||
                          listsTab == "allowlists" ||
                          listsTab == "blocklists" ||
                          listsTab == "privateLists" ||
                          listsTab == "createdLists"
                          ? undefined
                          : async (listsTab: string) => {
                            const newCustomPages = deepCopy(
                              accountInfo.customPages?.lists ?? []
                            )
                            newCustomPages.splice(
                              newCustomPages.findIndex(
                                (x) => x.title === listsTab
                              ),
                              1
                            )

                            await updateProfileInfo(chain.address, {
                              customPages: {
                                badges: accountInfo.customPages?.badges ?? [],
                                lists: newCustomPages,
                              }
                            })
                          }
                      }
                      tabInfo={[
                        {
                          key: "allLists",
                          content: "All",
                          disabled: false,
                        },
                        {
                          key: "allowlists",
                          content: "Included",
                          disabled: false,
                        },
                        {
                          key: "blocklists",
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
                        ...(accountInfo.customPages?.lists?.map((customPage) => {
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
                      allowlists where the address is included and blocklists
                      where the address is excluded.
                    </div>
                  )}
                  {listsTab === "allowlists" && (
                    <div
                      className="secondary-text"
                      style={{ marginBottom: 16, marginTop: 4 }}
                    >
                      <InfoCircleOutlined /> These results only include
                      allowlists where the address is included.
                    </div>
                  )}
                  {listsTab === "blocklists" && (
                    <div
                      className="secondary-text"
                      style={{ marginBottom: 16, marginTop: 4 }}
                    >
                      <InfoCircleOutlined /> These results only include
                      blocklists where the address is excluded.
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
                        accountInfo.customPages?.lists?.find(
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
                                  accountInfo?.customPages?.lists?.find(
                                    (x) => x.title === listsTab
                                  )?.items ?? []
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
                                accountInfo?.customPages?.lists?.find(
                                  (x) => x.title === listsTab
                                )
                              if (!currCustomPage) return

                              await updateProfileInfo(chain.address, {
                                customPages: {
                                  badges: accountInfo?.customPages?.badges ?? [],
                                  lists: accountInfo?.customPages?.lists?.map(
                                    (x) =>
                                      x.title === listsTab
                                        ? {
                                          ...currCustomPage,
                                          listIds: currCustomPageLists,
                                        }
                                        : x
                                  ) ?? [],
                                }
                              })
                            }
                          }}
                          onRemove={async (selectedList: string) => {
                            let currCustomPageLists =
                              listsTab == "Hidden"
                                ? deepCopy(accountInfo?.hiddenLists ?? [])
                                : deepCopy(
                                  accountInfo?.customPages?.lists?.find(
                                    (x) => x.title === listsTab
                                  )?.items ?? []
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
                                accountInfo?.customPages?.lists?.find(
                                  (x) => x.title === listsTab
                                )
                              if (!currCustomPage) return

                              await updateProfileInfo(chain.address, {
                                customPages: {
                                  badges: accountInfo?.customPages?.badges ?? [],
                                  lists: accountInfo?.customPages?.lists?.map(
                                    (x) =>
                                      x.title === listsTab
                                        ? {
                                          ...currCustomPage,
                                          listIds: currCustomPageLists,
                                        }
                                        : x
                                  ) ?? [],

                                }
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
                        accountInfo.customPages?.lists ?? []
                      )
                      newCustomPages.push({
                        title: newPageTitle,
                        description: newPageDescription,
                        items: [],
                      })

                      await updateProfileInfo(chain.address, {
                        customPages: {
                          badges: accountInfo.customPages?.badges ?? [],
                          lists: newCustomPages,
                        }
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
                                  hasMoreAddressLists
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
                            hasMore={isPresetList && hasMoreAddressLists}
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
                        "reviews",
                        "reviews"
                      )
                    }}
                    hasMore={
                      accountInfo?.views["reviews"]?.pagination
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
                        getAccountActivityView(accountInfo, "transferActivity") ??
                        []
                      }
                      fetchMore={async () =>
                        fetchNextForAccountViews(
                          accountInfo?.address ?? "",
                          "transferActivity",
                          "transferActivity"
                        )
                      }
                      hasMore={
                        accountInfo?.views["transferActivity"]?.pagination
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
