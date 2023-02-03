import { CalendarOutlined, DownOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, DatePicker, Divider, Form, Input, InputNumber, Select, Space, Switch, Typography, Upload, UploadProps, message } from 'antd';
import React, { useEffect, useState } from 'react';

import { PRIMARY_BLUE, PRIMARY_TEXT } from '../../../constants';
import { BadgeMetadata } from '../../../bitbadges-api/types';
import { MetadataAddMethod } from '../mint-collection/MintCollectionTimeline';
import { UriSelect } from './UriSelect';
import { MessageMsgNewCollection } from 'bitbadgesjs-transactions';
import MarkdownIt from 'markdown-it';
import MdEditor from 'react-markdown-editor-lite';
// import style manually
import 'react-markdown-editor-lite/lib/index.css';

const { Text } = Typography;
const { Option } = Select;

const mdParser = new MarkdownIt(/* Markdown-it options */);

//Do not pass an id if this is for the collection metadata
export function FullMetadataForm({
    metadata,
    setMetadata,
    addMethod,
    setAddMethod,

    id,
    newCollectionMsg,
    setNewCollectionMsg
}: {
    newCollectionMsg: MessageMsgNewCollection;
    setNewCollectionMsg: (badge: MessageMsgNewCollection) => void;
    metadata: BadgeMetadata | BadgeMetadata[];
    setMetadata: (metadata: BadgeMetadata | BadgeMetadata[]) => void;
    id?: number;
    addMethod: MetadataAddMethod;
    setAddMethod: (method: MetadataAddMethod) => void;
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

    const [currentMetadata, setCurrentMetadata] = useState<BadgeMetadata>({} as BadgeMetadata);

    const getMetadataToUpdate = (newMetadata: BadgeMetadata) => {
        setCurrentMetadata(newMetadata);

        if (!isNaN(Number(id)) && Number(id) >= 0) {
            let currMetadata: BadgeMetadata[] = metadata as BadgeMetadata[];
            currMetadata[Number(id)] = newMetadata;
            return currMetadata;
        } else {
            return newMetadata;
        }
    }

    let stringifiedMetadata = JSON.stringify(metadata);
    useEffect(() => {
        const m = !isNaN(Number(id)) && Number(id) >= 0 ? (metadata as BadgeMetadata[])[Number(id)] : metadata as BadgeMetadata;
        setCurrentMetadata(m);
        console.log('set metadata to', m)


    }, [metadata, stringifiedMetadata, id, images])

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
                const base64Image = file2Base64(info.file.originFileObj as File).then((base64) => {
                    console.log(base64);
                    setImages([
                        ...images,
                        {
                            value: base64,
                            label: info.file.url ? info.file.url : info.file.name,
                        },
                    ]);
                    setMetadata(getMetadataToUpdate({
                        ...currentMetadata,
                        image: base64
                    }));
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
        console.log('handleEditorChange', html, text);
    }

    return (
        <>
            <div>
                {addMethod === MetadataAddMethod.UploadUrl && <>
                    <UriSelect setUri={(collectionUri: string, badgeUri: string) => {
                        setNewCollectionMsg({
                            ...newCollectionMsg,
                            collectionUri,
                            badgeUri,
                        });
                    }} />
                </>}
                {addMethod === MetadataAddMethod.CSV && <>
                    {/* //TODO: 
                    */}
                </>}
                {addMethod === MetadataAddMethod.Manual && <>


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
                                setMetadata(getMetadataToUpdate({
                                    ...currentMetadata,
                                    name: e.target.value
                                }));
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
                                setMetadata(getMetadataToUpdate({
                                    ...currentMetadata,
                                    image: e
                                }));
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
                                setMetadata(getMetadataToUpdate({
                                    ...currentMetadata,
                                    category: e
                                }));
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
                        {/* TODO: Markdown */}
                        {/* <MdEditor style={{ height: '500px' }} renderHTML={text => mdParser.render(text)} onChange={handleEditorChange} /> */}
                        <Input.TextArea
                            value={currentMetadata.description}
                            onChange={(e) => {
                                setMetadata(getMetadataToUpdate({
                                    ...currentMetadata,
                                    description: e.target.value
                                }));
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
                                Color
                            </Text>
                        }
                    >
                        <Select
                            className="selector"
                            defaultValue={currentMetadata.color}
                            onSelect={(e: any) => {
                                setMetadata(getMetadataToUpdate({
                                    ...currentMetadata,
                                    color: e
                                }));
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
                                External URL
                            </Text>
                        }
                    >
                        <Input
                            value={currentMetadata.externalUrl}
                            onChange={(e) => {
                                setMetadata(getMetadataToUpdate({
                                    ...currentMetadata,
                                    externalUrl: e.target.value
                                }));
                            }}
                            style={{
                                backgroundColor: PRIMARY_BLUE,
                                color: PRIMARY_TEXT,
                            }}
                        />
                        <div style={{ fontSize: 12 }}>
                            <Text style={{ color: 'lightgray' }}>
                                *Please use a permanent fixed URL that will not change.
                            </Text>
                        </div>
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
                            onChange={(date, dateString) => {
                                setMetadata(getMetadataToUpdate({
                                    ...currentMetadata,
                                    validFrom: {
                                        start: Date.now() / 1000,
                                        end: new Date(dateString).valueOf() / 1000,
                                    }
                                }));
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
                            onChange={(e) =>
                                setMetadata({
                                    ...metadata,
                                    tags: e.target.value.split(','),
                                })}
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

                </>}



                {/* TODO: -need a way for large collections to be uploaded instead of manual metadata updates */}
            </div>
        </>
    );
};
