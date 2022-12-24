import React, { useEffect, useState } from 'react';
import { MessageMsgUpdatePermissions,  createTxMsgUpdatePermissions } from 'bitbadgesjs-transactions';
import { TxModal } from './TxModal';
import { BitBadgeCollection } from '../../bitbadges-api/types';
import { useChainContext } from '../../chain/ChainContext';
import { Button, InputNumber, Switch } from 'antd';
import { CanCreateDigit, CanFreezeDigit, CanManagerTransferDigit, CanRevokeDigit, CanUpdateBytesDigit, CanUpdateUrisDigit, GetPermissionNumberValue, GetPermissions, Permissions, UpdatePermissions } from '../../bitbadges-api/permissions';


export function CreateTxMsgUpdatePermissionsModal({ badge, visible, setVisible, children }
    : {
        badge: BitBadgeCollection,
        visible: boolean,
        setVisible: (visible: boolean) => void,
        children?: React.ReactNode,
    }) {
    const chain = useChainContext();
    const [currPermissions, setCurrPermissions] = useState<number>(GetPermissionNumberValue(badge.permissions));

    const txCosmosMsg: MessageMsgUpdatePermissions = {
        creator: chain.cosmosAddress,
        badgeId: badge.id,
        permissions: currPermissions
    };

    return (
        <TxModal
            destroyOnClose={true}
            visible={visible}
            setVisible={setVisible}
            txName="Update Permissions"
            txCosmosMsg={txCosmosMsg}
            createTxFunction={createTxMsgUpdatePermissions}
            displayMsg={'Are you sure?'}
        >
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Can Freeze</span>
                <div>
                    <Switch defaultChecked={GetPermissions(currPermissions).CanFreeze} onChange={() => {
                        setCurrPermissions(UpdatePermissions(currPermissions, CanFreezeDigit, !GetPermissions(currPermissions).CanFreeze))
                    }} />
                </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                Can Revoke
                <Switch defaultChecked={GetPermissions(currPermissions).CanRevoke} onChange={() => {
                    setCurrPermissions(UpdatePermissions(currPermissions, CanRevokeDigit, !GetPermissions(currPermissions).CanRevoke))
                }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                Can Create
                <Switch defaultChecked={GetPermissions(currPermissions).CanCreate} onChange={() => {
                    setCurrPermissions(UpdatePermissions(currPermissions, CanCreateDigit, !GetPermissions(currPermissions).CanCreate))
                }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                Can Update Uris
                <Switch defaultChecked={GetPermissions(currPermissions).CanUpdateUris} onChange={() => {
                    setCurrPermissions(UpdatePermissions(currPermissions, CanUpdateUrisDigit, !GetPermissions(currPermissions).CanUpdateUris))
                }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                Can Update Bytes
                <Switch defaultChecked={GetPermissions(currPermissions).CanUpdateBytes} onChange={() => {
                    setCurrPermissions(UpdatePermissions(currPermissions, CanUpdateBytesDigit, !GetPermissions(currPermissions).CanUpdateBytes))
                }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                Can Manager Transfer
                <Switch defaultChecked={GetPermissions(currPermissions).CanManagerTransfer} onChange={() => {
                    setCurrPermissions(UpdatePermissions(currPermissions, CanManagerTransferDigit, !GetPermissions(currPermissions).CanManagerTransfer))
                }} />
            </div>
            <hr />
            {children}
        </TxModal>
    );
}