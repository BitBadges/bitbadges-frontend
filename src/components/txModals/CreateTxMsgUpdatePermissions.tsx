import React, { useEffect, useState } from 'react';
import { MessageMsgUpdatePermissions, createTxMsgUpdatePermissions } from 'bitbadgesjs-transactions';
import { TxModal } from './TxModal';
import { BitBadgeCollection } from '../../bitbadges-api/types';
import { useChainContext } from '../../chain/ChainContext';
import { Switch } from 'antd';
import { CanCreateMoreBadgesDigit, CanUpdateDisallowedDigit, CanManagerBeTransferredDigit, CanUpdateBytesDigit, CanUpdateUrisDigit, GetPermissionNumberValue, GetPermissions, Permissions, UpdatePermissions } from '../../bitbadges-api/permissions';


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
        collectionId: badge.collectionId,
        permissions: currPermissions
    };

    //Upon visible turning to false, reset to initial state
    useEffect(() => {
        if (!visible) {
            setCurrPermissions(GetPermissionNumberValue(badge.permissions));
        }
    }, [visible, badge.permissions]);

    const items = [
        {
            title: 'Select Permissions To Update',
            description: <>
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    Can Freeze / Unfreeze Addresses
                    <div>
                        <Switch disabled={!GetPermissions(GetPermissionNumberValue(badge.permissions)).CanUpdateDisallowed} defaultChecked={GetPermissions(currPermissions).CanUpdateDisallowed} onChange={() => {
                            setCurrPermissions(UpdatePermissions(currPermissions, CanUpdateDisallowedDigit, !GetPermissions(currPermissions).CanUpdateDisallowed))
                        }} />
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    Can Create More Badges
                    <Switch disabled={!GetPermissions(GetPermissionNumberValue(badge.permissions)).CanCreateMoreBadges} defaultChecked={GetPermissions(currPermissions).CanCreateMoreBadges} onChange={() => {
                        setCurrPermissions(UpdatePermissions(currPermissions, CanCreateMoreBadgesDigit, !GetPermissions(currPermissions).CanCreateMoreBadges))
                    }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    Can Update Uris (Metadata)
                    <Switch disabled={!GetPermissions(GetPermissionNumberValue(badge.permissions)).CanUpdateUris} defaultChecked={GetPermissions(currPermissions).CanUpdateUris} onChange={() => {
                        setCurrPermissions(UpdatePermissions(currPermissions, CanUpdateUrisDigit, !GetPermissions(currPermissions).CanUpdateUris))
                    }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    Can Update Bytes
                    <Switch disabled={!GetPermissions(GetPermissionNumberValue(badge.permissions)).CanUpdateBytes} defaultChecked={GetPermissions(currPermissions).CanUpdateBytes} onChange={() => {
                        setCurrPermissions(UpdatePermissions(currPermissions, CanUpdateBytesDigit, !GetPermissions(currPermissions).CanUpdateBytes))
                    }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    Can Manager Be Transferred
                    <Switch disabled={!GetPermissions(GetPermissionNumberValue(badge.permissions)).CanManagerBeTransferred} defaultChecked={GetPermissions(currPermissions).CanManagerBeTransferred} onChange={() => {
                        setCurrPermissions(UpdatePermissions(currPermissions, CanManagerBeTransferredDigit, !GetPermissions(currPermissions).CanManagerBeTransferred))
                    }} />
                </div>
                <br />
                *Once a permission is turned off, it cannot be turned back on.
            </>
        }
    ]

    return (
        <TxModal
            msgSteps={items}
            visible={visible}
            setVisible={setVisible}
            txName="Update Permissions"
            txCosmosMsg={txCosmosMsg}
            createTxFunction={createTxMsgUpdatePermissions}
        >
            {children}
        </TxModal>
    );
}