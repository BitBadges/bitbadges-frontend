import { InfoCircleOutlined } from '@ant-design/icons';
import { Switch, Tooltip } from 'antd';
import { MessageMsgUpdatePermissions, createTxMsgUpdatePermissions } from 'bitbadgesjs-transactions';
import React, { useEffect, useState } from 'react';
import { CanCreateMoreBadgesDigit, CanManagerBeTransferredDigit, CanUpdateBytesDigit, CanUpdateDisallowedDigit, CanUpdateUrisDigit, GetPermissionNumberValue, GetPermissions, UpdatePermissions, CanDeleteDigit } from 'bitbadgesjs-utils';
import { BitBadgeCollection } from 'bitbadgesjs-utils';
import { useChainContext } from '../../contexts/ChainContext';
import { useCollectionsContext } from '../../contexts/CollectionsContext';
import { TxModal } from './TxModal';


export function CreateTxMsgUpdatePermissionsModal({ collection, visible, setVisible, children, }
    : {
        collection: BitBadgeCollection,
        visible: boolean,
        setVisible: (visible: boolean) => void,
        children?: React.ReactNode
    }) {
    const chain = useChainContext();
    const collections = useCollectionsContext();
    const [currPermissions, setCurrPermissions] = useState<number>(GetPermissionNumberValue(collection.permissions));

    const txCosmosMsg: MessageMsgUpdatePermissions = {
        creator: chain.cosmosAddress,
        collectionId: collection.collectionId,
        permissions: currPermissions
    };

    //Upon visible turning to false, reset to initial state
    useEffect(() => {
        if (!visible) {
            setCurrPermissions(GetPermissionNumberValue(collection.permissions));
        }
    }, [visible, collection.permissions]);

    const items = [
        {
            title: 'Select Permissions To Update',
            description: <>
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', margin: 8, justifyContent: 'space-between' }}>
                    Freeze / Unfreeze Addresses (Edit Transferability)
                    <div>
                        <Tooltip title="Once this permission is turned off, it cannot be turned back on." placement='bottom'>
                            <Switch disabled={!GetPermissions(GetPermissionNumberValue(collection.permissions)).CanUpdateDisallowed} defaultChecked={GetPermissions(currPermissions).CanUpdateDisallowed} onChange={() => {
                                setCurrPermissions(UpdatePermissions(currPermissions, CanUpdateDisallowedDigit, !GetPermissions(currPermissions).CanUpdateDisallowed))
                            }} />
                        </Tooltip>
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', margin: 8, justifyContent: 'space-between' }}>
                    Add More Badges to Collection
                    <Tooltip title="Once this permission is turned off, it cannot be turned back on." placement='bottom'>
                        <Switch disabled={!GetPermissions(GetPermissionNumberValue(collection.permissions)).CanCreateMoreBadges} defaultChecked={GetPermissions(currPermissions).CanCreateMoreBadges} onChange={() => {
                            setCurrPermissions(UpdatePermissions(currPermissions, CanCreateMoreBadgesDigit, !GetPermissions(currPermissions).CanCreateMoreBadges))
                        }} />
                    </Tooltip>
                </div>
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', margin: 8, justifyContent: 'space-between' }}>
                    Update Metadata URLs
                    <Tooltip title="Once this permission is turned off, it cannot be turned back on." placement='bottom'>
                        <Switch disabled={!GetPermissions(GetPermissionNumberValue(collection.permissions)).CanUpdateUris} defaultChecked={GetPermissions(currPermissions).CanUpdateUris} onChange={() => {
                            setCurrPermissions(UpdatePermissions(currPermissions, CanUpdateUrisDigit, !GetPermissions(currPermissions).CanUpdateUris))
                        }} />
                    </Tooltip>
                </div>
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', margin: 8, justifyContent: 'space-between' }}>
                    Update Bytes
                    <Tooltip title="Once this permission is turned off, it cannot be turned back on." placement='bottom'>
                        <Switch disabled={!GetPermissions(GetPermissionNumberValue(collection.permissions)).CanUpdateBytes} defaultChecked={GetPermissions(currPermissions).CanUpdateBytes} onChange={() => {
                            setCurrPermissions(UpdatePermissions(currPermissions, CanUpdateBytesDigit, !GetPermissions(currPermissions).CanUpdateBytes))
                        }} />
                    </Tooltip>
                </div>
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', margin: 8, justifyContent: 'space-between' }}>
                    Transfer the Manager Role
                    <Tooltip title="Once this permission is turned off, it cannot be turned back on." placement='bottom'>
                        <Switch disabled={!GetPermissions(GetPermissionNumberValue(collection.permissions)).CanManagerBeTransferred} defaultChecked={GetPermissions(currPermissions).CanManagerBeTransferred} onChange={() => {
                            setCurrPermissions(UpdatePermissions(currPermissions, CanManagerBeTransferredDigit, !GetPermissions(currPermissions).CanManagerBeTransferred))
                        }} />
                    </Tooltip>
                </div>
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', margin: 8, justifyContent: 'space-between' }}>
                    Delete Collection
                    <Tooltip title="Once this permission is turned off, it cannot be turned back on." placement='bottom'>
                        <Switch disabled={!GetPermissions(GetPermissionNumberValue(collection.permissions)).CanDelete} defaultChecked={GetPermissions(currPermissions).CanDelete} onChange={() => {
                            setCurrPermissions(UpdatePermissions(currPermissions, CanDeleteDigit, !GetPermissions(currPermissions).CanDelete))
                        }} />
                    </Tooltip>
                </div>
                <br />
                <InfoCircleOutlined /> Once a permission is turned off, it cannot be turned back on.
                <br />
            </>,
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
            onSuccessfulTx={async () => {
                await collections.refreshCollection(collection.collectionId);
            }}
        >
            {children}
        </TxModal>
    );
}