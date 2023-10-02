import { useState } from 'react';
import { CreateTxMsgUpdateCollectionModal } from '../../tx-modals/CreateTxMsgUpdateCollection';

export function SubmitMsgNewCollection() {
  const [visible, setVisible] = useState<boolean>(false);

  return <div className='full-width flex-center'
    style={{ marginTop: 20, }} >
    <button
      className='landing-button'
      style={{ width: '90%' }}
      onClick={() => setVisible(true)}
    >
      Create Badge Collection!
    </button>
    <CreateTxMsgUpdateCollectionModal
      visible={visible}
      setVisible={setVisible}
    />
  </div >
}
