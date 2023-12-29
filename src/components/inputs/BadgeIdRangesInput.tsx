import {
  InfoCircleOutlined
} from "@ant-design/icons"
import { Button, Input } from "antd"
import { UintRange } from "bitbadgesjs-proto"
import {
  getMaxBadgeIdForCollection,
  removeUintRangeFromUintRange,
  sortUintRangesAndMergeIfNecessary
} from "bitbadgesjs-utils"
import { useState } from "react"
import { useCollection } from "../../bitbadges-api/contexts/collections/CollectionsContext"
import { GO_MAX_UINT_64 } from "../../utils/dates"
import { BadgeAvatarDisplay } from "../badges/BadgeAvatarDisplay"

export function BadgeIdRangesInput({
  uintRanges,
  setUintRanges,
  maximum,
  minimum,
  collectionId,
  uintRangeBounds = [{ start: 1n, end: GO_MAX_UINT_64 }],
  hideDisplay,
  suggestedRanges,
}: {
  uintRanges: UintRange<bigint>[]
  setUintRanges: (uintRanges: UintRange<bigint>[]) => void
  maximum?: bigint
  minimum?: bigint
  uintRangeBounds?: UintRange<bigint>[]
  collectionId: bigint
  hideDisplay?: boolean
  suggestedRanges?: UintRange<bigint>[]
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

  const totalNumberOfBadges = collection
    ? getMaxBadgeIdForCollection(collection)
    : 0n
  
  const [sliderValues, setSliderValues] = useState<[bigint, bigint][]>(
    uintRanges
      ? uintRanges.map(({ start, end }) => [start, end])
      : uintRangeBounds
        ? uintRangeBounds.map(({ start, end }) => [start, end])
        : [[minimum ?? 1n, maximum ?? 1n]]
  )
  const [inputStr, setInputStr] = useState(
    uintRanges
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

  const overlaps = sliderValues.some(([start1, end1], i) => {
    return sliderValues.some(([start2, end2], j) => {
      if (i === j) {
        return false
      }
      return start1 <= end2 && start2 <= end1
    })
  })

  
  const [remaining] = removeUintRangeFromUintRange(
    uintRangeBounds ?? [],
    uintRanges ?? []
  )
  const outOfBounds = uintRangeBounds && remaining.length > 0

  const AvatarDisplay = (
    <>
      {!hideDisplay && (
        <>
          {sliderValues.length == 0 && (
            <div className="flex-center" style={{ color: "red" }}>
              None
            </div>
          )}
          {sliderValues.length > 0 && (
            <div className="flex-center full-width">
              <div style={{}} className="primary-text full-width">
                <BadgeAvatarDisplay
                  collectionId={collectionId}
                  badgeIds={sliderValues.map(([start, end]) => ({
                    start,end,
                  }))}
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
          <b>Select Badge IDs</b>
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

                  const splitSliderValues = e.target.value
                    .split(",")
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

                  setSliderValues(sliderValues)
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
                          const newSliderValues: [bigint, bigint][] = [
                            ...sliderValues,
                            [start, end],
                          ]
                          setSliderValues(newSliderValues)
                          setUintRanges(
                            newSliderValues.map(([start, end]) => ({
                              start,
                              end,
                            }))
                          )
                          setInputStr(
                            newSliderValues
                              .map(([start, end]) => `${start}-${end}`)
                              .join(", ")
                          )
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
                    sliderValues.map(([start, end]) => ({ start, end })),
                    true
                  )
                  setSliderValues(
                    newUintRanges.map(({ start, end }) => [start, end])
                  )
                  setUintRanges(newUintRanges)
                  setInputStr(
                    newUintRanges
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
