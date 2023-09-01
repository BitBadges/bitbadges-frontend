import { Divider, Spin } from 'antd';
import { useEffect } from 'react';
import { MsgUpdateCollectionProps, useTxTimelineContext } from '../../bitbadges-api/contexts/TxTimelineContext';
import { INFINITE_LOOP_MODE } from '../../constants';
import { UpdateCollectionTimeline } from './UpdateCollectionTimeline';

export function TxTimeline({
  txType,
  collectionId,
  onFinish,
  isModal,
  addressMappingId,
}: {
  txType: 'UpdateCollection'
  collectionId?: bigint,
  onFinish?: ((props: MsgUpdateCollectionProps) => void),
  isModal?: boolean,
  addressMappingId?: string,
}) {
  const txTimelineContext = useTxTimelineContext();

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: tx timeline, collectionId changed ');
    if (!txTimelineContext) return;
    if (onFinish) txTimelineContext.setOnFinish(onFinish);
    if (addressMappingId && txTimelineContext.existingAddressMappingId !== addressMappingId) {
      txTimelineContext.setExistingAddressMappingId(addressMappingId);
      txTimelineContext.setFormStepNum(1);
    }
    if (collectionId !== undefined && txTimelineContext.existingCollectionId !== collectionId) {
      txTimelineContext.setExistingCollectionId(collectionId);
      txTimelineContext.setFormStepNum(1);
    }
  }, []);

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: tx timeline, collectionId changed ');
    if (!txTimelineContext) return;
    if (onFinish) txTimelineContext.setOnFinish(onFinish);
    if (addressMappingId && txTimelineContext.existingAddressMappingId !== addressMappingId) {
      txTimelineContext.setExistingAddressMappingId(addressMappingId);
      txTimelineContext.setFormStepNum(1);
    }
    if (collectionId !== undefined && txTimelineContext.existingCollectionId !== collectionId) {
      txTimelineContext.setExistingCollectionId(collectionId);
      txTimelineContext.setFormStepNum(1);
    }
  }, [collectionId, addressMappingId]);


  if (!txTimelineContext.initialLoad) return <div className='primary-text'>
    <Spin size='large' />
    <Divider />
    {<p>Fetching all details for this collection. This may take some time.</p>}
  </div>

  if (txType === 'UpdateCollection') {
    return <UpdateCollectionTimeline isModal={isModal ? true : false} />
  } else {
    return <></>
  }
}
