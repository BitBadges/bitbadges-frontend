import { CalendarOutlined, DownOutlined, PlusOutlined } from '@ant-design/icons';
import { DatePicker, Divider, Form, Input, Select, Space, Typography } from 'antd';
import { cosmosToEth } from 'bitbadgesjs-address-converter';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { PRIMARY_BLUE, PRIMARY_TEXT } from '../../constants';
import { CanCreateDigit, CanFreezeDigit, CanManagerTransferDigit, CanRevokeDigit, CanUpdateUrisDigit, ForcefulTransfersDigit, FrozenByDefaultDigit, GetPermissions, Permissions, UpdatePermissions } from '../../bitbadges-api/permissions';
import { ConfirmManager } from './ConfirmManager';
import { CustomizeBadgeForm } from './CustomizeBadgeForm';
import { Badge } from './MintTimeline';
import { SubassetSupply } from './SubassetSupply';
import { SwitchForm } from './SwitchForm';

const { Text } = Typography;
const { Option } = Select;

export function StandardBadgeForm({
    setCurrStepNumber,
    badge,
    setBadge,
}: {
    setCurrStepNumber: (stepNumber: number) => void;
    badge: any;
    setBadge: (badge: Badge) => void;
}) {
    const address = useSelector((state: any) => state.user.address);

    const [currPermissions, setCurrPermissions] = useState<number>(0);
    const [handledPermissions, setHandledPermissions] = useState<Permissions>({
        CanUpdateBytes: false,
        CanUpdateUris: false,
        CanCreate: false,
        CanManagerTransfer: false,
        CanFreeze: false,
        CanRevoke: false,
        ForcefulTransfers: false,
        FrozenByDefault: false
    });


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


    //TODO: abstract all these to their own exportable components
    return (
        <CustomizeBadgeForm
            items={[
                {
                    title: 'Confirm Manager',
                    description: 'Every badge needs a manager. For this badge, the address below will be the manager.',
                    node: <ConfirmManager badge={badge} setBadge={setBadge} />
                },
                {
                    title: 'Can Manager Be Transferred?',
                    description: ``,
                    node: <SwitchForm
                        onSwitchChange={(noTransfersAllowed, transfersAllowed) => {
                            if (noTransfersAllowed) {
                                const newPermissions = UpdatePermissions(currPermissions, CanManagerTransferDigit, false);
                                setCurrPermissions(newPermissions);
                            } else if (transfersAllowed) {
                                const newPermissions = UpdatePermissions(currPermissions, CanManagerTransferDigit, true);
                                setCurrPermissions(newPermissions);
                            }

                            //Note: This is a hacky way to force a re-render instead of simply doing = handledPermissions
                            let newHandledPermissions = { ...handledPermissions };
                            newHandledPermissions.CanManagerTransfer = true;
                            setHandledPermissions(newHandledPermissions);
                        }}
                        isOptionOneSelected={handledPermissions.CanManagerTransfer && !GetPermissions(currPermissions).CanManagerTransfer}
                        isOptionTwoSelected={handledPermissions.CanManagerTransfer && !!GetPermissions(currPermissions).CanManagerTransfer}
                        selectedMessage={'You can transfer managerial privileges to another address in the future, if desired.'}
                        unselectedMessage={`You will permanently be manager of this badge.`}
                        helperMessage={`Note that if you select 'Yes', you can switch to 'No' at any point in the future.`}
                    />,
                    disabled: !handledPermissions.CanManagerTransfer
                },
                {
                    //TODO: add semi-fungible and random assortments of supplys / amounts support
                    title: 'Fungible or Non-Fungible?',
                    description: `Will each individual badge have unique characteristics or will they all be identical?`,
                    node: <SwitchForm
                        onSwitchChange={(fungible, nonFungible) => {
                            if (fungible) {
                                setBadge({
                                    ...badge,
                                    defaultSubassetSupply: 0,
                                    subassetSupplys: [],
                                });

                                //If fungible, set canCreateMore to false. Will update with further support
                                const newPermissions = UpdatePermissions(currPermissions, CanCreateDigit, false);
                                setCurrPermissions(newPermissions);

                                //Note: This is a hacky way to force a re-render instead of simply doing = handledPermissions
                                let newHandledPermissions = { ...handledPermissions };
                                newHandledPermissions.CanCreate = true;
                                setHandledPermissions(newHandledPermissions);
                            } else if (nonFungible) {
                                setBadge({
                                    ...badge,
                                    defaultSubassetSupply: 1,
                                    subassetSupplys: [],
                                });

                                //Note: This is a hacky way to force a re-render instead of simply doing = handledPermissions
                                let newHandledPermissions = { ...handledPermissions };
                                newHandledPermissions.CanCreate = true;
                                setHandledPermissions(newHandledPermissions);
                            }
                        }}
                        isOptionOneSelected={handledPermissions.CanCreate && badge.defaultSubassetSupply != 1}
                        isOptionTwoSelected={handledPermissions.CanCreate && badge.defaultSubassetSupply == 1}
                        selectedMessage={'Yes. Every minted badge will have its own unique characteristics (non-fungible).'}
                        unselectedMessage={`No. Every minted badge will have the same characteristics (fungible).`}
                        helperMessage={`If you only intend on creating one badge, this answer will not matter.`}
                    />,
                    disabled: badge.defaultSubassetSupply == undefined //This will change as well
                },
                {
                    //TODO: support creating more if CreateMore is set
                    title: 'Total Supply',
                    description: 'What do you want the total supply of this badge to be? This can not be changed later.',
                    node: <SubassetSupply badge={badge} setBadge={setBadge} />
                },
                // {
                //TODO: add support for this
                //     title: 'Can More Badges Be Created Later?',
                //     description: ``,
                //     node: <SwitchForm
                //         onSwitchChange={(value) => {
                //             //TODO: set permissions
                //             //and undisable next button
                //         }}
                //         defaultValue={false}
                //         selectedMessage={`Yes, new badges can be created later by the current manager. This permission can be permanently locked at anytime.`}
                //         unselectedMessage={`No new badges will be able to be created later. You have currently selected to create ${badge.subassetSupplys?.length} unique badge(s).`}
                //     />,
                // },
                {
                    title: 'Can Badges Be Revoked?',
                    description: ``,
                    node: <SwitchForm
                        onSwitchChange={(canNotRevoke, canRevoke) => {
                            if (canNotRevoke) {
                                const newPermissions = UpdatePermissions(currPermissions, CanRevokeDigit, false);
                                setCurrPermissions(newPermissions);
                            } else if (canRevoke) {
                                const newPermissions = UpdatePermissions(currPermissions, CanRevokeDigit, true);
                                setCurrPermissions(newPermissions);
                            }

                            //Note: This is a hacky way to force a re-render instead of simply doing = handledPermissions
                            let newHandledPermissions = { ...handledPermissions };
                            newHandledPermissions.CanRevoke = true;
                            setHandledPermissions(newHandledPermissions);
                        }}
                        isOptionOneSelected={handledPermissions.CanRevoke && !GetPermissions(currPermissions).CanRevoke}
                        isOptionTwoSelected={handledPermissions.CanRevoke && !!GetPermissions(currPermissions).CanRevoke}
                        selectedMessage={`The manager will be able to forcefully revoke this badge from an owner at anytime.`}
                        unselectedMessage={`The manager will not be able to forcefully revoke this badge.`}
                        helperMessage={`Note that if you select 'Yes', you can switch to 'No' at any point in the future.`}
                    />,
                    disabled: !handledPermissions.CanRevoke
                },
                {
                    title: 'Forceful Transfers?',
                    description: ``,
                    node: <SwitchForm
                        onSwitchChange={(noForceful, forceful) => {
                            if (noForceful) {
                                const newPermissions = UpdatePermissions(currPermissions, ForcefulTransfersDigit, false);
                                setCurrPermissions(newPermissions);
                            } else if (forceful) {
                                const newPermissions = UpdatePermissions(currPermissions, ForcefulTransfersDigit, true);
                                setCurrPermissions(newPermissions);
                            }

                            //Note: This is a hacky way to force a re-render instead of simply doing = handledPermissions
                            let newHandledPermissions = { ...handledPermissions };
                            newHandledPermissions.ForcefulTransfers = true;
                            setHandledPermissions(newHandledPermissions);
                        }}
                        isOptionOneSelected={handledPermissions.ForcefulTransfers && !GetPermissions(currPermissions).ForcefulTransfers}
                        isOptionTwoSelected={handledPermissions.ForcefulTransfers && !!GetPermissions(currPermissions).ForcefulTransfers}
                        selectedMessage={`When this badge is transferred, it will be forcefully transferred to the recipient's account without needing approval.`}
                        unselectedMessage={`When this badge is transferred, it will go into a pending queue until the recipient approves or denies the transfer.`}
                        helperMessage={`Note that this site does not display forceful badges by default.`}
                    />,
                    disabled: !handledPermissions.ForcefulTransfers
                },
                {
                    title: 'Can Manager Freeze Assets?',
                    //TODO: add whitelist freeze/ unfreeze support (w/ manager when frozen by default)
                    //make this clear in the messages
                    description: ``,
                    node: <SwitchForm
                        onSwitchChange={(canNotFreeze, canFreeze) => {
                            if (canNotFreeze) {
                                const newPermissions = UpdatePermissions(currPermissions, CanFreezeDigit, false);
                                setCurrPermissions(newPermissions);
                            } else if (canFreeze) {
                                const newPermissions = UpdatePermissions(currPermissions, CanFreezeDigit, true);
                                setCurrPermissions(newPermissions);
                            }

                            //Note: This is a hacky way to force a re-render instead of simply doing = handledPermissions
                            let newHandledPermissions = { ...handledPermissions };
                            newHandledPermissions.CanFreeze = true;
                            setHandledPermissions(newHandledPermissions);
                        }}
                        isOptionOneSelected={handledPermissions.CanFreeze && !GetPermissions(currPermissions).CanFreeze}
                        isOptionTwoSelected={handledPermissions.CanFreeze && !!GetPermissions(currPermissions).CanFreeze}
                        selectedMessage={`The manager can freeze and unfreeze any owner's ability to transfer this badge.`}
                        unselectedMessage={`The mnager can not freeze and unfreeze any owner's ability to transfer this badge.`}
                        helperMessage={`Note that if you select 'Yes', you can switch to 'No' at any point in the future.`}
                    />,
                    disabled: !handledPermissions.CanFreeze
                },
                {
                    title: 'Frozen by Default?',
                    description: ``,
                    node: <>
                        <SwitchForm
                            onSwitchChange={(notFrozen, frozen) => {
                                if (notFrozen) {
                                    const newPermissions = UpdatePermissions(currPermissions, FrozenByDefaultDigit, false);
                                    setCurrPermissions(newPermissions);
                                } else if (frozen) {
                                    const newPermissions = UpdatePermissions(currPermissions, FrozenByDefaultDigit, true);
                                    setCurrPermissions(newPermissions);
                                }

                                //Note: This is a hacky way to force a re-render instead of simply doing = handledPermissions
                                let newHandledPermissions = { ...handledPermissions };
                                newHandledPermissions.FrozenByDefault = true;
                                setHandledPermissions(newHandledPermissions);
                            }}
                            isOptionOneSelected={handledPermissions.FrozenByDefault && !GetPermissions(currPermissions).FrozenByDefault}
                            isOptionTwoSelected={handledPermissions.FrozenByDefault && !!GetPermissions(currPermissions).FrozenByDefault}

                            selectedMessage={`The transfer privileges of users will be frozen by default.`}
                            unselectedMessage={`The transfer privileges of users will be unfrozen by default.`}
                            helperMessage={GetPermissions(currPermissions).CanFreeze ? `` : `Note that you previously selected that the manager can not freeze or unfreeze any users' transfer privileges.`}
                        />
                    </>,
                    disabled: !handledPermissions.FrozenByDefault
                },
                {
                    title: 'Should Metadata Be Updatable?',
                    description: ``,
                    node: <SwitchForm
                        onSwitchChange={(canNotUpdate, canUpdate) => {
                            if (canNotUpdate) {
                                const newPermissions = UpdatePermissions(currPermissions, CanUpdateUrisDigit, false);
                                setCurrPermissions(newPermissions);
                            } else if (canUpdate) {
                                const newPermissions = UpdatePermissions(currPermissions, CanUpdateUrisDigit, true);
                                setCurrPermissions(newPermissions);
                            }

                            //Note: This is a hacky way to force a re-render instead of simply doing = handledPermissions
                            let newHandledPermissions = { ...handledPermissions };
                            newHandledPermissions.CanUpdateUris = true;
                            setHandledPermissions(newHandledPermissions);
                        }}
                        isOptionOneSelected={handledPermissions.CanUpdateUris && !GetPermissions(currPermissions).CanUpdateUris}
                        isOptionTwoSelected={handledPermissions.CanUpdateUris && !!GetPermissions(currPermissions).CanUpdateUris}
                        selectedMessage={`The metadata of the badge can be updated in the future.`}
                        unselectedMessage={`Whatever metadata the badge has upon creation is permanent.`}
                        helperMessage={``}
                    />,
                    disabled: !handledPermissions.CanUpdateUris
                },
                // {
                //   TODO: 
                //     title: 'Badge Metadata Storage',
                //     description: `Do you want us to handle the storage or do you want to handle the storage of the metadata (advanced)?`,
                //     node: <SwitchForm
                //         onSwitchChange={(ownerControlled, ipfsControlled) => {
                //             setBadge({
                //                 ...badge,
                //                 uri: 'https://facebook.com' //TODO:
                //             })
                //         }}
                //         isOptionOneSelected={false}
                //         isOptionTwoSelected={true}
                //         selectedMessage={`You will handle the metadata storage.`}
                //         unselectedMessage={`BitBadges`}
                //         helperMessage={!GetPermissions(currPermissions).CanUpdateUris && `Note that you previously selected that metadata can not be updated, so if you handle it yourself, you will never be able to change the URI.`}
                //     />,
                //     disabled: undefined //TODO:
                // },
                // {
                //TODO:
                //     title: 'Initial Frozen / Unfrozen Addresses ?',
                //     description: ``,
                //     node: <></>,
                // },

                {
                    title: 'Describe Your Badge',
                    description: ``,
                    node: <div>
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
                                value={badge.metadata?.title}
                                onChange={(e: any) => {
                                    setBadge({
                                        ...badge,
                                        metadata: {
                                            ...badge.metadata,
                                            title: e.target.value
                                        }
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
                                    Category
                                </Text>
                            }
                        // required={type === 0}
                        >
                            <Select
                                className="selector"
                                value={badge.metadata?.category}
                                placeholder="Default: None"
                                onChange={(e: any) => {
                                    setBadge({
                                        ...badge,
                                        metadata: {
                                            ...badge.metadata,
                                            category: e
                                        }
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
                            <Input.TextArea
                                value={badge.metadata?.description}
                                onChange={(e) => {
                                    setBadge({
                                        ...badge,
                                        metadata: {
                                            ...badge.metadata,
                                            description: e.target.value
                                        }
                                    });
                                }}
                                style={{
                                    backgroundColor: PRIMARY_BLUE,
                                    color: PRIMARY_TEXT,
                                }}
                            />
                        </Form.Item>

                        {/* 
                        TODO: tags
                        <Form.Item
                            label={
                                <Text
                                    style={{ color: PRIMARY_TEXT }}
                                    strong
                                >
                                    Tags
                                </Text>
                            }
                        >
                            <Input
                                value={badge.metadata?.tags}
                                onChange={(e) =>
                                    setBadge({
                                        ...badge,
                                        metadata: {
                                            ...badge.metadata,
                                            tags: e.target.value
                                        }
                                    });
                                }
                                style={{
                                    backgroundColor: PRIMARY_BLUE,
                                    color: PRIMARY_TEXT,
                                }}
                            />
                        </Form.Item> */}
                    </div>,
                    disabled: !(badge.metadata?.title)
                },
                {
                    title: 'Select Image',
                    description: ``,
                    node: <Form.Item
                        label={
                            <Text
                                style={{ color: PRIMARY_TEXT }}
                                strong
                            >
                                Image URI
                            </Text>
                        }
                    // required={type === 0}
                    >
                        {/* //TODO: better UX not select, 
                        */}
                        <Select
                            className="selector"
                            value={badge.metadata?.image}
                            onChange={(e) => {
                                setBadge({
                                    ...badge,
                                    metadata: {
                                        ...badge.metadata,
                                        image: e
                                    }
                                })
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
                                {GetPermissions(currPermissions).CanUpdateUris ? '' :
                                    `You have selected that badge metadta is permanent. Make sure this
                                    image URI is permanent as well.`
                                }
                            </Text>
                        </div>
                    </Form.Item>,
                },
                {
                    title: 'Select Criteria',
                    description: ``,
                    node: <div>
                        <Form.Item
                            label={
                                <Text
                                    style={{ color: PRIMARY_TEXT }}
                                    strong
                                >
                                    Color
                                </Text>
                            }
                            required
                        >
                            <Select
                                className="selector"
                                defaultValue={badge.metadata?.color}
                                onSelect={(e: any) => {
                                    setBadge({
                                        ...badge,
                                        metadata: {
                                            ...badge.metadata,
                                            color: e
                                        }
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
                                    External URL
                                </Text>
                            }
                        >
                            <Input
                                value={badge.metadata?.externalUrl}
                                onChange={(e) => {
                                    setBadge({
                                        ...badge,
                                        metadata: {
                                            ...badge.metadata,
                                            externalUrl: e.target.value
                                        }
                                    });
                                }}
                                style={{
                                    backgroundColor: PRIMARY_BLUE,
                                    color: PRIMARY_TEXT,
                                }}
                            />
                            <div style={{ fontSize: 12 }}>
                                <Text style={{ color: 'lightgray' }}>
                                    *Reminder: Badge metadata is not
                                    editable. Please use a URL that will not
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
                                    setBadge({
                                        ...badge,
                                        metadata: {
                                            ...badge.metadata,
                                            validFrom: {
                                                start: Date.now(),
                                                end: new Date(dateString).valueOf(),
                                            }
                                        }
                                    })
                                }}
                            />
                        </Form.Item>
                    </div>
                },
                // {
                //     title: 'Whitelisted Recipients',

                // }
                // {
                //     title: 'Confirmations',
                //     //See Old PermissionsForm.tsx and BadgeDataForm.tsx
                //     description: ``,
                //     node: <></>,
                // },
                //TODO: whitelist mint
                //TODO: bytes and updateBytes
                //TODO: more metadata!!!!!
                //: TODO: previews

                // {
                // }
            ]}
            setCurrStepNumber={setCurrStepNumber}
        />
    );
}
