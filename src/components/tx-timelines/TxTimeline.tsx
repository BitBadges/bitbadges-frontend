import { Divider, Spin } from 'antd';
import { useEffect } from 'react';
import { MsgUpdateCollectionProps, useTxTimelineContext } from '../../bitbadges-api/contexts/TxTimelineContext';
import { INFINITE_LOOP_MODE } from '../../constants';
import { UpdateCollectionTimeline } from './UpdateCollectionTimeline';
import { MetadataAddMethod } from 'bitbadgesjs-utils';

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
    console.log('test21', addressMappingId)
  }, []);

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: tx timeline, collectionId changed ');
    if (!txTimelineContext) return;
    txTimelineContext.resetState(collectionId, addressMappingId);
    console.log('test22', addressMappingId)
  }, [collectionId, addressMappingId]);

  if (!txTimelineContext.initialLoad) return <div className='primary-text inherit-bg' style={{ minHeight: '100vh' }} >
    <Spin size='large' />
    <Divider />
    {<p>Fetching all details for this collection. This may take some time.</p>}
  </ div>

  if (txType === 'UpdateCollection') {
    return <UpdateCollectionTimeline />
  } else {
    return <></>
  }
}
