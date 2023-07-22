import { CloseOutlined } from '@ant-design/icons';
import { Modal } from 'antd';
import React, { useEffect, useState } from 'react';
import { getAllPasswordsAndCodes } from '../../bitbadges-api/api';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { BlockinDisplay } from '../blockin/BlockinDisplay';
import { ClaimsTab } from '../collection-page/ClaimsTab';
import { CodesAndPasswords } from 'bitbadgesjs-utils';

export function FetchCodesModal({ visible, setVisible, children, collectionId }: {
  collectionId: bigint,
  visible: boolean,
  setVisible: (visible: boolean) => void,
  children?: React.ReactNode,
}) {
  const chain = useChainContext();

  const [codesAndPasswords, setCodesAndPasswords] = useState<CodesAndPasswords[]>([]);

  useEffect(() => {
    if (collectionId && chain.connected && chain.loggedIn) {
      const getAll = async () => {
        const codesRes = await getAllPasswordsAndCodes(collectionId);
        setCodesAndPasswords(codesRes.codesAndPasswords);
      }
      getAll();
    }
  }, [collectionId, chain]);

  return (
    <Modal
      title={<div className='primary-text primary-blue-bg'><b>{'Distribute'}</b></div>}
      open={visible}

      style={{
        paddingLeft: '12px',
        paddingRight: '0px',
        paddingTop: '0px',
        paddingBottom: '0px',
        borderBottom: '0px',
      }}
      footer={null}

      width={'80%'}
      closeIcon={<div className='primary-text primary-blue-bg'>{<CloseOutlined />}</div>}
      bodyStyle={{
        paddingTop: 8,
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