import { CalendarOutlined, DownOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, DatePicker, Divider, Form, Input, Select, Space, Typography, Upload, UploadProps, message } from 'antd';
import { useEffect, useState } from 'react';

import { MessageMsgNewCollection } from 'bitbadgesjs-transactions';
import MarkdownIt from 'markdown-it';
import MdEditor from 'react-markdown-editor-lite';
import { BadgeMetadata, MetadataAddMethod } from '../../../bitbadges-api/types';
import { GO_MAX_UINT_64, PRIMARY_BLUE, PRIMARY_TEXT } from '../../../constants';
import { MetadataUriSelect } from './MetadataUriSelect';
// import style manually
import 'react-markdown-editor-lite/lib/index.css';
import { getFullBadgeIdRanges } from '../../../bitbadges-api/badges';

const { Text } = Typography;
const { Option } = Select;

const mdParser = new MarkdownIt(/* Markdown-it options */);
const DELAY_TIME = 450;

//Do not pass an id if this is for the collection metadata
export function MetadataForm({
    metadata,
    setMetadata,
    addMethod,

    id,
    newCollectionMsg,
    setNewCollectionMsg,
    populateAllWithCollectionMetadata,
    populateAllWithCurrentMetadata,
}: {
    newCollectionMsg: MessageMsgNewCollection;
    setNewCollectionMsg: (badge: MessageMsgNewCollection) => void;
    metadata: BadgeMetadata;
    setMetadata: (metadata: BadgeMetadata) => void;
    id?: number;
    addMethod: MetadataAddMethod;
    populateAllWithCollectionMetadata?: () => BadgeMetadata;
    populateAllWithCurrentMetadata?: () => void;
}) {
    const [items, setItems] = useState(['BitBadge', 'Attendance', 'Certification']);
    const [name, setName] = useState('');
    const [images, setImages] = useState([
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
    ]);

    const addItem = (e: any) => {
        e.preventDefault();
        setItems([...items, name]);
        setName('');
    };

    const onNameChange = (event: any) => {
        setName(event.target.value);
    };

    const [currentMetadata, setCurrentMetadata] = useState(metadata);

    useEffect(() => {
        setCurrentMetadata(metadata);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);


    const props: UploadProps = {
        showUploadList: false,
        name: 'file',
        // action: 'https://www.mocky.io/v2/5cc8019d300000980a055e76',
        headers: {
            authorization: 'authorization-text',
        },

        onChange(info) {
            if (info.file.status !== 'uploading') {
                console.log(info.file, info.fileList);
            }
            console.log(info.file);

            if (info.file.status === 'done') {
                message.success(`${info.file.name} file uploaded successfully. ${JSON.stringify(info.file.url)}`);
                //TODO: this is async should we await
                file2Base64(info.file.originFileObj as File).then((base64) => {
                    console.log(base64);
                    setImages([
                        ...images,
                        {
                            value: base64,
                            label: info.file.url ? info.file.url : info.file.name,
                        },
                    ]);
                    setMetadata({
                        ...currentMetadata,
                        image: base64
                    });
                })
            } else if (info.file.status === 'error') {
                message.error(`${info.file.name} file upload failed. ${JSON.stringify(info.file)}}`);
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

    function handleEditorChange({ html, text }: any) {
        setCurrentMetadata({
            ...currentMetadata,
            description: text
        });
        console.log('handleEditorChange', html, text);
    }



    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            setMetadata({
                ...currentMetadata,
            });
        }, DELAY_TIME)
        console.log(delayDebounceFn);

        return () => clearTimeout(delayDebounceFn)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentMetadata])

    return (
        <>
            <div>
                {addMethod === MetadataAddMethod.UploadUrl && <>
                    <MetadataUriSelect setUri={(collectionUri: string, badgeUri: string) => {
                        setNewCollectionMsg({
                            ...newCollectionMsg,
                            collectionUri,
                            badgeUris: [{
                                uri: badgeUri,
                                badgeIds: {
                                    start: 1,
                                    end: GO_MAX_UINT_64
                                }
                            }],
                        });
                    }} />
                </>}

                {addMethod === MetadataAddMethod.Manual && <Form layout="vertical">

                    <br />
                    {id && <>

                        <Form.Item
                            label={
                                <Text

                                    style={{ color: PRIMARY_TEXT }}
                                    strong
                                >
                                    Shortcuts
                                </Text>
                            }
                        >

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Button style={{ backgroundColor: 'transparent', color: PRIMARY_TEXT, width: '48%' }}
                                    onClick={() => {
                                        if (populateAllWithCollectionMetadata) {
                                            const collectionMetadata = populateAllWithCollectionMetadata();
                                            setCurrentMetadata(collectionMetadata);
                                        }
                                        // let newMetadata: BadgeMetadataMap = {

                                        // };
                                        // for (const key of Object.keys(individualBadgeMetadata)) {
                                        //     newMetadata[key] = collectionMetadata;
                                        // }

                                        // setIndividualBadgeMetadata(newMetadata);
                                    }}>Populate All with Collection Metadata</Button>
                                <Button
                                    style={{ backgroundColor: 'transparent', color: PRIMARY_TEXT, width: '48%' }}
                                    onClick={() => {
                                        if (populateAllWithCurrentMetadata) {
                                            populateAllWithCurrentMetadata();
                                        }
                                        // let newMetadata: BadgeMetadataMap = {};
                                        // for (const key of Object.keys(individualBadgeMetadata)) {
                                        //     newMetadata[key] = individualBadgeMetadata[id];
                                        // }

                                        // setIndividualBadgeMetadata(newMetadata);
                                    }}>{`Populate All with Badge ID ${id}'s Metadata`}</Button>
                            </div>
                        </Form.Item>

                        <br />
                        <br />
                    </>}
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
                        <Input
                            value={currentMetadata.name}
                            onChange={(e: any) => {
                                setCurrentMetadata({
                                    ...currentMetadata,
                                    name: e.target.value
                                });
                            }}
                            style={{
                                backgroundColor: PRIMARY_BLUE,
                                color: PRIMARY_TEXT,
                            }}
                        />
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
                        <Select
                            className="selector"
                            value={currentMetadata.image}
                            onChange={(e) => {
                                setCurrentMetadata({
                                    ...currentMetadata,
                                    image: e
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
                                        <Upload {...props}>
                                            <Button icon={<UploadOutlined />}>Click to Upload New Image</Button>
                                        </Upload>
                                    </Space>
                                </>
                            )}
                        >
                            {images.map((item: any) => (
                                <Option
                                    key={item.value}
                                    value={item.value}
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
                        <Select
                            className="selector"
                            value={currentMetadata.category}
                            placeholder="Default: None"
                            onChange={(e: any) => {
                                setCurrentMetadata({
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
                        <MdEditor style={{
                            height: '500px',
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
                    </Form.Item>



                    <Form.Item
                        label={
                            <Text
                                style={{ color: PRIMARY_TEXT }}
                                strong
                            >
                                Color
                            </Text>
                        }
                    >
                        <Select
                            className="selector"
                            defaultValue={currentMetadata.color}
                            onSelect={(e: any) => {
                                setCurrentMetadata({
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
                    </Form.Item>
                    <Form.Item
                        label={
                            <Text
                                style={{ color: PRIMARY_TEXT }}
                                strong
                            >
                                URL
                            </Text>
                        }
                    >
                        <Input
                            value={currentMetadata.externalUrl}
                            onChange={(e) => {
                                setCurrentMetadata({
                                    ...currentMetadata,
                                    externalUrl: e.target.value
                                });
                            }}
                            style={{
                                backgroundColor: PRIMARY_BLUE,
                                color: PRIMARY_TEXT,
                            }}
                        />
                        {/* <div style={{ fontSize: 12 }}>
                            <Text style={{ color: 'lightgray' }}>
                                *Please use a permanent fixed URL that will not change.
                            </Text>
                        </div> */}
                    </Form.Item>
                    <Form.Item
                        label={
                            <Text
                                style={{ color: PRIMARY_TEXT }}
                                strong
                            >
                                Expiration Date
                            </Text>
                        }
                    >
                        <DatePicker
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
                                setCurrentMetadata({
                                    ...currentMetadata,
                                    validFrom: {
                                        start: Date.now() / 1000,
                                        end: new Date(dateString).valueOf() / 1000,
                                    }
                                });
                            }}
                        />
                    </Form.Item>


                    <Form.Item
                        label={
                            <Text
                                style={{ color: PRIMARY_TEXT }}
                                strong
                            >
                                Tags / Keywords
                            </Text>
                        }
                    >
                        <Input
                            value={currentMetadata.tags}
                            onChange={(e) => {
                                setCurrentMetadata({
                                    ...currentMetadata,
                                    tags: e.target.value.split(','),
                                })
                            }}
                            style={{
                                backgroundColor: PRIMARY_BLUE,
                                color: PRIMARY_TEXT,
                            }}
                        />
                        <div style={{ fontSize: 12 }}>
                            <Text style={{ color: 'lightgray' }}>
                                *Separate with a comma and a single space.
                            </Text>
                        </div>
                    </Form.Item>

                </Form>}
            </div>
        </>
    );
};
