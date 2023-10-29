import { InfoCircleOutlined } from '@ant-design/icons';
import { useCollectionsContext } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { InformationDisplayCard } from '../display/InformationDisplayCard';
import { DistributionOverview } from '../badges/DistributionCard';
import { getPermissionDetails } from './PermissionsInfo';
import { TimedUpdatePermissionUsedFlags, castTimedUpdatePermissionToUniversalPermission } from 'bitbadgesjs-utils';
import { neverHasManager } from '../../bitbadges-api/utils/manager';

export function OffChainTransferabilityTab({ collectionId }: {
  collectionId: bigint,

}) {
  const collections = useCollectionsContext();
  const collection = collections.getCollection(collectionId);


  if (!collection) return <></>;

  const isBitBadgesHosted = collection && collection.offChainBalancesMetadataTimeline.length > 0 && collection?.offChainBalancesMetadataTimeline[0].offChainBalancesMetadata.uri.startsWith('https://bitbadges.nyc3.digitaloceanspaces.com/balances/');
  const usesPermanentStorage = collection?.offChainBalancesMetadataTimeline.every(x => x.offChainBalancesMetadata.uri.startsWith('ipfs://'));
  const permissionDetails = getPermissionDetails(castTimedUpdatePermissionToUniversalPermission(collection?.collectionPermissions.canUpdateOffChainBalancesMetadata), TimedUpdatePermissionUsedFlags, neverHasManager(collection));
  const updatable = permissionDetails.hasPermittedTimes || permissionDetails.hasNeutralTimes

  const immutable = usesPermanentStorage && !updatable

  return (
    <>
      <InformationDisplayCard
        title='Transferability'
        span={24}
        noBorder
        inheritBg
      >
        <div className='text-gray-400'>
          <InfoCircleOutlined /> This collection stores its balances off-chain via a typical server,
          meaning no approvals or transfers happen on the blockchain.  {' '}Learn more about off-chain balances <a
            target='_blank'
            href="https://docs.bitbadges.io/overview/concepts/balances-types" rel="noreferrer">
            here

          </a>.
          <br />
          <br />
          {isBitBadgesHosted && "This collection's balances are stored on the BitBadges servers. We allow the manager to update the balances at any time."}
          {!isBitBadgesHosted && immutable && "This collection's balances are permanently frozen because they use permanent storage and the server URL can not be updated."}
          {!isBitBadgesHosted && !immutable && "This collection's balances are hosted via the server at the URL specified below. The balances are assigned and controlled by whoever has control of the server."}



        </div>
        <br />
        <div className='flex-center'>
          <DistributionOverview collectionId={collectionId} md={18} xs={24} sm={24} /></div>

      </InformationDisplayCard>
    </>
  );
}

