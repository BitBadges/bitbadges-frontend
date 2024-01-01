import { Col, Typography } from 'antd';
import { useRouter } from 'next/router';

import { Metadata, getMetadataDetailsForBadgeId } from 'bitbadgesjs-utils';
import { useCollection } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { BadgeAvatar } from './BadgeAvatar';

import { FullscreenExitOutlined, FullscreenOutlined } from '@ant-design/icons';
import { useLayoutEffect, useState } from 'react';
import { NEW_COLLECTION_ID } from '../../bitbadges-api/contexts/TxTimelineContext';
import { BadgeButtonDisplay } from '../button-displays/BadgePageButtonDisplay';
import { MarkdownDisplay } from '../../pages/account/[addressOrUsername]/settings';

const { Text } = Typography;

export function CollectionHeader({ collectionId, hideCollectionLink, badgeId, metadataOverride, multiDisplay }: {
  collectionId: bigint;
  badgeId?: bigint;
  hideCollectionLink?: boolean;
  metadataOverride?: Metadata<bigint>
  multiDisplay?: boolean
}) {
  const [showMore, setShowMore] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);

  const router = useRouter();
  const collection = useCollection(collectionId)
  const metadata = metadataOverride ? metadataOverride : badgeId ? getMetadataDetailsForBadgeId(badgeId, collection?.cachedBadgeMetadata ?? [])?.metadata : collection?.cachedCollectionMetadata;
  const collectionMetadata = collection?.cachedCollectionMetadata;

  useLayoutEffect(() => {
    // Calculate the height of the content inside the description div
    const descriptionElement = document.getElementById('description' + badgeId + collectionId);
    const descriptionElement2 = document.getElementById('description2' + badgeId + collectionId);

    const height = descriptionElement?.clientHeight ?? 0;
    const height2 = descriptionElement2?.clientHeight ?? 0;
    setContentHeight(Math.max(height, height2));

  }, [badgeId, collectionId, metadata?.description]);

  const Avatar = <>
    <div style={{}}>
      <BadgeAvatar
        collectionId={collectionId}
        showMultimedia
        badgeId={badgeId}
        size={300}
        noHover
        metadataOverride={metadataOverride}
        autoPlay={!multiDisplay}
      />
    </div>
  </>

  const Title = <>
    <div>
      <Text strong className='primary-text' style={{ fontSize: 30 }}>
        {metadata?.name}
      </Text>
    </div>
  </>

  const CollectionLink = <>
    <Text strong className='primary-text' style={{ fontSize: 20 }}>
      <a onClick={() => {
        router.push(`/collections/${collectionId}`)
      }}>{collectionMetadata?.name}</a>
    </Text>
  </>

  const TitlePlusButtons = <>
    <div className='flex-between flex-wrap'>
      {Title}
      <div>
        {collectionId !== NEW_COLLECTION_ID &&
          <BadgeButtonDisplay website={metadata?.externalUrl} badgeId={badgeId} collectionId={collectionId} socials={metadata?.socials} />
        }
      </div>
    </div>
  </>

  const About = metadata?.description && <>
    <div className='primary-text' id={'description2' + badgeId + collectionId} style={{ whiteSpace: 'normal', maxHeight: showMore ? undefined : '300px' }}>
      <MarkdownDisplay markdown={metadata?.description ?? ''} />
    </div>

    {!metadata?.description && <div className='secondary-text'>
      No description provided.
    </div>}
  </>

  if (multiDisplay) {
    return <div className='flex flex-wrap primary-text'>
      <Col
        style={{ textAlign: 'start', width: '100%' }}
      >
        <div className='flex-center flex-column' style={{ width: '100%' }}>
          {Avatar}
          <div style={{ overflow: 'hidden', textAlign: 'center' }}>
            {Title}
            {!hideCollectionLink && <>
              {CollectionLink}
              <br /><br />
            </>
            }
          </div>
        </div>
      </Col>
    </div>
  }

  return <div className='primary-text'>
    <div className='flex flex-wrap'>
      {<>
        <Col style={{ textAlign: 'start', width: '100%' }}        >
          {
            <Col md={24} xs={0} sm={0} style={{ minHeight: 200, marginTop: 10 }}>
              <div style={{ width: '100%', display: 'flex', flexDirection: 'row', flexWrap: 'wrap' }}>
                <div style={{ flex: '0 0 300px', marginRight: '32px' }}>
                  {Avatar}
                </div>
                <div style={{ flex: '1', overflow: 'hidden' }}>
                  {!multiDisplay && TitlePlusButtons}
                  {!hideCollectionLink && <>
                    {CollectionLink}
                    <br /><br />
                  </>
                  }
                  {About}
                </div>

              </div>
            </Col>}
          {
            <Col md={0} xs={24} sm={24} style={{ minHeight: 200, marginTop: 10 }}>
              <div className='flex-center flex-column'>
                <div style={{ flex: '0 0 300px' }}>
                  {Avatar}
                </div>
              </div>
              <div style={{ flex: '1', overflow: 'hidden' }}>
                {!multiDisplay && TitlePlusButtons}
                {!hideCollectionLink && <>
                  {CollectionLink}
                  <br /><br />
                </>}
                {About}
              </div>
            </Col>}

          {contentHeight >= 300 && (
            <div className='flex-between flex-wrap' style={{ marginTop: '10px' }}>
              <div></div>
              <div>
                <a onClick={() => { setShowMore(!showMore) }}>
                  {showMore ? <FullscreenOutlined /> : <FullscreenExitOutlined />} {showMore ? 'Show Less' : 'Show More'}
                </a>
              </div>
            </div>
          )}
        </Col>
        <br />
      </>}
    </div>
    <br />
  </div >
}
