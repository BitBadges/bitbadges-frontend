import { CloseOutlined } from '@ant-design/icons';
import { Empty, Modal } from 'antd';
import { CodesAndPasswords } from 'bitbadgesjs-utils';
import React, { useEffect, useState } from 'react';
import { getAllPasswordsAndCodes } from '../../bitbadges-api/api';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { NEW_COLLECTION_ID } from '../../bitbadges-api/contexts/TxTimelineContext';
import { useCollection } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { INFINITE_LOOP_MODE } from '../../constants';
import { BlockinDisplay } from '../blockin/BlockinDisplay';
import { CodesPasswordsTab } from '../codes/CodesPasswordsTab';

export function FetchCodesModal({ visible, setVisible, children, collectionId, approvalId }: {
  collectionId: bigint,
  visible: boolean,
  setVisible: (visible: boolean) => void,
  children?: React.ReactNode,
  approvalId?: string,
}) {
  const chain = useChainContext();

  const [codesAndPasswords, setCodesAndPasswords] = useState<CodesAndPasswords[] | undefined>(undefined);
  const [fetched, setFetched] = useState(false);
  const collection = useCollection(collectionId);

  useEffect(() => {
    if (!visible) return;
    if (!collection) return;
    if (INFINITE_LOOP_MODE) console.log('useEffect: fetch codes modal ');
    if (collectionId && chain.connected && chain.loggedIn && visible && !fetched) {
      const getAll = async () => {
        const codesRes = await getAllPasswordsAndCodes(collectionId);
        const codesAndPasswords = [];
        for (const approval of collection.collectionApprovals) {
          const cid = approval.uri?.split('/').pop();
          const correspondingCode = codesRes.codesAndPasswords.find(x => x.cid === cid);
          if (correspondingCode) {
            codesAndPasswords.push(correspondingCode);
          } else {
            codesAndPasswords.push({ cid: cid ?? '', codes: [], password: '' });
          }
        }

        setCodesAndPasswords(codesAndPasswords);
        setFetched(true);
      }
      getAll();
    }
  }, [collectionId, chain, visible, collection, fetched]);

  return (
    <Modal
      title={<div className='primary-text inherit-bg'><b>{'Distribute'}</b></div>}
      open={visible}
      style={{
        minWidth: '90%',
      }}
      footer={null}
      closeIcon={<div className='primary-text inherit-bg'>{<CloseOutlined />}</div>}
      bodyStyle={{
        paddingTop: 8,
      }}
      onCancel={() => setVisible(false)}
      destroyOnClose={true}
    >
      <div className='flex-center'>
        {collectionId === NEW_COLLECTION_ID ?
          <Empty
            description={<span className='secondary-text'>{'Not supported for previews.'}</span>}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ marginTop: 32 }}
          />
          : <>
            {!chain.connected || !chain.loggedIn ?
              <div style={{ textAlign: 'center' }}>
                <BlockinDisplay />
              </div>
              : <CodesPasswordsTab
                collectionId={collectionId}
                codesAndPasswords={codesAndPasswords}
                approvalId={approvalId}
              />}
          </>
        }
      </div>
      {children}
    </Modal>
  );
}