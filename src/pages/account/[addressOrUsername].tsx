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
import { deepCopy } from "bitbadgesjs-proto"
import {
  AccountViewKey,
  AddressListWithMetadata,
  BatchBadgeDetails, CollectionMap, addToBatchArray,
  getMaxBadgeIdForCollection,
  removeFromBatchArray,
  removeUintRangesFromUintRanges,
  sortUintRangesAndMergeIfNecessary
} from "bitbadgesjs-utils"
import { SHA256 } from "crypto-js"
import { useRouter } from "next/router"
import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react"
import { useSelector } from "react-redux"
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
  fetchBalanceForUser
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
import { GlobalReduxState } from "../_app"


const { Content } = Layout

export function applyClientSideFilters(
  allBadgeIds: BatchBadgeDetails<bigint>[],
  onlySpecificCollections: BatchBadgeDetails<bigint>[] = [],
  oldestFirst: boolean = false,
  collections: CollectionMap<bigint>
) {
  //Filter to only include the specific collections requested (if any)
  if (onlySpecificCollections.length > 0) {
    const filtered = []
    for (const badgeIdObj of allBadgeIds) {
      for (const filteredCollection of onlySpecificCollections) {
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

  //Filter out the max badge ID for each collection
  for (const badgeIdObj of allBadgeIds) {
    const collection = collections[`${badgeIdObj.collectionId}`]
    if (!collection) continue
    const maxBadgeId = getMaxBadgeIdForCollection(collection)
    const [remaining] = removeUintRangesFromUintRanges(
      [{ start: maxBadgeId + 1n, end: GO_MAX_UINT_64 }],
      badgeIdObj.badgeIds
    )
    badgeIdObj.badgeIds = remaining
  }

  //Apply client-side sorts
  if (oldestFirst) {
    allBadgeIds = allBadgeIds.sort((a, b) => a.collectionId > b.collectionId ? 1 : -1)
  } else {
    allBadgeIds = allBadgeIds.sort((a, b) => a.collectionId < b.collectionId ? 1 : -1)
  }

  return allBadgeIds.filter((x) => x.badgeIds.length > 0)
}


function PortfolioPage() {
  const router = useRouter()

  const chain = useChainContext()
  const collections = useSelector((state: GlobalReduxState) => state.collections.collections)
  const { addressOrUsername } = router.query
  const accountInfo = useAccount(addressOrUsername as string)
  const [tab, setTab] = useState("collected")
  const [addPageIsVisible, setAddPageIsVisible] = useState(false)
  const [warned, setWarned] = useState(false)
  const [badgeTab, setBadgeTab] = useState("All")
  const [cardView, setCardView] = useState(true)
  const [onlySpecificCollections, setOnlySpecificCollections] = useState<BatchBadgeDetails<bigint>[]>([])
  const [onlySpecificLists, setOnlyFilteredLists] = useState<string[]>([])
  const [groupByCollection, setGroupByCollection] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [listsTab, setListsTab] = useState<string>("allLists")
  const [oldestFirst, setOldestFirst] = useState(false)
  const [searchValue, setSearchValue] = useState<string>("")
  const [activityTab, setActivityTab] = useState("badges")
  const [customView, setCustomView] = useState<AddressListWithMetadata<bigint>[]>([])

  const badgeViewId = useMemo(() => {
    const baseViewId = badgeTab === "Managing" ? "managingBadges" : badgeTab === "Created" ? "createdBadges" : "badgesCollected";
    if (accountInfo?.views[baseViewId]?.pagination?.hasMore === false) {
      // We can handle all filters client-side using the base view
      return baseViewId;
    }

    let newViewId = baseViewId;
    if (onlySpecificCollections.length > 0) {
      newViewId += ":" + SHA256(JSON.stringify(onlySpecificCollections)).toString();
    }

    if (oldestFirst) {
      newViewId += ":oldestFirst";
    }

    return newViewId;
  }, [badgeTab, oldestFirst, accountInfo, onlySpecificCollections]);

  const listViewId = useMemo(() => {
    const baseViewId = listsTab;
    if (accountInfo?.views[baseViewId]?.pagination?.hasMore === false) {
      // We can handle all filters client-side using the base view
      return baseViewId;
    }

    let newViewId = baseViewId;
    if (onlySpecificLists.length > 0) {
      newViewId += ":" + SHA256(JSON.stringify(onlySpecificLists)).toString();
    }

    if (oldestFirst) {
      newViewId += ":oldestFirst";
    }

    return newViewId;
  }, [listsTab, oldestFirst, accountInfo, onlySpecificLists]);

  const badgesView = !accountInfo ? undefined : accountInfo?.views[badgeViewId]

  //apply client side filters for lists
  const listsView = !accountInfo ? [] : customView ?? getAccountAddressListsView(accountInfo, listViewId).filter((x) => !onlySpecificLists.includes(x.listId))
  if (oldestFirst) {
    listsView.sort((a, b) => a.createdBlock > b.createdBlock ? 1 : -1)
  } else {
    listsView.sort((a, b) => a.createdBlock < b.createdBlock ? 1 : -1)
  }

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

  useEffect(() => {
    if (listsTab !== "") {
      setAddPageIsVisible(false)
    }
  }, [listsTab])

  useEffect(() => {
    if (badgeTab !== "") {
      setAddPageIsVisible(false)
    }
  }, [badgeTab])


  const tabInfo = []
  tabInfo.push(
    { key: "collected", content: "Badges", disabled: false },
    { key: "lists", content: "Lists" },
    { key: "activity", content: "Activity", disabled: false },
    { key: "reviews", content: "Reviews" },
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

    for (const id of onlySpecificCollections) {
      fetchBalanceForUser(id.collectionId, accountInfo?.address)
    }
  }, [onlySpecificCollections, accountInfo?.address])


  const badgesToShow = useMemo(() => {
    const allBadgeIds: BatchBadgeDetails<bigint>[] = []

    //Get correct view: "All", "Hidden", "Managing", "Created", or custom page
    //Put all badge IDs from view into allBadgeIds
    if (badgeTab === "Hidden") {
      allBadgeIds.push(...deepCopy(accountInfo?.hiddenBadges ?? []))
    } else if (badgeTab === "All" || badgeTab === "Managing" || badgeTab === "Created") {
      if (badgeTab === "All") {
        const collectedBadges = getAccountBalancesView(accountInfo, "badgesCollected")
        for (const balanceInfo of collectedBadges) {
          if (!balanceInfo) {
            continue
          }

          allBadgeIds.push(
            deepCopy({
              badgeIds: sortUintRangesAndMergeIfNecessary(deepCopy(balanceInfo.balances.map((balance) => balance.badgeIds).flat() || []), true),
              collectionId: balanceInfo.collectionId,
            })
          )
        }
      } else {
        //.ids are a string[] of collectionIds
        //we will filter > max out later
        const badgesToAdd = (badgesView?.ids.map((id) => {
          return {
            collectionId: BigInt(id),
            badgeIds: [{ start: 1n, end: GO_MAX_UINT_64 }],
          }
        }).filter((x) => x) as BatchBadgeDetails<bigint>[]) ?? []

        allBadgeIds.push(...badgesToAdd)
      }
    } else {
      allBadgeIds.push(
        ...deepCopy(
          accountInfo?.customPages?.badges?.find((x) => x.title === badgeTab)?.items ?? []
        )
      )
    }

    return applyClientSideFilters(allBadgeIds, onlySpecificCollections, oldestFirst, collections)
  }, [accountInfo, badgeTab, onlySpecificCollections, badgesView?.ids, collections, oldestFirst])

  const isPresetList =
    listsTab === "allLists" ||
    listsTab === "allowlists" ||
    listsTab === "blocklists" ||
    listsTab === "privateLists" ||
    listsTab === "createdLists"

  const fetchAccountViewPage = useCallback(async () => {
    if (tab === "lists" && isPresetList && listsTab === "privateLists" && !chain.loggedIn) return;

    const viewId = tab === "collected" ? badgeViewId : listViewId;
    const viewType = viewId.split(':')[0] as AccountViewKey;
    await fetchNextForAccountViews(
      addressOrUsername as string,
      viewType,
      viewId,
      tab === "collected" ? onlySpecificCollections : undefined,
      tab === "lists" ? onlySpecificLists : undefined,
      oldestFirst
    )
  }, [addressOrUsername, listViewId, badgeViewId, onlySpecificCollections, onlySpecificLists, oldestFirst, tab, isPresetList, listsTab, chain.loggedIn])


  useEffect(() => {
    if (isPresetList) return

    //Should fix this in future (probably with a context), but for custom list pages, we do not have a fetch system like we do with badges
    //Here, we fetch them manually and store in the customView state
    async function getCustomView() {
      let idsToFetch = []
      const allIds = []
      const cachedLists = deepCopy(customView)
      if (listsTab === "Hidden") {
        idsToFetch.push(...(accountInfo?.hiddenLists ?? []))
        allIds.push(...(accountInfo?.hiddenLists ?? []))
      } else {
        idsToFetch.push(...(accountInfo?.customPages?.lists?.find((x) => x.title === listsTab)?.items ?? []))
        allIds.push(...(accountInfo?.customPages?.lists?.find((x) => x.title === listsTab)?.items ?? []))
      }

      //Remove any cached lists from idsToFetch
      idsToFetch = idsToFetch.filter((x) => !cachedLists.find((y) => y.listId === x))

      const res = idsToFetch.length > 0 ? await getAddressLists({ listIds: idsToFetch }) : { addressLists: [] }

      const newView = [];
      for (const id of allIds) {
        //Find it in either the cached lists or the newly fetched lists
        const list = cachedLists.find((x) => x.listId === id) ?? res.addressLists.find((x) => x.listId === id)
        if (!list) continue

        newView.push(list)
      }

      setCustomView(newView)
    }

    getCustomView()
  }, [listsTab, accountInfo?.customPages?.lists, isPresetList, accountInfo?.hiddenLists,])


  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log("useEffect: fetch more collected")

    if (!accountInfo || !accountInfo.address) return
    if (tab === 'activity' || tab == 'reviews') return

    fetchAccountViewPage();
  }, [fetchAccountViewPage, accountInfo, chain.loggedIn, chain.address, tab, listsTab, isPresetList])

  //Default fetch account, if not fetched already
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log("useEffect: get portfolio info")
    async function getPortfolioInfo() {
      //Check if addressOrUsername is an address or account number and fetch portfolio accordingly
      if (!addressOrUsername) return

      await fetchAccounts([addressOrUsername as string])
    }
    getPortfolioInfo()
  }, [addressOrUsername])


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
                    onlySpecificCollections={onlySpecificCollections}
                    setOnlySpecificCollections={setOnlySpecificCollections}
                    editMode={editMode}
                    setEditMode={setEditMode}
                    onlySpecificLists={onlySpecificLists}
                    setOnlyFilteredLists={setOnlyFilteredLists}
                    cardView={cardView}
                    setCardView={setCardView}
                    groupByCollection={groupByCollection}
                    setGroupByCollection={setGroupByCollection}
                    addressOrUsername={addressOrUsername as string}
                    setOldestFirst={setOldestFirst}
                    oldestFirst={oldestFirst}
                  />
                  <br />

                  <div className="full-width flex-center flex-wrap">
                    {onlySpecificCollections.map((filteredCollection, idx) => {
                      return (
                        <BatchBadgeDetailsTag
                          key={idx}
                          badgeIdObj={filteredCollection}
                          onClose={() => {
                            setOnlySpecificCollections(
                              onlySpecificCollections.filter(
                                (x) => !compareObjects(x, filteredCollection)
                              )
                            )
                          }}
                        />
                      )
                    })}
                  </div>
                  {onlySpecificCollections.length > 0 && <br />}
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
                                newCustomPages.splice(newCustomPages.findIndex(
                                  (x) => x.title === badgeTab
                                ), 1)

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

                    {badgeTab != "All" &&
                      badgeTab != "" &&
                      badgeTab != "Created" &&
                      badgeTab != "Managing" &&
                      editMode && (
                        <>
                          <div className="flex-center">
                            <CustomizeAddRemoveBadgeFromPage
                              currItems={deepCopy(badgeTab == "Hidden"
                                ? deepCopy(accountInfo?.hiddenBadges ?? [])
                                : deepCopy(
                                  accountInfo?.customPages?.badges?.find(
                                    (x) => x.title === badgeTab
                                  )?.items ?? []
                                ))}
                              onAdd={async (
                                selectedBadge: BatchBadgeDetails<bigint>
                              ) => {
                                let currCustomPageBadges = badgeTab == "Hidden"
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
                                              items: currCustomPageBadges,
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
                                              items: currCustomPageBadges,
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
                    <br />
                    {badgeTab !== "" && (
                      <>
                        {/* // badgeTab !== 'Managing' && badgeTab !== 'Created' && <> */}
                        <BadgeInfiniteScroll
                          addressOrUsername={addressOrUsername as string}
                          badgesToShow={badgesToShow}
                          cardView={cardView}
                          editMode={editMode}
                          hasMore={accountInfo.views[badgeViewId]?.pagination?.hasMore ?? true}
                          fetchMore={async () => {
                            const hasMore = accountInfo.views[badgeViewId]?.pagination?.hasMore ?? true
                            if (hasMore) {
                              await fetchAccountViewPage();
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
                    onlySpecificLists={onlySpecificLists}
                    setOnlyFilteredLists={setOnlyFilteredLists}
                    searchValue={searchValue}
                    setSearchValue={setSearchValue}
                    onlySpecificCollections={onlySpecificCollections}
                    setOnlySpecificCollections={setOnlySpecificCollections}
                    editMode={editMode}
                    setEditMode={setEditMode}
                    cardView={cardView}
                    setCardView={setCardView}
                    groupByCollection={groupByCollection}
                    setGroupByCollection={setGroupByCollection}
                    addressOrUsername={addressOrUsername as string}
                    setOldestFirst={setOldestFirst}
                    oldestFirst={oldestFirst}
                  />
                  <br />

                  <div className="full-width flex-center flex-wrap">
                    {onlySpecificLists.map((listId, idx) => {
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
                            setOnlyFilteredLists(
                              onlySpecificLists.filter((x) => x !== listId)
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
                      <InfoCircleOutlined /> These results include
                      allowlists and blocklists.
                    </div>
                  )}
                  {listsTab === "allowlists" && (
                    <div
                      className="secondary-text"
                      style={{ marginBottom: 16, marginTop: 4 }}
                    >
                      <InfoCircleOutlined /> These results only include
                      allowlists.
                    </div>
                  )}
                  {listsTab === "blocklists" && (
                    <div
                      className="secondary-text"
                      style={{ marginBottom: 16, marginTop: 4 }}
                    >
                      <InfoCircleOutlined /> These results only include
                      blocklists.
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
                          currItems={deepCopy(listsTab == "Hidden"
                            ? deepCopy(accountInfo?.hiddenLists ?? [])
                            : deepCopy(
                              accountInfo?.customPages?.lists?.find(
                                (x) => x.title === listsTab
                              )?.items ?? []
                            ))}
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
                                          items: currCustomPageLists,
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
                              const currCustomPage = accountInfo?.customPages?.lists?.find(
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
                                          items: currCustomPageLists,
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
                              await fetchAccountViewPage();
                            }}
                            hasMore={accountInfo.views[listViewId]?.pagination?.hasMore ?? true}
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

              {tab === "reviews" && (
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
