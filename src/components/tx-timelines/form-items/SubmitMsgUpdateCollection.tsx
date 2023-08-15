import { Button } from 'antd';
import { useState } from 'react';
import { CreateTxMsgUpdateCollectionModal } from '../../tx-modals/CreateTxMsgUpdateCollection';
import { MsgUpdateCollectionProps } from '../TxTimeline';

export function SubmitMsgNewCollection({
  collectionId,
  txState,
}: {
  collectionId?: bigint;
  txState: MsgUpdateCollectionProps
}) {

  const [visible, setVisible] = useState<boolean>(false);

  return <div className='full-width flex-center'
    style={{ marginTop: 20, }} >
    <Button
      type="primary"
      style={{ width: '90%' }}
      onClick={() => setVisible(true)}
    >
      Create Badge Collection!
    </Button>
    <CreateTxMsgUpdateCollectionModal
      visible={visible}
      setVisible={setVisible}
      collectionId={collectionId}
      doNotShowTimeline
      inheritedTxState={txState}
    />
  </div >
}