import { DownOutlined, InfoCircleOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { Avatar, Button, Checkbox, Divider, Form, Input, InputNumber, Select, Space, Tag, Tooltip, Typography, Upload, UploadProps, message } from 'antd';
import { useEffect, useState } from 'react';

import { faMinus, faReplyAll } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { UintRange, deepCopy } from 'bitbadgesjs-proto';
import { DefaultPlaceholderMetadata, Metadata, MetadataAddMethod, Numberify, getMetadataForBadgeId, searchUintRangesForId, setMetadataPropertyForSpecificBadgeIds, sortUintRangesAndMergeIfNecessary, updateBadgeMetadata } from 'bitbadgesjs-utils';
import MarkdownIt from 'markdown-it';
import MdEditor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';
import { useCollectionsContext } from '../../../bitbadges-api/contexts/CollectionsContext';
import { MSG_PREVIEW_ID, useTxTimelineContext } from '../../../bitbadges-api/contexts/TxTimelineContext';
import { getTotalNumberOfBadges } from '../../../bitbadges-api/utils/badges';
import { INFINITE_LOOP_MODE } from '../../../constants';
import { BadgeCard } from '../../badges/BadgeCard';
import { DevMode } from '../../common/DevMode';
import { BadgeIdRangesInput } from '../../inputs/BadgeIdRangesInput';
import { DateRangeInput } from '../../inputs/DateRangeInput';
import { MetadataUriSelect } from './MetadataUriSelect';

const { Text } = Typography;
const { Option } = Select;

const mdParser = new MarkdownIt(/* Markdown-it options */);
const DELAY_TIME = 300;

//TODO: abstract and clean this

//Do not pass an badgeId if this is for the collection metadata
export function MetadataForm({
  isCollectionSelect,
  badgeIds,
  toBeFrozen,
  hideCollectionSelect,
  isAddressMappingSelect
}: {
  isCollectionSelect?: boolean;
  badgeIds: UintRange<bigint>[];
  toBeFrozen?: boolean;
  hideCollectionSelect?: boolean;
  isAddressMappingSelect?: boolean
}) {
  const collectionId = MSG_PREVIEW_ID;
  const txTimelineContext = useTxTimelineContext();
  const addMethod = txTimelineContext.addMethod;

  badgeIds = sortUintRangesAndMergeIfNecessary(badgeIds);

  const collections = useCollectionsContext();
  const collection = collections.collections[collectionId.toString()]

  const [badgeId, setBadgeId] = useState<bigint>(badgeIds.length > 0 ? badgeIds[0].start : 1n);

  let metadata = (isCollectionSelect ? collection?.cachedCollectionMetadata : getMetadataForBadgeId(badgeId, collection?.cachedBadgeMetadata ?? [])) ?? DefaultPlaceholderMetadata;

  const [currMetadata, setCurrMetadata] = useState<Metadata<bigint>>(metadata);

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log("MetadataForm: useEffect: collection: ", collectionId);
    setCurrMetadata(metadata);
  }, [badgeId]);


  //TODO: Think about race conditions between the debounce time
  const setMetadata = (metadata: Metadata<bigint>) => {
    setCurrMetadata(metadata);

    const delayDebounceFn = setTimeout(async () => {
      if (!collection) return;
      if (isCollectionSelect) {
        collections.updateCollection({
          ...collection,
          cachedCollectionMetadata: metadata
        });
      } else {
        const newBadgeMetadata = updateBadgeMetadata(collection.cachedBadgeMetadata, { uri: undefined, toUpdate: true, metadata, badgeIds: [{ start: badgeId, end: badgeId }] });
        collections.updateCollection({
          ...collection,
          cachedBadgeMetadata: newBadgeMetadata
        })
      }
    }, DELAY_TIME);

    return () => clearTimeout(delayDebounceFn)
  }

  const populateOtherBadges = (badgeIds: UintRange<bigint>[], key: string, value: any) => {
    if (!collection) return;

    if (key === 'all') {
      const badgeMetadata = updateBadgeMetadata(deepCopy(collection.cachedBadgeMetadata),
        {
          badgeIds,
          metadata: currMetadata,
          toUpdate: true,
        }
      );

      collections.updateCollection({
        ...collection,
        cachedBadgeMetadata: badgeMetadata,
      })

      return
    }

    const badgeMetadata = deepCopy(collection.cachedBadgeMetadata);
    const newBadgeMetadata = setMetadataPropertyForSpecificBadgeIds(badgeMetadata, badgeIds, key, value);
    collections.updateCollection(
      deepCopy({
        ...collection,
        cachedBadgeMetadata: newBadgeMetadata,
      }))
  }

  const [items, setItems] = useState(['BitBadge', 'Attendance', 'Certification']);
  const [name, setName] = useState('');
  const [validForeverChecked, setValidForeverChecked] = useState((!metadata.validFrom) || (metadata.validFrom && metadata.validFrom.length === 0));
  const [uintRanges, setUintRanges] = useState<UintRange<bigint>[]>(badgeIds);

  const sampleImages = [
    {
      value: 'https://bitbadges.web.app/img/icons/logo.png',
      label: 'BitBadges Logo',
    },
    {
      value: 'https://png.pngtree.com/element_pic/16/11/26/4f816dc086585b8c9d4516821a15dc6e.jpg',
      label: 'Trophy',
    },
    {
      value: 'https://library.kissclipart.com/20191129/oq/kissclipart-gold-medal-058a93f291de9771.png',
      label: 'Medal',
    },
  ]

  const [images, setImages] = useState([
    ...sampleImages,
    metadata?.image && !sampleImages.find(x => x.value === currMetadata.image)
      ? {
        value: currMetadata.image,
        label: 'Custom Image',
      } : undefined
  ].filter(x => !!x));
  const [imageIsUploading, setImageIsUploading] = useState(false);

  const [populateIsOpen, setPopulateIsOpen] = useState(false);
  const [fieldName, setFieldName] = useState('');

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
          images.push({
            value: base64,
            label: info.file.url ? info.file.url : info.file.name,
          })
          setImages(images);
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

  const populateComponent = (_fieldName: string) => {
    let message = 'metadata';
    switch (_fieldName) {
      case 'name':
        message = 'title';
        break;
      case 'image':
        message = 'image';
        break;
      case 'description':
        message = 'description';
        break;
      case 'validFrom':
        message = 'valid from';
        break;
      case 'category':
        message = 'category';
        break;
      case 'tags':
        message = 'tags';
        break;
      case 'externalUrl':
        message = 'URL';
        break;
      default:
        break;
    }


    return <div>
      {populateIsOpen && fieldName === _fieldName && <div style={{ marginTop: 8 }} className='primary-text'>
        <br />
        <h3 className='primary-text' style={{ textAlign: 'center' }}>Set other badges to have this {message}?</h3>
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
        <div className='secondary-text' style={{ textAlign: 'center' }}>
          <InfoCircleOutlined style={{ marginRight: 4 }} /> If you make any edits in the future, you will need to populate again. It is not automatic.
          <br />
          <br />
        </div>

        <Button type='primary'
          className='full-width'
          onClick={() => {
            populateOtherBadges(uintRanges, fieldName, fieldName === 'all' ? '' : currMetadata[fieldName as keyof Metadata<bigint>]);
            setPopulateIsOpen(false);
          }}
        > Update </Button>
        <Divider />
        <hr />
      </div>}
    </div>
  }

  return (
    <>
      <div>
        {addMethod === MetadataAddMethod.UploadUrl && <>
          <MetadataUriSelect
            startId={1n}
            endId={collection ? getTotalNumberOfBadges(collection) : 1n}
            hideCollectionSelect={hideCollectionSelect}
          />
        </>}

        {addMethod === MetadataAddMethod.Manual && <Form layout="vertical">

          {!isCollectionSelect && badgeId > 0 && !isCollectionSelect && !isAddressMappingSelect && <div>
            <div className='primary-text flex-center' >

              <div><b>Setting Metadata for Badge ID:{' '}</b></div>
              <InputNumber
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
                className='primary-text primary-blue-bg'
              />
              {!isAddressMappingSelect && <Tooltip color='black' title='Populate the metadata of other badges with the metadata of this badge.'>
                <Avatar
                  className='styled-button'
                  src={<FontAwesomeIcon
                    icon={populateIsOpen && fieldName === 'all'
                      ? faMinus : faReplyAll}
                  />}
                  style={{ cursor: 'pointer', marginLeft: 8, transform: 'scaleX(-1)' }}
                  onClick={() => {
                    setPopulateIsOpen(!populateIsOpen);
                    setFieldName('all');
                  }}
                />
              </Tooltip>}

            </div>


            <br />
            <div className='primary-text flex-center'>
              <BadgeCard
                badgeId={badgeId}
                collectionId={collectionId}
                size={75}
              />
              {/* <BadgeCard
                badgeId={badgeId + 1n}
                collectionId={collectionId}
                size={75}
              /> */}
            </div>
            {populateComponent('all')}
          </div>

          }
          {!isAddressMappingSelect && isCollectionSelect && <>
            <div className='flex-center'>
              <Tooltip color='black' title='Populate the metadata of other badges with this metadata.'>
                <Avatar
                  className='styled-button'
                  src={<FontAwesomeIcon
                    icon={populateIsOpen && fieldName === 'all'
                      ? faMinus : faReplyAll}
                  />}
                  style={{ cursor: 'pointer', marginLeft: 8, transform: 'scaleX(-1)' }}
                  onClick={() => {
                    setPopulateIsOpen(!populateIsOpen);
                    setFieldName('all');
                  }}
                />
              </Tooltip>
            </div>
            {populateComponent('all')}
          </>}
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
            <div className='flex-between'>
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
                className='primary-text primary-blue-bg'
              />
              {!isAddressMappingSelect && <Tooltip color='black' title='Populate the metadata of other badges with this title.'>
                <Avatar
                  className='styled-button'
                  src={<FontAwesomeIcon
                    icon={populateIsOpen && fieldName === 'name'
                      ? faMinus : faReplyAll}
                  />}
                  style={{ cursor: 'pointer', marginLeft: 8, transform: 'scaleX(-1)' }}
                  onClick={() => {
                    setPopulateIsOpen(!populateIsOpen);
                    setFieldName('name');
                  }}
                />
              </Tooltip>}
            </div>
            {populateComponent('name')}
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
            <div className='flex-between'>
              <Select
                className="selector primary-text primary-blue-bg"
                value={images.find((item: any) => item.value === currMetadata.image)?.label}
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
                        height="20px"
                        style={{ paddingRight: 10 }}
                        alt="Label"
                      />
                      <div>{item.label}</div>
                    </div>
                  </Option>
                ))}
              </Select>

              {!isAddressMappingSelect && <Tooltip color='black' title='Populate the metadata of other badges with this image.'>
                <Avatar
                  className='styled-button'
                  src={<FontAwesomeIcon
                    icon={populateIsOpen && fieldName === 'image'
                      ? faMinus : faReplyAll}
                  />}
                  style={{ cursor: 'pointer', marginLeft: 8, transform: 'scaleX(-1)' }}
                  onClick={() => {
                    setPopulateIsOpen(!populateIsOpen);
                    setFieldName('image');
                  }}
                />
              </Tooltip>}
            </div>
            {populateComponent('image')}
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
            <div className='flex-between'>
              <Select
                className="selector primary-text primary-blue-bg"
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
              {!isAddressMappingSelect && <Tooltip color='black' title='Populate the metadata of other badges with this category.'>
                <Avatar
                  className='styled-button'
                  src={<FontAwesomeIcon
                    icon={populateIsOpen && fieldName === 'category'
                      ? faMinus : faReplyAll}
                  />}
                  style={{
                    cursor: 'pointer', marginLeft: 8, transform: 'scaleX(-1)',
                  }}
                  onClick={() => {
                    setPopulateIsOpen(!populateIsOpen);
                    setFieldName('category');
                  }}
                />
              </Tooltip>}

            </div>
            {populateComponent('category')}
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
            <div className='flex-between'>
              <MdEditor
                className='primary-text primary-blue-bg'
                style={{
                  width: '100%',
                  minHeight: '250px',

                }} renderHTML={text => mdParser.render(text)} onChange={handleEditorChange}
                value={currMetadata.description}
              />
              {/* <Input.TextArea
                            value={currMetadata.description}
                            onChange={(e) => {
                                setMetadata({
                                    ...currMetadata,
                                    description: e.target.value
                                });
                            }}
                            style={{
                                backgroundColor: PRIMARY_BLUE,
                                color: PRIMARY_TEXT,
                            }}
                        /> */}
              {!isAddressMappingSelect && <Tooltip color='black' title='Populate the metadata of other badges with this description.'>
                <Avatar
                  className='styled-button'
                  src={<FontAwesomeIcon
                    icon={populateIsOpen && fieldName === 'description'
                      ? faMinus : faReplyAll}
                  />}
                  style={{ cursor: 'pointer', marginLeft: 8, transform: 'scaleX(-1)' }}
                  onClick={() => {
                    setPopulateIsOpen(!populateIsOpen);
                    setFieldName('description');
                  }}
                />
              </Tooltip>}
            </div>
            {populateComponent('description')}
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
            <div className='flex-between'>
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
                className='primary-text primary-blue-bg'
              />
              {!isAddressMappingSelect && <Tooltip color='black' title='Populate the metadata of other badges with this website.'>
                <Avatar
                  className='styled-button'
                  src={<FontAwesomeIcon
                    icon={populateIsOpen && fieldName === 'externalUrl'
                      ? faMinus : faReplyAll}
                  />}
                  style={{ cursor: 'pointer', marginLeft: 8, transform: 'scaleX(-1)' }}
                  onClick={() => {
                    setPopulateIsOpen(!populateIsOpen);
                    setFieldName('externalUrl');
                  }}
                />
              </Tooltip>}

            </div>
            <div style={{ fontSize: 12 }}>
              <Text style={{ color: 'lightgray' }}>
                {toBeFrozen && '*Note that you have selected for this metadata to be frozen and uneditable. Please enter a website URL that is permanent and will not change in the future.'}
              </Text>
            </div>
            {populateComponent('externalUrl')}
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
            <div className='flex-between'>
              <div className='primary-text primary-blue-bg full-width'>
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
              {!isAddressMappingSelect && <Tooltip color='black' title='Populate the metadata of other badges with this expiration date.'>
                <Avatar
                  className='styled-button'
                  src={<FontAwesomeIcon
                    icon={populateIsOpen && fieldName === 'validFrom'
                      ? faMinus : faReplyAll}
                  />}
                  style={{ cursor: 'pointer', marginLeft: 8, transform: 'scaleX(-1)' }}
                  onClick={() => {
                    setPopulateIsOpen(!populateIsOpen);
                    setFieldName('validFrom');
                  }}
                />
              </Tooltip>}

            </div>
            {populateComponent('validFrom')}
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
            <div className='flex-between'>
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
                className='primary-text primary-blue-bg'
              />
              {!isAddressMappingSelect && <Tooltip color='black' title='Populate the metadata of other badges with these tags.'>
                <Avatar
                  className='styled-button'
                  src={<FontAwesomeIcon
                    icon={populateIsOpen && fieldName === 'tags'
                      ? faMinus : faReplyAll}
                  />}
                  style={{ cursor: 'pointer', marginLeft: 8, transform: 'scaleX(-1)' }}
                  onClick={() => {
                    setPopulateIsOpen(!populateIsOpen);
                    setFieldName('tags');
                  }}
                />
              </Tooltip>}

            </div>
            <div style={{ fontSize: 12 }}>
              <Text style={{ color: 'lightgray' }}>
                *Separate with a comma.
              </Text>
            </div>
            <div style={{ display: 'flex', marginTop: 4 }}>
              {currMetadata.tags?.map((tag: any, idx: number) => {
                if (tag === '') return;
                return <Tag key={tag + idx} style={{ backgroundColor: 'transparent', borderColor: 'white', color: 'white' }}>
                  {tag}
                </Tag>
              })}

            </div>

            {populateComponent('tags')}
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
