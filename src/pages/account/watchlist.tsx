import {
  CloseCircleOutlined,
  MinusOutlined,
  PlusOutlined,
} from "@ant-design/icons"
import { Divider, Layout, Tag, Typography, notification } from "antd"
import { UintRange, deepCopy } from "bitbadgesjs-proto"
import {
  AccountViewKey,
  BitBadgesAddressList
} from "bitbadgesjs-utils"
import { useEffect, useMemo, useState } from "react"
import { useChainContext } from "../../bitbadges-api/contexts/ChainContext"

import { BatchBadgeDetails, addToBatchArray, removeFromBatchArray } from "bitbadgesjs-utils"
import { useSelector } from "react-redux"
import { getAddressLists } from "../../bitbadges-api/api"
import {
  updateProfileInfo,
  useAccount,
} from "../../bitbadges-api/contexts/accounts/AccountsContext"
import { fetchBalanceForUser } from "../../bitbadges-api/contexts/collections/CollectionsContext"
import { BadgeAvatar } from "../../components/badges/BadgeAvatar"
import { BadgeInfiniteScroll } from "../../components/badges/BadgeInfiniteScroll"
import { BatchBadgeDetailsTag, OptionsSelects } from "../../components/badges/DisplayFilters"
import { ListInfiniteScroll } from "../../components/badges/ListInfiniteScroll"
import { DevMode } from "../../components/common/DevMode"
import { CustomizeAddRemoveBadgeFromPage, CustomizeAddRemoveListFromPage, NewPageInputForm } from "../../components/display/CustomPages"
import IconButton from "../../components/display/IconButton"
import { Tabs } from "../../components/navigation/Tabs"
import { compareObjects } from "../../utils/compare"
import { GlobalReduxState } from "../_app"
import { applyClientSideFilters } from "./[addressOrUsername]"

const { Content } = Layout

