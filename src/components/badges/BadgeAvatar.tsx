import { ClockCircleOutlined } from '@ant-design/icons';
import { Avatar, Spin, Tooltip, notification } from 'antd';
import { BalanceArray, Metadata, getBalanceForIdAndTime } from 'bitbadgesjs-sdk';
import { useRouter } from 'next/router';
import { NEW_COLLECTION_ID } from '../../bitbadges-api/contexts/TxTimelineContext';
import { useCollection } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { getTimeRangesString } from '../../utils/dates';

export function BadgeAvatar({
  collectionId,
  size,
  badgeId,
  balances,
  showId,
  showSupplys,
  noHover,
  metadataOverride,
  onClick,
  showMultimedia,
  autoPlay
}: {
  collectionId: bigint;
  badgeId?: bigint;
  size?: number;
  balances?: BalanceArray<bigint>;
  showId?: boolean;
  showSupplys?: boolean;
  noHover?: boolean;
  metadataOverride?: Metadata<bigint>;
  onClick?: () => void;
  showMultimedia?: boolean;
  autoPlay?: boolean;
}) {
  const router = useRouter();
  const collection = useCollection(collectionId);
  let metadata = metadataOverride ? metadataOverride : badgeId ? collection?.getBadgeMetadata(badgeId) : collection?.getCollectionMetadata();

  // If the badgeId is greater than the max badgeId for the collection, then it is a placeholder badge
  if (!metadata && badgeId && collection && badgeId > collection.getMaxBadgeId()) {
    metadata = Metadata.DefaultPlaceholderMetadata();
  }

  const currBalanceAmount = badgeId && balances ? getBalanceForIdAndTime(badgeId, BigInt(Date.now()), balances.filterZeroBalances()) : 0n;
  const showOwnershipTimesIcon = badgeId && balances && showSupplys && balances.some((x) => !x.ownershipTimes.isFull()) ? true : false;

  const metadataImageUrl = metadata?.image ? metadata.image.replace('ipfs://', 'https://bitbadges-ipfs.infura-ipfs.io/ipfs/') : undefined;

  const metadataImage = metadataImageUrl ?? <Spin />;

  let videoUri = metadata?.video ? metadata.video.replace('ipfs://', 'https://bitbadges-ipfs.infura-ipfs.io/ipfs/') : '';

  const isYoutubeUri = videoUri && (videoUri.includes('youtube.com') || videoUri.includes('youtu.be'));
  if (isYoutubeUri) {
    const videoId = videoUri.split('/').pop();
    videoUri = `https://www.youtube.com/embed/${videoId}`;
  }

  function getVideoType(videoUrl: string) {
    const fileExtension = videoUrl.split('.').pop()?.toLowerCase();
    switch (fileExtension) {
      case 'mp4':
        return 'video/mp4';
      case 'webm':
        return 'video/webm';
      case 'ogg':
        return 'video/ogg';
      case 'm4v':
        return 'video/mp4';
      case 'gltf':
        return 'model/gltf+json';
      case 'glb':
        return 'model/gltf-binary';
      default:
        // If the file extension is not recognized, you can return a default type
        return 'video/mp4';
    }
  }

  const avatar = (
    <div>
      {(!showMultimedia || !videoUri) && (
        <Avatar
          shape="square"
          style={{
            verticalAlign: 'middle',
            margin: 4,
            cursor: collection && badgeId ? 'pointer' : undefined
          }}
          className={'rounded-lg ' + (badgeId && !noHover ? 'badge-avatar' : undefined)}
          src={metadataImage}
          size={size ? size : 65}
          onClick={() => {
            if (onClick) {
              onClick();
              return;
            }
            if (!badgeId) return;
            if (collectionId == NEW_COLLECTION_ID) {
              notification.info({
                message: 'Navigating to a preview badge is not supported.',
                description: 'You will be able to see a preview of the pages on the last step of this form.'
              });
              return;
            }
            router.push(`/collections/${collectionId}/${badgeId}`);
          }}
          onError={() => {
            return false;
          }}
        />
      )}

      {showMultimedia && videoUri && metadataImageUrl && !isYoutubeUri && (
        <video
          style={{
            verticalAlign: 'middle',
            margin: 4,
            cursor: collection && badgeId ? 'pointer' : undefined,
            borderRadius: '8%'
          }}
          autoPlay={autoPlay}
          className={collectionId + '-' + badgeId + '-multimedia'}
          height={size ? size : 65}
          width={size ? size : 65}
          controls
          controlsList="nodownload"
          playsInline
          loop
          poster={metadataImageUrl}>
          <source src={videoUri} type={getVideoType(videoUri)} />
        </video>
      )}

      {isYoutubeUri && showMultimedia && videoUri && metadataImageUrl && (
        <iframe
          className="rounded-2xl"
          width={300}
          height={300}
          src={videoUri}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      )}
    </div>
  );

  return (
    <div>
      {noHover ? (
        avatar
      ) : (
        <Tooltip placement="bottom" title={`${metadata?.name ? metadata.name : ''} ${badgeId ? `(#${badgeId})` : ''}`}>
          <div style={{ textAlign: 'center' }}>{avatar}</div>
        </Tooltip>
      )}
      <div style={{ textAlign: 'center' }}>
        {showId && (
          <b>
            <span>{`${badgeId}`}</span>
            <br />
          </b>
        )}
        {!!balances && (
          <>
            <b className="primary-text">
              {showSupplys && (
                <>
                  x<span style={{ color: currBalanceAmount < 0 ? 'red' : undefined }}>{`${currBalanceAmount}`}</span>
                </>
              )}

              {showOwnershipTimesIcon && (
                <Tooltip
                  color="black"
                  title={
                    <div>
                      {balances.map((x, idx) => {
                        return (
                          <>
                            {idx > 0 && <br />}
                            {idx > 0 && <br />}x{x.amount.toString()} from {getTimeRangesString(x.ownershipTimes, '', true)}
                          </>
                        );
                      })}
                    </div>
                  }>
                  <ClockCircleOutlined style={{ marginLeft: 4 }} />
                </Tooltip>
              )}
            </b>
          </>
        )}
      </div>
    </div>
  );
}
