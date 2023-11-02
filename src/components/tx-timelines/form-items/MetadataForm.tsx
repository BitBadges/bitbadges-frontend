import { DownOutlined, InfoCircleOutlined, PlusOutlined, UploadOutlined, WarningOutlined } from '@ant-design/icons';
import { Button, Checkbox, Divider, Form, Input, InputNumber, Progress, Select, Space, Spin, Switch, Tag, Tooltip, Typography, Upload, UploadProps, message, notification } from 'antd';
import { useState } from 'react';

import { faMinus, faPlus, faReplyAll } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { UintRange, deepCopy } from 'bitbadgesjs-proto';
import { BadgeMetadataDetails, DefaultPlaceholderMetadata, Metadata, MetadataAddMethod, Numberify, batchUpdateBadgeMetadata, getMetadataForBadgeId, invertUintRanges, removeUintRangeFromUintRange, searchUintRangesForId, setMetadataPropertyForSpecificBadgeIds, sortUintRangesAndMergeIfNecessary } from 'bitbadgesjs-utils';
import MarkdownIt from 'markdown-it';
import MdEditor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';
import { NEW_COLLECTION_ID, useTxTimelineContext } from '../../../bitbadges-api/contexts/TxTimelineContext';

import { getTotalNumberOfBadges } from '../../../bitbadges-api/utils/badges';
import { BadgeAvatarDisplay } from '../../badges/BadgeAvatarDisplay';
import { CollectionHeader } from '../../badges/CollectionHeader';
import { DevMode } from '../../common/DevMode';
import IconButton from '../../display/IconButton';
import { InformationDisplayCard } from '../../display/InformationDisplayCard';
import { ToolIcon } from '../../display/ToolIcon';
import { BadgeIdRangesInput } from '../../inputs/BadgeIdRangesInput';
import { DateRangeInput } from '../../inputs/DateRangeInput';
import { MetadataUriSelect } from './MetadataUriSelect';
import { fetchAndUpdateMetadata, fetchMetadataForPreview, setCollection, updateCollection, useCollection } from '../../../bitbadges-api/contexts/collections/CollectionsContext';
import { GO_MAX_UINT_64 } from '../../../utils/dates';

const { Text } = Typography;
const { Option } = Select;

const mdParser = new MarkdownIt(/* Markdown-it options */);

