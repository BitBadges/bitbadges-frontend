import {
  InfoCircleOutlined
} from "@ant-design/icons"
import { Button, Input, Switch } from "antd"
import { UintRange } from "bitbadgesjs-proto"
import {
  checkIfUintRangesOverlap,
  getMaxBadgeIdForCollection,
  isFullUintRanges,
  removeUintRangeFromUintRange,
  sortUintRangesAndMergeIfNecessary
} from "bitbadgesjs-utils"
import { useState } from "react"
import { useCollection } from "../../bitbadges-api/contexts/collections/CollectionsContext"
import { GO_MAX_UINT_64 } from "../../utils/dates"
import { BadgeAvatarDisplay } from "../badges/BadgeAvatarDisplay"


export const BadgeIDSelectWithSwitch = ({ message, hideBadges, disabled, collectionId, uintRanges, setUintRanges }: { message?: string, hideBadges?: boolean, disabled?: boolean, collectionId: bigint, uintRanges: UintRange<bigint>[], setUintRanges: (uintRanges: UintRange<bigint>[]) => void }) => {
  return <>
    <div className="flex-center flex-column full-width" style={{ textAlign: 'center' }}>

      <Switch
        checked={isFullUintRanges(uintRanges)}
        disabled={disabled}
        checkedChildren="All Badges"
        unCheckedChildren="Custom"
        onChange={(checked) => {
          if (checked) {
            setUintRanges([{ start: 1n, end: GO_MAX_UINT_64 }],
            );
          } else {
            setUintRanges([]);
          }
        }}
      />
      <br />
      {isFullUintRanges(uintRanges) &&
        <div className="secondary-text">
          <InfoCircleOutlined />{' '}
          {isFullUintRanges(uintRanges) && "All IDs are selected, even IDs that may have not been created yet."}
        </div>}
      <br />
      <>
        {isFullUintRanges(uintRanges) ? <></> : <>

          <BadgeIdRangesInput
            message={message}
            uintRangeBounds={[{ start: 1n, end: GO_MAX_UINT_64 }]}
            collectionId={collectionId}
            uintRanges={uintRanges}
            setUintRanges={(uintRanges) => {
              setUintRanges(uintRanges);
            }}
            hideDisplay={hideBadges}
          />
        </>}</>
    </div>
  </>
}


