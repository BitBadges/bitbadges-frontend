import { Col, Typography, notification } from 'antd';
import { useRouter } from 'next/router';

import { Metadata, getMetadataDetailsForBadgeId } from 'bitbadgesjs-utils';
import { useCollection } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { BadgeAvatar } from './BadgeAvatar';

import { FullscreenExitOutlined, FullscreenOutlined } from '@ant-design/icons';
import { useLayoutEffect, useState } from 'react';
import { MarkdownDisplay } from '../../pages/account/[addressOrUsername]/settings';
import { BadgeButtonDisplay } from '../button-displays/BadgePageButtonDisplay';
import { NEW_COLLECTION_ID } from '../../bitbadges-api/contexts/TxTimelineContext';

const { Text } = Typography;

export function CollectionHeader({ mappingId, collectionId, hideCollectionLink, badgeId, metadataOverride, multiDisplay }: {
  collectionId: bigint;
  badgeId?: bigint;
  hideCollectionLink?: boolean;
  metadataOverride?: Metadata<bigint>
  multiDisplay?: boolean,
  mappingId?: string
}) {
  const [showMore, setShowMore] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);

  const router = useRouter();
  const collection = useCollection(collectionId)
  const metadata = metadataOverride ? metadataOverride : badgeId ? getMetadataDetailsForBadgeId(badgeId, collection?.cachedBadgeMetadata ?? [])?.metadata : collection?.cachedCollectionMetadata;
  const collectionMetadata = collection?.cachedCollectionMetadata;

  useLayoutEffect(() => {
    // Calculate the height of the content inside the description div
    const descriptionElement = document.getElementById('description' + badgeId + collectionId + mappingId);
    const descriptionElement2 = document.getElementById('description2' + badgeId + collectionId + mappingId);

    const height = descriptionElement?.clientHeight ?? 0;
    const height2 = descriptionElement2?.clientHeight ?? 0;
    setContentHeight(Math.max(height, height2));
  }, [badgeId, collectionId, metadata?.description, mappingId]);

  const Avatar = <>
    <div>
      <BadgeAvatar
        collectionId={collectionId}
        showMultimedia
        badgeId={badgeId}
        size={multiDisplay ? 150 : 300}
        noHover
        metadataOverride={metadataOverride}
        autoPlay={!multiDisplay}
      />
    </div>
  </>


  const CollectionLink = <>
    <div className='flex-center-if-mobile'>
      <Text strong className='primary-text' style={{ fontSize: 20 }}>
        <a onClick={() => {
          if (collectionId == NEW_COLLECTION_ID) {
            notification.info({
              message: "Navigating to a preview collection is not supported.",
              description: 'You will be able to see a preview on the last steps of this form.',
            })
            return
          }
          router.push(`/collections/${collectionId}`)
        }}>{collectionMetadata?.name}</a>
      </Text>
    </div>
  </>

  const Title = <>
    <div className='flex-center-if-mobile flex-column'>
      <Text strong className='primary-text' style={{ fontSize: 30 }}>
        {metadata?.name}
        {/* {"kljdgfsjhdsjhfhj jdfshg fgjhklsdgjh dfsjhlkgfgjk ds jghdfskdgfjh gfdjkh fdsjhkldfsgkhgk hsfdg df hg"} */}
      </Text>
      {!hideCollectionLink && <>
        {CollectionLink}
      </>}
    </div>
  </>

  const TitlePlusButtons = <>
    <div className='flex-between' style={{ alignItems: 'normal' }}>
      {Title}

      <div className='flex-center-if-mobile' style={{ maxWidth: 350 }}>
        <BadgeButtonDisplay mappingId={mappingId} website={metadata?.externalUrl} badgeId={badgeId} collectionId={collectionId} socials={metadata?.socials} />
      </div>
    </div>

  </>

  const TitlePlusButtonsMobile = <>
    <div className='flex-between flex-wrap full-width' style={{ alignItems: 'normal' }}>
      <div className='flex-center-if-mobile flex-column' style={{ alignItems: 'normal' }}>
        {Title}
      </div>

      <div className='flex-center-if-mobile' style={{ alignItems: 'normal' }}>
        <BadgeButtonDisplay mappingId={mappingId} website={metadata?.externalUrl} badgeId={badgeId} collectionId={collectionId} socials={metadata?.socials} />
      </div>
    </div>

  </>

  const About = metadata?.description && <>
    <div className='primary-text' id={'description2' + badgeId + collectionId + mappingId} style={{ whiteSpace: 'normal', maxHeight: showMore ? undefined : '300px' }}>
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
              <div style={{ width: '100%', display: 'flex' }}>
                <div style={{ flex: '0 0 300px', marginRight: '32px' }}>
                  {Avatar}
                </div>
                <div style={{ flex: '1', overflow: 'hidden' }}>
                  {!multiDisplay && TitlePlusButtons}

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
              <div style={{ flex: '1', overflow: 'hidden' }} className=''>
                {!multiDisplay && TitlePlusButtonsMobile}

              </div>
              <br />

              {About}
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
