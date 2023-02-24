import { Button } from 'antd';
import { MessageMsgNewCollection, MessageMsgUpdateUris } from 'bitbadgesjs-transactions';
import { useState } from 'react';
import { addToIpfs } from '../../../bitbadges-api/api';
import { BadgeMetadata, MetadataAddMethod } from '../../../bitbadges-api/types';
import { useChainContext } from '../../../chain/ChainContext';
import { CreateTxMsgUpdateUrisModal } from '../../txModals/CreateTxMsgUpdateUrisModal';

export function SubmitMsgUpdateUris({
    newCollectionMsg,
    setNewCollectionMsg,
    addMethod,
    collectionMetadata,
    badgeMetadata,
    collectionId,
}: {
    newCollectionMsg: MessageMsgNewCollection,
    setNewCollectionMsg: (newCollectionMsg: MessageMsgNewCollection) => void,
    addMethod: MetadataAddMethod;
    collectionMetadata: BadgeMetadata;
    badgeMetadata: { [key: string]: BadgeMetadata };
    collectionId: number;
}) {
    const chain = useChainContext();
    const [visible, setVisible] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);




    async function updateIPFSUris() {
        //If metadata was added manually, add it to IPFS and update the colleciton and badge URIs
        if (addMethod == MetadataAddMethod.Manual) {
            let res = await addToIpfs(collectionMetadata, badgeMetadata);
            setNewCollectionMsg({
                ...newCollectionMsg,
                collectionUri: 'ipfs://' + res.cid + '/collection',
                badgeUri: 'ipfs://' + res.cid + '/{id}',
            });
        }
    }

    const updateUrisMsg: MessageMsgUpdateUris = {
        creator: chain.cosmosAddress,
        collectionId: collectionId,
        collectionUri: newCollectionMsg.collectionUri,
        badgeUri: newCollectionMsg.badgeUri,
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
                await updateIPFSUris();
                setVisible(true);
                setLoading(false);
            }}
        >
            Update Metadata!
        </Button>
        <CreateTxMsgUpdateUrisModal
            visible={visible}
            setVisible={setVisible}
            txCosmosMsg={updateUrisMsg}
        />
    </div>
}
