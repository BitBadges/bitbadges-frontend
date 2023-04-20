import { CalendarOutlined, DownOutlined, InfoCircleOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { Avatar, Button, Checkbox, DatePicker, Divider, Form, Input, InputNumber, Select, Space, Tag, Tooltip, Typography, Upload, UploadProps, message } from 'antd';
import { useEffect, useState } from 'react';

import { MessageMsgNewCollection } from 'bitbadgesjs-transactions';
import MarkdownIt from 'markdown-it';
import MdEditor from 'react-markdown-editor-lite';
import { BadgeMetadata, BitBadgeCollection, IdRange, MetadataAddMethod, DefaultPlaceholderMetadata, GO_MAX_UINT_64, MAX_DATE_TIMESTAMP, } from 'bitbadgesjs-utils';
import { PRIMARY_BLUE, PRIMARY_TEXT, SECONDARY_TEXT } from '../../../constants';
import { MetadataUriSelect } from './MetadataUriSelect';
// import style manually
import { faMinus, faReplyAll } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import moment from 'moment';
import 'react-markdown-editor-lite/lib/index.css';
import { getIdRangesForAllBadgeIdsInCollection } from 'bitbadgesjs-utils';
import { BadgeAvatar } from '../../badges/BadgeAvatar';
import { IdRangesInput } from '../../balances/IdRangesInput';

const { Text } = Typography;
const { Option } = Select;

const mdParser = new MarkdownIt(/* Markdown-it options */);
const DELAY_TIME = 300;

//TODO: abstract and clean this

//Do not pass an id if this is for the collection metadata
export function MetadataForm({
    metadata,
    setMetadata,
    addMethod,
    hideCollectionSelect,

    id,
    setId,
    newCollectionMsg,
    setNewCollectionMsg,
    populateOtherBadges,
    startId,
    endId,
    toBeFrozen,
    collection,
    updateMetadataForBadgeIdsDirectlyFromUriIfAbsent
}: {
    newCollectionMsg: MessageMsgNewCollection;
    setNewCollectionMsg: (badge: MessageMsgNewCollection) => void;
    metadata: BadgeMetadata;
    setMetadata: (metadata: BadgeMetadata) => void;
    id?: number;
    setId?: (id: number) => void;
    addMethod: MetadataAddMethod;
    populateOtherBadges: (badgeIds: IdRange[], key: string, value: any, metadataToSet?: BadgeMetadata) => void;
    startId: number;
    endId: number;
    toBeFrozen?: boolean;
    collection: BitBadgeCollection;
    updateMetadataForBadgeIdsDirectlyFromUriIfAbsent?: (badgeIds: number[]) => void
    hideCollectionSelect?: boolean;
}) {
    const [items, setItems] = useState(['BitBadge', 'Attendance', 'Certification']);
    const [name, setName] = useState('');
    const [validForeverChecked, setValidForeverChecked] = useState(metadata.validFrom?.end === MAX_DATE_TIMESTAMP);
    const [idRanges, setIdRanges] = useState<IdRange[]>([
        {
            start: startId ? startId : 1,
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
        metadata.image && !sampleImages.find(x => x.value === metadata.image)
            ? {
                value: metadata.image,
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

    const [currentMetadata, setCurrentMetadata] = useState(metadata);
    const [updateParentMetadataFlag, setUpdateParentMetadataFlag] = useState(false);

    const updateCurrentMetadata = (metadata: BadgeMetadata) => {
        console.log("SETTING CURR METADATA", metadata);
        setCurrentMetadata(metadata);
        setUpdateParentMetadataFlag(!updateParentMetadataFlag);
    };

    useEffect(() => {
        setCurrentMetadata(metadata);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

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
                    updateCurrentMetadata({
                        ...currentMetadata,
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
        updateCurrentMetadata({
            ...currentMetadata,
            description: text
        });
        // console.log('handleEditorChange', html, text);
    }



    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            setMetadata(currentMetadata);
        }, DELAY_TIME);

        return () => clearTimeout(delayDebounceFn)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [updateParentMetadataFlag])

    return (
        <>
            <div>
                {addMethod === MetadataAddMethod.UploadUrl && <>
                    <MetadataUriSelect
                        collection={collection}
                        newCollectionMsg={newCollectionMsg}
                        setNewCollectionMsg={(newCollectionMsg: MessageMsgNewCollection, updateCollection: boolean, updateBadges: boolean) => {
                            setNewCollectionMsg(newCollectionMsg);
                            if (updateCollection) setMetadata(JSON.parse(JSON.stringify({ ...DefaultPlaceholderMetadata, image: '' })));
                            if (updateBadges) populateOtherBadges(getIdRangesForAllBadgeIdsInCollection(collection), 'all', '', { ...DefaultPlaceholderMetadata, image: '' });
                        }}
                        startId={startId}
                        endId={endId}
                        updateMetadataForBadgeIdsDirectlyFromUriIfAbsent={updateMetadataForBadgeIdsDirectlyFromUriIfAbsent}
                        hideCollectionSelect={hideCollectionSelect}
                    />
                </>}

                {addMethod === MetadataAddMethod.Manual && <Form layout="vertical">

                    {id && <div>
                        <div style={{ color: PRIMARY_TEXT, display: 'flex', alignItems: 'center', justifyContent: 'center' }} >

                            <div><b>Setting Metadata for Badge ID:{' '}</b></div>
                            <InputNumber min={startId ? startId : 1} max={endId ? endId : GO_MAX_UINT_64}
                                value={id}
                                onChange={(e) => {
                                    if (setId) setId(e)
                                }}
                                style={{
                                    marginLeft: 8,
                                    backgroundColor: PRIMARY_BLUE,
                                    color: PRIMARY_TEXT,
                                }}
                            />
                            <Tooltip title='Populate the metadata of other badges with the metadata of this badge.'>
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
                        <br />
                        <div style={{ color: PRIMARY_TEXT }}>
                            <BadgeAvatar
                                badgeId={id}
                                metadata={currentMetadata}
                                collection={collection}
                                size={75}
                                showId
                            />
                        </div>
                        <div>
                            {populateIsOpen && fieldName === 'all' && <div style={{ marginTop: 8, color: PRIMARY_TEXT }}>
                                <br />
                                <h3 style={{ color: PRIMARY_TEXT, textAlign: 'center' }}>Set other badges to have the metadata of this badge?</h3>
                                <br />
                                <IdRangesInput
                                    darkMode
                                    minimum={startId ? startId : 1}
                                    maximum={endId ? endId : GO_MAX_UINT_64}
                                    setIdRanges={setIdRanges}
                                    verb={'Update'}
                                    collection={collection}
                                />

                                <Divider />
                                {!id && <div style={{ color: SECONDARY_TEXT, textAlign: 'center' }}>
                                    <InfoCircleOutlined style={{ marginRight: 4 }} /> The updated badge metadata will be visible on the next step.
                                    <br />
                                    <br />
                                </div>}
                                <Button type='primary'
                                    style={{ width: '100%' }}
                                    onClick={() => {
                                        populateOtherBadges(idRanges, fieldName, '', currentMetadata);
                                        setPopulateIsOpen(false);
                                    }}
                                > Update </Button>
                                <Divider />
                                <hr />
                            </div>}
                        </div>


                    </div>

                    }
                    <br />
                    <Form.Item
                        label={
                            <Text
                                style={{ color: PRIMARY_TEXT }}
                                strong
                            >
                                Title
                            </Text>
                        }
                        required
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Input
                                value={currentMetadata.name}
                                onChange={(e: any) => {
                                    updateCurrentMetadata({
                                        ...currentMetadata,
                                        name: e.target.value
                                    });
                                }}
                                style={{
                                    backgroundColor: PRIMARY_BLUE,
                                    color: PRIMARY_TEXT,
                                }}
                            />
                            <Tooltip title='Populate the metadata of other badges with this title.'>
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
                            </Tooltip>
                        </div>
                        {populateIsOpen && fieldName === 'name' && <div style={{ marginTop: 8, color: PRIMARY_TEXT }}>
                            <br />
                            <h3 style={{ color: PRIMARY_TEXT, textAlign: 'center' }}>Set other badges to have this title?</h3>
                            <br />
                            <IdRangesInput
                                darkMode
                                minimum={startId ? startId : 1}
                                maximum={endId ? endId : GO_MAX_UINT_64}
                                setIdRanges={setIdRanges}
                                verb={'Update'}
                                collection={collection}
                            />

                            <Divider />
                            {!id && <div style={{ color: SECONDARY_TEXT, textAlign: 'center' }}>
                                <InfoCircleOutlined style={{ marginRight: 4 }} /> The updated badge metadata will be visible on the next step.
                                <br />
                                <br />
                            </div>}
                            <Button type='primary'
                                style={{ width: '100%' }}
                                onClick={() => {
                                    populateOtherBadges(idRanges, fieldName, currentMetadata[fieldName]);
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
                                style={{ color: PRIMARY_TEXT }}
                                strong
                            >
                                Image
                            </Text>
                        }
                        required
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Select
                                className="selector"
                                value={images.find((item: any) => item.value === currentMetadata.image)?.label}
                                onChange={(e) => {
                                    const newImage = images.find((item: any) => e === item.label)?.value;
                                    if (newImage) {
                                        updateCurrentMetadata({
                                            ...currentMetadata,
                                            image: newImage
                                        });
                                    }
                                }}
                                style={{
                                    backgroundColor: PRIMARY_BLUE,
                                    color: PRIMARY_TEXT,
                                }}
                                suffixIcon={
                                    <DownOutlined
                                        style={{ color: PRIMARY_TEXT }}
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

                            <Tooltip title='Populate the metadata of other badges with this image.'>
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
                            </Tooltip>
                        </div>
                        {populateIsOpen && fieldName === 'image' && <div style={{ marginTop: 8, color: PRIMARY_TEXT }}>
                            <br />
                            <h3 style={{ color: PRIMARY_TEXT, textAlign: 'center' }}>Set other badges to have this image?</h3>
                            <br />
                            <IdRangesInput
                                darkMode
                                minimum={startId ? startId : 1}
                                maximum={endId ? endId : GO_MAX_UINT_64}
                                setIdRanges={setIdRanges}
                                verb={'Update'}
                                collection={collection}
                            />

                            <Divider />
                            <Button type='primary'
                                style={{ width: '100%' }}
                                onClick={() => {
                                    populateOtherBadges(idRanges, fieldName, currentMetadata[fieldName]);
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
                                style={{ color: PRIMARY_TEXT }}
                                strong
                            >
                                Category
                            </Text>
                        }
                    // required={type === 0}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Select
                                className="selector"
                                value={currentMetadata.category}
                                placeholder="Default: None"
                                onChange={(e: any) => {
                                    updateCurrentMetadata({
                                        ...currentMetadata,
                                        category: e
                                    });

                                }}
                                style={{
                                    backgroundColor: PRIMARY_BLUE,
                                    color: PRIMARY_TEXT,
                                }}
                                suffixIcon={
                                    <DownOutlined
                                        style={{ color: PRIMARY_TEXT }}
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
                            <Tooltip title='Populate the metadata of other badges with this category.'>
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
                            </Tooltip>

                        </div>
                        {populateIsOpen && fieldName === 'category' && <div style={{ marginTop: 8, color: PRIMARY_TEXT }}>
                            <br />
                            <h3 style={{ color: PRIMARY_TEXT, textAlign: 'center' }}>Set other badges to have this category?</h3>
                            <br />
                            <IdRangesInput
                                darkMode
                                minimum={startId ? startId : 1}
                                maximum={endId ? endId : GO_MAX_UINT_64}
                                setIdRanges={setIdRanges}
                                verb={'Update'}
                                collection={collection}
                            />

                            <Divider />
                            <Button type='primary'
                                style={{ width: '100%' }}
                                onClick={() => {
                                    populateOtherBadges(idRanges, fieldName, currentMetadata[fieldName]);
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
                                style={{ color: PRIMARY_TEXT }}
                                strong
                            >
                                Description
                            </Text>
                        }
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <MdEditor style={{
                                width: '100%',
                                minHeight: '250px',
                                backgroundColor: PRIMARY_BLUE,
                                color: PRIMARY_TEXT
                            }} renderHTML={text => mdParser.render(text)} onChange={handleEditorChange}
                                value={currentMetadata.description}
                            />
                            {/* <Input.TextArea
                            value={currentMetadata.description}
                            onChange={(e) => {
                                setMetadata({
                                    ...currentMetadata,
                                    description: e.target.value
                                });
                            }}
                            style={{
                                backgroundColor: PRIMARY_BLUE,
                                color: PRIMARY_TEXT,
                            }}
                        /> */}
                            <Tooltip title='Populate the metadata of other badges with this description.'>
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
                            </Tooltip>
                        </div>
                        {populateIsOpen && fieldName === 'description' && <div style={{ marginTop: 8, color: PRIMARY_TEXT }}>
                            <br />
                            <h3 style={{ color: PRIMARY_TEXT, textAlign: 'center' }}>Set other badges to have this description?</h3>
                            <br />
                            <IdRangesInput
                                darkMode
                                minimum={startId ? startId : 1}
                                maximum={endId ? endId : GO_MAX_UINT_64}
                                setIdRanges={setIdRanges}
                                verb={'Update'}
                                collection={collection}
                            />

                            <Divider />
                            <Button type='primary'
                                style={{ width: '100%' }}
                                onClick={() => {
                                    populateOtherBadges(idRanges, fieldName, currentMetadata[fieldName]);
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
                                style={{ color: PRIMARY_TEXT }}
                                strong
                            >
                                Website <Tooltip title={'Provide a website link for users to learn more about this collection.'}>
                                    <InfoCircleOutlined />
                                </Tooltip>
                            </Text>
                        }
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Input
                                value={currentMetadata.externalUrl}
                                onChange={(e) => {
                                    updateCurrentMetadata({
                                        ...currentMetadata,
                                        externalUrl: e.target.value
                                    });
                                }}
                                style={{
                                    backgroundColor: PRIMARY_BLUE,
                                    color: PRIMARY_TEXT,
                                }}
                            />
                            <Tooltip title='Populate the metadata of other badges with this website.'>
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
                            </Tooltip>

                        </div>
                        <div style={{ fontSize: 12 }}>
                            <Text style={{ color: 'lightgray' }}>
                                {toBeFrozen && '*Note that you have selected for this metadata to be frozen and uneditable. Please enter a website URL that is permanent and will not change in the future.'}
                            </Text>
                        </div>
                        {populateIsOpen && fieldName === 'externalUrl' && <div style={{ marginTop: 8, color: PRIMARY_TEXT }}>
                            <br />
                            <h3 style={{ color: PRIMARY_TEXT, textAlign: 'center' }}>Set other badges to have this website?</h3>
                            <br />
                            <IdRangesInput
                                darkMode
                                minimum={startId ? startId : 1}
                                maximum={endId ? endId : GO_MAX_UINT_64}
                                setIdRanges={setIdRanges}
                                verb={'Update'}
                                collection={collection}
                            />

                            <Divider />
                            <Button type='primary'
                                style={{ width: '100%' }}
                                onClick={() => {
                                    populateOtherBadges(idRanges, fieldName, currentMetadata[fieldName]);
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
                                style={{ color: PRIMARY_TEXT }}
                                strong
                            >
                                Expiration Date <Tooltip title={'How long will badges in this collection be valid? Note this has no on-chain significance and is only informational.'}>
                                    <InfoCircleOutlined />
                                </Tooltip>
                            </Text>
                        }
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>

                            <div style={{
                                width: '100%',
                                backgroundColor: PRIMARY_BLUE,
                                color: PRIMARY_TEXT,
                            }}>
                                {!validForeverChecked &&
                                    <DatePicker
                                        placeholder='Default: No Expiration Date'
                                        value={currentMetadata.validFrom ? moment(new Date(currentMetadata.validFrom.end * 1000)) : undefined}
                                        style={{
                                            width: '100%',
                                            backgroundColor: PRIMARY_BLUE,
                                            color: PRIMARY_TEXT,
                                        }}
                                        suffixIcon={
                                            <CalendarOutlined
                                                style={{
                                                    color: PRIMARY_TEXT,
                                                }}
                                            />
                                        }
                                        onChange={(_date, dateString) => {
                                            updateCurrentMetadata({
                                                ...currentMetadata,
                                                validFrom: {
                                                    start: Date.now() / 1000,
                                                    end: new Date(dateString).valueOf() / 1000,
                                                }
                                            });
                                        }}
                                    />
                                }
                                <div style={{ color: PRIMARY_TEXT }}>
                                    Valid Forever?
                                    <Checkbox
                                        checked={validForeverChecked}
                                        style={{ marginLeft: 5 }}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                updateCurrentMetadata({
                                                    ...currentMetadata,
                                                    validFrom: {
                                                        start: Date.now() / 1000,
                                                        end: MAX_DATE_TIMESTAMP
                                                    }
                                                });
                                            } else {
                                                updateCurrentMetadata({
                                                    ...currentMetadata,
                                                    validFrom: {
                                                        start: Date.now() / 1000,
                                                        end: Date.now() / 1000,
                                                    }
                                                });
                                            }
                                            setValidForeverChecked(e.target.checked);
                                        }}
                                    />

                                </div>

                            </div>
                            <Tooltip title='Populate the metadata of other badges with this expiration date.'>
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
                            </Tooltip>

                        </div>
                        {populateIsOpen && fieldName === 'validFrom' && <div style={{ marginTop: 8, color: PRIMARY_TEXT }}>
                            <br />
                            <h3 style={{ color: PRIMARY_TEXT, textAlign: 'center' }}>Set other badges to have this expiration date?</h3>
                            <br />
                            <IdRangesInput
                                darkMode
                                minimum={startId ? startId : 1}
                                maximum={endId ? endId : GO_MAX_UINT_64}
                                setIdRanges={setIdRanges}
                                verb={'Update'}
                                collection={collection}
                            />

                            <Divider />
                            <Button type='primary'
                                style={{ width: '100%' }}
                                onClick={() => {
                                    populateOtherBadges(idRanges, fieldName, currentMetadata[fieldName]);
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
                                style={{ color: PRIMARY_TEXT }}
                                strong
                            >
                                Tags / Keywords <Tooltip title={'Use tags and keywords to further categorize your badge and make it more searchable!'}>
                                    <InfoCircleOutlined />
                                </Tooltip>
                            </Text>
                        }
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Input
                                value={currentMetadata.tags}
                                onChange={(e) => {
                                    updateCurrentMetadata({
                                        ...currentMetadata,
                                        tags: e.target.value.split(','),
                                    })
                                }}
                                style={{
                                    backgroundColor: PRIMARY_BLUE,
                                    color: PRIMARY_TEXT,
                                }}
                            />
                            <Tooltip title='Populate the metadata of other badges with these tags.'>
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
                            </Tooltip>

                        </div>
                        <div style={{ fontSize: 12 }}>
                            <Text style={{ color: 'lightgray' }}>
                                *Separate with a comma.
                            </Text>
                        </div>
                        <div style={{ display: 'flex', marginTop: 4 }}>
                            {currentMetadata.tags?.map((tag: any, idx: number) => {
                                if (tag === '') return;
                                return <Tag key={tag + idx} style={{ backgroundColor: 'transparent', borderColor: 'white', color: 'white' }}>
                                    {tag}
                                </Tag>
                            })}

                        </div>

                        {populateIsOpen && fieldName === 'tags' && <div style={{ marginTop: 8, color: PRIMARY_TEXT }}>
                            <br />
                            <h3 style={{ color: PRIMARY_TEXT, textAlign: 'center' }}>Set other badges to have these tags?</h3>
                            <br />
                            <IdRangesInput
                                darkMode
                                minimum={startId ? startId : 1}
                                maximum={endId ? endId : GO_MAX_UINT_64}
                                setIdRanges={setIdRanges}
                                verb={'Update'}
                                collection={collection}
                            />

                            <Divider />
                            <Button type='primary'
                                style={{ width: '100%' }}
                                onClick={() => {
                                    populateOtherBadges(idRanges, fieldName, currentMetadata[fieldName]);
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
                                style={{ color: PRIMARY_TEXT }}
                                strong
                            >
                                Border Color <Tooltip title={'Add a colored border around the image!'}>
                                    <InfoCircleOutlined />
                                </Tooltip>
                            </Text>
                        }
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Select
                                className="selector"
                                defaultValue={currentMetadata.color}
                                onSelect={(e: any) => {
                                    updateCurrentMetadata({
                                        ...currentMetadata,
                                        color: e
                                    });
                                }}
                                style={{
                                    backgroundColor: PRIMARY_BLUE,
                                    color: PRIMARY_TEXT,
                                }}
                                suffixIcon={
                                    <DownOutlined
                                        style={{ color: PRIMARY_TEXT }}
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
                            <Tooltip title='Populate the metadata of other badges with this border color.'>
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
                            </Tooltip>

                        </div>
                        {populateIsOpen && fieldName === 'color' && <div style={{ marginTop: 8, color: PRIMARY_TEXT }}>
                            <br />
                            <h3 style={{ color: PRIMARY_TEXT, textAlign: 'center' }}>Set other badges to have this color?</h3>
                            <br />
                            <IdRangesInput
                                darkMode
                                minimum={startId ? startId : 1}
                                maximum={endId ? endId : GO_MAX_UINT_64}
                                setIdRanges={setIdRanges}
                                verb={'Update'}
                                collection={collection}
                            />

                            <Divider />
                            <Button type='primary'
                                style={{ width: '100%' }}
                                onClick={() => {
                                    populateOtherBadges(idRanges, fieldName, currentMetadata[fieldName]);
                                    setPopulateIsOpen(false);
                                }}
                            > Update </Button>
                            <Divider />
                            <hr />
                        </div>}
                    </Form.Item>


                </Form>}
            </div >
        </>
    );
};
