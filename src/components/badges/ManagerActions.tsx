import { RecipientFormItem } from '../old/RecipientFormItem';
import { BurnOwnerFormItem } from '../old/BurnOwnerFormItem';
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

import { ETH_LOGO, PRIMARY_TEXT, SECONDARY_TEXT } from '../../constants';
import { RecipientList } from '../old/RecipientList';
import { ethers } from 'ethers';
import { BitBadgeCollection } from '../../bitbadges-api/types';
import { CreateTxMsgTransferManagerModal } from '../txModals/CreateTxMsgTransferManagerModal';
import { CreateTxMsgNewBadgeModal } from '../txModals/CreateTxMsgNewBadgeModal';
import { CreateTxMsgRevokeBadgeModal } from '../txModals/CreateTxMsgRevokeBadge';
import { useChainContext } from '../../chain/ChainContext';
import { BlockinDisplay } from '../blockin/BlockinDisplay';
import { CreateTxMsgFreezeModal } from '../txModals/CreateTxMsgFreezeModal';

const { Option } = Select;
const { Text } = Typography;

export function BadgeModalManagerActions({
    badge,
}: {
    badge?: BitBadgeCollection;
}) {
    const [lockSupplyIsVisible, setLockSupplyIsVisible] = useState(false);
    const [mintMoreIsVisible, setMintMoreIsVisible] = useState(false);
    const [mintApprovalIsVisible, setMintApprovalIsVisible] = useState(false);
    const [lockRevokeIsVisible, setLockRevokeIsVisible] = useState(false);
    const [revokeIsVisible, setRevokeIsVisible] = useState(false);
    const [transferManagerIsVisible, setTransferManagerIsVisible] = useState(false);
    const [freezeIsVisible, setFreezeIsVisible] = useState(false);


    const chain = useChainContext();
    const accountNumber = chain.accountNumber;

    if (!badge) return <></>;

    const managerActions = [];
    const allUserActions = [];

    //TODO: add back permission checks
    if (badge.permissions) {
        if (badge.permissions.CanCreate) {
            // managerActions.push({
            //     title: <div style={{ color: PRIMARY_TEXT }}>Mint</div>,
            //     description: (
            //         <div style={{ color: SECONDARY_TEXT }}>
            //             Mint more of this badge
            //         </div>
            //     ),
            //     icon: <PlusOutlined />,
            //     visible: mintMoreIsVisible,
            //     content: (
            //         <>
            //             {mintMoreIsVisible && (
            //                 <div
            //                     style={{
            //                         width: '100%',
            //                         display: 'flex',
            //                         justifyContent: 'center',
            //                     }}
            //                 >
            //                     <Form
            //                         layout="horizontal"
            //                         style={{ width: '50vw' }}
            //                     >
            //                         <RecipientFormItem
            //                             recipients={recipients}
            //                             setRecipients={setRecipients}
            //                         />
            //                         {getSignAndSubmitButton(async () => {
            //                             const data = {
            //                                 recipients,
            //                                 badgeId: badge.id,
            //                             };
            //                             submitTransaction(data, '/badges/mint');
            //                         }, txnSubmitted || recipients.length === 0)}
            //                         <Divider />
            //                     </Form>
            //                 </div>
            //             )}
            //         </>
            //     ),
            //     showModal: () => {
            //         setMintMoreIsVisible(!mintMoreIsVisible);
            //     },
            // });

            // managerActions.push({
            //     title: (
            //         <div style={{ color: PRIMARY_TEXT }}>Approve a Mint</div>
            //     ),
            //     description: (
            //         <div style={{ color: SECONDARY_TEXT }}>
            //             Add a mint approval.
            //         </div>
            //     ),
            //     icon: <PlusOutlined />,
            //     visible: mintApprovalIsVisible,
            //     content: (
            //         <>
            //             {mintApprovalIsVisible && (
            //                 <div
            //                     style={{
            //                         width: '100%',
            //                         display: 'flex',
            //                         justifyContent: 'center',
            //                     }}
            //                 >
            //                     <Form
            //                         layout="horizontal"
            //                         style={{ width: '50vw' }}
            //                     >
            //                         <Form.Item
            //                             label={
            //                                 <Text
            //                                     strong
            //                                     style={{ color: PRIMARY_TEXT }}
            //                                 >
            //                                     Approved Address
            //                                 </Text>
            //                             }
            //                         >
            //                             <Input
            //                                 addonBefore={
            //                                     <Select
            //                                         value={approveeChain}
            //                                         onSelect={(e: any) =>
            //                                             setApproveeChain(e)
            //                                         }
            //                                         defaultValue="ETH"
            //                                     >
            //                                         <Option value="ETH">
            //                                             ETH
            //                                         </Option>
            //                                     </Select>
            //                                 }
            //                                 placeholder="Enter Address (0x....)"
            //                                 value={approveeAddress}
            //                                 onChange={(e) =>
            //                                     setApproveeAddress(
            //                                         e.target.value
            //                                     )
            //                                 }
            //                                 suffix={
            //                                     <InputNumber
            //                                         value={approveeAmount}
            //                                         onChange={(e) =>
            //                                             setApproveeAmount(e)
            //                                         }
            //                                     />
            //                                 }
            //                             />
            //                             <div
            //                                 style={{
            //                                     marginTop: 10,
            //                                 }}
            //                             >
            //                                 <RecipientList
            //                                     hideTotals
            //                                     showWarnings
            //                                     recipients={[
            //                                         {
            //                                             to: `${approveeChain}:${approveeAddress}`,
            //                                             amount: approveeAmount,
            //                                         },
            //                                     ]}
            //                                     setRecipients={() => {
            //                                         setApproveeAddress('');
            //                                         setApproveeAmount(0);
            //                                     }}
            //                                 />
            //                             </div>
            //                         </Form.Item>
            //                         {getSignAndSubmitButton(async () => {
            //                             const data = {
            //                                 approvedAddress: approveeAddress,
            //                                 badgeId: badge.id,
            //                                 amount: approveeAmount,
            //                             };

            //                             submitTransaction(
            //                                 data,
            //                                 '/badges/addMintApproval'
            //                             );
            //                         }, txnSubmitted)}
            //                         <Divider />
            //                     </Form>
            //                 </div>
            //             )}
            //         </>
            //     ),
            //     showModal: () => {
            //         setMintApprovalIsVisible(!mintApprovalIsVisible);
            //     },
            // });

            // managerActions.push({
            //     title: <div style={{ color: PRIMARY_TEXT }}>Lock Supply</div>,
            //     icon: <LockOutlined />,
            //     description: (
            //         <div style={{ color: SECONDARY_TEXT }}>
            //             Disable minting privileges permanently.
            //         </div>
            //     ),
            //     visible: lockSupplyIsVisible,
            //     content: (
            //         <>
            //             {lockSupplyIsVisible && (
            //                 <div
            //                     style={{
            //                         width: '100%',
            //                         display: 'flex',
            //                         justifyContent: 'center',
            //                     }}
            //                 >
            //                     <Form
            //                         // labelCol={{ span: 4 }}
            //                         // wrapperCol={{ span: 14 }}
            //                         layout="horizontal"
            //                         style={{ width: '50vw' }}
            //                     >
            //                         <Form.Item>
            //                             <Text style={{ color: PRIMARY_TEXT }}>
            //                                 *Warning: This action is permanent.
            //                                 Once you lock the supply of this
            //                                 badge, you will never be able to
            //                                 mint any more.
            //                             </Text>
            //                         </Form.Item>
            //                         {getSignAndSubmitButton(async () => {
            //                             const data = {
            //                                 badgeId: badge.id,
            //                             };
            //                             submitTransaction(
            //                                 data,
            //                                 '/badges/lockSupply'
            //                             );
            //                         }, txnSubmitted)}
            //                         <Divider />
            //                     </Form>
            //                 </div>
            //             )}
            //         </>
            //     ),
            //     showModal: () => {
            //         setLockSupplyIsVisible(!lockSupplyIsVisible);
            //     },
            // });
        }


        // if (badge.permissions.CanFreeze) {
        managerActions.push({
            title: <div style={{ color: PRIMARY_TEXT }}>Freeze</div>,
            description: (
                <div style={{ color: SECONDARY_TEXT }}>
                    Freeze a badge from an existing owner
                </div>
            ),
            icon: <UndoOutlined />,
            showModal: () => {
                setFreezeIsVisible(!freezeIsVisible);
            },
        });

        // if (badge.permissions.CanRevoke) {
        managerActions.push({
            title: <div style={{ color: PRIMARY_TEXT }}>Revoke</div>,
            description: (
                <div style={{ color: SECONDARY_TEXT }}>
                    Revoke a badge from an existing owner
                </div>
            ),
            icon: <UndoOutlined />,
            showModal: () => {
                setRevokeIsVisible(!revokeIsVisible);
            },
        });
        // managerActions.push({
        //     title: (
        //         <div style={{ color: PRIMARY_TEXT }}>
        //             TODO: Update Permissions
        //         </div>
        //     ),
        //     description: (
        //         <div style={{ color: SECONDARY_TEXT }}>
        //             Disable revoking privileges permanently.
        //         </div>
        //     ),
        //     icon: <LockOutlined />,
        //     visible: lockRevokeIsVisible,
        //     // content: (
        //     //     <>
        //     //         {lockRevokeIsVisible && (
        //     //             <div
        //     //                 style={{
        //     //                     width: '100%',
        //     //                     display: 'flex',
        //     //                     justifyContent: 'center',
        //     //                 }}
        //     //             >
        //     //                 <Form
        //     //                     // labelCol={{ span: 4 }}
        //     //                     // wrapperCol={{ span: 14 }}
        //     //                     layout="horizontal"
        //     //                     style={{ width: '50vw' }}
        //     //                 >
        //     //                     <Form.Item>
        //     //                         <Text style={{ color: PRIMARY_TEXT }}>
        //     //                             *Warning: This action is permanent.
        //     //                             Once you lock your revoke
        //     //                             permission, you will never be able
        //     //                             to revoke again.
        //     //                         </Text>
        //     //                     </Form.Item>

        //     //                     {getSignAndSubmitButton(async () => {
        //     //                         const data = {
        //     //                             badgeId: badge.id,
        //     //                         };
        //     //                         submitTransaction(
        //     //                             data,
        //     //                             '/badges/lockRevoke'
        //     //                         );
        //     //                     }, txnSubmitted)}
        //     //                     <Divider />
        //     //                 </Form>
        //     //             </div>
        //     //         )}
        //     //     </>
        //     // ),
        //     showModal: () => {
        //         setLockRevokeIsVisible(!lockRevokeIsVisible);
        //     },
        // });
        // }

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
            showModal: () => {
                setTransferManagerIsVisible(!transferManagerIsVisible);
            },
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
            {allUserActions.length > 0 ? (
                <List
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
                <>
                    <Empty
                        style={{ color: PRIMARY_TEXT }}
                        description="There are no actions you can take. To perform an action, you must either own this badge or be the badge manager."
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                    <BlockinDisplay />
                </>
            )}

            <CreateTxMsgTransferManagerModal
                visible={transferManagerIsVisible}
                setVisible={setTransferManagerIsVisible}
                badge={badge}
            />

            <CreateTxMsgRevokeBadgeModal
                visible={revokeIsVisible}
                setVisible={setRevokeIsVisible}
                badge={badge}
            />

            <CreateTxMsgFreezeModal
                visible={freezeIsVisible}
                setVisible={setFreezeIsVisible}
                badge={badge}
            />
        </div >
    );
}
