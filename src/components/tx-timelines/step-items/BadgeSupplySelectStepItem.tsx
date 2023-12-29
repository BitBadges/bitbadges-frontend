import { Divider, Switch } from "antd"
import {
  DefaultPlaceholderMetadata,
  deepCopyBalances,
  removeBadgeMetadata,
  sortUintRangesAndMergeIfNecessary,
  updateBadgeMetadata,
} from "bitbadgesjs-utils"
import { useState } from "react"
import {
  EmptyStepItem,
  NEW_COLLECTION_ID,
  useTxTimelineContext,
} from "../../../bitbadges-api/contexts/TxTimelineContext"

import { getMaxBadgeIdForCollection } from "bitbadgesjs-utils"
import { DistributionOverview } from "../../badges/DistributionCard"
import { DevMode } from "../../common/DevMode"
import { BalanceInput } from "../../inputs/BalanceInput"
import { validateUintRangeArr } from "../form-items/CustomJSONSetter"
import { UpdateSelectWrapper } from "../form-items/UpdateSelectWrapper"
import {
  updateCollection,
  useCollection,
} from "../../../bitbadges-api/contexts/collections/CollectionsContext"
import { BadgeIdRangesInput } from "../../inputs/BadgeIdRangesInput"
import { Balance } from "bitbadgesjs-proto"
import { GO_MAX_UINT_64 } from "../../../utils/dates"
import { InfoCircleOutlined } from "@ant-design/icons"

