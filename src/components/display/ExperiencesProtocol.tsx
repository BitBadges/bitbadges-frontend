import { InfoCircleOutlined } from '@ant-design/icons';
import { BatchBadgeDetails } from 'bitbadgesjs-sdk';
import { useEffect, useState } from 'react';
import { getCollectionForProtocol } from '../../bitbadges-api/api';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { fetchAccounts, useAccount } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { fetchCollectionsWithOptions } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { INFINITE_LOOP_MODE } from '../../constants';
import { CollectionDisplayWithBadges } from '../badges/MultiCollectionBadgeDisplay';
import { EmptyIcon } from '../common/Empty';
import { ExperiencesProtocolMessage, ExperiencesProtocolSubmit } from '../tx-timelines/step-items/TemplateCollections';
import { Divider } from './Divider';
import { InformationDisplayCard } from './InformationDisplayCard';

export function ExperiencesProtocolDisplay({ addressOrUsername }: { addressOrUsername?: string }) {
  const accountInfo = useAccount(addressOrUsername);
  const chain = useChainContext();

  const [protocolCollectionId, setProtocolCollectionId] = useState<bigint>(0n);

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: get portfolio info');
    async function getPortfolioInfo() {
      //Check if addressOrUsername is an address or account number and fetch portfolio accordingly
      if (!addressOrUsername) return;
      setProtocolCollectionId(0n);
      await fetchAccounts([addressOrUsername]);
    }
    getPortfolioInfo();
  }, [addressOrUsername]);

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: get follow details');
    async function getFollowDetailsInfo() {
      if (!accountInfo) return;
      const res = await getCollectionForProtocol({
        address: accountInfo?.cosmosAddress,
        name: 'Experiences Protocol'
      });
      if (!res.collectionId) return;

      setProtocolCollectionId(res.collectionId);

      await fetchCollectionsWithOptions([
        {
          collectionId: res.collectionId,
          fetchTotalAndMintBalances: true,

          metadataToFetch: { badgeIds: [{ start: 1n, end: 10n }] }
        }
      ]);
    }
    getFollowDetailsInfo();
  }, [accountInfo]);

  return (
    <InformationDisplayCard
      title={<div className="flex-center">Experiences Protocol</div>}
      md={8}
      xs={24}
      sm={24}
      subtitle={'Share how your experiences went with specific users via badges.'}>
      <br />
      {
        <div className="" style={{ textAlign: 'center' }}>
          {!!protocolCollectionId && (
            <div className="">
              <div className="secondary-text">
                <InfoCircleOutlined /> This is the collection that this user uses for their experiences. Their experiences are determined by who owns
                the badges in this collection.
              </div>
              <br />
              <div className="flex-center full-width">
                <CollectionDisplayWithBadges
                  browseDisplay
                  hideCollectionLink
                  span={24}
                  badgeObj={
                    new BatchBadgeDetails({
                      collectionId: protocolCollectionId,
                      badgeIds: [{ start: 1n, end: 10n }]
                    })
                  }
                />
              </div>
            </div>
          )}
          {(!protocolCollectionId || !BigInt(protocolCollectionId)) && (
            <div className="secondary-text">
              <EmptyIcon description="This user has not set up their experiences collection yet." />
              {chain.cosmosAddress && chain.cosmosAddress === accountInfo?.cosmosAddress && (
                <>
                  <div className="secondary-text">
                    <InfoCircleOutlined /> You can set yours up via the template below.
                  </div>
                  <Divider />
                  <div className="primary-text" style={{ fontSize: 20, fontWeight: 'bolder' }}>
                    Experiences Collection Template
                  </div>
                  <ExperiencesProtocolMessage />
                  <ExperiencesProtocolSubmit />
                </>
              )}
            </div>
          )}
        </div>
      }
    </InformationDisplayCard>
  );
}
