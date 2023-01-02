import { CalendarOutlined, DownOutlined, PlusOutlined } from '@ant-design/icons';
import { DatePicker, Divider, Form, Input, InputNumber, Select, Space, Typography } from 'antd';
import React, { useEffect, useState } from 'react';

import { PRIMARY_BLUE, PRIMARY_TEXT } from '../../../constants';
import { BadgeMetadata } from '../../../bitbadges-api/types';
import Image from 'next/image';

const { Text } = Typography;
const { Option } = Select;

//Do not pass an id if this is for the collection netadata
export function FullMetadataForm({
    metadata,
    setMetadata,
    id
}: {
    metadata: BadgeMetadata | BadgeMetadata[];
    setMetadata: (metadata: BadgeMetadata | BadgeMetadata[]) => void;
    id?: number;
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
    const [newImage, setNewImage] = useState('');

    const addItem = (e: any) => {
        e.preventDefault();
        setItems([...items, name]);
        setName('');
    };

    const onNameChange = (event: any) => {
        setName(event.target.value);
    };

    const addImage = (e: any) => {
        e.preventDefault();
        setImages([
            ...images,
            {
                value: newImage,
                label: newImage,
            },
        ]);
        setNewImage('');
    };

    const onNewImageChange = (event: any) => {
        setNewImage(event.target.value);
    };

    const [currentMetadata, setCurrentMetadata] = useState<BadgeMetadata>({} as BadgeMetadata);
    const getMetadataToUpdate = (newMetadata: BadgeMetadata) => {
        setCurrentMetadata(newMetadata);
        if (!isNaN(Number(id)) && Number(id) >= 0) {
            let currMetadata: BadgeMetadata[] = metadata as BadgeMetadata[];
            currMetadata[Number(id)] = newMetadata;
            console.log('ID', id, 'RETURNING NEW METADATA FOR ID', currMetadata)
            return currMetadata;
        } else {
            console.log('ID', id, 'RETURNING NEW METADATA', newMetadata)
            // setCurrMetadata(newMetadata);
            return newMetadata;
        }


    }



    let stringifiedMetadata = JSON.stringify(metadata);
    useEffect(() => {
        const m = !isNaN(Number(id)) && Number(id) >= 0 ? (metadata as BadgeMetadata[])[Number(id)] : metadata as BadgeMetadata;
        setCurrentMetadata(m);
        console.log('set metadata to', m)
    }, [metadata, stringifiedMetadata, id])

    // console.log(currMetadata.name);
    // console.log(metadata, stringifiedMetadata, id, currMetadata)

    return (
        <div>
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
                                <Input
                                    placeholder="Enter Custom Image URI"
                                    value={newImage}
                                    onChange={onNewImageChange}
                                />
                                <Typography.Link
                                    // disabled={
                                    // !isuri.isValid(newImage) TODO:
                                    // }
                                    onClick={addImage}
                                    style={{
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    <PlusOutlined /> Add Image
                                </Typography.Link>
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
                <br />
                <div style={{ fontSize: 12 }}>
                    <Text style={{ color: 'lightgray' }}>
                        {/* {GetPermissions(newBadgeMsg.permissions).CanUpdateUris ? '' :
                                        `You have selected that badge metadata is permanent. Make sure this
                                    image URI is permanent as well.`
                                    } */}
                        {/* //TODO: parse image and always store in IPFS instead 
                                */}
                    </Text>
                </div>
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
                        *Reminder: Badge metadata is not
                        editable. Please use a permanent URL that will not
                        change.
                        {/* TODO: change this */}
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
                                start: Date.now(),
                                end: new Date(dateString).valueOf(),
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


            {/* TODO: -need a way for large collections to be uploaded instead of manual metadata updates */}
        </div>
    );
};
