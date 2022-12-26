import { CalendarOutlined, DownOutlined, PlusOutlined } from '@ant-design/icons';
import { DatePicker, Divider, Form, Input, Select, Space, Typography } from 'antd';
import React, { useEffect, useState } from 'react';

import { PRIMARY_BLUE, PRIMARY_TEXT } from '../../constants';
import { CanCreateDigit, CanFreezeDigit, CanManagerTransferDigit, CanRevokeDigit, CanUpdateUrisDigit, ForcefulTransfersDigit, FrozenByDefaultDigit, GetPermissions, Permissions, UpdatePermissions } from '../../bitbadges-api/permissions';
import { ConfirmManager } from './ConfirmManager';
import { CustomizeBadgeForm } from './CustomizeBadgeForm';
import { SubassetSupply } from './SubassetSupply';
import { SwitchForm } from './SwitchForm';
import { useChainContext } from '../../chain/ChainContext';
import { BadgeMetadata, BitBadgeCollection } from '../../bitbadges-api/types';
import { MessageMsgNewBadge } from 'bitbadgesjs-transactions';

const { Text } = Typography;
const { Option } = Select;

export function StandardBadgeForm({
    setCurrStepNumber,
    newBadgeMsg,
    setNewBadgeMsg,
    newBadgeMetadata,
    setNewBadgeMetadata,
}: {
    setCurrStepNumber: (stepNumber: number) => void;
    newBadgeMsg: MessageMsgNewBadge;
    setNewBadgeMsg: (badge: MessageMsgNewBadge) => void;
    newBadgeMetadata: BadgeMetadata;
    setNewBadgeMetadata: (metadata: BadgeMetadata) => void;
}) {
    const chain = useChainContext();

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
                    node: <ConfirmManager />
                },

                {
                    title: 'Set the Collection Metadata',
                    description: `Individual badges will be created later.`,
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
                                value={newBadgeMetadata.name}
                                onChange={(e: any) => {
                                    setNewBadgeMetadata({
                                        ...newBadgeMetadata,
                                        name: e.target.value
                                    })
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
                            {/* //TODO: better UX not select, 
                        */}
                            <Select
                                className="selector"
                                value={newBadgeMetadata?.image}
                                onChange={(e) => {
                                    setNewBadgeMetadata({
                                        ...newBadgeMetadata,
                                        image: e
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
                                value={newBadgeMetadata?.category}
                                placeholder="Default: None"
                                onChange={(e: any) => {
                                    setNewBadgeMetadata({
                                        ...newBadgeMetadata,
                                        category: e
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
                                value={newBadgeMetadata?.description}
                                onChange={(e) => {
                                    setNewBadgeMetadata({
                                        ...newBadgeMetadata,
                                        description: e.target.value
                                    })
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
                                value={newBadgeMetadata?.tags}
                                onChange={(e) =>
                                    setNewBadgeMsg({
                                        ...newBadgeMsg,
                                        metadata: {
                                            ...newBadgeMsg.metadata,
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
                                defaultValue={newBadgeMetadata?.color}
                                onSelect={(e: any) => {
                                    setNewBadgeMetadata({
                                        ...newBadgeMetadata,
                                        color: e
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
                                value={newBadgeMetadata?.externalUrl}
                                onChange={(e) => {
                                    setNewBadgeMetadata({
                                        ...newBadgeMetadata,
                                        externalUrl: e.target.value
                                    })
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
                                    setNewBadgeMetadata({
                                        ...newBadgeMetadata,
                                        validFrom: {
                                            start: Date.now(),
                                            end: new Date(dateString).valueOf(),
                                        }
                                    })
                                }}
                            />
                        </Form.Item>
                    </div>,
                    disabled: !(newBadgeMetadata?.name)
                },
                {
                    //TODO: add semi-fungible and random assortments of supplys / amounts support
                    title: 'Fungible or Non-Fungible?',
                    // description: `Will each individual badge have unique characteristics or will they all be identical?`,
                    description: '',
                    node: <SwitchForm
                        onSwitchChange={(fungible, nonFungible) => {
                            if (fungible) {

                                //If fungible, set canCreateMore to false. Will update with further support
                                const newPermissions = UpdatePermissions(newBadgeMsg.permissions, CanCreateDigit, false);
                                setNewBadgeMsg({
                                    ...newBadgeMsg,
                                    defaultSubassetSupply: 0,
                                    permissions: newPermissions
                                })

                                //Note: This is a hacky way to force a re-render instead of simply doing = handledPermissions
                                let newHandledPermissions = { ...handledPermissions };
                                newHandledPermissions.CanCreate = true;
                                setHandledPermissions(newHandledPermissions);
                            } else if (nonFungible) {
                                const newPermissions = UpdatePermissions(newBadgeMsg.permissions, CanCreateDigit, false);
                                setNewBadgeMsg({
                                    ...newBadgeMsg,
                                    permissions: newPermissions,
                                    defaultSubassetSupply: 1
                                });

                                //Note: This is a hacky way to force a re-render instead of simply doing = handledPermissions
                                let newHandledPermissions = { ...handledPermissions };
                                newHandledPermissions.CanCreate = true;
                                setHandledPermissions(newHandledPermissions);
                            }
                        }}
                        isOptionOneSelected={handledPermissions.CanCreate && newBadgeMsg.defaultSubassetSupply != 1}
                        isOptionTwoSelected={handledPermissions.CanCreate && newBadgeMsg.defaultSubassetSupply == 1}
                        selectedMessage={'Yes. Every minted badge will have its own unique characteristics (non-fungible).'}
                        unselectedMessage={`No. Every minted badge will have the same characteristics (fungible).`}
                    // helperMessage={`If you only intend on creating one badge, this answer will not matter.`}
                    />,
                    disabled: newBadgeMsg.defaultSubassetSupply == undefined //This will change as well
                },
                {
                    title: `How Many ${newBadgeMsg.defaultSubassetSupply === 0 ? 'Fungible' : 'Non-Fungible'} Badges To Create?`,
                    description: 'What do you want the total supply of this badge to be? This can not be changed later.',
                    node: <SubassetSupply newBadgeMsg={newBadgeMsg} setNewBadgeMsg={setNewBadgeMsg} />,
                    disabled: newBadgeMsg.subassetSupplys?.length == 0 || newBadgeMsg.subassetAmountsToCreate?.length == 0
                },
                {
                    title: 'Non-Transferable?',
                    description: ``,
                    node: <>
                        <SwitchForm
                            onSwitchChange={(notFrozen, frozen) => {
                                if (notFrozen) {
                                    const newPermissions = UpdatePermissions(newBadgeMsg.permissions, FrozenByDefaultDigit, false);
                                    setNewBadgeMsg({
                                        ...newBadgeMsg,
                                        permissions: newPermissions
                                    })
                                } else if (frozen) {
                                    const newPermissions = UpdatePermissions(newBadgeMsg.permissions, FrozenByDefaultDigit, true);
                                    setNewBadgeMsg({
                                        ...newBadgeMsg,
                                        permissions: newPermissions
                                    })
                                }

                                //Note: This is a hacky way to force a re-render instead of simply doing = handledPermissions
                                let newHandledPermissions = { ...handledPermissions };
                                newHandledPermissions.FrozenByDefault = true;
                                setHandledPermissions(newHandledPermissions);
                            }}
                            isOptionOneSelected={handledPermissions.FrozenByDefault && !GetPermissions(newBadgeMsg.permissions).FrozenByDefault}
                            isOptionTwoSelected={handledPermissions.FrozenByDefault && !!GetPermissions(newBadgeMsg.permissions).FrozenByDefault}

                            selectedMessage={`Users will not be able to transfer this badge.`}
                            unselectedMessage={`Users will be able to transfer this badge.`}
                        // helperMessage={GetPermissions(newBadgeMsg.permissions).CanFreeze ? `` : `Note that you previously selected that the manager can not freeze or unfreeze any users' transfer privileges.`}
                        />

                    </>,
                    disabled: !handledPermissions.FrozenByDefault
                },
                {
                    title: 'Forceful Transfers?',
                    description: ``,
                    node: <SwitchForm
                        onSwitchChange={(noForceful, forceful) => {
                            if (noForceful) {
                                const newPermissions = UpdatePermissions(newBadgeMsg.permissions, ForcefulTransfersDigit, false);
                                setNewBadgeMsg({
                                    ...newBadgeMsg,
                                    permissions: newPermissions
                                })
                            } else if (forceful) {
                                const newPermissions = UpdatePermissions(newBadgeMsg.permissions, ForcefulTransfersDigit, true);
                                setNewBadgeMsg({
                                    ...newBadgeMsg,
                                    permissions: newPermissions
                                })
                            }

                            //Note: This is a hacky way to force a re-render instead of simply doing = handledPermissions
                            let newHandledPermissions = { ...handledPermissions };
                            newHandledPermissions.ForcefulTransfers = true;
                            setHandledPermissions(newHandledPermissions);
                        }}
                        isOptionOneSelected={handledPermissions.ForcefulTransfers && !GetPermissions(newBadgeMsg.permissions).ForcefulTransfers}
                        isOptionTwoSelected={handledPermissions.ForcefulTransfers && !!GetPermissions(newBadgeMsg.permissions).ForcefulTransfers}
                        selectedMessage={
                            GetPermissions(newBadgeMsg.permissions).FrozenByDefault ?
                                `When this badge is initially minted, it will be forcefully transferred to the recipient's account without needing approval.` :
                                `When this badge is initially minted and whenever this badge is transferred between users, it will be forcefully transferred to the recipient's account without needing approval.`
                        }
                        unselectedMessage={
                            GetPermissions(newBadgeMsg.permissions).FrozenByDefault ?
                                `When this badge is initially minted, it will go into a pending queue until the recipient approves or denies the transfer.` :
                                `When this badge is initially minted and whenever this badge is transferred between users, it will go into a pending queue until the recipient approves or denies the transfer.`
                        }
                    // helperMessage={`Note that this site does not display forceful badges by default.`}
                    />,
                    disabled: !handledPermissions.ForcefulTransfers
                },
                {
                    title: 'Can Manager Be Transferred?',
                    description: ``,
                    node: <SwitchForm
                        onSwitchChange={(noTransfersAllowed, transfersAllowed) => {
                            if (noTransfersAllowed) {
                                const newPermissions = UpdatePermissions(newBadgeMsg.permissions, CanManagerTransferDigit, false);
                                setNewBadgeMsg({
                                    ...newBadgeMsg,
                                    permissions: newPermissions
                                })
                            } else if (transfersAllowed) {
                                const newPermissions = UpdatePermissions(newBadgeMsg.permissions, CanManagerTransferDigit, true);
                                setNewBadgeMsg({
                                    ...newBadgeMsg,
                                    permissions: newPermissions
                                })
                            }

                            //Note: This is a hacky way to force a re-render instead of simply doing = handledPermissions
                            let newHandledPermissions = { ...handledPermissions };
                            newHandledPermissions.CanManagerTransfer = true;
                            setHandledPermissions(newHandledPermissions);
                        }}
                        isOptionOneSelected={handledPermissions.CanManagerTransfer && !GetPermissions(newBadgeMsg.permissions).CanManagerTransfer}
                        isOptionTwoSelected={handledPermissions.CanManagerTransfer && !!GetPermissions(newBadgeMsg.permissions).CanManagerTransfer}
                        selectedMessage={'You can transfer managerial privileges to another address in the future, if desired.'}
                        unselectedMessage={`You will permanently be manager of this badge.`}
                        helperMessage={`Note that if you select 'Yes', you can switch to 'No' at any point in the future.`}
                    />,
                    disabled: !handledPermissions.CanManagerTransfer
                },
                {
                    title: `Can Manager ${GetPermissions(newBadgeMsg.permissions).FrozenByDefault ? 'Unfreeze' : 'Freeze'} Addresses?`,
                    //TODO: add whitelist freeze/ unfreeze support (w/ manager when frozen by default)
                    //make this clear in the messages
                    description: `You have selected for this badge to be ${GetPermissions(newBadgeMsg.permissions).FrozenByDefault ? 'non-transferable. Should the manager have the privilege of allowing transfers from certain addresses?' : 'transferable. Should the manager have the privilege of disabling transfers from certain addresses?'}`,
                    node: <SwitchForm
                        onSwitchChange={(canNotFreeze, canFreeze) => {
                            if (canNotFreeze) {
                                const newPermissions = UpdatePermissions(newBadgeMsg.permissions, CanFreezeDigit, false);
                                setNewBadgeMsg({
                                    ...newBadgeMsg,
                                    permissions: newPermissions
                                })
                            } else if (canFreeze) {
                                const newPermissions = UpdatePermissions(newBadgeMsg.permissions, CanFreezeDigit, true);
                                setNewBadgeMsg({
                                    ...newBadgeMsg,
                                    permissions: newPermissions
                                })
                            }

                            //Note: This is a hacky way to force a re-render instead of simply doing = handledPermissions
                            let newHandledPermissions = { ...handledPermissions };
                            newHandledPermissions.CanFreeze = true;
                            setHandledPermissions(newHandledPermissions);
                        }}
                        isOptionOneSelected={handledPermissions.CanFreeze && !GetPermissions(newBadgeMsg.permissions).CanFreeze}
                        isOptionTwoSelected={handledPermissions.CanFreeze && !!GetPermissions(newBadgeMsg.permissions).CanFreeze}
                        selectedMessage={`The manager can freeze and unfreeze any owner's ability to transfer this badge.`}
                        unselectedMessage={`The mnager can not freeze and unfreeze any owner's ability to transfer this badge.`}
                        helperMessage={`Note that if you select 'Yes', you can switch to 'No' at any point in the future.`}
                    />,
                    disabled: !handledPermissions.CanFreeze
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
                                const newPermissions = UpdatePermissions(newBadgeMsg.permissions, CanRevokeDigit, false);
                                setNewBadgeMsg({
                                    ...newBadgeMsg,
                                    permissions: newPermissions
                                })
                            } else if (canRevoke) {
                                const newPermissions = UpdatePermissions(newBadgeMsg.permissions, CanRevokeDigit, true);
                                setNewBadgeMsg({
                                    ...newBadgeMsg,
                                    permissions: newPermissions
                                })
                            }

                            //Note: This is a hacky way to force a re-render instead of simply doing = handledPermissions
                            let newHandledPermissions = { ...handledPermissions };
                            newHandledPermissions.CanRevoke = true;
                            setHandledPermissions(newHandledPermissions);
                        }}
                        isOptionOneSelected={handledPermissions.CanRevoke && !GetPermissions(newBadgeMsg.permissions).CanRevoke}
                        isOptionTwoSelected={handledPermissions.CanRevoke && !!GetPermissions(newBadgeMsg.permissions).CanRevoke}
                        selectedMessage={`The manager will be able to forcefully revoke this badge from an owner at anytime.`}
                        unselectedMessage={`The manager will not be able to forcefully revoke this badge.`}
                        helperMessage={`Note that if you select 'Yes', you can switch to 'No' at any point in the future.`}
                    />,
                    disabled: !handledPermissions.CanRevoke
                },



                // {
                //     title: 'Should Metadata Be Updatable?',
                //     description: ``,
                //     node: <SwitchForm
                //         onSwitchChange={(canNotUpdate, canUpdate) => {
                //             if (canNotUpdate) {
                //                 const newPermissions = UpdatePermissions(newBadgeMsg.permissions, CanUpdateUrisDigit, false);
                //                 setNewBadgeMsg({
                //                     ...newBadgeMsg,
                //                     permissions: newPermissions
                //                 })
                //             } else if (canUpdate) {
                //                 const newPermissions = UpdatePermissions(newBadgeMsg.permissions, CanUpdateUrisDigit, true);
                //                 setNewBadgeMsg({
                //                     ...newBadgeMsg,
                //                     permissions: newPermissions
                //                 })
                //             }

                //             //Note: This is a hacky way to force a re-render instead of simply doing = handledPermissions
                //             let newHandledPermissions = { ...handledPermissions };
                //             newHandledPermissions.CanUpdateUris = true;
                //             setHandledPermissions(newHandledPermissions);
                //         }}
                //         isOptionOneSelected={handledPermissions.CanUpdateUris && !GetPermissions(newBadgeMsg.permissions).CanUpdateUris}
                //         isOptionTwoSelected={handledPermissions.CanUpdateUris && !!GetPermissions(newBadgeMsg.permissions).CanUpdateUris}
                //         selectedMessage={`The metadata of the badge can be updated in the future.`}
                //         unselectedMessage={`Whatever metadata the badge has upon creation is permanent.`}
                //         helperMessage={``}
                //     />,
                //     disabled: !handledPermissions.CanUpdateUris
                // },
                // {
                //   TODO: 
                //     title: 'Badge Metadata Storage',
                //     description: `Do you want us to handle the storage or do you want to handle the storage of the metadata (advanced)?`,
                //     node: <SwitchForm
                //         onSwitchChange={(ownerControlled, ipfsControlled) => {
                //             setNewBadgeMsg({
                //                 ...newBadgeMsg,
                //                 uri: 'https://facebook.com' //TODO:
                //             })
                //         }}
                //         isOptionOneSelected={false}
                //         isOptionTwoSelected={true}
                //         selectedMessage={`You will handle the metadata storage.`}
                //         unselectedMessage={`BitBadges`}
                //         helperMessage={!GetPermissions(newBadgeMsg.permissions).CanUpdateUris && `Note that you previously selected that metadata can not be updated, so if you handle it yourself, you will never be able to change the URI.`}
                //     />,
                //     disabled: undefined //TODO:
                // },
                // {
                //TODO:
                //     title: 'Initial Frozen / Unfrozen Addresses ?',
                //     description: ``,
                //     node: <></>,
                // },

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
