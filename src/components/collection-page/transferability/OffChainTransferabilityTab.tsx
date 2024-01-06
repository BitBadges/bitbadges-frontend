import { WarningOutlined } from '@ant-design/icons';
import { useCollection } from '../../../bitbadges-api/contexts/collections/CollectionsContext';
import { DistributionOverview } from '../../badges/DistributionCard';
import { Divider } from '../../display/Divider';
import { InformationDisplayCard } from '../../display/InformationDisplayCard';
import { getMetadataForBadgeId } from 'bitbadgesjs-utils';
import { MarkdownDisplay } from '../../../pages/account/[addressOrUsername]/settings';
import { areBalancesBitBadgesHosted } from '../../../bitbadges-api/utils/balances';

export function OffChainTransferabilityTab({ collectionId, badgeId }: {
  collectionId: bigint,
  badgeId?: bigint,
}) {

  const collection = useCollection(collectionId);
  const isBitBadgesHosted = areBalancesBitBadgesHosted(collection);

  if (!collection) return <></>;


  let info = {
    'host': collection.offChainBalancesMetadataTimeline.length > 0 ?
      collection.offChainBalancesMetadataTimeline[0].offChainBalancesMetadata.uri :
      'Unknown',
    'assignMethod': 'Custom. Balances can be updated by whoever has permission to update what is returned from the server.',
  }

  const currMetadata = badgeId ? getMetadataForBadgeId(badgeId, collection.cachedBadgeMetadata) : collection.cachedCollectionMetadata;
  if (currMetadata?.offChainTransferabilityInfo) {
    if (currMetadata.offChainTransferabilityInfo.host) {
      info.host = currMetadata.offChainTransferabilityInfo.host;
    }
    if (currMetadata.offChainTransferabilityInfo.assignMethod) {
      info.assignMethod = currMetadata.offChainTransferabilityInfo.assignMethod;
    }
  } else if (isBitBadgesHosted) {
    info = {
      'host': 'Balances are maintained by BitBadges. If balances are updatable, we store them on our centralized DigitalOcean Spaces. If balances are immutable, we store them in a decentralized manner on IPFS. If the balances URL is updatable, the collection manager can choose to move off of BitBadges\' service, if desired.',
      "assignMethod": 'If updatable, balances can only be assigned manually by the collection manager.',
    }
  } else if (collection.offChainBalancesMetadataTimeline[0].offChainBalancesMetadata.uri === "https://api.bitbadges.io/api/v0/ethFirstTx/{address}") {
    info = {
      'host': 'Balances are hosted and fetched on-demand by the BitBadges API.',
      "assignMethod": 'To determine badge balances, the date of a user\'s first Ethereum transaction on the mainnet blockchain is queried. See https://github.com/BitBadges/bitbadges-indexer/blob/master/src/routes/ethFirstTx.ts for the full code.',
    }
  } else if (collection.offChainBalancesMetadataTimeline[0].offChainBalancesMetadata.uri === "https://bitbadges-balances.nyc3.digitaloceanspaces.com/airdrop/balances") {
    info = {
      'host': 'Balances are hosted by the BitBadges API.',
      "assignMethod": 'Each user is assigned a balance of x1 if they have claimed their BitBadges betanet airdrop.',
    }
  }

  return (
    <>
      <br />
      <div className='flex flex-wrap'>
        <InformationDisplayCard
          title='Transferability'
          subtitle={<>This collection stores its balances off-chain,
            meaning no approvals or transfers happen on the blockchain.

            {' '}Learn more <a
              target='_blank'
              href="https://docs.bitbadges.io/overview/concepts/balances-types" rel="noreferrer">
              here

            </a>.</>}
          md={12}
          xs={24}
          sm={24}
        >

          <br />
          <div className='flex-center'>
            <DistributionOverview noBorder inheritBg collectionId={collectionId} md={24} xs={24} sm={24} hideTitle />
          </div>

        </InformationDisplayCard>
        <InformationDisplayCard
          title='Additional Details'
          subtitle={<>Additional information regarding the storage of the balances.
          </>}
          md={12}
          xs={24}
          sm={24}
        >
          <InformationDisplayCard title='' inheritBg span={24} noBorder style={{ textAlign: 'left' }}>
            <b>Where are the balances hosted?</b>
            <br />
            <div className='flex secondary-text'>
              <MarkdownDisplay markdown={info.host} />
            </div>
            <br />
            <b>How are balances assigned?</b>
            <br />
            <div className='flex secondary-text'>
              <MarkdownDisplay markdown={info.assignMethod} />
            </div>
            <br />
            <Divider />
            <div className='secondary-text'>
              <WarningOutlined style={{ color: 'orange' }} />
              <span style={{ color: 'orange' }}> Warning</span> - Interact with third-party sites at your own risk.
              Remember, this collection will never have any on-chain approval or transfer transactions for these badges because they are stored off-chain.
            </div>
          </InformationDisplayCard>
        </InformationDisplayCard>
      </div>
    </>
  );
}

