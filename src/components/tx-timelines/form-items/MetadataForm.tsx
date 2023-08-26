import { CalendarOutlined, DownOutlined, InfoCircleOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { Avatar, Button, Checkbox, DatePicker, Divider, Form, Input, InputNumber, Select, Space, Tag, Tooltip, Typography, Upload, UploadProps, message } from 'antd';
import { useEffect, useState } from 'react';

import MarkdownIt from 'markdown-it';
import MdEditor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';
import { MetadataUriSelect } from './MetadataUriSelect';
// import style manually
import { faMinus, faReplyAll } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { UintRange } from 'bitbadgesjs-proto';
import { DefaultPlaceholderMetadata, Metadata, MetadataAddMethod, Numberify, getMetadataForBadgeId, setMetadataPropertyForSpecificBadgeIds, updateBadgeMetadata } from 'bitbadgesjs-utils';
import { useCollectionsContext } from '../../../bitbadges-api/contexts/CollectionsContext';
import { INFINITE_LOOP_MODE } from '../../../constants';
import { GO_MAX_UINT_64 } from '../../../utils/dates';
import { BadgeCard } from '../../badges/BadgeCard';
import { UintRangesInput } from '../../badges/balances/IdRangesInput';
import moment from 'moment';

const { Text } = Typography;
const { Option } = Select;

const mdParser = new MarkdownIt(/* Markdown-it options */);
const DELAY_TIME = 300;

//TODO: abstract and clean this

//Do not pass an badgeId if this is for the collection metadata
export function MetadataForm({
  collectionId,
  isCollectionSelect,
  addMethod,
  startId,
  endId,
  toBeFrozen,
  hideCollectionSelect,
  isAddressMappingSelect
}: {
  addMethod: MetadataAddMethod;
  isCollectionSelect?: boolean;
  startId: bigint;
  endId: bigint;
  toBeFrozen?: boolean;
  collectionId: bigint;
  hideCollectionSelect?: boolean;
  isAddressMappingSelect?: boolean
}) {
  const collections = useCollectionsContext();
  const collection = collections.collections[collectionId.toString()]

  const [badgeId, setBadgeId] = useState<bigint>(startId ?? 1n);

  let metadata = (isCollectionSelect ? collection?.cachedCollectionMetadata : getMetadataForBadgeId(badgeId, collection?.cachedBadgeMetadata ?? [])) ?? DefaultPlaceholderMetadata;

  const [currMetadata, setCurrMetadata] = useState<Metadata<bigint>>(metadata);

  // console.log(isAddressMappingSelect);

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
        const newBadgeMetadata = updateBadgeMetadata(collection.cachedBadgeMetadata, { toUpdate: true, metadata, badgeIds: [{ start: badgeId, end: badgeId }] });
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

    const badgeMetadata = collection.cachedBadgeMetadata;
    const newBadgeMetadata = setMetadataPropertyForSpecificBadgeIds(badgeMetadata, badgeIds, key, value);
    collections.updateCollection({
      ...collection,
      cachedBadgeMetadata: newBadgeMetadata,
    })
  }

  const [items, setItems] = useState(['BitBadge', 'Attendance', 'Certification']);
  const [name, setName] = useState('');
  const [validForeverChecked, setValidForeverChecked] = useState((!metadata.validFrom) || (metadata.validFrom && metadata.validFrom.length === 0));
  const [uintRanges, setUintRanges] = useState<UintRange<bigint>[]>([
    {
      start: startId ? startId : 1n,
      end: endId ? endId : GO_MAX_UINT_64
    }
  ]);

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

  return (
    <>
      <div>
        {addMethod === MetadataAddMethod.UploadUrl && <>
          <MetadataUriSelect
            collectionId={collectionId}
            startId={startId}
            endId={endId}
            hideCollectionSelect={hideCollectionSelect}
          />
        </>}

        {addMethod === MetadataAddMethod.Manual && <Form layout="vertical">

          {!isCollectionSelect && badgeId > 0 && !isCollectionSelect && !isAddressMappingSelect && <div>
            <div className='primary-text flex-center' >

              <div><b>Setting Metadata for Badge ID:{' '}</b></div>
              <InputNumber min={Numberify((startId ? startId : 1n).toString())} max={Numberify((endId ? endId : GO_MAX_UINT_64).toString())}
                value={Numberify(badgeId.toString())}
                onChange={(e) => {
                  if (e && e > 0 && setBadgeId) setBadgeId(BigInt(e));
                }}
                style={{
                  marginLeft: 8,
                }}
                className='primary-text primary-blue-bg'
              />
              {!isAddressMappingSelect && <Tooltip color='black' title='Populate the metadata of other badges with the metadata of this badge.'>
                <Avatar
                  className='screen-button'
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
            </div>
            <div>
              {populateIsOpen && fieldName === 'all' && <div style={{ marginTop: 8 }} className='primary-text'>
                <br />
                <h3 className='primary-text' style={{ textAlign: 'center' }}>Set other badges to have the metadata of this badge?</h3>
                <br />
                <UintRangesInput
                  minimum={startId ? startId : 1n}
                  maximum={endId ? endId : GO_MAX_UINT_64}
                  setUintRanges={setUintRanges}
                  collectionId={collectionId}
                />

                <Divider />
                {isCollectionSelect && !isAddressMappingSelect && <div className='secondary-text' style={{ textAlign: 'center' }}>
                  <InfoCircleOutlined style={{ marginRight: 4 }} /> The updated badge metadata will be visible on the next step.
                  <br />
                  <br />
                </div>}
                <Button type='primary'
                  className='full-width'
                  onClick={() => {
                    populateOtherBadges(uintRanges, fieldName, '');
                    setPopulateIsOpen(false);
                  }}
                > Update </Button>
                <Divider />
                <hr />
              </div>}
            </div>


          </div>

          }
          {!isAddressMappingSelect && isCollectionSelect && <>
            <div className='flex-center'>
              <Tooltip color='black' title='Populate the metadata of other badges with this metadata.'>
                <Avatar
                  className='screen-button'
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
            <div>
              {populateIsOpen && fieldName === 'all' && <div style={{ marginTop: 8 }} className='primary-text'>
                <br />
                <h3 className='primary-text' style={{ textAlign: 'center' }}>Set other badges to have this metadata?</h3>
                <br />
                <UintRangesInput
                  minimum={startId ? startId : 1n}
                  maximum={endId ? endId : GO_MAX_UINT_64}
                  setUintRanges={setUintRanges}
                  collectionId={collectionId}
                />

                <Divider />
                {<div className='secondary-text' style={{ textAlign: 'center' }}>
                  <InfoCircleOutlined style={{ marginRight: 4 }} /> The updated badge metadata will be visible on the next step.
                  <br />
                  <br />
                </div>}
                <Button type='primary'
                  className='full-width'
                  onClick={() => {
                    populateOtherBadges(uintRanges, fieldName, '');
                    setPopulateIsOpen(false);
                  }}
                > Update </Button>
                <Divider />
                <hr />
              </div>}
            </div>
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
                  className='screen-button'
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
            {populateIsOpen && fieldName === 'name' && <div style={{ marginTop: 8 }} className='primary-text'>
              <br />
              <h3 className='primary-text' style={{ textAlign: 'center' }}>Set other badges to have this title?</h3>
              <br />
              <UintRangesInput
                minimum={startId ? startId : 1n}
                maximum={endId ? endId : GO_MAX_UINT_64}
                setUintRanges={setUintRanges}
                collectionId={collectionId}
              />

              <Divider />
              {isCollectionSelect && !isAddressMappingSelect && <div className='secondary-text' style={{ textAlign: 'center' }}>
                <InfoCircleOutlined style={{ marginRight: 4 }} /> The updated badge metadata will be visible on the next step.
                <br />
                <br />
              </div>}
              <Button type='primary'
                className='full-width'
                onClick={() => {
                  populateOtherBadges(uintRanges, fieldName, currMetadata[fieldName]);
                  setPopulateIsOpen(false);
                }}
              > Update </Button>
              <Divider />
              <hr />
            </div>}
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
                  className='screen-button'
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
            {populateIsOpen && fieldName === 'image' && <div style={{ marginTop: 8 }} className='primary-text'>
              <br />
              <h3 className='primary-text' style={{ textAlign: 'center' }}>Set other badges to have this image?</h3>
              <br />
              <UintRangesInput
                minimum={startId ? startId : 1n}
                maximum={endId ? endId : GO_MAX_UINT_64}
                setUintRanges={setUintRanges}
                collectionId={collectionId}
              />

              <Divider />
              {isCollectionSelect && !isAddressMappingSelect && <div className='secondary-text' style={{ textAlign: 'center' }}>
                <InfoCircleOutlined style={{ marginRight: 4 }} /> The updated badge metadata will be visible on the next step.
                <br />
                <br />
              </div>}
              <Button type='primary'
                className='full-width'
                onClick={() => {
                  populateOtherBadges(uintRanges, fieldName, currMetadata[fieldName]);
                  setPopulateIsOpen(false);
                }}
              > Update </Button>
              <Divider />
              <hr />
            </div>}
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
                  className='screen-button'
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
            {populateIsOpen && fieldName === 'category' && <div style={{ marginTop: 8 }} className='primary-text'>
              <br />
              <h3 className='primary-text' style={{ textAlign: 'center' }}>Set other badges to have this category?</h3>
              <br />
              <UintRangesInput
                minimum={startId ? startId : 1n}
                maximum={endId ? endId : GO_MAX_UINT_64}
                setUintRanges={setUintRanges}
                collectionId={collectionId}
              />

              <Divider />
              {isCollectionSelect && !isAddressMappingSelect && <div className='secondary-text' style={{ textAlign: 'center' }}>
                <InfoCircleOutlined style={{ marginRight: 4 }} /> The updated badge metadata will be visible on the next step.
                <br />
                <br />
              </div>}
              <Button type='primary'
                className='full-width'
                onClick={() => {
                  populateOtherBadges(uintRanges, fieldName, currMetadata[fieldName]);
                  setPopulateIsOpen(false);
                }}
              > Update </Button>
              <Divider />
              <hr />
            </div>}
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
                  className='screen-button'
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
            {populateIsOpen && fieldName === 'description' && <div style={{ marginTop: 8 }} className='primary-text'>
              <br />
              <h3 className='primary-text' style={{ textAlign: 'center' }}>Set other badges to have this description?</h3>
              <br />
              <UintRangesInput
                minimum={startId ? startId : 1n}
                maximum={endId ? endId : GO_MAX_UINT_64}
                setUintRanges={setUintRanges}
                collectionId={collectionId}
              />

              <Divider />
              {isCollectionSelect && !isAddressMappingSelect && <div className='secondary-text' style={{ textAlign: 'center' }}>
                <InfoCircleOutlined style={{ marginRight: 4 }} /> The updated badge metadata will be visible on the next step.
                <br />
                <br />
              </div>}
              <Button type='primary'
                className='full-width'
                onClick={() => {
                  populateOtherBadges(uintRanges, fieldName, currMetadata[fieldName]);
                  setPopulateIsOpen(false);
                }}
              > Update </Button>
              <Divider />
              <hr />
            </div>}
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
                  className='screen-button'
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
            {populateIsOpen && fieldName === 'externalUrl' && <div style={{ marginTop: 8 }} className='primary-text'>
              <br />
              <h3 className='primary-text' style={{ textAlign: 'center' }}>Set other badges to have this website?</h3>
              <br />
              <UintRangesInput
                minimum={startId ? startId : 1n}
                maximum={endId ? endId : GO_MAX_UINT_64}
                setUintRanges={setUintRanges}
                collectionId={collectionId}
              />

              <Divider />
              {isCollectionSelect && !isAddressMappingSelect && <div className='secondary-text' style={{ textAlign: 'center' }}>
                <InfoCircleOutlined style={{ marginRight: 4 }} /> The updated badge metadata will be visible on the next step.
                <br />
                <br />
              </div>}
              <Button type='primary'
                className='full-width'
                onClick={() => {
                  populateOtherBadges(uintRanges, fieldName, currMetadata[fieldName]);
                  setPopulateIsOpen(false);
                }}
              > Update </Button>
              <Divider />
              <hr />
            </div>}
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
                {!validForeverChecked && <>
                  <DatePicker
                    allowClear={false}

                    showTime
                    showMinute
                    placeholder='Default: None'
                    value={currMetadata.validFrom && currMetadata.validFrom.length > 0 ? moment(new Date(Number(currMetadata.validFrom[0].start))) : undefined}
                    className='primary-text primary-blue-bg full-width'
                    suffixIcon={
                      <CalendarOutlined
                        className='primary-text'
                      />
                    }
                    onChange={(_date, dateString) => {
                      console.log(dateString);
                      console.log(new Date(dateString))
                      setMetadata({
                        ...currMetadata,
                        validFrom: [{

                          start: BigInt(new Date(dateString).valueOf()),
                          end: currMetadata.validFrom && currMetadata.validFrom.length > 0 ? currMetadata.validFrom[0].end : GO_MAX_UINT_64,
                        }]
                      });
                    }}
                  />
                  <br />
                  <br />
                  <DatePicker
                    allowClear={false}
                    showTime
                    showMinute
                    placeholder='Default: No Expiration Date'
                    value={currMetadata.validFrom && currMetadata.validFrom.length > 0 ? moment(new Date(Number(currMetadata.validFrom[0].end))) : undefined}
                    className='primary-text primary-blue-bg full-width'
                    suffixIcon={
                      <CalendarOutlined
                        className='primary-text'
                      />
                    }
                    onChange={(_date, dateString) => {
                      console.log(dateString);
                      console.log(new Date(dateString))
                      setMetadata({
                        ...currMetadata,
                        validFrom: [{
                          start: currMetadata.validFrom && currMetadata.validFrom.length > 0 ? currMetadata.validFrom[0].start : BigInt(Date.now()),
                          end: BigInt(new Date(dateString).valueOf()),
                        }]
                      });
                    }}
                  />
                </>
                }
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

              </div>
              {!isAddressMappingSelect && <Tooltip color='black' title='Populate the metadata of other badges with this expiration date.'>
                <Avatar
                  className='screen-button'
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
            {populateIsOpen && fieldName === 'validFrom' && <div style={{ marginTop: 8 }} className='primary-text'>
              <br />
              <h3 className='primary-text' style={{ textAlign: 'center' }}>Set other badges to have this expiration date?</h3>
              <br />
              <UintRangesInput
                minimum={startId ? startId : 1n}
                maximum={endId ? endId : GO_MAX_UINT_64}
                setUintRanges={setUintRanges}
                collectionId={collectionId}
              />

              <Divider />
              {isCollectionSelect && !isAddressMappingSelect && <div className='secondary-text' style={{ textAlign: 'center' }}>
                <InfoCircleOutlined style={{ marginRight: 4 }} /> The updated badge metadata will be visible on the next step.
                <br />
                <br />
              </div>}
              <Button type='primary'
                className='full-width'
                onClick={() => {
                  populateOtherBadges(uintRanges, fieldName, currMetadata[fieldName]);
                  setPopulateIsOpen(false);
                }}
              > Update </Button>
              <Divider />
              <hr />
            </div>}
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
                  className='screen-button'
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

            {populateIsOpen && fieldName === 'tags' && <div style={{ marginTop: 8 }} className='primary-text'>
              <br />
              <h3 className='primary-text' style={{ textAlign: 'center' }}>Set other badges to have these tags?</h3>
              <br />
              <UintRangesInput
                minimum={startId ? startId : 1n}
                maximum={endId ? endId : GO_MAX_UINT_64}
                setUintRanges={setUintRanges}
                collectionId={collectionId}
              />

              <Divider />
              {isCollectionSelect && !isAddressMappingSelect && <div className='secondary-text' style={{ textAlign: 'center' }}>
                <InfoCircleOutlined style={{ marginRight: 4 }} /> The updated badge metadata will be visible on the next step.
                <br />
                <br />
              </div>}
              <Button type='primary'
                className='full-width'
                onClick={() => {
                  populateOtherBadges(uintRanges, fieldName, currMetadata[fieldName]);
                  setPopulateIsOpen(false);
                }}
              > Update </Button>
              <Divider />
              <hr />
            </div>}
          </Form.Item>
          {/* <Form.Item
            label={
              <Text
                className='primary-text'
                strong
              >
                Border Color <Tooltip color='black' title={'Add a colored border around the image!'}>
                  <InfoCircleOutlined />
                </Tooltip>
              </Text>
            }
          >
            <div className='flex-between'>
              <Select
                className="selector primary-text primary-blue-bg"
                defaultValue={currMetadata.color}
                onSelect={(e: any) => {
                  setMetadata({
                    ...currMetadata,
                    color: e
                  });
                }}
                style={{
                }}
                suffixIcon={
                  <DownOutlined
                    className='primary-text'
                  />
                }
              >
                <Select.Option value={undefined}>
                  None
                </Select.Option>
                <Select.Option value="black">
                  <span style={{ color: 'black' }}>
                    ⬤
                  </span>{' '}
                  Black
                </Select.Option>
                <Select.Option value="red">
                  <span style={{ color: 'red' }}>⬤</span>{' '}
                  Red
                </Select.Option>
                <Select.Option value="blue">
                  <span style={{ color: 'blue' }}>⬤</span>{' '}
                  Blue
                </Select.Option>
                <Select.Option value="green">
                  <span style={{ color: 'green' }}>
                    ⬤
                  </span>{' '}
                  Green
                </Select.Option>
                <Select.Option value="orange">
                  <span style={{ color: 'orange' }}>
                    ⬤
                  </span>{' '}
                  Orange
                </Select.Option>
                <Select.Option value="yellow">
                  <span style={{ color: 'yellow' }}>
                    ⬤
                  </span>{' '}
                  Yellow
                </Select.Option>
                <Select.Option value="purple">
                  <span style={{ color: 'purple' }}>
                    ⬤
                  </span>{' '}
                  Purple
                </Select.Option>
                <Select.Option value="pink">
                  <span style={{ color: 'pink' }}>⬤</span>{' '}
                  Pink
                </Select.Option>
                <Select.Option value="brown">
                  <span style={{ color: 'brown' }}>
                    ⬤
                  </span>{' '}
                  Brown
                </Select.Option>
              </Select>
              {!isAddressMappingSelect && <Tooltip color='black' title='Populate the metadata of other badges with this border color.'>
                <Avatar
                  className='screen-button'
                  src={<FontAwesomeIcon
                    icon={populateIsOpen && fieldName === 'color'
                      ? faMinus : faReplyAll}
                  />}
                  style={{ cursor: 'pointer', marginLeft: 8, transform: 'scaleX(-1)' }}
                  onClick={() => {
                    setPopulateIsOpen(!populateIsOpen);
                    setFieldName('color');
                  }}
                />
              </Tooltip>}

            </div>
            {populateIsOpen && fieldName === 'color' && <div style={{ marginTop: 8 }} className='primary-text'>
              <br />
              <h3 className='primary-text' style={{ textAlign: 'center' }}>Set other badges to have this color?</h3>
              <br />
              <UintRangesInput
                minimum={startId ? startId : 1n}
                maximum={endId ? endId : GO_MAX_UINT_64}
                setUintRanges={setUintRanges}
                collectionId={collectionId}
              />

              <Divider />
              {isCollectionSelect && !isAddressMappingSelect && <div className='secondary-text' style={{ textAlign: 'center' }}>
                  <InfoCircleOutlined style={{ marginRight: 4 }} /> The updated badge metadata will be visible on the next step.
                  <br />
                  <br />
                </div>}
              <Button type='primary'
                className='full-width'
                onClick={() => {
                  populateOtherBadges(uintRanges, fieldName, currMetadata[fieldName]);
                  setPopulateIsOpen(false);
                }}
              > Update </Button>
              <Divider />
              <hr />
            </div>}
          </Form.Item> */}


        </Form>}
      </div >
    </>
  );
};
