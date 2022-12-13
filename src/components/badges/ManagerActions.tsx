import { RecipientFormItem } from '../RecipientFormItem';
import { BurnOwnerFormItem } from '../BurnOwnerFormItem';
import {
    Avatar,
    Button,
    Form,
    Select,
    List,
    Skeleton,
    Divider,
    Input,
    Empty,
    Typography,
    InputNumber,
} from 'antd';
import { useState } from 'react';
import React from 'react';
import {
    LockOutlined,
    PlusOutlined,
    UndoOutlined,
    SwapRightOutlined,
    RightOutlined,
    DownOutlined,
    CheckOutlined,
    CloseOutlined,
    DeleteOutlined,
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { ETH_LOGO, PRIMARY_TEXT, SECONDARY_TEXT } from '../../constants';
import { RecipientList } from '../RecipientList';
import { ethers } from 'ethers';
import { BitBadgeCollection } from '../../bitbadges-api/types';

const { Option } = Select;
const { Text } = Typography;

export function BadgeModalManagerActions({
    badge,
    hidePermissions,
}: {
    badge?: BitBadgeCollection;
    hidePermissions?: boolean;
}) {
    const [recipients, setRecipients] = useState<any[]>([]);
    const [owners, setOwners] = useState<any[]>([]);
    const [transactionIsLoading, setTransactionIsLoading] = useState(false);
    const [txnSubmitted, setTxnSubmitted] = useState(false);
    const [lockSupplyIsVisible, setLockSupplyIsVisible] = useState(false);
    const [mintMoreIsVisible, setMintMoreIsVisible] = useState(false);
    const [mintApprovalIsVisible, setMintApprovalIsVisible] = useState(false);
    const [lockRevokeIsVisible, setLockRevokeIsVisible] = useState(false);
    const [revokeIsVisible, setRevokeIsVisible] = useState(false);
    const [newManagerChain, setnewManagerChain] = useState('ETH');
    const [newManagerAddress, setnewManagerAddress] = useState('');

    const [approveeChain, setApproveeChain] = useState('ETH');
    const [approveeAddress, setApproveeAddress] = useState('');
    const [approveeAmount, setApproveeAmount] = useState(0);

    const [transferManagerIsVisible, setTransferManagerIsVisible] =
        useState(false);

    const accountNumber = useSelector((state: any) => state.user.accountNumber);
    // const navigate = useNavigate();

    if (!badge) return <></>;

    const getPopover = (visible: boolean, setVisible: (arg: boolean) => void) => {
        return (
            <button
                className="link-button"
                style={{ color: PRIMARY_TEXT }}
                key="list-loadmore-edit"
                onClick={() => setVisible(!visible)}
            >
                {visible ? <DownOutlined /> : <RightOutlined />}
            </button>
        );
    };

    const submitTransaction = async (data: any, route: any) => {
        setTxnSubmitted(true);
        setTransactionIsLoading(true);

        // await signAndSubmitTxn(route, data);
        //TODO:

        setTransactionIsLoading(false);
    };

    const getSignAndSubmitButton = (onClick: React.MouseEventHandler<HTMLElement>, disabled: boolean) => {
        return (
            <Form.Item>
                <Button
                    style={{
                        width: '100%',
                    }}
                    type="primary"
                    onClick={onClick}
                    loading={transactionIsLoading}
                    disabled={disabled}
                >
                    Sign and Submit
                </Button>
            </Form.Item>
        );
    };

    const managerActions = [];
    const allUserActions = [];

    if (badge.permissions) {
        if (badge.permissions.CanCreate) {
            managerActions.push({
                title: <div style={{ color: PRIMARY_TEXT }}>Mint</div>,
                description: (
                    <div style={{ color: SECONDARY_TEXT }}>
                        Mint more of this badge
                    </div>
                ),
                icon: <PlusOutlined />,
                visible: mintMoreIsVisible,
                content: (
                    <>
                        {mintMoreIsVisible && (
                            <div
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    justifyContent: 'center',
                                }}
                            >
                                <Form
                                    layout="horizontal"
                                    style={{ width: '50vw' }}
                                >
                                    <RecipientFormItem
                                        recipients={recipients}
                                        setRecipients={setRecipients}
                                    />
                                    {getSignAndSubmitButton(async () => {
                                        const data = {
                                            recipients,
                                            badgeId: badge.id,
                                        };
                                        submitTransaction(data, '/badges/mint');
                                    }, txnSubmitted || recipients.length === 0)}
                                    <Divider />
                                </Form>
                            </div>
                        )}
                    </>
                ),
                showModal: () => {
                    setMintMoreIsVisible(!mintMoreIsVisible);
                },
                popover: getPopover(mintMoreIsVisible, setMintMoreIsVisible),
            });

            managerActions.push({
                title: (
                    <div style={{ color: PRIMARY_TEXT }}>Approve a Mint</div>
                ),
                description: (
                    <div style={{ color: SECONDARY_TEXT }}>
                        Add a mint approval.
                    </div>
                ),
                icon: <PlusOutlined />,
                visible: mintApprovalIsVisible,
                content: (
                    <>
                        {mintApprovalIsVisible && (
                            <div
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    justifyContent: 'center',
                                }}
                            >
                                <Form
                                    layout="horizontal"
                                    style={{ width: '50vw' }}
                                >
                                    <Form.Item
                                        label={
                                            <Text
                                                strong
                                                style={{ color: PRIMARY_TEXT }}
                                            >
                                                Approved Address
                                            </Text>
                                        }
                                    >
                                        <Input
                                            addonBefore={
                                                <Select
                                                    value={approveeChain}
                                                    onSelect={(e: any) =>
                                                        setApproveeChain(e)
                                                    }
                                                    defaultValue="ETH"
                                                >
                                                    <Option value="ETH">
                                                        ETH
                                                    </Option>
                                                </Select>
                                            }
                                            placeholder="Enter Address (0x....)"
                                            value={approveeAddress}
                                            onChange={(e) =>
                                                setApproveeAddress(
                                                    e.target.value
                                                )
                                            }
                                            suffix={
                                                <InputNumber
                                                    value={approveeAmount}
                                                    onChange={(e) =>
                                                        setApproveeAmount(e)
                                                    }
                                                />
                                            }
                                        />
                                        <div
                                            style={{
                                                marginTop: 10,
                                            }}
                                        >
                                            <RecipientList
                                                hideTotals
                                                showWarnings
                                                recipients={[
                                                    {
                                                        to: `${approveeChain}:${approveeAddress}`,
                                                        amount: approveeAmount,
                                                    },
                                                ]}
                                                setRecipients={() => {
                                                    setApproveeAddress('');
                                                    setApproveeAmount(0);
                                                }}
                                            />
                                        </div>
                                    </Form.Item>
                                    {getSignAndSubmitButton(async () => {
                                        const data = {
                                            approvedAddress: approveeAddress,
                                            badgeId: badge.id,
                                            amount: approveeAmount,
                                        };

                                        submitTransaction(
                                            data,
                                            '/badges/addMintApproval'
                                        );
                                    }, txnSubmitted)}
                                    <Divider />
                                </Form>
                            </div>
                        )}
                    </>
                ),
                showModal: () => {
                    setMintApprovalIsVisible(!mintApprovalIsVisible);
                },
                popover: getPopover(
                    mintApprovalIsVisible,
                    setMintApprovalIsVisible
                ),
            });

            managerActions.push({
                title: <div style={{ color: PRIMARY_TEXT }}>Lock Supply</div>,
                icon: <LockOutlined />,
                description: (
                    <div style={{ color: SECONDARY_TEXT }}>
                        Disable minting privileges permanently.
                    </div>
                ),
                visible: lockSupplyIsVisible,
                content: (
                    <>
                        {lockSupplyIsVisible && (
                            <div
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    justifyContent: 'center',
                                }}
                            >
                                <Form
                                    // labelCol={{ span: 4 }}
                                    // wrapperCol={{ span: 14 }}
                                    layout="horizontal"
                                    style={{ width: '50vw' }}
                                >
                                    <Form.Item>
                                        <Text style={{ color: PRIMARY_TEXT }}>
                                            *Warning: This action is permanent.
                                            Once you lock the supply of this
                                            badge, you will never be able to
                                            mint any more.
                                        </Text>
                                    </Form.Item>
                                    {getSignAndSubmitButton(async () => {
                                        const data = {
                                            badgeId: badge.id,
                                        };
                                        submitTransaction(
                                            data,
                                            '/badges/lockSupply'
                                        );
                                    }, txnSubmitted)}
                                    <Divider />
                                </Form>
                            </div>
                        )}
                    </>
                ),
                showModal: () => {
                    setLockSupplyIsVisible(!lockSupplyIsVisible);
                },
                popover: getPopover(
                    lockSupplyIsVisible,
                    setLockSupplyIsVisible
                ),
            });
        }

        if (badge.permissions.CanRevoke) {
            managerActions.push({
                title: <div style={{ color: PRIMARY_TEXT }}>Revoke</div>,
                description: (
                    <div style={{ color: SECONDARY_TEXT }}>
                        Revoke a badge from an existing owner
                    </div>
                ),
                icon: <UndoOutlined />,
                visible: revokeIsVisible,
                content: (
                    <>
                        {revokeIsVisible && (
                            <div
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    justifyContent: 'center',
                                }}
                            >
                                <Form
                                    layout="horizontal"
                                    style={{ width: '50vw' }}
                                >
                                    <BurnOwnerFormItem
                                        owners={owners}
                                        setOwners={setOwners}
                                    />
                                    {getSignAndSubmitButton(async () => {
                                        const data = {
                                            owners,
                                            badgeId: badge.id,
                                        };
                                        submitTransaction(data, '/badges/burn');
                                    }, txnSubmitted || owners.length === 0)}
                                    <Divider />
                                </Form>
                            </div>
                        )}
                    </>
                ),
                showModal: () => {
                    setRevokeIsVisible(!revokeIsVisible);
                },
                popover: getPopover(revokeIsVisible, setRevokeIsVisible),
            });
            managerActions.push({
                title: (
                    <div style={{ color: PRIMARY_TEXT }}>
                        Lock Revoke Permissions
                    </div>
                ),
                description: (
                    <div style={{ color: SECONDARY_TEXT }}>
                        Disable revoking privileges permanently.
                    </div>
                ),
                icon: <LockOutlined />,
                visible: lockRevokeIsVisible,
                content: (
                    <>
                        {lockRevokeIsVisible && (
                            <div
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    justifyContent: 'center',
                                }}
                            >
                                <Form
                                    // labelCol={{ span: 4 }}
                                    // wrapperCol={{ span: 14 }}
                                    layout="horizontal"
                                    style={{ width: '50vw' }}
                                >
                                    <Form.Item>
                                        <Text style={{ color: PRIMARY_TEXT }}>
                                            *Warning: This action is permanent.
                                            Once you lock your revoke
                                            permission, you will never be able
                                            to revoke again.
                                        </Text>
                                    </Form.Item>

                                    {getSignAndSubmitButton(async () => {
                                        const data = {
                                            badgeId: badge.id,
                                        };
                                        submitTransaction(
                                            data,
                                            '/badges/lockRevoke'
                                        );
                                    }, txnSubmitted)}
                                    <Divider />
                                </Form>
                            </div>
                        )}
                    </>
                ),
                showModal: () => {
                    setLockRevokeIsVisible(!lockRevokeIsVisible);
                },
                popover: getPopover(
                    lockRevokeIsVisible,
                    setLockRevokeIsVisible
                ),
            });
        }

        managerActions.push({
            title: (
                <div style={{ color: PRIMARY_TEXT }}>Transfer Manager Role</div>
            ),
            description: (
                <div style={{ color: SECONDARY_TEXT }}>
                    Transfer manager privileges to new address
                </div>
            ),
            icon: <SwapRightOutlined />,
            visible: transferManagerIsVisible,
            content: (
                <>
                    {transferManagerIsVisible && (
                        <div
                            style={{
                                width: '100%',
                                display: 'flex',
                                justifyContent: 'center',
                            }}
                        >
                            <Form layout="horizontal" style={{ width: '50vw' }}>
                                <Form.Item
                                    label={
                                        <Text
                                            strong
                                            style={{ color: PRIMARY_TEXT }}
                                        >
                                            New Manager
                                        </Text>
                                    }
                                >
                                    <Input.Group compact>
                                        <Select
                                            value={newManagerChain}
                                            onSelect={(e: any) =>
                                                setnewManagerChain(e)
                                            }
                                            defaultValue="ETH"
                                        >
                                            <Option value="ETH">ETH</Option>
                                        </Select>
                                        <Input
                                            style={{ width: '75%' }}
                                            value={newManagerAddress}
                                            onChange={(e) =>
                                                setnewManagerAddress(
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </Input.Group>
                                </Form.Item>
                                <Form.Item>
                                    <Text style={{ color: PRIMARY_TEXT }}>
                                        *Warning: This action is permanent. Once
                                        you transfer the manager role to this
                                        new address, you will lose privileges on
                                        this address.
                                    </Text>
                                </Form.Item>
                                {getSignAndSubmitButton(async () => {
                                    const data = {
                                        badgeId: badge.id,
                                        newManager: `${newManagerChain}:${newManagerAddress}`,
                                    };
                                    submitTransaction(
                                        data,
                                        '/badges/transferManager'
                                    );
                                }, txnSubmitted || !ethers.utils.isAddress(newManagerAddress))}

                                {!ethers.utils.isAddress(newManagerAddress) && (
                                    <Text>*Invalid address specified</Text>
                                )}
                                <Divider />
                            </Form>
                        </div>
                    )}
                </>
            ),
            showModal: () => {
                setTransferManagerIsVisible(!transferManagerIsVisible);
            },
            popover: getPopover(
                transferManagerIsVisible,
                setTransferManagerIsVisible
            ),
        });

        console.log(accountNumber, badge);
        if (accountNumber === badge.manager) {
            allUserActions.push(...managerActions);
        }
    }

    return (
        <div
            style={{
                width: '100%',
                fontSize: 20,
            }}
        >
            {!hidePermissions && (
                <>
                    {allUserActions.length > 0 ? (
                        <List
                            // header={
                            //     // <div style={{ textAlign: 'center' }}>
                            //     //     <Text
                            //     //         style={{
                            //     //             color: PRIMARY_TEXT,
                            //     //             fontWeight: 'bolder',
                            //     //             fontSize: 30,
                            //     //         }}
                            //     //     >
                            //     //         Actions
                            //     //     </Text>
                            //     // </div>
                            // }
                            itemLayout="horizontal"
                            dataSource={allUserActions}
                            renderItem={(item: any) => (
                                <>
                                    <div
                                        className="action-item"
                                        onClick={() => {
                                            item.showModal();
                                        }}
                                    >
                                        <List.Item
                                            actions={[
                                                <button
                                                    className="link-button"
                                                    key="list-loadmore-edit"
                                                >
                                                    {item.popover}
                                                </button>,
                                            ]}
                                            style={{
                                                paddingLeft: 8,
                                            }}
                                        >
                                            <Skeleton
                                                avatar
                                                title={false}
                                                loading={item.loading}
                                                active
                                            >
                                                <List.Item.Meta
                                                    avatar={
                                                        <Avatar
                                                            style={{
                                                                backgroundColor:
                                                                    'black',
                                                            }}
                                                            icon={item.icon}
                                                        />
                                                    }
                                                    title={item.title}
                                                    description={
                                                        item.description
                                                    }
                                                />
                                            </Skeleton>
                                        </List.Item>
                                    </div>

                                    <div>{item.content}</div>
                                    <Divider
                                        style={{
                                            color: 'black',
                                            backgroundColor: 'black',
                                            margin: 0,
                                        }}
                                    />
                                </>
                            )}
                        />
                    ) : (
                        <Empty
                            style={{ color: PRIMARY_TEXT }}
                            description="There are no actions you can take. To perform an action, you must either own this badge or be the badge manager."
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                    )}
                </>
            )}
            {(hidePermissions) && (
                <Empty
                    style={{ color: PRIMARY_TEXT }}
                    description="This is just a badge preview, so there are no actions you can take."
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
            )}
        </div>
    );
}
