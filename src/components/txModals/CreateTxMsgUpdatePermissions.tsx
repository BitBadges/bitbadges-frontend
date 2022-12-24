import React, { useEffect, useState } from 'react';
import { MessageMsgFreezeAddress, MessageMsgRevokeBadge, MessageMsgUpdatePermissions, createTxMsgFreezeAddress, createTxMsgRevokeBadge, createTxMsgUpdatePermissions } from 'bitbadgesjs-transactions';
import { TxModal } from './TxModal';
import { BitBadgeCollection, IdRange, User } from '../../bitbadges-api/types';
import { useChainContext } from '../../chain/ChainContext';
import { AddressSelect } from './AddressSelect';
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
            Can Freeze
            <Switch defaultChecked={GetPermissions(currPermissions).CanFreeze} onChange={() => {
                setCurrPermissions(UpdatePermissions(currPermissions, CanFreezeDigit, !GetPermissions(currPermissions).CanFreeze))
            }} />
            <br />
            Can Revoke
            <Switch defaultChecked={GetPermissions(currPermissions).CanRevoke} onChange={() => {
                setCurrPermissions(UpdatePermissions(currPermissions, CanRevokeDigit, !GetPermissions(currPermissions).CanRevoke))
            }} />
            <br />
            Can Create
            <Switch defaultChecked={GetPermissions(currPermissions).CanCreate} onChange={() => {
                setCurrPermissions(UpdatePermissions(currPermissions, CanCreateDigit, !GetPermissions(currPermissions).CanCreate))
            }} />
            <br />
            Can Update Uris
            <Switch defaultChecked={GetPermissions(currPermissions).CanUpdateUris} onChange={() => {
                setCurrPermissions(UpdatePermissions(currPermissions, CanUpdateUrisDigit, !GetPermissions(currPermissions).CanUpdateUris))
            }} />
            <br />
            Can Update Bytes
            <Switch defaultChecked={GetPermissions(currPermissions).CanUpdateBytes} onChange={() => {
                setCurrPermissions(UpdatePermissions(currPermissions, CanUpdateBytesDigit, !GetPermissions(currPermissions).CanUpdateBytes))
            }} />
            <br />
            Can Manager Transfer
            <Switch defaultChecked={GetPermissions(currPermissions).CanManagerTransfer} onChange={() => {
                setCurrPermissions(UpdatePermissions(currPermissions, CanManagerTransferDigit, !GetPermissions(currPermissions).CanManagerTransfer))
            }} />
            <br />
            <hr />
            {children}
        </TxModal>
    );
}