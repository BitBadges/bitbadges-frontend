import { DownOutlined, InfoCircleOutlined, MinusOutlined, PlusOutlined, UploadOutlined, WarningOutlined } from '@ant-design/icons';
import { faMinus, faReplyAll } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  Button,
  Checkbox,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  Progress,
  Select,
  Space,
  Spin,
  Switch,
  Tooltip,
  Typography,
  Upload,
  UploadProps,
  message,
  notification
} from 'antd';
import { BadgeMetadataDetails, Metadata, Numberify, UintRange, UintRangeArray } from 'bitbadgesjs-sdk';
import moment from 'moment';
import { ReactNode, useState } from 'react';
import { NEW_COLLECTION_ID, useTxTimelineContext } from '../../../bitbadges-api/contexts/TxTimelineContext';
import {
  fetchAndUpdateMetadata,
  fetchMetadataForPreview,
  setCollection,
  updateCollection,
  useCollection
} from '../../../bitbadges-api/contexts/collections/CollectionsContext';
import { MetadataAddMethod } from '../../../bitbadges-api/types';
import { MarkdownEditor } from '../../../pages/account/[addressOrUsername]/settings';
import { getBadgeIdsString } from '../../../utils/badgeIds';
import { GO_MAX_UINT_64 } from '../../../utils/dates';
import { BadgeAvatarDisplay } from '../../badges/BadgeAvatarDisplay';
import { CollectionHeader } from '../../badges/CollectionHeader';
import { TagsSelect } from '../../collection-page/BadgesTab';
import IconButton from '../../display/IconButton';
import { InformationDisplayCard } from '../../display/InformationDisplayCard';
import { BadgeIdRangesInput } from '../../inputs/BadgeIdRangesInput';
import { RadioGroup } from '../../inputs/Selects';
import { MetadataUriSelect } from './MetadataUriSelect';

const { Text } = Typography;
const { Option } = Select;

const { batchUpdateBadgeMetadata, setMetadataPropertyForSpecificBadgeIds } = BadgeMetadataDetails;

