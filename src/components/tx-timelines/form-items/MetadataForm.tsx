import {
  DownOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  UploadOutlined,
  WarningOutlined,
} from "@ant-design/icons"
import {
  Button,
  Checkbox,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  Progress,
  Select,
  Space,
  Spin,
  Switch,
  Tag,
  Tooltip,
  Typography,
  Upload,
  UploadProps,
  message,
  notification
} from "antd"
import { useState } from "react"

import { faMinus, faReplyAll } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { UintRange, deepCopy } from "bitbadgesjs-proto"
import {
  BadgeMetadataDetails,
  DefaultPlaceholderMetadata,
  Metadata,
  MetadataAddMethod,
  Numberify,
  batchUpdateBadgeMetadata,
  getMetadataForBadgeId,
  getTotalNumberOfBadgeIds,
  invertUintRanges,
  removeUintRangesFromUintRanges,
  searchUintRangesForId,
  setMetadataPropertyForSpecificBadgeIds,
  sortUintRangesAndMergeIfNecessary,
} from "bitbadgesjs-utils"
import {
  NEW_COLLECTION_ID,
  useTxTimelineContext,
} from "../../../bitbadges-api/contexts/TxTimelineContext"

import { getMaxBadgeIdForCollection } from "bitbadgesjs-utils"
import {
  fetchAndUpdateMetadata,
  fetchMetadataForPreview,
  setCollection,
  updateCollection,
  useCollection,
} from "../../../bitbadges-api/contexts/collections/CollectionsContext"
import { MarkdownEditor } from "../../../pages/account/[addressOrUsername]/settings"
import { getBadgeIdsString } from "../../../utils/badgeIds"
import { GO_MAX_UINT_64 } from "../../../utils/dates"
import { BadgeAvatarDisplay } from "../../badges/BadgeAvatarDisplay"
import { CollectionHeader } from "../../badges/CollectionHeader"
import IconButton from "../../display/IconButton"
import { InformationDisplayCard } from "../../display/InformationDisplayCard"
import { BadgeIdRangesInput } from "../../inputs/BadgeIdRangesInput"
import { RadioGroup } from "../../inputs/Selects"
import { MetadataUriSelect } from "./MetadataUriSelect"

const { Text } = Typography
const { Option } = Select

export const MultiViewBadgeDisplay = ({
  badgeId,
  badgeIds,
  setBadgeId
}: {
  badgeId: bigint,
  setBadgeId?: (badgeId: bigint) => void,
  badgeIds: UintRange<bigint>[]
}) => {
  const [uiDisplayMode, setUiDisplayMode] = useState<string>("card")

  return <>
    {
      badgeId > 0 && (
        <div className="primary-text flex-center">
          <div>
            <b style={{ fontSize: 18 }}>
              Metadata for Badge ID{" "}
            </b>
          </div>
          <InputNumber
            //badgeIds are sorted above
            min={
              badgeIds && badgeIds.length > 0
                ? Numberify(badgeIds[0].start.toString())
                : 1
            }
            max={
              badgeIds && badgeIds.length > 0
                ? Numberify(
                  badgeIds[badgeIds.length - 1].end.toString()
                )
                : Number.MAX_SAFE_INTEGER
            }
            value={Numberify(badgeId.toString())}
            onChange={(e) => {
              if (e && e > 0 && setBadgeId) {
                const [, found] = searchUintRangesForId(
                  BigInt(e),
                  badgeIds
                )
                if (found) setBadgeId(BigInt(e))
              }
            }}
            style={{
              marginLeft: 8,
            }}
            className="primary-text inherit-bg"
          />
        </div>
      )}

    <div className="flex-center flex-column full-width">
      {(
        <RadioGroup value={uiDisplayMode} onChange={(value) => {
          setUiDisplayMode(value)
        }} options={[
          { label: 'Card', value: 'card' },
          { label: 'Image', value: 'image' },
          { label: 'Collection', value: 'collection' },
          { label: 'Header', value: 'header' },
        ]} />
      )}

    </div>
    <br />

    {
      uiDisplayMode === 'header' && (
        <div className="primary-text mx-10">
          <CollectionHeader
            collectionId={NEW_COLLECTION_ID}
            badgeId={badgeId}
          />
        </div>
      )
    }
    <div className="flex-center flex-column full-width">

      <div className="flex-center flex-wrap full-width">
        {
          badgeId > 0 && (uiDisplayMode === 'card' || uiDisplayMode == 'image') &&
          (
            <>
              <div className="primary-text flex-center">
                {/* Slight hack here. Instead of putting BadgeCard directly, we use BadgeAvatarDisplay which has support for fetching the metadata from source */}
                <BadgeAvatarDisplay
                  collectionId={NEW_COLLECTION_ID}
                  badgeIds={[{ start: badgeId, end: badgeId }]}
                  showIds={true}
                  selectedId={badgeId}
                  cardView={uiDisplayMode !== 'image'}
                />
              </div>
            </>
          )}

        {uiDisplayMode === 'collection' &&
          (
            <div className="primary-text">
              <BadgeAvatarDisplay
                // onClick={(id: bigint) => {
                //   setBadgeId(id)
                // }}
                collectionId={NEW_COLLECTION_ID}
                badgeIds={badgeIds}
                showIds={true}
                selectedId={badgeId}
              />
            </div>
          )}
      </div>
    </div>
  </>
}

