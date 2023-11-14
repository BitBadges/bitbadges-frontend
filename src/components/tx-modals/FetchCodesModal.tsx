import { CloseOutlined } from '@ant-design/icons';
import { Empty, Modal } from 'antd';
import React, { useEffect, useState } from 'react';
import { getAllPasswordsAndCodes } from '../../bitbadges-api/api';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { BlockinDisplay } from '../blockin/BlockinDisplay';
import { ClaimsTab } from '../collection-page/ClaimsTab';
import { CodesAndPasswords } from 'bitbadgesjs-utils';
import { INFINITE_LOOP_MODE } from '../../constants';
import { NEW_COLLECTION_ID } from '../../bitbadges-api/contexts/TxTimelineContext';

//TODO: have option to only show a single claim?
export function FetchCodesModal({ visible, setVisible, children, collectionId }: {
  collectionId: bigint,
  visible: boolean,
  setVisible: (visible: boolean) => void,
  children?: React.ReactNode,
}) {
  const chain = useChainContext();

  const [codesAndPasswords, setCodesAndPasswords] = useState<CodesAndPasswords[]>([]);

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: fetch codes modal ');
    if (collectionId && chain.connected && chain.loggedIn && visible) {
      const getAll = async () => {
        const codesRes = await getAllPasswordsAndCodes(collectionId);
        setCodesAndPasswords(codesRes.codesAndPasswords);
      }
      getAll();
    }
  }, [collectionId, chain, visible]);

  return (
    <Modal
      title={<div className='primary-text inherit-bg'><b>{'Distribute'}</b></div>}
      open={visible}
      style={{}}
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
              : <ClaimsTab
                collectionId={collectionId}
                codesAndPasswords={codesAndPasswords}
              />}
          </>
        }
      </div>
      {children}
    </Modal>
  );
}