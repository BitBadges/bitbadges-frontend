import { useState } from 'react';
import { CreateTxMsgUniversalUpdateCollectionModal } from '../../tx-modals/CreateTxMsgUniversalUpdateCollection';
import { MsgUniversalUpdateCollection } from 'bitbadgesjs-proto';

export function SubmitMsgNewCollection({ MsgUniversalUpdateCollection, afterTx, isBitBadgesFollowProtocol }: {
  afterTx?: (collectionId: bigint) => Promise<void>,
  MsgUniversalUpdateCollection?: MsgUniversalUpdateCollection<bigint>,
  isBitBadgesFollowProtocol?: boolean,
}) {
  const [visible, setVisible] = useState<boolean>(false);

  return <div className='full-width flex-center' style={{ marginTop: 20, }}>
    <button
      className='landing-button'
      style={{ width: '90%' }}
      onClick={() => setVisible(true)}
    >
      Create Badge Collection!
    </button>
    <CreateTxMsgUniversalUpdateCollectionModal
      visible={visible}
      setVisible={setVisible}
      MsgUniversalUpdateCollection={MsgUniversalUpdateCollection}
      afterTxParam={afterTx}
      
      isBitBadgesFollowProtocol={isBitBadgesFollowProtocol}
    />
  </div >
}
