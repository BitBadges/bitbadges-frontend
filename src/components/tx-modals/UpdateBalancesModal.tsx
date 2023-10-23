import { CloseOutlined } from '@ant-design/icons';
import { Divider, Modal, Spin, notification } from 'antd';
import { OffChainBalancesMap, convertToCosmosAddress } from 'bitbadgesjs-utils';
import { createBalanceMapForOffChainBalances } from 'bitbadgesjs-utils/dist/distribution';
import React, { useEffect } from 'react';
import { addBalancesToOffChainStorage, refreshMetadata } from '../../bitbadges-api/api';
import { useTxTimelineContext } from '../../bitbadges-api/contexts/TxTimelineContext';
import { DistributionComponent } from '../tx-timelines/step-items/OffChainBalancesStepItem';

export function UpdateBalancesModal({ visible, setVisible, children, collectionId }: {
  collectionId: bigint,
  visible: boolean,
  setVisible: (visible: boolean) => void,
  children?: React.ReactNode,
}) {
  const txTimelineContext = useTxTimelineContext();

  const [loading, setLoading] = React.useState(false);

  useEffect(() => {
    txTimelineContext.resetState(collectionId);
  }, []);



  return (
    <Modal
      title={<div className='primary-text inherit-bg'><b>{'Distribute'}</b></div>}
      open={visible}
      width={'90%'}
      footer={null}
      closeIcon={<div className='primary-text inherit-bg'>{<CloseOutlined />}</div>}
      bodyStyle={{
        paddingTop: 8,
        backgroundColor: '#001529',
      }}
      onCancel={() => setVisible(false)}
      destroyOnClose={true}
      className='primary-text'
    >
      {!txTimelineContext.initialLoad ? <Spin /> : <>
        <DistributionComponent />
        <Divider />
        <Divider />
        <button
          disabled={txTimelineContext.transfers.length == 0 || loading}
          className='landing-button'
          style={{ width: '100%', marginTop: 20 }}
          onClick={async () => {
            setLoading(true);
            const _balanceMap = await createBalanceMapForOffChainBalances(txTimelineContext.transfers);

            const balanceMap: OffChainBalancesMap<bigint> = {};
            for (const entries of Object.entries(_balanceMap)) {
              const [key, value] = entries;
              balanceMap[convertToCosmosAddress(key)] = value;
            }

            await addBalancesToOffChainStorage({ balances: balanceMap, method: 'centralized', collectionId: collectionId });

            await refreshMetadata(collectionId);

            notification.success({
              message: 'Success',
              description: 'Balances updated. Note it may take a few minutes for the changes to be reflected.',
            });
            setLoading(false);
            setVisible(false);
          }}>
          Update Balances {loading && <Spin />}
        </button>
        {children}
      </>}
    </Modal>
  );
}