import { Button } from 'antd';
import { MessageMsgNewCollection, MessageMsgUpdateDisallowedTransfers } from 'bitbadgesjs-transactions';
import { useState } from 'react';
import { BitBadgeCollection } from '../../../bitbadges-api/types';
import { useChainContext } from '../../../chain/ChainContext';
import { CreateTxMsgUpdateDisallowedTransfersModal } from '../../txModals/CreateTxMsgUpdateDisallowedTransfers';

export function SubmitMsgUpdateDisallowedTransfers({
    newCollectionMsg,
    setNewCollectionMsg,
    collection,
}: {
    newCollectionMsg: MessageMsgNewCollection;
    setNewCollectionMsg: (newCollectionMsg: MessageMsgNewCollection) => void;
    collection: BitBadgeCollection
}) {
    const chain = useChainContext();
    const [visible, setVisible] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);




    const updateDisallowedTransfersMsg: MessageMsgUpdateDisallowedTransfers = {
        creator: chain.cosmosAddress,
        collectionId: collection.collectionId,
        disallowedTransfers: newCollectionMsg.disallowedTransfers
    }

    return <div
        style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 20,
        }}
    >
        {/* TODO: Preview and Review */}
        <Button
            type="primary"
            style={{ width: '90%' }}
            loading={loading}
            onClick={async () => {
                setLoading(true);
                setVisible(true);
                setLoading(false);
            }}
        >
            Update Disallowed Transfers
        </Button>
        <CreateTxMsgUpdateDisallowedTransfersModal
            visible={visible}
            setVisible={setVisible}
            txCosmosMsg={updateDisallowedTransfersMsg}
        />
    </div>
}
