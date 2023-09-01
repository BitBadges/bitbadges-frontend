import { Button } from 'antd';
import { useState } from 'react';
import { useTxTimelineContext } from '../../../bitbadges-api/contexts/TxTimelineContext';
import { CreateTxMsgUpdateCollectionModal } from '../../tx-modals/CreateTxMsgUpdateCollection';

export function SubmitMsgNewCollection({
  collectionId,
}: {
  collectionId?: bigint;
}) {

  const [visible, setVisible] = useState<boolean>(false);
  const txState = useTxTimelineContext();

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