function WatchlistPage() {
  const chain = useChainContext()

  const accountInfo = useAccount(chain.address)

  const [tab, setTab] = useState(accountInfo?.readme ? "overview" : "collected")
  const [addPageIsVisible, setAddPageIsVisible] = useState(false)
  const [warned, setWarned] = useState(false)
  const [oldestFirst, setOldestFirst] = useState(false)

  useEffect(() => {
    if (
      accountInfo?.cosmosAddress === chain.cosmosAddress &&
      !chain.loggedIn &&
      chain.cosmosAddress &&
      !warned
    ) {
      notification.info({
        message: "You must sign in to customize your watchlist.",
      })
      setWarned(true)
    }
  }, [accountInfo, chain, warned])

  const [badgeTab, setBadgeTab] = useState(
    accountInfo?.watchlists?.badges && accountInfo?.watchlists?.badges?.length > 0
      ? accountInfo?.watchlists?.badges[0].title
      : ""
  )

  useEffect(() => {
    if (badgeTab !== "") {
      setAddPageIsVisible(false)
    }
  }, [badgeTab])

  const [cardView, setCardView] = useState(true)
  const [onlySpecificCollections, setOnlySpecificCollections] = useState<BatchBadgeDetails<bigint>[]>([])
  const [groupByCollection, setGroupByCollection] = useState(false)

  const [editMode, setEditMode] = useState(false)
  const [listsTab, setListsTab] = useState<string>(
    accountInfo?.watchlists?.lists && accountInfo?.watchlists?.lists?.length > 0
      ? accountInfo?.watchlists?.lists[0].title
      : ""
  )
  const [searchValue, setSearchValue] = useState<string>("")
  const [tabSetInitial, setTabSetInitial] = useState(!!accountInfo)

  const collections = useSelector((state: GlobalReduxState) => state.collections.collections)

  useEffect(() => {
    if (!accountInfo) return
    if (tabSetInitial) return
    setTabSetInitial(true)
    if (!listsTab)
      setListsTab(
        accountInfo?.watchlists?.lists &&
          accountInfo?.watchlists?.lists?.length > 0
          ? accountInfo?.watchlists?.lists[0].title
          : ""
      )
    if (!badgeTab)
      setBadgeTab(
        accountInfo?.watchlists?.badges &&
          accountInfo?.watchlists?.badges?.length > 0
          ? accountInfo?.watchlists?.badges[0].title
          : ""
      )
  }, [accountInfo, badgeTab, listsTab, tabSetInitial])

  useEffect(() => {
    if (listsTab !== "") {
      setAddPageIsVisible(false)
    }
  }, [listsTab])

  const tabInfo = []
  tabInfo.push(
    { key: "collected", content: "Badges", disabled: false },
    { key: "lists", content: "Lists" }
  )

  const badgePageTabInfo = []

  if (accountInfo?.watchlists?.badges) {
    for (const customPage of accountInfo?.watchlists?.badges) {
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

  let badgesToShow = useMemo(() => {
    let allBadgeIds: {
      collectionId: bigint
      badgeIds: UintRange<bigint>[]
    }[] = []
    allBadgeIds.push(
      ...deepCopy(accountInfo?.watchlists?.badges?.find((x) => x.title === badgeTab)
        ?.items ?? []
      )
    )

    return applyClientSideFilters(allBadgeIds, onlySpecificCollections, oldestFirst, collections)
  }, [accountInfo, badgeTab, onlySpecificCollections, collections, oldestFirst])

  const [customView, setCustomView] = useState<BitBadgesAddressList<bigint>[]>([])
  const [onlySpecificLists, setOnlyFilteredLists] = useState<string[]>([])

  useEffect(() => {
    async function getCustomView() {
      const idsToFetch = []

      idsToFetch.push(...(accountInfo?.watchlists?.lists?.find((x) => x.title === listsTab)
        ?.items ?? [])
      )

      const res = await getAddressLists({ listsToFetch: idsToFetch.map(x => { return { listId: x } }) })
      const addressLists = res.addressLists;

      if (oldestFirst) {
        addressLists.sort((a, b) => a.createdBlock > b.createdBlock ? 1 : -1)
      } else {
        addressLists.sort((a, b) => a.createdBlock < b.createdBlock ? 1 : -1)
      }
      setCustomView(addressLists)
    }

    getCustomView()
  }, [listsTab, accountInfo?.watchlists?.lists, oldestFirst])

  const listsView = customView.filter(
    (x) => onlySpecificLists.length === 0 || onlySpecificLists.includes(x.listId)
  )

  if (!accountInfo) {
    return <></>
  }

  return (
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
          <div
            className="flex-center primary-text"
            style={{
              alignItems: "center",
              marginBottom: 16,
              fontSize: 25,
              fontWeight: "bolder",
            }}
          >
            Watchlists
          </div>

          <Tabs tabInfo={tabInfo} tab={tab} setTab={setTab} fullWidth />

          {(tab === "collected" || tab == "hidden") && (
            <>
              <br />
              <OptionsSelects
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
                addressOrUsername={chain.address as string}
                oldestFirst={oldestFirst}
                setOldestFirst={setOldestFirst}
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
                        !editMode
                          ? undefined
                          : async (badgeTab: string) => {
                            const newCustomPages = deepCopy(
                              accountInfo.watchlists?.badges ?? []
                            )
                            newCustomPages.splice(
                              newCustomPages.findIndex(
                                (x) => x.title === badgeTab
                              ),
                              1
                            )

                            await updateProfileInfo(chain.address, {
                              watchlists: {
                                badges: newCustomPages,
                                lists: accountInfo.watchlists?.lists ?? [],
                              },
                            })
                          }
                      }
                      tabInfo={[
                        ...(accountInfo.watchlists?.badges?.map((customPage) => {
                          return {
                            key: customPage.title,
                            content: customPage.title,
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
                        !addPageIsVisible ? <PlusOutlined /> : <MinusOutlined />
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

                {badgeTab !== "" &&
                  accountInfo.watchlists?.badges?.find(
                    (x) => x.title === badgeTab
                  )?.description && (
                    <div
                      className="secondary-text"
                      style={{ marginBottom: 16, marginTop: 4 }}
                    >
                      {
                        accountInfo.watchlists?.badges?.find(
                          (x) => x.title === badgeTab
                        )?.description
                      }
                    </div>
                  )}

                {!accountInfo.watchlists?.badges?.length &&
                  !addPageIsVisible && (
                    <div
                      className="secondary-text"
                      style={{ marginBottom: 16, marginTop: 4 }}
                    >
                      You have no custom pages. Sign in, go into customize mode,
                      and click the plus button to add one.
                    </div>
                  )}

                <br />

                {badgeTab != "" && editMode && (
                  <>
                    <div className="flex-center">
                      <CustomizeAddRemoveBadgeFromPage
                        currItems={deepCopy(
                          accountInfo?.watchlists?.badges?.find(
                            (x) => x.title === badgeTab
                          )?.items ?? []
                        )}
                        onAdd={async (selectedBadge: BatchBadgeDetails<bigint>) => {
                          let currCustomPageBadges = deepCopy(
                            accountInfo?.watchlists?.badges?.find(
                              (x) => x.title === badgeTab
                            )?.items ?? []
                          )
                          currCustomPageBadges = addToBatchArray(
                            currCustomPageBadges,
                            [selectedBadge]
                          )

                          const currCustomPage =
                            accountInfo?.watchlists?.badges?.find(
                              (x) => x.title === badgeTab
                            )
                          if (!currCustomPage) return

                          await updateProfileInfo(chain.address, {
                            watchlists: {
                              badges: accountInfo?.watchlists?.badges?.map(
                                (x) =>
                                  x.title === badgeTab
                                    ? {
                                      ...currCustomPage,
                                      items: currCustomPageBadges,
                                    }
                                    : x
                              ) ?? [],
                              lists: accountInfo.watchlists?.lists ?? [],
                            },
                          })
                        }}
                        onRemove={async (selectedBadge: BatchBadgeDetails<bigint>) => {
                          let currCustomPageBadges = deepCopy(
                            accountInfo?.watchlists?.badges?.find(
                              (x) => x.title === badgeTab
                            )?.items ?? []
                          )
                          currCustomPageBadges = removeFromBatchArray(
                            currCustomPageBadges,
                            [selectedBadge]
                          )

                          const currCustomPage =
                            accountInfo?.watchlists?.badges?.find(
                              (x) => x.title === badgeTab
                            )
                          if (!currCustomPage) return

                          await updateProfileInfo(chain.address, {
                            watchlists: {
                              badges: accountInfo?.watchlists?.badges?.map(
                                (x) =>
                                  x.title === badgeTab
                                    ? {
                                      ...currCustomPage,
                                      items: currCustomPageBadges,
                                    }
                                    : x
                              ) ?? [],
                              lists: accountInfo.watchlists?.lists ?? [],
                            },
                          })
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
                      accountInfo.watchlists?.badges ?? []
                    )
                    newCustomPages.push({
                      title: newPageTitle,
                      description: newPageDescription,
                      items: [],
                    })

                    await updateProfileInfo(chain.address, {
                      watchlists: {
                        badges: newCustomPages,
                        lists: accountInfo.watchlists?.lists ?? [],
                      },
                    })

                    setBadgeTab(newPageTitle)
                  }}
                />

                {badgeTab !== "" && (
                  <>
                    <BadgeInfiniteScroll
                      fetchMore={async () => { }}
                      hasMore={false}
                      cardView={cardView}
                      groupByCollection={groupByCollection}
                      addressOrUsername={accountInfo?.address ?? ""}
                      editMode={editMode}
                      badgesToShow={badgesToShow}
                      isWatchlist
                    />
                  </>
                )}
              </div>
            </>
          )}

          {tab === "lists" && (
            <>
              <br />
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
                addressOrUsername={chain.address as string}
                oldestFirst={oldestFirst}
                setOldestFirst={setOldestFirst}
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
                    !editMode
                      ? undefined
                      : async (listsTab: string) => {
                        const newCustomPages = deepCopy(
                          accountInfo.watchlists?.lists ?? []
                        )
                        newCustomPages.splice(
                          newCustomPages.findIndex(
                            (x) => x.title === listsTab
                          ),
                          1
                        )

                        await updateProfileInfo(chain.address, {
                          watchlists: {
                            badges: accountInfo.watchlists?.badges ?? [],
                            lists: newCustomPages,
                          },
                        })
                      }
                  }
                  tabInfo={[
                    ...(accountInfo.watchlists?.lists?.map((customPage) => {
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
                      !addPageIsVisible ? <PlusOutlined /> : <MinusOutlined />
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
              {listsTab !== "" && (
                <div
                  className="secondary-text"
                  style={{ marginBottom: 16, marginTop: 4 }}
                >
                  {
                    accountInfo.watchlists?.lists?.find(
                      (x) => x.title === badgeTab
                    )?.description
                  }
                </div>
              )}

              {!accountInfo.watchlists?.lists?.length && !addPageIsVisible && (
                <div
                  className="secondary-text"
                  style={{ marginBottom: 16, marginTop: 4 }}
                >
                  You have no custom pages. Sign in, go into customize mode, and
                  click the plus button to add one.
                </div>
              )}
              {listsTab != "" && editMode && (
                <>
                  <div className="flex-center">
                    <CustomizeAddRemoveListFromPage
                      currItems={deepCopy(
                        accountInfo?.watchlists?.lists?.find(
                          (x) => x.title === listsTab
                        )?.items ?? []
                      )}
                      addressOrUsername={accountInfo.address}
                      onAdd={async (selectedList: string) => {
                        let currCustomPageLists = deepCopy(
                          accountInfo?.watchlists?.lists?.find(
                            (x) => x.title === listsTab
                          )?.items ?? []
                        )

                        currCustomPageLists = currCustomPageLists.concat([
                          selectedList,
                        ])

                        const currCustomPage =
                          accountInfo?.watchlists?.lists?.find(
                            (x) => x.title === listsTab
                          )
                        if (!currCustomPage) return

                        await updateProfileInfo(chain.address, {
                          watchlists: {
                            badges: accountInfo?.watchlists?.badges ?? [],
                            lists: accountInfo?.watchlists?.lists?.map((x) =>
                              x.title === listsTab
                                ? {
                                  ...currCustomPage,
                                  items: currCustomPageLists,
                                }
                                : x
                            ) ?? [],
                          },


                        })
                      }}
                      onRemove={async (selectedList: string) => {
                        let currCustomPageLists = deepCopy(
                          accountInfo?.watchlists?.lists?.find(
                            (x) => x.title === listsTab
                          )?.items ?? []
                        )
                        currCustomPageLists = currCustomPageLists.filter(
                          (x) => x !== selectedList
                        )

                        const currCustomPage =
                          accountInfo?.watchlists?.lists?.find(
                            (x) => x.title === listsTab
                          )
                        if (!currCustomPage) return

                        await updateProfileInfo(chain.address, {
                          watchlists: {
                            badges: accountInfo?.watchlists?.badges ?? [],
                            lists: accountInfo?.watchlists?.lists?.map((x) =>
                              x.title === listsTab
                                ? {
                                  ...currCustomPage,
                                  items: currCustomPageLists,
                                }
                                : x
                            ) ?? [],
                          },
                        })
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
                    accountInfo.watchlists?.lists ?? []
                  )
                  newCustomPages.push({
                    title: newPageTitle,
                    description: newPageDescription,
                    items: [],
                  })

                  await updateProfileInfo(chain.address, {
                    watchlists: {
                      badges: accountInfo.watchlists?.badges ?? [],
                      lists: newCustomPages,
                    },
                  })

                  setListsTab(newPageTitle)
                }}
              />

              {listsTab !== "" && (
                <>
                  <ListInfiniteScroll
                    fetchMore={async () => { }}
                    hasMore={false}
                    listsView={listsView}
                    addressOrUsername={accountInfo?.address ?? ""}
                    showInclusionDisplay={false}
                  />
                </>
              )}
            </>
          )}
        </div>
        <DevMode obj={accountInfo} />
        <Divider />
      </Content>
    </>
  )
}

export default WatchlistPage
