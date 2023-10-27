import { Divider, Spin } from 'antd';
import { useEffect } from 'react';
import { MsgUpdateCollectionProps, useTxTimelineContext } from '../../bitbadges-api/contexts/TxTimelineContext';
import { INFINITE_LOOP_MODE } from '../../constants';
import { UpdateCollectionTimeline } from './UpdateCollectionTimeline';

export function TxTimeline({
  txType,
  collectionId,
  addressMappingId,
}: {
  txType: 'UpdateCollection'
  collectionId?: bigint,
  onFinish?: ((props: MsgUpdateCollectionProps) => void),
  addressMappingId?: string,
}) {
  const txTimelineContext = useTxTimelineContext();

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: tx timeline, collectionId changed ');
    if (!txTimelineContext) return;
    txTimelineContext.resetState(collectionId, addressMappingId);
  }, [collectionId, addressMappingId]);

  if (!txTimelineContext.initialLoad) return <div className='dark:text-white inherit-bg' style={{ minHeight: '100vh' }} >
    <Spin size='large' />
    <Divider />
    {<p>Fetching all details for this collection. This may take some time.</p>}
  </ div>

  if (txType === 'UpdateCollection') {
    return <UpdateCollectionTimeline />
    return <></>
  } else {
    return <></>
  }
}
