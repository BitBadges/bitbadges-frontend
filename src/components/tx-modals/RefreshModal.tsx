import { CloseOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Modal, Typography, notification } from 'antd';
import { NumberType, RefreshStatusRouteSuccessResponse } from 'bitbadgesjs-utils';
import { useEffect, useState } from 'react';
import { getRefreshStatus } from '../../bitbadges-api/api';
import { triggerMetadataRefresh } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { Divider } from '../display/Divider';

const { Text } = Typography;

export function RefreshModal({ visible, setVisible, collectionId, }: {
  visible: boolean,
  setVisible: (visible: boolean) => void,
  collectionId?: bigint,
}) {

  const [refreshStatus, setRefreshStatus] = useState<RefreshStatusRouteSuccessResponse<NumberType>>();
  const refreshDoc = refreshStatus?.refreshDoc;
  const inQueue = refreshStatus?.inQueue;
  const errorDocs = refreshStatus?.errorDocs

  useEffect(() => {
    async function fetchRefreshDetails() {
      if (!collectionId) return;
      const res = await getRefreshStatus(collectionId);
      setRefreshStatus(res);
    }

    fetchRefreshDetails();
  }, [collectionId]);

  async function triggerRefresh() {
    try {
      if (!collectionId) return;

      await triggerMetadataRefresh(collectionId);
      notification.success({ message: "Added to the refresh queue! It may take awhile for the refresh to be processed. Please check back later." });
    } catch (e) {
      console.error(e);
      notification.error({ message: "Oops! Something went wrong. Please try again later." });
    }
  }

  //5 minute cooldown
  const recentlyRefreshed = refreshDoc?.refreshRequestTime && (Date.now() - Number(refreshDoc.refreshRequestTime)) < 5 * 60 * 1000;

  return (
    <Modal
      title={<div className='primary-text inherit-bg'><b>{'Refresh Collection ID '}{collectionId?.toString()}</b></div>}
      open={visible}

      footer={null}
      closeIcon={<div className='primary-text inherit-bg'>{<CloseOutlined />}</div>}
      bodyStyle={{
        paddingTop: 8,
      }}
      onCancel={() => setVisible(false)}
      destroyOnClose={true}
    >
      <>
        {inQueue && <>
          <div className='secondary-text'>
            {'This collection is currently in the refresh queue.'}
          </div>

        </>}
        {!inQueue && refreshDoc &&
          <div className='secondary-text'>
            {'This collection\'s last refresh request was on '}
            <b>{new Date(Number(refreshDoc.refreshRequestTime)).toLocaleString()}</b>
            {'.'}
          </div>
        }
        {recentlyRefreshed && <>
          <div className='secondary-text'>
            {'This collection was recently refreshed. There is a cooldown period of 5 minutes between refreshes.'}
          </div>
        </>}

        {errorDocs && errorDocs?.length > 0 && <>
          <br />
          <div className='secondary-text'>
            {'The following errors have been encountered:'}
          </div>
          <div className='secondary-text'>
            {errorDocs.map((errorDoc, i) => {
              return <div key={i}>
                <br />
                <div><b>{errorDoc._legacyId.includes('balance') ? 'Balances' : 'Metadata'} Error</b></div>
                <div><b>Attempted {errorDoc.numRetries.toString()} Times</b></div>
                <div>Next Retry Time: {new Date(Number(errorDoc.nextFetchTime)).toLocaleString()}</div>
                <div>{'Error: '}
                  <Text type='danger'>
                    {errorDoc.error}
                  </Text></div>
              </div>
            })}
          </div>
        </>}

        <Divider />
        <div>
          <button className='landing-button'
            disabled={!!recentlyRefreshed}
            onClick={async () => {

              await triggerRefresh();
              setVisible(false);
            }} style={{ width: '100%' }}>
            {'Refresh?'}
          </button>
        </div>
        <br />
        <div className='secondary-text'>
          <InfoCircleOutlined /> {'Please only refresh if you believe there have been changes.'}
        </div>
      </>
    </Modal>
  );
}