//Do not pass an badgeId if this is for the collection metadata
export function MetadataForm({
  isCollectionSelect,
  badgeIds,
  toBeFrozen,
  isAddressMappingSelect,
  addMethod,
  setAddMethod,
}: {
  isCollectionSelect?: boolean;
  badgeIds: UintRange<bigint>[];
  toBeFrozen?: boolean;
  isAddressMappingSelect?: boolean;
  addMethod?: MetadataAddMethod;
  setAddMethod?: (addMethod: MetadataAddMethod) => void;
}) {
  const collectionId = NEW_COLLECTION_ID;
  badgeIds = sortUintRangesAndMergeIfNecessary(badgeIds, true)

  const txTimelineContext = useTxTimelineContext();
  const existingCollectionId = txTimelineContext.existingCollectionId;


  const collection = useCollection(collectionId)

  const [badgeId, setBadgeId] = useState<bigint>(badgeIds.length > 0 ? badgeIds[0].start : 1n);
  const [showAvatarDisplay, setShowAvatarDisplay] = useState<boolean>(false);

  let metadata = (isCollectionSelect ? collection?.cachedCollectionMetadata : getMetadataForBadgeId(badgeId, collection?.cachedBadgeMetadata ?? [])) ?? DefaultPlaceholderMetadata;
  const currMetadata = metadata;

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
        cachedBadgeMetadata: [{ uri: undefined, toUpdate: true, metadata, badgeIds: [{ start: badgeId, end: badgeId }] }]
      })
    }
  }

  const populateOtherBadges = (previewMetadata: BadgeMetadataDetails<bigint>[], badgeIds: UintRange<bigint>[], key: string, value: any) => {
    const newBadgeMetadata = setMetadataPropertyForSpecificBadgeIds(previewMetadata, badgeIds, key, value);
    return newBadgeMetadata
  }

  const [items, setItems] = useState(['BitBadge', 'Attendance', 'Certification']);
  const [name, setName] = useState('');
  const [validForeverChecked, setValidForeverChecked] = useState((!metadata.validFrom) || (metadata.validFrom && metadata.validFrom.length === 0));
  const [uintRanges, setUintRanges] = useState<UintRange<bigint>[]>(badgeIds);
  const [applyingBatchUpdate, setApplyingBatchUpdate] = useState(false);

  const sampleImages = [
    {
      value: 'ipfs://QmbG3PyyQyZTzdTBANxb3sA8zC37VgXndJhndXSBf7Sr4o',
      label: 'BitBadges Logo',
    },
  ]

  console.log(currMetadata.image)

  const images = [
    ...sampleImages,
    currMetadata.image && !sampleImages.find(x => x.value === currMetadata.image)
      ? {
        value: currMetadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/'),
        label: 'Custom Image',
      } : undefined
  ].filter(x => !!x);

  const [imageIsUploading, setImageIsUploading] = useState(false);

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

  const dummyRequest = ({ onSuccess }: any) => {
    setTimeout(() => {
      onSuccess("ok");
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

          setMetadata({
            ...currMetadata,
            image: base64
          });
          setImageIsUploading(false);
          message.success(`${info.file.name} file uploaded successfully.`);
        })
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} file upload failed.`);
      } else {

      }
    },
  };

  const file2Base64 = (file: File): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result?.toString() || '');
      reader.onerror = error => reject(error);
    })
  }

  function handleEditorChange({ text }: any) {
    setMetadata({
      ...currMetadata,
      description: text
    });
    // console.log('handleEditorChange', html, text);
  }

  const FieldCheckbox = ({ fieldName, label }: { fieldName: string, label: string }) => {
    return <Checkbox
      className='primary-text'
      checked={fieldNames.includes(fieldName)}
      onChange={(e) => {
        if (e.target.checked) {
          setFieldNames([...fieldNames, fieldName]);
        } else {
          setFieldNames(fieldNames.filter(x => x !== fieldName));
        }
      }}
    >{label}</Checkbox>
  }

  let numBadgesFetched = 0n;
  const existingCollection = useCollection(existingCollectionId || 0n);
  for (const metadata of existingCollection?.cachedBadgeMetadata ?? []) {
    const uintRangesToSearch = uintRanges;
    const [, removed] = removeUintRangeFromUintRange(uintRangesToSearch, metadata.badgeIds);
    for (const badgeIdRange of removed) {
      numBadgesFetched += badgeIdRange.end - badgeIdRange.start + 1n;
    }
  }

  let totalNeedToFetch = 0n;
  for (const range of uintRanges) {
    totalNeedToFetch += range.end - range.start + 1n;
  }

  let percent = Number(numBadgesFetched) / Number(totalNeedToFetch);

  const outOfBoundsIds = invertUintRanges(badgeIds, 1n, GO_MAX_UINT_64);

  const [, removed] = removeUintRangeFromUintRange(outOfBoundsIds, uintRanges);
  const hasOutOfBoundsids = removed.length > 0;

  const PopulateComponent = () => {
    let message = 'metadata';

    return <div>
      {populateIsOpen && <div style={{ marginTop: 8, textAlign: 'center' }} className='primary-text'>
        <InformationDisplayCard title={`Set other badges to have properties from this ${message}?`}>
          <div className='' style={{ textAlign: 'center' }}>
            <WarningOutlined style={{ marginRight: 4, color: '#FF5733' }} /> This will overwrite the {message} of the selected badges for the selected properties.
            <br />
            <br />
          </div>
          <br />
          <div className='flex-center flex-wrap primary-text'>
            <FieldCheckbox fieldName='name' label='Title' />
            <FieldCheckbox fieldName='image' label='Image' />
            <FieldCheckbox fieldName='description' label='Description' />
            <FieldCheckbox fieldName='validFrom' label='Validity' />
            <FieldCheckbox fieldName='category' label='Category' />
            <FieldCheckbox fieldName='tags' label='Tags' />
            <FieldCheckbox fieldName='externalUrl' label='Website' />
          </div>

          <br />
          <BadgeIdRangesInput
            uintRangeBounds={badgeIds}
            uintRanges={uintRanges}
            setUintRanges={setUintRanges}
            collectionId={collectionId}
          />

          <Divider />
          {isCollectionSelect && !isAddressMappingSelect && <div className='secondary-text' style={{ textAlign: 'center' }}>
            <InfoCircleOutlined style={{ marginRight: 4 }} /> The updated badge metadata will be visible on the next step.
            <br />
            <br />
          </div>}
          {!isAddressMappingSelect && !!existingCollectionId && numBadgesFetched < totalNeedToFetch && <>
            <div className='secondary-text' style={{ textAlign: 'center' }}>

              <InfoCircleOutlined style={{ marginRight: 4 }} /> We will first need to fetch the metadata for the selected badges (if not already fetched). This may take some time.
              <br /><br />
              {numBadgesFetched.toString()}/{totalNeedToFetch.toString()} badges fetched. <br />
              <Progress percent={Math.ceil(percent * 100)}
                type='line'

                format={() => {
                  return <Typography.Text className='primary-text'>{`${Math.ceil(percent * 100)}%`}</Typography.Text>
                }}

              />

              <br />
              <br />
            </div>
          </>}


          <div className='full-width flex-center'>
            <button
              disabled={fieldNames.length === 0 || uintRanges.length === 0 || applyingBatchUpdate || hasOutOfBoundsids}
              className='landing-button full-width'
              style={{ width: '100%' }}
              onClick={async () => {
                setApplyingBatchUpdate(true);
                let cachedCollection = collection;
                if (!cachedCollection) return;

                const fetchedMetadata = await fetchMetadataForPreview(existingCollectionId || 0n, uintRanges, false);

                let batchUpdatedMetadata = batchUpdateBadgeMetadata(deepCopy(cachedCollection?.cachedBadgeMetadata), fetchedMetadata.map(x => {
                  return {
                    badgeIds: x.badgeIds,
                    metadata: x.metadata,
                    toUpdate: true,
                  }
                }));


                for (const fieldName of fieldNames) {
                  batchUpdatedMetadata = populateOtherBadges(batchUpdatedMetadata, uintRanges, fieldName, currMetadata[fieldName as keyof Metadata<bigint>]);
                }

                updateCollection({
                  collectionId: NEW_COLLECTION_ID,
                  cachedBadgeMetadata: batchUpdatedMetadata
                });

                setPopulateIsOpen(false);

                notification.success({
                  message: 'Success',
                  description: `Successfully batch applied metadata for selected badges.`,
                });

                setApplyingBatchUpdate(false);
              }}
            >Update {applyingBatchUpdate && <Spin />}</button >
          </div>
          <Divider />
        </ InformationDisplayCard>
      </div>
      }
    </div >
  }

  return (
    <>
      <div>
        {!isAddressMappingSelect && setAddMethod && <>
          <br />
          <div className='flex-center flex-column'>
            <Switch
              checkedChildren="Manual"
              unCheckedChildren="Enter URL"
              checked={addMethod === MetadataAddMethod.Manual}
              onChange={async (e) => {
                if (!collection) return;

                const hasExistingCollection = !!txTimelineContext.existingCollectionId;

                //HACK: We use setCollection to override and set the cached metadata. Should probably handle this better, but it works
                if (isCollectionSelect) {
                  let collectionMetadataToSet: Metadata<bigint> | undefined = DefaultPlaceholderMetadata;
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
                    cachedBadgeMetadata: hasExistingCollection ? [] : [{ uri: undefined, toUpdate: true, metadata: DefaultPlaceholderMetadata, badgeIds: [{ start: 1n, end: getTotalNumberOfBadges(collection) }] }]
                  });
                }
                setAddMethod?.(e ? MetadataAddMethod.Manual : MetadataAddMethod.UploadUrl);
              }}
            />
            {addMethod === MetadataAddMethod.Manual && <Typography.Text strong className='secondary-text' style={{ marginTop: 4 }}>
              {`Enter your metadata directly into this form, and we handle the metadata storage for you in a decentralized manner using IPFS.`}
              <Tooltip
                placement='bottom'
                title={`IPFS, or Interplanetary File System, is a way of sharing files and information on the internet that doesn't rely on traditional servers and makes the web more resilient to censorship and centralization.`}
              >
                <InfoCircleOutlined
                  style={{ marginLeft: 4, marginRight: 4 }}
                />
              </Tooltip>
            </Typography.Text>}
          </div>
          <br />
        </>}

        {addMethod === MetadataAddMethod.UploadUrl && <>
          <MetadataUriSelect
            startId={1n}
            endId={collection ? getTotalNumberOfBadges(collection) : 1n}
            hideCollectionSelect={!isAddressMappingSelect && !isCollectionSelect}
            hideBadgeSelect={!isAddressMappingSelect && isCollectionSelect}
          />
        </>}

        {addMethod === MetadataAddMethod.Manual &&
          <Form colon={false} layout="vertical">


            {isCollectionSelect && addMethod === MetadataAddMethod.Manual &&
              <div>
                <div>
                  <br />
                  <CollectionHeader collectionId={NEW_COLLECTION_ID} hideCollectionLink />
                </div>
              </div>
            }
            <div className='flex-center flex-wrap'>
              {!isCollectionSelect && !isAddressMappingSelect && badgeId > 0 &&
                <div className='primary-text flex-center' >


                  <div><b style={{ fontSize: 18 }}>Setting Metadata for Badge ID:{' '}</b></div>
                  <InputNumber
                    //badgeIds are sorted above 
                    min={badgeIds && badgeIds.length > 0 ? Numberify(badgeIds[0].start.toString()) : 1}
                    max={badgeIds && badgeIds.length > 0 ? Numberify(badgeIds[badgeIds.length - 1].end.toString()) : Number.MAX_SAFE_INTEGER}
                    value={Numberify(badgeId.toString())}
                    onChange={(e) => {
                      if (e && e > 0 && setBadgeId) {
                        const [, found] = searchUintRangesForId(BigInt(e), badgeIds);
                        if (found) setBadgeId(BigInt(e));
                      }
                    }}
                    style={{
                      marginLeft: 8,
                    }}
                    className='primary-text inherit-bg'
                  />

                </div>}
              {!isAddressMappingSelect && <IconButton
                text='Batch Apply'
                tooltipMessage='Populate the metadata of other badges with the metadata of this badge.'
                src={<FontAwesomeIcon
                  icon={populateIsOpen ? faMinus : faReplyAll}
                />}
                onClick={() => {
                  setPopulateIsOpen(!populateIsOpen);
                }}
                style={{ cursor: 'pointer', marginLeft: 8, transform: 'scaleX(-1)' }}
              />}
              {!isCollectionSelect && !isAddressMappingSelect && <IconButton
                text='Show All'
                tooltipMessage='Show a display of updatable badges in this collection.'
                src={showAvatarDisplay ? <FontAwesomeIcon
                  icon={faMinus}
                /> : <FontAwesomeIcon
                  icon={faPlus}
                />}
                onClick={() => {
                  setShowAvatarDisplay(!showAvatarDisplay);
                }}
                style={{ cursor: 'pointer', marginLeft: 8 }}
              />}
            </div>
            <div className='flex-center flex-column full-width'>
              <div className='flex-center flex full-width'>
                {!isCollectionSelect && !isAddressMappingSelect && showAvatarDisplay &&
                  <div className='primary-text mx-10'>
                    <BadgeAvatarDisplay
                      onClick={(id: bigint) => {
                        setBadgeId(id);
                      }}
                      collectionId={NEW_COLLECTION_ID}
                      badgeIds={badgeIds}
                      showIds={true}
                      selectedId={badgeId}
                    />
                  </div>}
                {!isCollectionSelect && badgeId > 0 && !isCollectionSelect && !isAddressMappingSelect && <>

                  <div className='primary-text flex-center mx-10'>
                    {/* Slight hack here. Instead of putting BadgeCard directly, we use BadgeAvatarDisplay which has support for fetching the metadata from source */}
                    <BadgeAvatarDisplay
                      collectionId={NEW_COLLECTION_ID}
                      badgeIds={[{ start: badgeId, end: badgeId }]}
                      showIds={true}
                      selectedId={badgeId}
                      cardView
                    />
                  </div>
                </>
                }
              </div>

            </div>

            {/* TODO: If I make this react component, it glitches and rerenders every time (prob just need to pass in props correctly). Works as function though */}
            {PopulateComponent()}

            <br />
            <Form.Item
              label={
                <Text
                  className='primary-text'
                  strong
                >
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
                    name: e.target.value
                  });
                }}
                style={{
                }}
                className='primary-text inherit-bg'
              />


            </Form.Item>

            <Form.Item
              label={
                <Text
                  className='primary-text'
                  strong
                >
                  Image
                </Text>
              }
              required
            >
              <div className='flex-between' style={{}}>
                <Select
                  className="selector primary-text inherit-bg"
                  value={images.find((item: any) => item.value === currMetadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/'))?.label}
                  onChange={(e) => {
                    const newImage = images.find((item: any) => e === item.label)?.value;
                    if (newImage) {
                      setMetadata({
                        ...currMetadata,
                        image: newImage
                      });
                    }
                  }}
                  style={{
                  }}
                  suffixIcon={
                    <DownOutlined
                      className='primary-text'
                    />
                  }
                  dropdownRender={(menu) => (
                    <>
                      {menu}
                      <Divider
                        style={{ margin: '8px 0' }}
                      />
                      <Space
                        align="center"
                        style={{ padding: '0 8px 4px' }}
                      >
                        <Upload {...props}>
                          <Button icon={<UploadOutlined />}>Click to Upload New Image(s)</Button>
                        </Upload>
                      </Space>
                    </>
                  )}
                >
                  {images.map((item: any) => (
                    <Option
                      key={item.label}
                      value={item.label}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <img
                          src={item.value}

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

            <Form.Item
              label={
                <Text
                  className='primary-text'
                  strong
                >
                  Category
                </Text>
              }
            // required={type === 0}
            >
              <div className='flex-between' style={{}}>
                <Select
                  className="selector primary-text inherit-bg"
                  value={currMetadata.category}
                  placeholder="Default: None"
                  onChange={(e: any) => {
                    setMetadata({
                      ...currMetadata,
                      category: e
                    });

                  }}
                  style={{
                  }}
                  suffixIcon={
                    <DownOutlined
                      className='primary-text'
                    />
                  }
                  dropdownRender={(menu) => (
                    <>
                      {menu}
                      <Divider
                        style={{ margin: '8px 0' }}
                      />
                      <Space
                        align="center"
                        style={{ padding: '0 8px 4px' }}
                      >
                        <Input
                          placeholder="Add Custom Category"
                          value={name}
                          onChange={onNameChange}
                        />
                        <Typography.Link
                          onClick={addItem}
                          style={{
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <PlusOutlined /> Add
                          Category
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
                <Text
                  className='primary-text'
                  strong
                >
                  Description
                </Text>
              }
            >
              <div className='flex-between' style={{}}>
                <MdEditor
                  className='primary-text'
                  style={{
                    width: '100%',
                    minHeight: '250px',
                    background: 'inherit',

                  }} renderHTML={text => mdParser.render(text)} onChange={handleEditorChange}
                  value={currMetadata.description}
                />

              </div>
            </Form.Item>


            <Form.Item
              label={
                <Text
                  className='primary-text'
                  strong
                >
                  Website <Tooltip color='black' title={'Provide a website link for users to learn more.'}>
                    <InfoCircleOutlined />
                  </Tooltip>
                </Text>
              }
            >
              <div className='flex-between' style={{}}>
                <Input
                  value={currMetadata.externalUrl}
                  onChange={(e) => {
                    setMetadata({
                      ...currMetadata,
                      externalUrl: e.target.value
                    });
                  }}
                  style={{
                  }}
                  className='primary-text inherit-bg'
                />

              </div>
              <div style={{ fontSize: 12 }}>
                <Text className='secondary-text'>
                  {toBeFrozen && '*Note that you have selected for this metadata to be frozen and uneditable. Please enter a website URL that is permanent and will not change in the future.'}
                </Text>
              </div>
            </Form.Item>
            <Form.Item
              label={
                <Text
                  className='primary-text'
                  strong
                >
                  Validity <Tooltip color='black' title={'How long will badge(s) be valid? Note this has no on-chain significance and is only informational. Could be used for subscriptions, memberships, etc.'}>
                    <InfoCircleOutlined />
                  </Tooltip>
                </Text>
              }
            >
              <div className='flex-between' style={{}}>
                <div className='primary-text inherit-bg full-width'>
                  <div className='primary-text'>
                    Always Valid?
                    <Checkbox
                      checked={validForeverChecked}
                      style={{ marginLeft: 5 }}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setMetadata({
                            ...currMetadata,
                            validFrom: []
                          });
                        } else {
                          const maxDate = new Date();
                          maxDate.setFullYear(9999);
                          maxDate.setMonth(11);
                          maxDate.setDate(31);
                          maxDate.setHours(0);
                          maxDate.setMinutes(0);
                          maxDate.setSeconds(0);

                          setMetadata({
                            ...currMetadata,
                            validFrom: [{
                              start: BigInt(Date.now()),
                              end: BigInt(maxDate.valueOf())
                            }]
                          });
                        }
                        setValidForeverChecked(e.target.checked);
                      }}
                    />

                  </div>

                  {!validForeverChecked && <>
                    <DateRangeInput
                      timeRanges={currMetadata.validFrom ?? []}
                      setTimeRanges={(timeRanges: UintRange<bigint>[]) => {
                        setMetadata({
                          ...currMetadata,
                          validFrom: timeRanges
                        });
                      }
                      }
                    />
                  </>
                  }

                </div>

              </div>
            </Form.Item>



            <Form.Item
              label={
                <Text
                  className='primary-text'
                  strong
                >
                  Tags / Keywords <Tooltip color='black' title={'Use tags and keywords to further categorize your badge and make it more searchable!'}>
                    <InfoCircleOutlined />
                  </Tooltip>
                </Text>
              }
            >
              <div className='flex-between' style={{}}>
                <Input
                  value={currMetadata.tags}
                  onChange={(e) => {
                    setMetadata({
                      ...currMetadata,
                      tags: e.target.value.split(','),
                    })
                  }}
                  style={{
                  }}
                  className='primary-text inherit-bg'
                />

              </div>
              <div style={{ fontSize: 12, }}>
                <Text className='secondary-text'>
                  *Separate with a comma.
                </Text>
              </div>
              <div style={{ display: 'flex', marginTop: 4 }}>
                {currMetadata.tags?.map((tag: any, idx: number) => {
                  if (tag === '') return;
                  return <Tag key={tag + idx} className='card-bg secondary-text'>
                    {tag}
                  </Tag>
                })}

              </div>
            </Form.Item>


            <Form.Item
              label={
                <Text
                  className='primary-text'
                  strong
                >
                  Useful Tools
                </Text>
              }
            >
              <div className='flex-between' style={{}}>
                <div style={{ display: 'flex' }} className='flex-wrap'>
                  <ToolIcon name="Sketch.io" />
                  <ToolIcon name="Excalidraw" />
                </div>

              </div>
            </Form.Item>



          </Form>}
        <DevMode obj={collection?.collectionMetadataTimeline} />
        <DevMode obj={collection?.cachedCollectionMetadata} />
        <DevMode obj={collection?.cachedBadgeMetadata} />
        <DevMode obj={collection?.badgeMetadataTimeline} />
      </div >
    </>
  );
};
