import { CloseOutlined } from '@ant-design/icons';
import { Modal } from 'antd';
import React, { useEffect, useState } from 'react';
import { getAllPasswordsAndCodes } from '../../bitbadges-api/api';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { BlockinDisplay } from '../blockin/BlockinDisplay';
import { ClaimsTab } from '../collection-page/ClaimsTab';
import { CodesAndPasswords } from 'bitbadgesjs-utils';
import { INFINITE_LOOP_MODE } from '../../constants';

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
      title={<div className='primary-text primary-blue-bg'><b>{'Distribute'}</b></div>}
      open={visible}

      style={{
        // paddingLeft: '12px',
        // paddingRight: '0px',
        // paddingTop: '0px',
        // paddingBottom: '0px',
        // borderBottom: '0px',
      }}
      width={'90%'}

      footer={null}
      closeIcon={<div className='primary-text primary-blue-bg'>{<CloseOutlined />}</div>}
      bodyStyle={{
        paddingTop: 8,
        backgroundColor: '#001529',
      }}
      className='primary-text primary-blue-bg'
      onCancel={() => setVisible(false)}
      destroyOnClose={true}
    >
      <div className='flex-center'>
        {!chain.connected || !chain.loggedIn ?
          <div style={{ textAlign: 'center' }}>
            <BlockinDisplay />
          </div>
          : <ClaimsTab
            collectionId={collectionId}
            codesAndPasswords={codesAndPasswords}
            isModal
          />}
      </div>
      {children}
    </Modal>
  );
}