export function BadgeSupplySelectStepItem() {
  const collection = useCollection(NEW_COLLECTION_ID)
  const txTimelineContext = useTxTimelineContext()
  const startingCollection = txTimelineContext.startingCollection
  const existingCollectionId = txTimelineContext.existingCollectionId
  const badgesToCreate = txTimelineContext.badgesToCreate
  const setBadgesToCreate = txTimelineContext.setBadgesToCreate

  const balancesToShow =
    collection?.owners.find((x) => x.cosmosAddress === "Total")?.balances || []
  const [err, setErr] = useState<Error | null>(null)
  const [limitedSupply, setLimitedSupply] = useState<boolean>(
    collection?.defaultBalances.balances.length === 0
  )
  const [updateFlag, setUpdateFlag] = useState<boolean>(true)

  const revertFunction = () => {
    if (!collection) return

    const prevNumberOfBadges = startingCollection
      ? getMaxBadgeIdForCollection(startingCollection)
      : 0n

    const newBadgeMetadata = removeBadgeMetadata(
      collection.cachedBadgeMetadata,
      [
        {
          start: prevNumberOfBadges + 1n,
          end: getMaxBadgeIdForCollection(collection),
        },
      ]
    )

    updateCollection({
      collectionId: NEW_COLLECTION_ID,
      cachedBadgeMetadata: newBadgeMetadata,
      defaultBalances: collection?.defaultBalances
        ? {
          ...collection.defaultBalances,
          balances: [],
        }
        : undefined,
    })

    setBadgesToCreate([])
  }

  const isNonIndexed = collection?.balancesType == "Off-Chain - Non-Indexed"

  const onAddBadges = (balance: Balance<bigint>, reset?: boolean) => {
    if (!collection) return
    const currBadgesToCreate = reset ? [] : deepCopyBalances(badgesToCreate)
    const newBadgesToCreate = deepCopyBalances([...currBadgesToCreate, balance])
    const prevNumberOfBadges = startingCollection
      ? getMaxBadgeIdForCollection(startingCollection)
      : 0n
    const maxBadgeIdAdded =
      sortUintRangesAndMergeIfNecessary(
        newBadgesToCreate.map((x) => x.badgeIds).flat(),
        true
      ).pop()?.end || 0n

    const newBadgeMetadata = updateBadgeMetadata(
      collection.cachedBadgeMetadata,
      {
        metadata: DefaultPlaceholderMetadata,
        badgeIds: [{ start: prevNumberOfBadges + 1n, end: maxBadgeIdAdded }],
      }
    )

    updateCollection({
      collectionId: NEW_COLLECTION_ID,
      cachedBadgeMetadata: newBadgeMetadata,
    })

    setBadgesToCreate(newBadgesToCreate)
  }

  const onAddStartBalances = (balance: Balance<bigint>) => {
    if (!collection) return
    const currBadgesToCreate = deepCopyBalances(
      collection.defaultBalances.balances
    )
    const newBadgesToCreate = deepCopyBalances([...currBadgesToCreate, balance])
    const prevNumberOfBadges = startingCollection
      ? getMaxBadgeIdForCollection(startingCollection)
      : 0n
    const maxBadgeIdAdded =
      sortUintRangesAndMergeIfNecessary(
        newBadgesToCreate.map((x) => x.badgeIds).flat(),
        true
      ).pop()?.end || 0n

    const newBadgeMetadata = updateBadgeMetadata(
      collection.cachedBadgeMetadata,
      {
        metadata: DefaultPlaceholderMetadata,
        badgeIds: [{ start: prevNumberOfBadges + 1n, end: maxBadgeIdAdded }],
      }
    )

    updateCollection({
      collectionId: NEW_COLLECTION_ID,
      cachedBadgeMetadata: newBadgeMetadata,
    })

    updateCollection({
      collectionId: NEW_COLLECTION_ID,
      defaultBalances: {
        ...collection.defaultBalances,
        balances: newBadgesToCreate,
      },
    })
  }

  if (
    txTimelineContext.existingCollectionId &&
    txTimelineContext.existingCollectionId > 0n
  ) {
    if ((collection?.defaultBalances.balances.length ?? 0) > 0) {
      return EmptyStepItem //cant update defaults anymore
    }
  }

  const isCreateTx = !existingCollectionId

  const SuggestedEmptyBalances: Balance<bigint>[] = [
    {
      amount: 1n,
      badgeIds: [{ start: 1n, end: 10n }],
      ownershipTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
    },
    {
      amount: 1n,
      badgeIds: [{ start: 1n, end: 100n }],
      ownershipTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
    },
    {
      amount: 1n,
      badgeIds: [{ start: 1n, end: 1000n }],
      ownershipTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
    },
    {
      amount: 1n,
      badgeIds: [{ start: 1n, end: 10000n }],
      ownershipTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
    },
  ]

  return {
    title: `Create Badges`,
    description: isNonIndexed
      ? "Define the number of badges to be used in your collection."
      : "Define the circulating supplys for badges in your collection. You can customize and distribute these badges in later steps.",
    node: () => (
      <UpdateSelectWrapper
        documentationLink="https://docs.bitbadges.io/overview/how-it-works/total-supplys"
        err={err}
        setErr={(err) => {
          setErr(err)
        }}
        updateFlag={updateFlag}
        setUpdateFlag={setUpdateFlag}
        jsonPropertyPath=""
        permissionName="canCreateMoreBadges"
        customValue={badgesToCreate}
        customSetValueFunction={(val: any) => {
          //Check it is a valid balance sarray
          if (!Array.isArray(val))
            throw new Error("Must be valid balances array")
          for (let i = 0; i < val.length; i++) {
            if (!val[i].badgeIds) throw new Error("Must specify badgeIds")
            if (!val[i].ownershipTimes)
              throw new Error("Must specify ownershipTimes")
            if (!val[i].amount || !BigInt(val[i].amount))
              throw new Error("Must specify amount")

            if (!validateUintRangeArr(val[i].badgeIds))
              throw new Error("Must be valid badgeIds array")
            if (!validateUintRangeArr(val[i].ownershipTimes))
              throw new Error("Must be valid ownershipTimes array")
          }

          setBadgesToCreate(val)
        }}
        customRevertFunction={revertFunction}
        node={() => (
          <div
            className="primary-text"
            style={{
              textAlign: "center",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {isNonIndexed && (
              <div
                className="flex-center flex-column"
                style={{
                  textAlign: "center",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <BadgeIdRangesInput
                  collectionId={NEW_COLLECTION_ID}
                  suggestedRanges={
                    badgesToCreate.length > 0
                      ? badgesToCreate.map((x) => x.badgeIds).flat()
                      : deepCopyBalances(SuggestedEmptyBalances)
                        .map((x) => x.badgeIds)
                        .flat()
                  }
                  uintRanges={badgesToCreate.map((x) => x.badgeIds).flat()}
                  setUintRanges={(uintRanges) => {
                    if (!collection) return

                    onAddBadges(
                      {
                        badgeIds: uintRanges,
                        ownershipTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                        amount: 1n,
                      },
                      true
                    )
                  }}
                />
              </div>
            )}
            {!isNonIndexed && (
              <>
                <div
                  className="flex-center"
                  style={{
                    textAlign: "center",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <DistributionOverview
                    md={12}
                    xs={24}
                    sm={24}
                    lg={12}
                    xl={12}
                    xxl={12}
                    collectionId={NEW_COLLECTION_ID}
                    isSelectStep={true}
                  />
                </div>
                <br />
                {collection?.balancesType === "Standard" && isCreateTx && (
                  <>
                    <Switch
                      checkedChildren="Defined Supply"
                      unCheckedChildren="Start Balances"
                      checked={limitedSupply}
                      onChange={(checked) => {
                        setLimitedSupply(checked)
                        txTimelineContext.setTransfers([])
                        if (checked) {
                          updateCollection({
                            collectionId: NEW_COLLECTION_ID,
                            defaultBalances: collection?.defaultBalances
                              ? {
                                ...collection.defaultBalances,
                                balances: [],
                              }
                              : undefined,
                            collectionPermissions: {
                              ...collection?.collectionPermissions,
                              canCreateMoreBadges: [],
                            },
                          })
                        } else {
                          revertFunction()
                          updateCollection({
                            collectionId: NEW_COLLECTION_ID,
                            collectionPermissions: {
                              ...collection?.collectionPermissions,
                              canCreateMoreBadges: [
                                {
                                  badgeIds: [
                                    { start: 1n, end: GO_MAX_UINT_64 },
                                  ],
                                  ownershipTimes: [
                                    { start: 1n, end: GO_MAX_UINT_64 },
                                  ],
                                  permittedTimes: [],
                                  forbiddenTimes: [
                                    { start: 1n, end: GO_MAX_UINT_64 },
                                  ],
                                },
                              ],
                            },
                          })
                        }
                      }}
                    />
                    <br />
                    <br />
                    <div className="flex-center">
                      <div
                        className="secondary-text"
                        style={{
                          textAlign: "center",
                          justifyContent: "center",
                          alignItems: "center",
                          maxWidth: 800,
                        }}
                      >
                        <InfoCircleOutlined style={{ marginRight: 4 }} />{" "}
                        {limitedSupply
                          ? `Set the circulating supplys for badges in your collection. Created badges will initially be sent to the Mint address.
        Every transfer requires a blockchain transaction that satisifies the approval requirements for the collection, sender, and recipient. This is the recommended option.`
                          : `ALL addresses will be given a predefined balance of badges upon first interaction with this collection. For example, all addresses start with x1 of ID 1. Because there is no limit on addresses that can be created, note that there is potentially an infinite supply of badges.`}
                      </div>
                    </div>
                  </>
                )}
                {((collection?.balancesType === "Standard" && limitedSupply) ||
                  collection?.balancesType !== "Standard" ||
                  !isCreateTx) && (
                    <>
                      <BalanceInput
                        sequentialOnly
                        balancesToShow={balancesToShow}
                        onAddBadges={(balance) => onAddBadges(balance)}
                        hideDisplay
                        message="Circulating Supplys"
                        onRemoveAll={revertFunction}
                        suggestedBalances={
                          badgesToCreate.length > 0
                            ? badgesToCreate
                            : deepCopyBalances(SuggestedEmptyBalances)
                        }
                      />
                      <Divider />
                      <DevMode obj={badgesToCreate} />
                    </>
                  )}
                {collection?.balancesType === "Standard" &&
                  !limitedSupply &&
                  isCreateTx && (
                    <>
                      <BalanceInput
                        sequentialOnly
                        balancesToShow={
                          collection?.defaultBalances.balances ?? []
                        }
                        onAddBadges={(balance) => {
                          onAddStartBalances(balance)
                        }}
                        hideDisplay
                        message="Start Balances"
                        onRemoveAll={() => {
                          updateCollection({
                            collectionId: NEW_COLLECTION_ID,
                            defaultBalances: collection?.defaultBalances
                              ? {
                                ...collection.defaultBalances,
                                balances: [],
                              }
                              : undefined,
                          })
                        }}
                        suggestedBalances={
                          collection.defaultBalances.balances.length > 0
                            ? collection.defaultBalances.balances
                            : deepCopyBalances(SuggestedEmptyBalances)
                        }
                      />
                      <Divider />
                      <DevMode obj={collection?.defaultBalances.balances} />
                    </>
                  )}
              </>
            )}
          </div>
        )}
      />
    ),
    disabled:
      (!existingCollectionId &&
        !limitedSupply &&
        collection?.defaultBalances.balances.length == 0) ||
      (!existingCollectionId && limitedSupply && badgesToCreate?.length == 0) ||
      !!err,
  }
}
