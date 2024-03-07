import { useState } from 'react';
import { CreateTxMsgUniversalUpdateCollectionModal } from '../../tx-modals/CreateTxMsgUniversalUpdateCollection';
import { MsgUniversalUpdateCollection } from 'bitbadgesjs-sdk';

export function SubmitMsgNewCollection({
  msgUniversalUpdateCollection,
  afterTx,
  isBitBadgesFollowProtocol,
  isExperiencesProtocol
}: {
  afterTx?: (collectionId: bigint) => Promise<void>;
  msgUniversalUpdateCollection?: MsgUniversalUpdateCollection<bigint>;
  isBitBadgesFollowProtocol?: boolean;
  isExperiencesProtocol?: boolean;
}) {
  const [visible, setVisible] = useState<boolean>(false);

  return (
    <div className="full-width flex-center" style={{ marginTop: 20 }}>
      <button
        className="landing-button"
        style={{ width: '90%' }}
        onClick={() => {
          setVisible(true);
        }}
      >
        Create Badge Collection!
      </button>
      <CreateTxMsgUniversalUpdateCollectionModal
        visible={visible}
        setVisible={setVisible}
        msgUniversalUpdateCollection={msgUniversalUpdateCollection}
        afterTxParam={afterTx}
        isExperiencesProtocol={isExperiencesProtocol}
        isBitBadgesFollowProtocol={isBitBadgesFollowProtocol}
      />
    </div>
  );
}