export function ImageSelect({
  image,
  setImage
}: {
  image: string,
  setImage: (image: string) => void
}) {
  const sampleImages = [
    {
      value: "ipfs://QmbG3PyyQyZTzdTBANxb3sA8zC37VgXndJhndXSBf7Sr4o",
      label: "BitBadges Logo",
    },
  ]
  const [imageUrl, setImageUrl] = useState("")

  const images = [
    ...sampleImages,
    image &&
      !sampleImages.find((x) => x.value === image)
      ? {
        value: image,
        label: "Custom Image",
      }
      : undefined,
  ].filter((x) => !!x)

  const [imageIsUploading, setImageIsUploading] = useState(false)
  const dummyRequest = ({ onSuccess }: any) => {
    setTimeout(() => {
      onSuccess("ok")
    }, 0)
  }

  const props: UploadProps = {
    showUploadList: false,
    name: "file",
    multiple: true,
    customRequest: dummyRequest,
    async onChange(info) {
      if (info.file.status !== "uploading") {
        console.log(info.file, info.fileList)
      } else {
        if (!imageIsUploading) {
          message.info(`${info.file.name} file is uploading.`)
          setImageIsUploading(true)
        }
      }

      if (info.file.status === "done") {
        await file2Base64(info.file.originFileObj as File).then((base64) => {
          setImage(base64)
          setImageIsUploading(false)
          message.success(`${info.file.name} file uploaded successfully.`)
        })
      } else if (info.file.status === "error") {
        message.error(`${info.file.name} file upload failed.`)
      } else {
      }
    },
  }

  const file2Base64 = (file: File): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result?.toString() || "")
      reader.onerror = (error) => reject(error)
    })
  }

  return <Form.Item
    label={
      <Text className="primary-text" strong>
        Image
      </Text>
    }
    required
  >
    <div className="flex-between">
      <Select
        className="selector primary-text inherit-bg"
        value={
          images.find(
            (item: any) => item.value === image
          )?.label
        }
        onChange={(e) => {
          const newImage = images.find(
            (item: any) => e === item.label
          )?.value
          if (newImage) {
            setImage(newImage)
          }
        }}

        suffixIcon={<DownOutlined className="primary-text" />}
        dropdownRender={(menu) => (
          <>
            {menu}
            <Divider style={{ margin: "8px 0" }} />
            <Space
              align="center"
              style={{ padding: "0 8px 4px", width: "100%" }}
            >
              <Upload {...props}>
                <Button icon={<UploadOutlined />}>
                  Click to Upload New Image(s)
                </Button>
              </Upload>
              or Enter URL
              <Input
                style={{ color: "black" }}
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value)
                  setImage(e.target.value)
                }}
                placeholder="Enter URL"
              />
            </Space>
          </>
        )}
      >
        {images.map((item: any) => (
          <Option key={item.label} value={item.label}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
              }}
            >
              <img
                src={item.value.replace(
                  "ipfs://",
                  "https://bitbadges-ipfs.infura-ipfs.io/ipfs/"
                )}
                style={{ paddingRight: 10, height: 20 }}
                alt="Label"
              />
              <div>{item.label}</div>
            </div>
          </Option>
        ))}
      </Select>
    </div>
  </Form.Item>
}

