import { InfoCircleOutlined } from '@ant-design/icons';
import { BigIntify } from 'bitbadgesjs-sdk';
import { useEffect, useState } from 'react';
import { getCollectionForProtocol } from '../../bitbadges-api/api';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { fetchAccounts, useAccount } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { INFINITE_LOOP_MODE } from '../../constants';
import { BadgeAvatarDisplay } from '../badges/BadgeAvatarDisplay';
import { CollectionDisplayWithBadges } from '../badges/MultiCollectionBadgeDisplay';
import { EmptyIcon } from '../common/Empty';
import { SubmitMsgNewCollection } from '../tx-timelines/form-items/SubmitMsgUniversalUpdateCollection';
import { InformationDisplayCard } from './InformationDisplayCard';

import { convertMsgUniversalUpdateCollection } from "bitbadgesjs-sdk";
import { fetchCollectionsWithOptions } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { GO_MAX_UINT_64 } from '../../utils/dates';
import { Divider } from './Divider';
const template2 = require('../tx-timelines/step-items/templates/template2.json');

export function ExperiencesProtocolDisplay({ addressOrUsername }: { addressOrUsername?: string }) {
  const accountInfo = useAccount(addressOrUsername as string);
  const chain = useChainContext();

  const [protocolCollectionId, setProtocolCollectionId] = useState<bigint>(0n);


  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: get portfolio info');
    async function getPortfolioInfo() {
      //Check if addressOrUsername is an address or account number and fetch portfolio accordingly
      if (!addressOrUsername) return;
      setProtocolCollectionId(0n);
      await fetchAccounts([addressOrUsername as string]);

    }
    getPortfolioInfo();
  }, [addressOrUsername]);

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: get follow details');
    async function getFollowDetailsInfo() {
      if (!accountInfo) return;
      const res = await getCollectionForProtocol({ address: accountInfo?.cosmosAddress, name: 'Experiences Protocol' })
      if (!res.collectionId) return;

      setProtocolCollectionId(res.collectionId);

      await fetchCollectionsWithOptions([{
        collectionId: res.collectionId,
        fetchTotalAndMintBalances: true,

        metadataToFetch: { badgeIds: [{ start: 1n, end: 10n }] }
      }]);
    }
    getFollowDetailsInfo();
  }, [accountInfo]);


  return (
    <InformationDisplayCard title={<div className='flex-center'>Experiences Protocol</div>} md={8} xs={24} sm={24} subtitle={'Share how your experiences went with specific users via badges.'} >
      <br />
      {<div className='' style={{ textAlign: 'center' }}>
        {!!protocolCollectionId && <div className=''>
          <div className='secondary-text'>
            <InfoCircleOutlined /> This is the collection that this user uses for their experiences. Their experiences are determined by who owns the badges in this collection.
          </div>
          <br />
          <div className='flex-center full-width'>
            <CollectionDisplayWithBadges
              browseDisplay
              hideCollectionLink
              span={24}
              badgeObj={{
                collectionId: protocolCollectionId,
                badgeIds: [{ start: 1n, end: 10n }]
              }}
            />
          </div>


        </div>}
        {(!protocolCollectionId || !BigInt(protocolCollectionId)) && <div className='secondary-text'>
          <EmptyIcon description='This user has not set up their experiences collection yet.' />
          {chain.cosmosAddress && chain.cosmosAddress === accountInfo?.cosmosAddress && <><div className='secondary-text'>
            <InfoCircleOutlined /> You can set yours up via the template below.
          </div>
            <Divider />
            <div className='primary-text' style={{ fontSize: 20, fontWeight: 'bolder' }}>
              Experiences Collection Template
            </div>
            <>
              This collection will have badges that you get to hand out based on your experiences.
              For example, give the authentic badge to users you trust. You will always have full control over who gets these badges.
              Updating the balances is instant, free, and does not require any blockchain transactions
              because balances are stored off-chain (learn more <a href="https://docs.bitbadges.io/overview/how-it-works/balances-types#off-chain" target="_blank" rel="noopener noreferrer">here</a>).
              <br />
              <br />
              <BadgeAvatarDisplay collectionId={17n} badgeIds={[{ start: 1n, end: 6n }]} showIds />
            </>
            <>
              <SubmitMsgNewCollection
                MsgUniversalUpdateCollection={convertMsgUniversalUpdateCollection({
                  ...template2,
                  creator: chain.cosmosAddress,
                  managerTimeline: [{
                    manager: chain.cosmosAddress,
                    timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                  }],
                }, BigIntify)}
                isExperiencesProtocol
              // afterTx={async (collectionId: bigint) => {
              //   // await updateFollowDetails({ followingCollectionId: collectionId });
              // }}
              />
            </>
          </>}
        </div>}
      </div>}
    </InformationDisplayCard>
  );
}