export function BadgeIdRangesInput({
  uintRanges,
  setUintRanges,
  maximum,
  minimum,
  collectionId,
  uintRangeBounds = [{ start: 1n, end: GO_MAX_UINT_64 }],
  hideDisplay,
  suggestedRanges,
  message,
}: {
  uintRanges: UintRange<bigint>[]
  setUintRanges: (uintRanges: UintRange<bigint>[]) => void
  maximum?: bigint
  minimum?: bigint
  uintRangeBounds?: UintRange<bigint>[]
  collectionId: bigint
  hideDisplay?: boolean
  suggestedRanges?: UintRange<bigint>[]
  message?: string
}) {
  uintRangeBounds = sortUintRangesAndMergeIfNecessary(uintRangeBounds, true)
  const collection = useCollection(collectionId)
  suggestedRanges = suggestedRanges ?? []

  if (collection)
    suggestedRanges?.unshift({
      start: 1n,
      end: getMaxBadgeIdForCollection(collection),
    })
  suggestedRanges?.unshift({ start: 1n, end: 1n })
  suggestedRanges =
    suggestedRanges?.filter((suggestedRange) => {
      return suggestedRange.start <= suggestedRange.end
    }) ?? []
  suggestedRanges = suggestedRanges?.filter((x, idx, self) => {
    return self.findIndex((y) => y.start === x.start && y.end === x.end) === idx
  })

  const totalNumberOfBadges = collection ? getMaxBadgeIdForCollection(collection) : 0n

  const [inputStr, setInputStr] = useState(uintRanges
    ? uintRanges.map(({ start, end }) => `${start}-${end}`).join(", ")
    : uintRangeBounds
      ? uintRangeBounds
        .map(({ start, end }) => [start, end])
        .map(([start, end]) => `${start}-${end}`)
        .join(", ")
      : `${minimum ?? 1n}-${maximum ?? 1n}`
  )

  if (maximum && maximum <= 0) {
    return null
  }

  const overlaps = checkIfUintRangesOverlap(uintRanges);

  const [remaining] = removeUintRangeFromUintRange(
    uintRangeBounds ?? [],
    uintRanges ?? []
  )
  const outOfBounds = uintRangeBounds && remaining.length > 0

  const AvatarDisplay = (
    <>
      {!hideDisplay && (
        <>
          {uintRanges.length == 0 && (
            <div className="flex-center" style={{ color: "red" }}>
              None
            </div>
          )}
          {uintRanges.length > 0 && (
            <div className="flex-center full-width">
              <div className="primary-text full-width">
                <BadgeAvatarDisplay
                  collectionId={collectionId}
                  badgeIds={uintRanges}
                  showIds={true}
                />
              </div>
            </div>
          )}
        </>
      )}
    </>
  )

  const CustomInput = (
    <>
      {(
        <>
          <b>{message ?? "Select Badge IDs"}</b>
          <div className="flex-center full-width">
            <Input
              style={{ textAlign: "center" }}
              className="primary-text inherit-bg"
              value={inputStr}
              placeholder="Ex: 1-5, 7-10, 11, 20-30, 40-50, ...."
              onChange={(e) => {
                setInputStr(e.target.value)
                try {
                  let sliderValues: [bigint, bigint][] = []

                  const splitSliderValues = e.target.value.split(",")
                    .map((x) => x.trim())
                    .filter((x) => x !== "")
                  for (const sliderValue of splitSliderValues) {
                    if (sliderValue.split("-").length !== 2) {
                      if (
                        sliderValue.split("-").length === 1 &&
                        BigInt(sliderValue.split("-")[0]) > 0
                      ) {
                        sliderValues.push([
                          BigInt(sliderValue.split("-")[0]),
                          BigInt(sliderValue.split("-")[0]),
                        ])
                      } else {
                        continue
                      }
                    } else {
                      if (
                        sliderValue.split("-")[0] === "" ||
                        sliderValue.split("-")[1] === ""
                      ) {
                        continue
                      }
                      //start can't be greater than end
                      if (
                        BigInt(sliderValue.split("-")[0]) >
                        BigInt(sliderValue.split("-")[1])
                      ) {
                        continue
                      }

                      sliderValues.push([
                        BigInt(sliderValue.split("-")[0]),
                        BigInt(sliderValue.split("-")[1]),
                      ])
                    }
                  }


                  setUintRanges(
                    sliderValues.map(([start, end]) => ({ start, end }))
                  )
                } catch (err) {
                  console.log(err)
                }
              }}
            />
          </div>
          {totalNumberOfBadges > 0 && (
            <div
              className="secondary-text"
              style={{ textAlign: "center", fontSize: 12 }}
            >
              <InfoCircleOutlined /> Created IDs for this collection: 1-
              {totalNumberOfBadges.toString()}
            </div>
          )}
          <br />
          {!inputStr && suggestedRanges && suggestedRanges.length > 0 && (
            <>
              <div
                className="secondary-text"
                style={{ textAlign: "center", fontSize: 12 }}
              >
                <b>Suggested (Start ID - End ID)</b>
                <br />
                <div className="flex-center flex-wrap">
                  {suggestedRanges.map(({ start, end }) => {
                    return (
                      <Button
                        key={`${start}-${end}`}
                        className="styled-icon-button"
                        style={{ margin: 4 }}
                        onClick={() => {
                          setUintRanges([
                            ...uintRanges,
                            { start, end }
                          ])
                          setInputStr(uintRanges.concat({ start, end }).map(({ start, end }) => `${start}-${end}`).join(", "))
                        }}
                      >
                        {start.toString()} - {end.toString()}
                      </Button>
                    )
                  })}
                </div>
              </div>
              <br />
            </>
          )}

          {overlaps && (
            <div style={{ color: "red", textAlign: "center" }}>
              <br />
              <b>Overlapping ranges are not allowed.</b>
              <br />
            </div>
          )}
          <br />
          <div className="flex-center">
            {overlaps && (
              <Button
                type="primary"
                style={{ width: 200 }}
                className="landing-button"
                onClick={() => {
                  const newUintRanges = sortUintRangesAndMergeIfNecessary(
                    uintRanges,
                    true
                  )
                  setUintRanges(newUintRanges)
                  setInputStr(newUintRanges
                    .map(({ start, end }) => [start, end])
                    .map(([start, end]) => `${start}-${end}`)
                    .join(", ")
                  )
                }}
              >
                Sort and Remove Overlaps
              </Button>
            )}
          </div>

          {outOfBounds && (
            <div style={{ color: "red", textAlign: "center" }}>
              <b>
                You have selected some badges that are out of bounds. Please
                resolve this before continuing.
              </b>
              <br />
              <p>
                Out of Bounds IDs:{" "}
                {remaining
                  ?.map(({ start, end }) => `${start}-${end}`)
                  .join(", ")}
              </p>
              <br />
            </div>
          )}
        </>
      )}
    </>
  )

  return (
    <>
      {CustomInput}
      {AvatarDisplay}
    </>
  )
}