//Do not pass an badgeId if this is for the collection metadata
export function MetadataForm({
  isCollectionSelect,
  badgeIds,
  toBeFrozen,
  isAddressListSelect,
  addMethod,
  setAddMethod,
}: {
  isCollectionSelect?: boolean
  badgeIds: UintRange<bigint>[]
  toBeFrozen?: boolean
  isAddressListSelect?: boolean
  addMethod?: MetadataAddMethod
  setAddMethod?: (addMethod: MetadataAddMethod) => void
}) {
  const collectionId = NEW_COLLECTION_ID
  badgeIds = sortUintRangesAndMergeIfNecessary(badgeIds, true)

  const txTimelineContext = useTxTimelineContext()
  const existingCollectionId = txTimelineContext.existingCollectionId
  const collection = useCollection(collectionId)

  const [badgeId, setBadgeId] = useState<bigint>(
    badgeIds.length > 0 ? badgeIds[0].start : 1n
  )

  let metadata =
    (isCollectionSelect
      ? collection?.cachedCollectionMetadata
      : getMetadataForBadgeId(
        badgeId,
        collection?.cachedBadgeMetadata ?? []
      )) ?? DefaultPlaceholderMetadata
  const currMetadata = metadata

  const setMetadata = (metadata: Metadata<bigint>) => {
    if (!collection) return
    if (isCollectionSelect) {
      updateCollection({
        collectionId: NEW_COLLECTION_ID,
        cachedCollectionMetadata: metadata,
      })
    } else {
      //This is handled in the context. It applies the array below to the existing metadata
      //We use setCollection for complete overwrites
      updateCollection({
        collectionId: NEW_COLLECTION_ID,
        cachedBadgeMetadata: [
          {
            uri: undefined,
            toUpdate: true,
            metadata,
            badgeIds: [{ start: badgeId, end: badgeId }],
          },
        ],
      })
    }
  }

  const populateOtherBadges = (
    previewMetadata: BadgeMetadataDetails<bigint>[],
    badgeIds: UintRange<bigint>[],
    key: string,
    value: any
  ) => {
    const newBadgeMetadata = setMetadataPropertyForSpecificBadgeIds(
      previewMetadata,
      badgeIds,
      key,
      value
    )
    return newBadgeMetadata
  }

  const [items, setItems] = useState([
    "BitBadge",
    "Attendance",
    "Certification",
  ])
  const [name, setName] = useState("")
  const [applyingBatchUpdate, setApplyingBatchUpdate] = useState(false)



  const [populateIsOpen, setPopulateIsOpen] = useState(false)
  const [fieldNames, setFieldNames] = useState<string[]>([])

  const addItem = (e: any) => {
    e.preventDefault()
    setItems([...items, name])
    setName("")
  }

  const onNameChange = (event: any) => {
    setName(event.target.value)
  }



  const FieldCheckbox = ({
    fieldName,
    label,
  }: {
    fieldName: string
    label: string
  }) => {
    return (
      <Checkbox
        className="primary-text"
        checked={fieldNames.includes(fieldName)}
        onChange={(e) => {
          if (e.target.checked) {
            setFieldNames([...fieldNames, fieldName])
          } else {
            setFieldNames(fieldNames.filter((x) => x !== fieldName))
          }
        }}
      >
        {label}
      </Checkbox>
    )
  }


  const updatedIds = collection?.cachedBadgeMetadata.filter(x => x.toUpdate).map(x => x.badgeIds).flat() ?? []
  const nonUpdatedIds = !collection ? [] : invertUintRanges(updatedIds, 1n, getMaxBadgeIdForCollection(collection))



  const [inRangeBadgeIds] = removeUintRangesFromUintRanges([{ start: (!collection ? 0n : getMaxBadgeIdForCollection(collection)) + 1n, end: GO_MAX_UINT_64 }], badgeIds)
  badgeIds = inRangeBadgeIds

  const PopulateComponent = () => {
    const [uintRanges, setUintRanges] = useState<UintRange<bigint>[]>(badgeIds)
    const existingCollection = useCollection(existingCollectionId || 0n)

    const totalNeedToFetch = getTotalNumberOfBadgeIds(uintRanges)

    let numBadgesFetched = 0n
    for (const metadata of existingCollection?.cachedBadgeMetadata ?? []) {
      const uintRangesToSearch = uintRanges
      const [, removed] = removeUintRangesFromUintRanges(
        uintRangesToSearch,
        metadata.badgeIds
      )
      for (const badgeIdRange of removed) {
        numBadgesFetched += badgeIdRange.end - badgeIdRange.start + 1n
      }
    }
    let percent = Number(numBadgesFetched) / Number(totalNeedToFetch)

    const outOfBoundsIds = invertUintRanges(badgeIds, 1n, GO_MAX_UINT_64)

    const [, removed] = removeUintRangesFromUintRanges(outOfBoundsIds, uintRanges)
    const hasOutOfBoundsids = removed.length > 0

    let message = badgeId && !isCollectionSelect ? `ID ${badgeId}'s metadata`
      : " the collection metadata"


    return (
      <div>
        {populateIsOpen && (
          <div
            style={{ marginTop: 8, textAlign: "center" }}
            className="primary-text"
          >
            <InformationDisplayCard
              title={`Set other badges to have properties from ${message}?`}
            >
              <div className="" style={{ textAlign: "center" }}>
                <WarningOutlined style={{ marginRight: 4, color: "#FF5733" }} />{" "}
                This will overwrite the metadata of the selected badges for the
                selected properties.
                <br />
                <br />
              </div>
              <br />
              <div className="flex-center flex-wrap primary-text">
                <FieldCheckbox fieldName="name" label="Title" />
                <FieldCheckbox fieldName="image" label="Image" />
                <FieldCheckbox fieldName="video" label="Video" />
                <FieldCheckbox fieldName="description" label="Description" />
                <FieldCheckbox fieldName="category" label="Category" />
                <FieldCheckbox fieldName="tags" label="Tags" />
                <FieldCheckbox fieldName="externalUrl" label="Website" />
                <FieldCheckbox fieldName="socials" label="Socials" />
              </div>

              <br />
              <br />
              <div className="flex-center">
                <Col md={12} xs={24} className="full-width">
                  <BadgeIdRangesInput
                    uintRangeBounds={badgeIds}
                    uintRanges={uintRanges}
                    setUintRanges={setUintRanges}
                    collectionId={collectionId}
                  />
                </Col>
              </div>
              <br />
              {isCollectionSelect && !isAddressListSelect && (
                <div className="secondary-text" style={{ textAlign: "center" }}>
                  <InfoCircleOutlined style={{ marginRight: 4 }} /> The updated
                  badge metadata will be visible on the next step.
                  <br />
                  <br />
                </div>
              )}
              {!isAddressListSelect &&
                !!existingCollectionId &&
                numBadgesFetched < totalNeedToFetch && (
                  <>
                    <div
                      className="secondary-text"
                      style={{ textAlign: "center" }}
                    >
                      <InfoCircleOutlined style={{ marginRight: 4 }} /> We will
                      first need to fetch the metadata for the selected badges
                      (if not already fetched). This may take some time.
                      <br />
                      <br />
                      {numBadgesFetched.toString()}/
                      {totalNeedToFetch.toString()} badges fetched. <br />
                      <Progress
                        percent={Math.ceil(percent * 100)}
                        type="line"
                        format={() => {
                          return (
                            <Typography.Text className="primary-text">{`${Math.ceil(
                              percent * 100
                            )}%`}</Typography.Text>
                          )
                        }}
                      />
                      <br />
                      <br />
                    </div>
                  </>
                )}

              <div className="full-width flex-center">
                <button
                  disabled={
                    fieldNames.length === 0 ||
                    uintRanges.length === 0 ||
                    applyingBatchUpdate ||
                    hasOutOfBoundsids
                  }
                  className="landing-button full-width"
                  style={{ width: "100%" }}
                  onClick={async () => {
                    setApplyingBatchUpdate(true)
                    let cachedCollection = collection
                    if (!cachedCollection) return

                    const fetchedMetadata = await fetchMetadataForPreview(
                      existingCollectionId || 0n,
                      uintRanges,
                      false
                    )

                    let batchUpdatedMetadata = batchUpdateBadgeMetadata(
                      deepCopy(cachedCollection?.cachedBadgeMetadata),
                      fetchedMetadata.map((x) => {
                        return {
                          badgeIds: x.badgeIds,
                          metadata: x.metadata,
                          toUpdate: true,
                        }
                      })
                    )

                    for (const fieldName of fieldNames) {
                      batchUpdatedMetadata = populateOtherBadges(
                        batchUpdatedMetadata,
                        uintRanges,
                        fieldName,
                        currMetadata[fieldName as keyof Metadata<bigint>]
                      )
                    }

                    updateCollection({
                      collectionId: NEW_COLLECTION_ID,
                      cachedBadgeMetadata: batchUpdatedMetadata,
                    })

                    setPopulateIsOpen(false)

                    notification.success({
                      message: "Success",
                      description: `Successfully batch applied metadata for selected badges.`,
                    })

                    setApplyingBatchUpdate(false)
                  }}
                >
                  Update {applyingBatchUpdate && <Spin />}
                </button>
              </div>
              <Divider />
            </InformationDisplayCard>
          </div>
        )}
      </div>
    )
  }


  return (
    <>
      <InformationDisplayCard span={24} >
        {!isAddressListSelect && setAddMethod && (
          <>
            <br />
            <div className="flex-center flex-column">
              <Switch
                checkedChildren="Manual"
                unCheckedChildren="Enter URL"
                checked={addMethod === MetadataAddMethod.Manual}
                onChange={async (e) => {
                  if (!collection) return

                  const hasExistingCollection =
                    !!txTimelineContext.existingCollectionId

                  //HACK: We use setCollection to override and set the cached metadata. Should probably handle this better, but it works
                  if (isCollectionSelect) {
                    let collectionMetadataToSet: Metadata<bigint> | undefined =
                      DefaultPlaceholderMetadata
                    if (hasExistingCollection && existingCollectionId) {
                      const res = await fetchAndUpdateMetadata(
                        existingCollectionId,
                        {}
                      )
                      collectionMetadataToSet = res.cachedCollectionMetadata
                    }

                    setCollection({
                      ...collection,
                      cachedCollectionMetadata: collectionMetadataToSet,
                    })
                  } else {
                    setCollection({
                      ...collection,
                      cachedBadgeMetadata: hasExistingCollection
                        ? []
                        : [
                          {
                            uri: undefined,
                            toUpdate: true,
                            metadata: DefaultPlaceholderMetadata,
                            badgeIds: [
                              {
                                start: 1n,
                                end: getMaxBadgeIdForCollection(collection),
                              },
                            ],
                          },
                        ],
                    })
                  }
                  setAddMethod?.(
                    e ? MetadataAddMethod.Manual : MetadataAddMethod.UploadUrl
                  )
                }}
              />
              {addMethod === MetadataAddMethod.Manual && (
                <Typography.Text
                  strong
                  className="secondary-text"
                  style={{ marginTop: 4, textAlign: "center" }}
                >
                  {`We handle the metadata storage for you in a decentralized manner using IPFS.`}
                  <Tooltip
                    placement="bottom"
                    title={`IPFS, or Interplanetary File System, is a way of sharing files and information on the internet that doesn't rely on traditional servers and makes the web more resilient to censorship and centralization.`}
                  >
                    <InfoCircleOutlined
                      style={{ marginLeft: 4, marginRight: 4 }}
                    />
                  </Tooltip>
                </Typography.Text>
              )}
            </div>
            <br />
          </>
        )}

        {addMethod === MetadataAddMethod.UploadUrl && (
          <>
            <MetadataUriSelect
              startId={1n}
              endId={collection ? getMaxBadgeIdForCollection(collection) : 1n}
              hideCollectionSelect={
                !isAddressListSelect && !isCollectionSelect
              }
              hideBadgeSelect={!isAddressListSelect && isCollectionSelect}
            />
          </>
        )}

        {addMethod === MetadataAddMethod.Manual && (
          <Form colon={false} layout="vertical">
            {isCollectionSelect && addMethod === MetadataAddMethod.Manual && (
              <div>
                <div>
                  <br />
                  <CollectionHeader
                    collectionId={NEW_COLLECTION_ID}
                    hideCollectionLink
                  />
                </div>
              </div>
            )}

            {!isCollectionSelect && !isAddressListSelect && (<>
              <div className="secondary-text" style={{ textAlign: "center" }}>
                {nonUpdatedIds.length > 0 &&
                  <span style={{ color: 'orange' }}>
                    <WarningOutlined />
                    You have not updated the metadata for IDs {getBadgeIdsString(nonUpdatedIds)}.

                    {!!txTimelineContext.existingCollectionId ?
                      " If these are newly created IDs, they will have default placeholder metadata. Or else, they will remain as previously set."
                      : " They will have default placeholder metadata."
                    }
                  </span>}
              </div>
              <br />
            </>
            )}



            {!isCollectionSelect && !isAddressListSelect && <>
              <MultiViewBadgeDisplay badgeId={badgeId} badgeIds={inRangeBadgeIds} setBadgeId={setBadgeId} />
            </>}

            <br />
            <div className="flex-center flex-wrap">

              {!isAddressListSelect && (
                <IconButton
                  text="Batch Apply"
                  tooltipMessage="Populate the metadata of other badges with the metadata of this badge."
                  src={
                    <FontAwesomeIcon
                      icon={populateIsOpen ? faMinus : faReplyAll}
                    />
                  }
                  onClick={() => {
                    setPopulateIsOpen(!populateIsOpen)
                  }}
                  style={{
                    cursor: "pointer",
                    marginLeft: 8,
                    transform: "scaleX(-1)",
                  }}
                />
              )}
            </div>
            <br />
            <PopulateComponent />


            <Form.Item
              label={
                <Text className="primary-text" strong>
                  Title
                </Text>
              }
              required
            >
              <Input
                value={currMetadata.name}
                onChange={(e: any) => {
                  setMetadata({
                    ...currMetadata,
                    name: e.target.value,
                  })
                }}

                className="primary-text inherit-bg"
              />
            </Form.Item>

            <ImageSelect image={currMetadata.image} setImage={(image: string) => {
              setMetadata({
                ...currMetadata,
                image: image
              })
            }} />

            <Form.Item
              label={
                <Text className="primary-text" strong>
                  Video
                </Text>
              }
            >
              <div className="flex-between">
                <Input
                  value={currMetadata.video}
                  onChange={(e) => {
                    setMetadata({
                      ...currMetadata,
                      video: e.target.value,
                    })
                  }}
                  placeholder="Enter Video URL (optional)"
                />
              </div>
              <div style={{ fontSize: 12 }}>
                <Text className="secondary-text">
                  Videos can either be a URL to a video file (e.g. .mp4) or a YouTube embed link.
                  Videos will be viewable only after navigating to the badge page.
                  For icons, avatars, and thumbnails, we will use the image provided above.
                </Text>
              </div>
            </Form.Item>
            <Form.Item
              label={
                <Text className="primary-text" strong>
                  Description
                </Text>
              }
            >
              <div className="flex-between">
                <MarkdownEditor
                  markdown={currMetadata.description}
                  setMarkdown={(markdown: string) => {
                    setMetadata({
                      ...currMetadata,
                      description: markdown,
                    })
                  }}
                />
              </div>
            </Form.Item>
            <Form.Item
              label={
                <Text className="primary-text" strong>
                  Category
                </Text>
              }
            // required={type === 0}
            >
              <div className="flex-between">
                <Select
                  className="selector primary-text inherit-bg"
                  value={currMetadata.category}
                  placeholder="Default: None"
                  onChange={(e: any) => {
                    setMetadata({
                      ...currMetadata,
                      category: e,
                    })
                  }}

                  suffixIcon={<DownOutlined className="primary-text" />}
                  dropdownRender={(menu) => (
                    <>
                      {menu}
                      <Divider style={{ margin: "8px 0" }} />
                      <Space
                        align="center"
                        style={{ padding: "0 8px 4px", color: "black" }}
                      >
                        <Input
                          placeholder="Add Custom Category"
                          value={name}
                          onChange={onNameChange}
                          style={{ color: "black" }}
                        />
                        <Typography.Link
                          onClick={addItem}
                          style={{
                            whiteSpace: "nowrap",
                          }}
                        >
                          <PlusOutlined /> Add Category
                        </Typography.Link>
                      </Space>
                    </>
                  )}
                >
                  {items.map((item: any) => (
                    <Option key={item} value={item}>
                      {item}
                    </Option>
                  ))}
                </Select>
              </div>
            </Form.Item>


            <Form.Item
              label={
                <Text className="primary-text" strong>
                  Website{" "}
                  <Tooltip
                    color="black"
                    title={"Provide a website link for users to learn more."}
                  >
                    <InfoCircleOutlined />
                  </Tooltip>
                </Text>
              }
            >
              <div className="flex-between">
                <Input
                  value={currMetadata.externalUrl}
                  onChange={(e) => {
                    setMetadata({
                      ...currMetadata,
                      externalUrl: e.target.value,
                    })
                  }}

                  className="primary-text inherit-bg"
                />
              </div>
              <div style={{ fontSize: 12 }}>
                <Text className="secondary-text">
                  {toBeFrozen &&
                    "*You have selected for this metadata to be frozen and uneditable. Please enter a website URL that is permanent and will not change in the future."}
                </Text>
              </div>
            </Form.Item>

            <Form.Item
              label={
                <Text className="primary-text" strong>
                  Tags / Keywords / Attributes{" "}
                  <Tooltip
                    color="black"
                    title={
                      "Use tags and keywords to further categorize your badge and make it more searchable!"
                    }
                  >
                    <InfoCircleOutlined />
                  </Tooltip>
                </Text>
              }
            >
              <div className="flex-between">
                <Input
                  value={currMetadata.tags}
                  onChange={(e) => {
                    if (!e.target.value) {
                      setMetadata({
                        ...currMetadata,
                        tags: undefined,
                      })
                      return;
                    }
                    setMetadata({
                      ...currMetadata,
                      tags: e.target.value.split(","),
                    })
                  }}

                  className="primary-text inherit-bg"
                />
              </div>
              <div style={{ fontSize: 12 }}>
                <Text className="secondary-text">*Separate with a comma.</Text>
              </div>
              <div style={{ display: "flex", marginTop: 4 }}>
                {currMetadata.tags?.map((tag: any, idx: number) => {
                  if (tag === "") return
                  return (
                    <Tag key={tag + idx} className="card-bg secondary-text">
                      {tag}
                    </Tag>
                  )
                })}
              </div>
            </Form.Item>

            <Form.Item
              label={
                <Text className="primary-text" strong>
                  X
                </Text>
              }
            >
              <Input
                defaultValue={currMetadata.socials?.twitter ?? ""}
                value={currMetadata.socials?.twitter ?? ""}
                onChange={(e) => {
                  setMetadata({
                    ...currMetadata,
                    socials: {
                      ...currMetadata.socials,
                      twitter: e.target.value,
                    },
                  })
                }}
                className="form-input"
              />
              {currMetadata.socials?.twitter && (
                <a
                  href={
                    "https://x.com/" + currMetadata.socials?.twitter ?? ""
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  https://x.com/{currMetadata.socials?.twitter}
                </a>
              )}
            </Form.Item>

            <Form.Item
              label={
                <Text className="primary-text" strong>
                  GitHub
                </Text>
              }
            >
              <Input
                defaultValue={currMetadata.socials?.github ?? ""}
                value={currMetadata.socials?.github ?? ""}
                onChange={(e) => {
                  setMetadata({
                    ...currMetadata,
                    socials: {
                      ...currMetadata.socials,
                      github: e.target.value,
                    },
                  })
                }}
                className="form-input"
              />
              {currMetadata.socials?.github && (
                <a
                  href={"https://github.com/" + currMetadata.socials?.github}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  https://github.com/{currMetadata.socials?.github}
                </a>
              )}
            </Form.Item>

            <Form.Item
              label={
                <Text className="primary-text" strong>
                  Telegram
                </Text>
              }
            >
              <Input
                defaultValue={currMetadata.socials?.telegram}
                value={currMetadata.socials?.telegram ?? ""}
                onChange={(e) => {
                  setMetadata({
                    ...currMetadata,
                    socials: {
                      ...currMetadata.socials,
                      telegram: e.target.value,
                    },
                  })
                }}
                className="form-input"
              />
              {currMetadata.socials?.telegram && (
                <a
                  href={`https://t.me/${currMetadata.socials?.telegram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  https://t.me/{currMetadata.socials?.telegram}
                </a>
              )}
            </Form.Item>

            <Form.Item
              label={
                <Text className="primary-text" strong>
                  Discord
                </Text>
              }
            >
              <Input
                defaultValue={currMetadata.socials?.discord}
                value={currMetadata.socials?.discord}
                onChange={(e) => {
                  setMetadata({
                    ...currMetadata,
                    socials: {
                      ...currMetadata.socials,
                      discord: e.target.value,
                    },
                  })
                }}
                className="form-input"
              />
              {currMetadata.socials?.discord && (
                <div className="secondary-text">
                  https://discord.com/invite/{currMetadata.socials?.discord}
                </div>
              )}
            </Form.Item>
          </Form>
        )}
      </InformationDisplayCard>
    </>
  )
}