export const MultiViewBadgeDisplay = ({
  badgeId,
  badgeIds,
  setBadgeId
}: {
  badgeId: bigint;
  setBadgeId?: (badgeId: bigint) => void;
  badgeIds: UintRangeArray<bigint>;
}) => {
  const [uiDisplayMode, setUiDisplayMode] = useState<string>('card');

  return (
    <>
      {badgeId > 0 && (
        <div className="primary-text flex-center">
          <div>
            <b style={{ fontSize: 18 }}>Metadata for Badge ID </b>
          </div>
          <InputNumber
            //badgeIds are sorted above
            min={badgeIds && badgeIds.length > 0 ? Numberify(badgeIds[0].start.toString()) : 1}
            max={badgeIds && badgeIds.length > 0 ? Numberify(badgeIds[badgeIds.length - 1].end.toString()) : Number.MAX_SAFE_INTEGER}
            value={Numberify(badgeId.toString())}
            onChange={(e) => {
              if (e && e > 0 && setBadgeId) {
                const found = badgeIds.searchIfExists(BigInt(e));
                if (found) setBadgeId(BigInt(e));
              }
            }}
            style={{ marginLeft: 8 }}
            className="primary-text inherit-bg"
          />
        </div>
      )}

      <div className="flex-center flex-column full-width">
        {
          <RadioGroup
            value={uiDisplayMode}
            onChange={(value) => {
              setUiDisplayMode(value);
            }}
            options={[
              { label: 'Card', value: 'card' },
              { label: 'Image', value: 'image' },
              { label: 'Collection', value: 'collection' },
              { label: 'Header', value: 'header' }
            ]}
          />
        }
      </div>
      <br />

      {uiDisplayMode === 'header' && (
        <div className="primary-text mx-10">
          <CollectionHeader collectionId={NEW_COLLECTION_ID} badgeId={badgeId} />
        </div>
      )}
      <div className="flex-center flex-column full-width">
        <div className="flex-center flex-wrap full-width">
          {badgeId > 0 && (uiDisplayMode === 'card' || uiDisplayMode == 'image') && (
            <>
              <div className="primary-text flex-center">
                {/* Slight hack here. Instead of putting BadgeCard directly, we use BadgeAvatarDisplay which has support for fetching the metadata from source */}
                <BadgeAvatarDisplay
                  collectionId={NEW_COLLECTION_ID}
                  badgeIds={UintRangeArray.From([{ start: badgeId, end: badgeId }])}
                  showIds={true}
                  selectedId={badgeId}
                  cardView={uiDisplayMode !== 'image'}
                  fetchDirectly
                />
              </div>
            </>
          )}

          {uiDisplayMode === 'collection' && (
            <div className="primary-text">
              <BadgeAvatarDisplay collectionId={NEW_COLLECTION_ID} badgeIds={badgeIds} showIds={true} selectedId={badgeId} fetchDirectly />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export const FormInputLabel = ({ label }: { label: string }) => {
  return <Text className="primary-text">{label}</Text>;
};

export const GenericTextAreaFormInput = ({
  label,
  value,
  setValue,
  placeholder,
  helper,
  err,
  required
}: {
  label: string;
  value: string;
  setValue: (value: string) => void;
  placeholder?: string;
  helper?: string | ReactNode;
  err?: string;
  required?: boolean;
}) => {
  return (
    <Form.Item required={required} label={<FormInputLabel label={label} />}>
      <Input.TextArea
        autoSize
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
        }}
        placeholder={placeholder}
        className="primary-text inherit-bg form-input full-width"
      />
      {helper ? (
        typeof helper === 'string' ? (
          <div style={{ fontSize: 12 }}>
            <Text className="secondary-text">{helper}</Text>
          </div>
        ) : (
          helper
        )
      ) : null}
      {err && <div style={{ fontSize: 12, color: 'red' }}>{err}</div>}
    </Form.Item>
  );
};

export const GenericStringArrFormInput = ({
  label,
  value,
  setValue,
  placeholder,
  helper,
  err
}: {
  label: string;
  value: string[];
  setValue: (value: string[]) => void;
  placeholder?: string;
  helper?: string | ReactNode;
  err?: string;
}) => {
  const [valueStr, setValueStr] = useState(value.join(', '));

  return (
    <GenericTextFormInput
      label={label}
      value={valueStr}
      setValue={(value) => {
        setValueStr(value);
        setValue(value.split(',').map((x) => x.trim()));
      }}
      placeholder={placeholder}
      helper={helper}
      err={err}
    />
  );
};

export const GenericMarkdownFormInput = ({
  label,
  value,
  setValue,
  placeholder,
  helper,
  err,
  height,
  required
}: {
  label: string;
  value: string;
  setValue: (value: string) => void;
  placeholder?: string;
  helper?: string | ReactNode;
  err?: string;
  height?: number;
  required?: boolean;
}) => {
  return (
    <Form.Item required={required} label={<FormInputLabel label={label} />}>
      <MarkdownEditor
        markdown={value}
        setMarkdown={(e) => {
          setValue(e);
        }}
        height={height ?? 300}
        placeholder={placeholder}
      />
      {helper ? (
        typeof helper === 'string' ? (
          <div style={{ fontSize: 12 }}>
            <Text className="secondary-text">{helper}</Text>
          </div>
        ) : (
          helper
        )
      ) : null}
      {err && <div style={{ fontSize: 12, color: 'red' }}>{err}</div>}
    </Form.Item>
  );
};

export const GenericTextFormInput = ({
  label,
  value,
  setValue,
  placeholder,
  helper,
  err,
  required
}: {
  label: string;
  value: string;
  setValue: (value: string) => void;
  placeholder?: string;
  helper?: string | ReactNode;
  err?: string;
  required?: boolean;
}) => {
  return (
    <Form.Item required={required} label={<FormInputLabel label={label} />}>
      <Input
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
        }}
        placeholder={placeholder}
        className="primary-text inherit-bg"
      />
      {helper ? (
        typeof helper === 'string' ? (
          <div style={{ fontSize: 12, textAlign: 'start' }}>
            <Text className="secondary-text">{helper}</Text>
          </div>
        ) : (
          helper
        )
      ) : null}
      {err && <div style={{ fontSize: 12, color: 'red' }}>{err}</div>}
    </Form.Item>
  );
};

