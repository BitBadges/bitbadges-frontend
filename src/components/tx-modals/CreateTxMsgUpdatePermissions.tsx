import { InfoCircleOutlined } from '@ant-design/icons';
import { Switch, Tooltip } from 'antd';
import { MessageMsgUpdatePermissions, createTxMsgUpdatePermissions } from 'bitbadgesjs-transactions';
import React, { useEffect, useState } from 'react';
import { CanCreateMoreBadgesDigit, CanManagerBeTransferredDigit, CanUpdateBytesDigit, CanUpdateDisallowedDigit, CanUpdateUrisDigit, GetPermissionNumberValue, GetPermissions, UpdatePermissions } from '../../bitbadges-api/permissions';
import { BitBadgeCollection } from '../../bitbadges-api/types';
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

    // const isIPFS = collection.badgeUris.some(x => x.uri.startsWith('ipfs://')) || collection.collectionUri.startsWith('ipfs://');

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
                <br />
                <InfoCircleOutlined /> Once a permission is turned off, it cannot be turned back on.
                <br />
                {/* {isIPFS && !GetPermissions(currPermissions).CanUpdateUris && GetPermissions(currPermissions).CanCreateMoreBadges && <div style={{ color: 'red' }}>
                    <WarningOutlined /> {"To have the \"Add More Badges\" permission turned on, you must also have the \"Update Metadata URLs\" permission turned on. This is because this collection uses IPFS for its metadata storage."}
                </div> */}
                {/* } */}
            </>,
            // disabled: isIPFS && !GetPermissions(currPermissions).CanUpdateUris && GetPermissions(currPermissions).CanCreateMoreBadges
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