import { Modal } from 'antd';
import { MessageMsgUpdateBytes, createTxMsgUpdateBytes } from 'bitbadgesjs-transactions';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { useChainContext } from '../../contexts/ChainContext';
import { useCollectionsContext } from '../../contexts/CollectionsContext';
import { TxTimeline, TxTimelineProps } from '../tx-timelines/TxTimeline';
import { TxModal } from './TxModal';
import { MetadataAddMethod } from 'bitbadgesjs-utils';
import { addToIpfs, addUserListToIpfs } from '../../bitbadges-api/api';


export function CreateTxMsgUpdateBytesModal({ visible, setVisible, children, collectionId }
    : {
        visible: boolean,
        setVisible: (visible: boolean) => void,
        children?: React.ReactNode
        collectionId: number,
    }) {
    const router = useRouter();
    const collections = useCollectionsContext();
    const chain = useChainContext();

    const [txState, setTxState] = useState<TxTimelineProps>();
    const [disabled, setDisabled] = useState<boolean>(true);

    const UpdateBytesMsg: MessageMsgUpdateBytes = {
        creator: chain.cosmosAddress,
        collectionId: collectionId,
        newBytes: txState ? txState.newCollectionMsg.bytes: '',
    };

    async function updateIPFSUris() {
      if (!txState) return;
      const addMethod = txState.addMethod;
      const collectionMetadata = txState.collectionMetadata;
      const userList = txState.userList;


      let badgeMsg = txState.newCollectionMsg;
      if (txState.newCollectionMsg.standard === 0) {
      
      
    } else if (txState.newCollectionMsg.standard === 1) {
        //If metadata was added manually, add it to IPFS and update the colleciton and badge URIs
        if (addMethod == MetadataAddMethod.Manual) {
          let res = await addToIpfs(collectionMetadata, {});

          badgeMsg.collectionUri = 'ipfs://' + res.cid + '/collection';
          badgeMsg.badgeUris = [];
          //No need to append here or perform any additional logic with the badge URIs like in MintBadge because there is no existing collection
        }

      let res = await addUserListToIpfs(userList);
      badgeMsg.bytes = 'ipfs://' + res.cid;
    }

    return {
        creator: txState ? txState?.newCollectionMsg.creator : '',
        collectionId: collectionId,
        newBytes: badgeMsg.bytes,
    } as MessageMsgUpdateBytes;
  }

    const msgSteps = [
        {
            title: 'Update User List',
            description: <TxTimeline
                txType='UpdateUserList'
                collectionId={collectionId}
                onFinish={(txState: TxTimelineProps) => {
                    setDisabled(false);
                    setTxState(txState);
                }}
            />,
            disabled: disabled,
        }
    ];

    return (
        <TxModal
              beforeTx={async () => {
                const newMsg = await updateIPFSUris();
                return newMsg
            }}
            msgSteps={msgSteps}
            visible={visible}
            setVisible={setVisible}
            txName="Update User List"
            txCosmosMsg={UpdateBytesMsg}
            createTxFunction={createTxMsgUpdateBytes}
            onSuccessfulTx={async () => {
                await collections.refreshCollection(collectionId);
                router.push(`/collections/${collectionId}`)
                Modal.destroyAll()
            }}
            requireRegistration
        >
            {children}
        </TxModal>
    );
}