export function ImageSelect({ image, setImage }: { image: string; setImage: (image: string) => void }) {
  const sampleImages = [
    {
      value: 'ipfs://QmbG3PyyQyZTzdTBANxb3sA8zC37VgXndJhndXSBf7Sr4o',
      label: 'BitBadges Logo'
    }
  ];
  const [imageUrl, setImageUrl] = useState('');

  const images = [
    ...sampleImages,
    image && !sampleImages.find((x) => x.value === image)
      ? {
          value: image,
          label: 'Custom Image'
        }
      : undefined
  ].filter((x) => !!x);

  const [imageIsUploading, setImageIsUploading] = useState(false);
  const dummyRequest = ({ onSuccess }: any) => {
    setTimeout(() => {
      onSuccess('ok');
    }, 0);
  };

  const props: UploadProps = {
    showUploadList: false,
    name: 'file',
    multiple: true,
    customRequest: dummyRequest,
    async onChange(info) {
      if (info.file.status !== 'uploading') {
        console.log(info.file, info.fileList);
      } else {
        if (!imageIsUploading) {
          message.info(`${info.file.name} file is uploading.`);
          setImageIsUploading(true);
        }
      }

      if (info.file.status === 'done') {
        await file2Base64(info.file.originFileObj as File).then((base64) => {
          setImage(base64);
          setImageIsUploading(false);
          message.success(`${info.file.name} file uploaded successfully.`);
        });
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} file upload failed.`);
      } else {
      }
    }
  };

  const file2Base64 = async (file: File): Promise<string> => {
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        resolve(reader.result?.toString() || '');
      };
      reader.onerror = (error) => {
        reject(error);
      };
    });
  };

  return (
    <Form.Item
      label={
        <Text className="primary-text" strong>
          Image
        </Text>
      }
      required>
      <div className="flex-between">
        <Select
          className="selector primary-text inherit-bg"
          value={images.find((item: any) => item.value === image)?.label}
          onChange={(e) => {
            const newImage = images.find((item: any) => e === item.label)?.value;
            if (newImage) {
              setImage(newImage);
            }
          }}
          suffixIcon={<DownOutlined className="primary-text" />}
          dropdownRender={(menu) => (
            <>
              {menu}
              <Divider style={{ margin: '8px 0' }} />
              <Space align="center" style={{ padding: '0 8px 4px', width: '100%' }}>
                <Upload {...props}>
                  <Button icon={<UploadOutlined />}>Click to Upload New Image(s)</Button>
                </Upload>
                or Enter URL
                <Input
                  style={{ color: 'black' }}
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setImage(e.target.value);
                  }}
                  placeholder="Enter URL"
                />
              </Space>
            </>
          )}>
          {images.map((item: any) => (
            <Option key={item.label} value={item.label}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center'
                }}>
                <img
                  src={item.value.replace('ipfs://', 'https://bitbadges-ipfs.infura-ipfs.io/ipfs/')}
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
  );
}

//Do not pass an badgeId if this is for the collection metadata
export function MetadataForm({
  isCollectionSelect,
  badgeIds,
  toBeFrozen,
  isAddressListSelect,
  addMethod,
  setAddMethod
}: {
  isCollectionSelect?: boolean;
  badgeIds: UintRangeArray<bigint>;
  toBeFrozen?: boolean;
  isAddressListSelect?: boolean;
  addMethod?: MetadataAddMethod;
  setAddMethod?: (addMethod: MetadataAddMethod) => void;
}) {
  const collectionId = NEW_COLLECTION_ID;
  badgeIds.sortAndMerge();

  const txTimelineContext = useTxTimelineContext();
  const existingCollectionId = txTimelineContext.existingCollectionId;
  const collection = useCollection(collectionId);

  const [badgeId, setBadgeId] = useState<bigint>(badgeIds.length > 0 ? badgeIds[0].start : 1n);

  const metadata =
    (isCollectionSelect ? collection?.cachedCollectionMetadata : collection?.getBadgeMetadata(badgeId)) ?? Metadata.DefaultPlaceholderMetadata();
  const currMetadata = metadata.clone();

  const setMetadata = (metadata: Metadata<bigint>) => {
    if (!collection) return;
    if (isCollectionSelect) {
      updateCollection({
        collectionId: NEW_COLLECTION_ID,
        cachedCollectionMetadata: metadata
      });
    } else {
      //This is handled in the context. It applies the array below to the existing metadata
      //We use setCollection for complete overwrites
      updateCollection({
        collectionId: NEW_COLLECTION_ID,
        cachedBadgeMetadata: [
          new BadgeMetadataDetails<bigint>({
            uri: undefined,
            toUpdate: true,
            metadata,
            badgeIds: [{ start: badgeId, end: badgeId }]
          })
        ]
      });
    }
  };

  const populateOtherBadges = (previewMetadata: Array<BadgeMetadataDetails<bigint>>, badgeIds: UintRangeArray<bigint>, key: string, value: any) => {
    const newBadgeMetadata = setMetadataPropertyForSpecificBadgeIds(previewMetadata, badgeIds, key, value);
    return newBadgeMetadata;
  };

  const [items, setItems] = useState(['BitBadge', 'Attendance', 'Certification']);
  const [name, setName] = useState('');
  const [applyingBatchUpdate, setApplyingBatchUpdate] = useState(false);

  const [populateIsOpen, setPopulateIsOpen] = useState(false);
  const [fieldNames, setFieldNames] = useState<string[]>([]);

  const addItem = (e: any) => {
    e.preventDefault();
    setItems([...items, name]);
    setName('');
  };

  const onNameChange = (event: any) => {
    setName(event.target.value);
  };

  const FieldCheckbox = ({ fieldName, label }: { fieldName: string; label: string }) => {
    return (
      <Checkbox
        className="primary-text"
        checked={fieldNames.includes(fieldName)}
        onChange={(e) => {
          if (e.target.checked) {
            setFieldNames([...fieldNames, fieldName]);
          } else {
            setFieldNames(fieldNames.filter((x) => x !== fieldName));
          }
        }}>
        {label}
      </Checkbox>
    );
  };

  const updatedIds = UintRangeArray.From(
    collection?.cachedBadgeMetadata
      .filter((x) => x.toUpdate)
      .map((x) => x.badgeIds)
      .flat() ?? []
  );
  const nonUpdatedIds = !collection ? [] : updatedIds.remove(collection.getBadgeIdRange());

  const [inRangeBadgeIds] = badgeIds.getOverlapDetails([{ start: (!collection ? 0n : collection.getMaxBadgeId()) + 1n, end: GO_MAX_UINT_64 }]);
  badgeIds = inRangeBadgeIds;

  const PopulateComponent = () => {
    const [uintRanges, setUintRanges] = useState<UintRangeArray<bigint>>(badgeIds);
    const existingCollection = useCollection(existingCollectionId || 0n);

    const totalNeedToFetch = uintRanges.size();

    let numBadgesFetched = 0n;
    for (const metadata of existingCollection?.cachedBadgeMetadata ?? []) {
      const uintRangesToSearch = uintRanges;
      const removed = metadata.badgeIds.getOverlaps(uintRangesToSearch);
      numBadgesFetched += removed.size();
    }
    const percent = Number(numBadgesFetched) / Number(totalNeedToFetch);

    const outOfBoundsIds = badgeIds.toInverted(UintRange.FullRange());

    const removed = uintRanges.getOverlaps(outOfBoundsIds);
    const hasOutOfBoundsids = removed.length > 0;

    const message = badgeId && !isCollectionSelect ? `ID ${badgeId}'s metadata` : ' the collection metadata';

    return (
      <div>
        {populateIsOpen && (
          <div style={{ marginTop: 8, textAlign: 'center' }} className="primary-text">
            <InformationDisplayCard title={`Set other badges to have properties from ${message}?`}>
              <div className="" style={{ textAlign: 'center' }}>
                <WarningOutlined style={{ marginRight: 4, color: '#FF5733' }} /> This will overwrite the metadata of the selected badges for the
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
                <FieldCheckbox fieldName="attributes" label="Attributes" />
              </div>

              <br />
              <br />
              <div className="flex-center">
                <Col md={12} xs={24} className="full-width">
                  <BadgeIdRangesInput uintRangeBounds={badgeIds} uintRanges={uintRanges} setUintRanges={setUintRanges} collectionId={collectionId} />
                </Col>
              </div>
              <br />
              {isCollectionSelect && !isAddressListSelect && (
                <div className="secondary-text" style={{ textAlign: 'center' }}>
                  <InfoCircleOutlined style={{ marginRight: 4 }} /> The updated badge metadata will be visible on the next step.
                  <br />
                  <br />
                </div>
              )}
              {!isAddressListSelect && !!existingCollectionId && numBadgesFetched < totalNeedToFetch && (
                <>
                  <div className="secondary-text" style={{ textAlign: 'center' }}>
                    <InfoCircleOutlined style={{ marginRight: 4 }} /> We will first need to fetch the metadata for the selected badges (if not already
                    fetched). This may take some time.
                    <br />
                    <br />
                    {numBadgesFetched.toString()}/{totalNeedToFetch.toString()} badges fetched. <br />
                    <Progress
                      percent={Math.ceil(percent * 100)}
                      type="line"
                      format={() => {
                        return <Typography.Text className="primary-text">{`${Math.ceil(percent * 100)}%`}</Typography.Text>;
                      }}
                    />
                    <br />
                    <br />
                  </div>
                </>
              )}

              <div className="full-width flex-center">
                <button
                  disabled={fieldNames.length === 0 || uintRanges.length === 0 || applyingBatchUpdate || hasOutOfBoundsids}
                  className="landing-button full-width"
                  style={{ width: '100%' }}
                  onClick={async () => {
                    setApplyingBatchUpdate(true);
                    const cachedCollection = collection;
                    if (!cachedCollection) return;

                    const fetchedMetadata = await fetchMetadataForPreview(existingCollectionId || 0n, uintRanges, false);

                    let batchUpdatedMetadata = batchUpdateBadgeMetadata(
                      cachedCollection.cachedBadgeMetadata.map((x) => x.clone()),
                      fetchedMetadata.map((x) => {
                        return new BadgeMetadataDetails<bigint>({
                          badgeIds: x.badgeIds,
                          metadata: x.metadata,
                          toUpdate: true
                        });
                      })
                    );

                    for (const fieldName of fieldNames) {
                      batchUpdatedMetadata = populateOtherBadges(
                        batchUpdatedMetadata,
                        uintRanges,
                        fieldName,
                        currMetadata[fieldName as keyof Metadata<bigint>]
                      );
                    }

                    updateCollection({
                      collectionId: NEW_COLLECTION_ID,
                      cachedBadgeMetadata: batchUpdatedMetadata
                    });

                    setPopulateIsOpen(false);

                    notification.success({
                      message: 'Success',
                      description: `Successfully batch applied metadata for selected badges.`
                    });

                    setApplyingBatchUpdate(false);
                  }}>
                  Update {applyingBatchUpdate && <Spin />}
                </button>
              </div>
              <Divider />
            </InformationDisplayCard>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <InformationDisplayCard span={24}>
        {!isAddressListSelect && setAddMethod && (
          <>
            <br />
            <div className="flex-center flex-column">
              <Switch
                checkedChildren="Manual"
                unCheckedChildren="Enter URL"
                checked={addMethod === MetadataAddMethod.Manual}
                onChange={async (e) => {
                  if (!collection) return;

                  const hasExistingCollection = !!txTimelineContext.existingCollectionId;

                  //HACK: We use setCollection to override and set the cached metadata. Should probably handle this better, but it works
                  if (isCollectionSelect) {
                    let collectionMetadataToSet: Metadata<bigint> | undefined = Metadata.DefaultPlaceholderMetadata();
                    if (hasExistingCollection && existingCollectionId) {
                      const res = await fetchAndUpdateMetadata(existingCollectionId, {});
                      collectionMetadataToSet = res.cachedCollectionMetadata;
                    }

                    setCollection({
                      ...collection,
                      cachedCollectionMetadata: collectionMetadataToSet
                    });
                  } else {
                    setCollection({
                      ...collection,
                      cachedBadgeMetadata: hasExistingCollection
                        ? []
                        : [
                            new BadgeMetadataDetails<bigint>({
                              uri: undefined,
                              toUpdate: true,
                              metadata: Metadata.DefaultPlaceholderMetadata(),
                              badgeIds: collection.getBadgeIdRange()
                            })
                          ]
                    });
                  }
                  setAddMethod?.(e ? MetadataAddMethod.Manual : MetadataAddMethod.UploadUrl);
                }}
              />
              {addMethod === MetadataAddMethod.Manual && (
                <Typography.Text strong className="secondary-text" style={{ marginTop: 4, textAlign: 'center' }}>
                  {`We handle the metadata storage for you in a decentralized manner using IPFS.`}
                  <Tooltip
                    placement="bottom"
                    title={`IPFS, or Interplanetary File System, is a way of sharing files and information on the internet that doesn't rely on traditional servers and makes the web more resilient to censorship and centralization.`}>
                    <InfoCircleOutlined style={{ marginLeft: 4, marginRight: 4 }} />
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
              endId={collection ? collection.getMaxBadgeId() : 1n}
              hideCollectionSelect={!isAddressListSelect && !isCollectionSelect}
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
                  <CollectionHeader collectionId={NEW_COLLECTION_ID} hideCollectionLink />
                </div>
              </div>
            )}

            {!isCollectionSelect && !isAddressListSelect && (
              <>
                <div className="secondary-text" style={{ textAlign: 'center' }}>
                  {nonUpdatedIds.length > 0 && (
                    <span style={{ color: 'orange' }}>
                      <WarningOutlined />
                      You have not updated the metadata for IDs {getBadgeIdsString(nonUpdatedIds)}.
                      {!!txTimelineContext.existingCollectionId
                        ? ' If these are newly created IDs, they will have default placeholder metadata. Or else, they will remain as previously set.'
                        : ' They will have default placeholder metadata.'}
                    </span>
                  )}
                </div>
                <br />
              </>
            )}

            {!isCollectionSelect && !isAddressListSelect && (
              <>
                <MultiViewBadgeDisplay badgeId={badgeId} badgeIds={inRangeBadgeIds} setBadgeId={setBadgeId} />
              </>
            )}

            <br />
            <div className="flex-center flex-wrap">
              {!isAddressListSelect && (
                <IconButton
                  text="Batch Apply"
                  tooltipMessage="Populate the metadata of other badges with the metadata of this badge."
                  src={<FontAwesomeIcon icon={populateIsOpen ? faMinus : faReplyAll} />}
                  onClick={() => {
                    setPopulateIsOpen(!populateIsOpen);
                  }}
                  style={{
                    cursor: 'pointer',
                    marginLeft: 8,
                    transform: 'scaleX(-1)'
                  }}
                />
              )}
            </div>
            <br />
            <PopulateComponent />
            <GenericTextFormInput
              label="Title"
              required
              value={currMetadata.name}
              setValue={(value) => {
                currMetadata.name = value;
                setMetadata(currMetadata);
              }}
              placeholder="Enter Title"
            />

            <ImageSelect
              image={currMetadata.image}
              setImage={(image: string) => {
                currMetadata.image = image;
                setMetadata(currMetadata);
              }}
            />

            <GenericMarkdownFormInput
              label="Description"
              value={currMetadata.description}
              setValue={(value) => {
                currMetadata.description = value;
                setMetadata(currMetadata);
              }}
              placeholder="Enter Description"
            />

            <GenericTextFormInput
              label="Video"
              value={currMetadata.video ?? ''}
              setValue={(value) => {
                currMetadata.video = value;
                setMetadata(currMetadata);
              }}
              placeholder="Enter Video URL (optional)"
              helper="Videos can either be a URL to a video file (e.g. .mp4) or a YouTube embed link. Videos will be viewable only after navigating to the badge page. For icons, avatars, and thumbnails, we will use the image provided above."
              err={
                !!currMetadata.video &&
                (currMetadata.video.includes('youtube.com') || currMetadata.video.includes('youtu.be')) &&
                !currMetadata.video.includes('embed')
                  ? 'YouTube links must be embed links to work correctly (e.g. https://www.youtube.com/embed/VIDEO_ID).'
                  : ''
              }
            />

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
                  onChange={(e) => {
                    currMetadata.category = e;
                    setMetadata(currMetadata);
                  }}
                  suffixIcon={<DownOutlined className="primary-text" />}
                  dropdownRender={(menu) => (
                    <>
                      {menu}
                      <Divider style={{ margin: '8px 0' }} />
                      <Space align="center" style={{ padding: '0 8px 4px', color: 'black' }}>
                        <Input placeholder="Add Custom Category" value={name} onChange={onNameChange} style={{ color: 'black' }} />
                        <Typography.Link
                          onClick={addItem}
                          style={{
                            whiteSpace: 'nowrap'
                          }}>
                          <PlusOutlined /> Add Category
                        </Typography.Link>
                      </Space>
                    </>
                  )}>
                  {items.map((item: any) => (
                    <Option key={item} value={item}>
                      {item}
                    </Option>
                  ))}
                </Select>
              </div>
            </Form.Item>

            <GenericTextFormInput
              label="Website"
              value={currMetadata.externalUrl ?? ''}
              setValue={(value) => {
                currMetadata.externalUrl = value;
                setMetadata(currMetadata);
              }}
              placeholder="Enter Website URL"
              helper={
                toBeFrozen
                  ? '*You have selected for this metadata to be frozen and uneditable. Please enter a website URL that is permanent and will not change in the future.'
                  : ''
              }
            />

            <TagsSelect tags={currMetadata.tags ?? []} setTags={(tags) => setMetadata(new Metadata({ ...currMetadata, tags }))} suggestedTags={[]} />

            <SocialsFormItems
              socials={currMetadata.socials ?? {}}
              setSocials={(socials) => setMetadata(new Metadata({ ...currMetadata, socials }))}
            />

            <AttributesSelect
              attributes={currMetadata.attributes ?? []}
              setAttributes={(attributes) => setMetadata(new Metadata({ ...currMetadata, attributes }))}
            />
          </Form>
        )}
      </InformationDisplayCard>
    </>
  );
}

export const AttributesSelect = ({
  attributes,
  setAttributes
}: {
  attributes: Array<{ name: string; value: string | number | boolean; type?: 'date' | 'url' | undefined }>;
  setAttributes: (attributes: Array<{ name: string; value: string | number | boolean; type?: 'date' | 'url' | undefined }>) => void;
}) => {
  attributes = [...attributes];

  return (
    <Form.Item
      label={
        <Text className="primary-text" strong>
          Attributes
        </Text>
      }>
      {/* Attributes can be string, number, boolea, date, or URL */}
      {attributes?.map((attribute, idx) => {
        return (
          <div key={idx} className="flex-between">
            <Col md={8} xs={24} className="full-width" style={{ paddingRight: 8 }}>
              <Select
                style={{ marginRight: 8 }}
                value={attribute.type ? attribute.type : typeof attribute.value}
                onChange={(e) => {
                  if (e === 'date') {
                    attributes![idx].type = 'date';
                    attributes![idx].value = Date.now();
                  } else if (e === 'url') {
                    attributes![idx].type = 'url';
                  } else {
                    if (attributes![idx].type) delete attributes![idx].type;
                    if (e === 'number') {
                      attributes![idx].value = 0;
                    } else if (e === 'boolean') {
                      attributes![idx].value = false;
                    } else {
                      attributes![idx].value = '';
                    }
                  }

                  setAttributes(attributes);
                }}
                className="selector primary-text inherit-bg">
                <Option value="string">String</Option>
                <Option value="number">Number</Option>
                <Option value="boolean">Boolean</Option>
                <Option value="date">Date</Option>
                <Option value="url">URL</Option>
              </Select>
            </Col>
            <Col md={7} xs={24} className="full-width" style={{ paddingRight: 8 }}>
              <Input
                style={{ marginRight: 8 }}
                value={attribute.name}
                onChange={(e) => {
                  attributes![idx].name = e.target.value;
                  setAttributes(attributes);
                }}
                placeholder="Attribute Name"
                className="primary-text inherit-bg"
              />
            </Col>
            <Col md={8} xs={24} className="full-width" style={{ paddingRight: 8 }}>
              {attributes![idx].type === 'date' && (
                <DatePicker
                  style={{ width: '100%' }}
                  value={moment(new Date(Number(attributes![idx].value)))}
                  onChange={(e) => {
                    if (!e) return;
                    attributes![idx].value = new Date(e?.toISOString() ?? '').valueOf() ?? 0;
                    setAttributes(attributes);
                  }}
                  className="primary-text inherit-bg"
                />
              )}
              {(attributes![idx].type === 'url' || typeof attributes![idx].value === 'string') && (
                <Input
                  value={attributes![idx].value as string}
                  onChange={(e) => {
                    attributes![idx].value = e.target.value;
                    setAttributes(attributes);
                  }}
                  placeholder="Attribute Value"
                  className="primary-text inherit-bg"
                />
              )}
              {typeof attributes![idx].value === 'number' && attributes![idx].type !== 'date' && (
                <InputNumber
                  value={attributes![idx].value as number}
                  onChange={(e) => {
                    attributes![idx].value = e as number;
                    setAttributes(attributes);
                  }}
                  className="primary-text inherit-bg"
                />
              )}
              {typeof attributes![idx].value === 'boolean' && (
                <Switch
                  checkedChildren="True"
                  unCheckedChildren="False"
                  checked={attributes![idx].value as boolean}
                  onChange={(e) => {
                    attributes![idx].value = e;
                    setAttributes(attributes);
                  }}
                />
              )}
            </Col>
            <Col md={1} xs={24} className="full-width">
              <IconButton
                onClick={() => {
                  attributes = [...attributes];
                  attributes!.splice(idx, 1);
                  setAttributes(attributes);
                }}
                src={<MinusOutlined />}
                text=""
              />
            </Col>
          </div>
        );
      })}
      <div className="flex-center">
        <IconButton
          onClick={() => {
            if (!attributes) attributes = [];
            attributes = [...attributes];

            attributes!.push({ name: '', value: '', type: 'url' });
            setAttributes(attributes);
          }}
          src={<PlusOutlined />}
          text="Add"
        />
      </div>
    </Form.Item>
  );
};

export const SocialsFormItems = ({
  socials,
  setSocials
}: {
  socials: { twitter?: string; github?: string; telegram?: string; discord?: string };
  setSocials: (socials: { twitter?: string; github?: string; telegram?: string; discord?: string }) => void;
}) => {
  return (
    <>
      <GenericTextFormInput
        label="X"
        value={socials?.twitter ?? ''}
        setValue={(value) => {
          socials = { ...socials, twitter: value };
          setSocials(socials);
        }}
        placeholder="Enter Twitter Handle"
        helper={
          <>
            {socials?.twitter && (
              <a href={'https://x.com/' + socials?.twitter ?? ''} target="_blank" rel="noopener noreferrer">
                https://x.com/{socials?.twitter}
              </a>
            )}
          </>
        }
      />

      <GenericTextFormInput
        label="GitHub"
        value={socials?.github ?? ''}
        setValue={(value) => {
          socials = { ...socials, github: value };
          setSocials(socials);
        }}
        placeholder="Enter GitHub Username"
        helper={
          <>
            {socials?.github && (
              <a href={'https://github.com/' + socials?.github} target="_blank" rel="noopener noreferrer">
                https://github.com/{socials?.github}
              </a>
            )}
          </>
        }
      />

      <GenericTextFormInput
        label="Telegram"
        value={socials?.telegram ?? ''}
        setValue={(value) => {
          socials = { ...socials, telegram: value };
          setSocials(socials);
        }}
        placeholder="Enter Telegram Username"
        helper={
          <>
            {socials?.telegram && (
              <a href={`https://t.me/${socials?.telegram}`} target="_blank" rel="noopener noreferrer">
                https://t.me/{socials?.telegram}
              </a>
            )}
          </>
        }
      />

      <GenericTextFormInput
        label="Discord"
        value={socials?.discord ?? ''}
        setValue={(value) => {
          socials = { ...socials, discord: value };
          setSocials(socials);
        }}
        placeholder="Enter Discord Server ID"
        helper={
          <>
            {socials?.discord && (
              <a href={`https://discord.com/invite/${socials?.discord}`} target="_blank" rel="noopener noreferrer">
                https://discord.com/invite/{socials?.discord}
              </a>
            )}
          </>
        }
      />
    </>
  );
};
