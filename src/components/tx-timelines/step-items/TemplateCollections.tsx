import { BigIntify, MsgUniversalUpdateCollection, UintRangeArray } from 'bitbadgesjs-sdk';
import { useState } from 'react';
import { useChainContext } from '../../../bitbadges-api/contexts/ChainContext';
import { BadgeAvatarDisplay } from '../../badges/BadgeAvatarDisplay';
import { SubmitMsgNewCollection } from '../form-items/SubmitMsgUniversalUpdateCollection';
import { SwitchForm } from '../form-items/SwitchForm';
import { GenericFormStepWrapper } from '../form-items/GenericFormStepWrapper';

const template1 = require('./templates/template1.json');
const template2 = require('./templates/template2.json');

export const FollowProtocolMessage = () => {
  return (
    <>
      This collection will have one badge of infinite supply that you assign to who you want to follow. You will always have full control over who you
      follow. Updating your following is instant, free, and does not require any blockchain transactions because balances are stored off-chain (learn
      more{' '}
      <a href="https://docs.bitbadges.io/overview/how-it-works/balances-types#off-chain" target="_blank" rel="noopener noreferrer">
        here
      </a>
      ).
      <br />
      <br />
      <BadgeAvatarDisplay collectionId={15n} badgeIds={UintRangeArray.From([{ start: 1n, end: 1n }])} showIds />
    </>
  );
};

export const FollowProtocolSubmit = () => {
  const chain = useChainContext();

  return (
    <SubmitMsgNewCollection
      msgUniversalUpdateCollection={new MsgUniversalUpdateCollection({
        ...template2,
        creator: chain.cosmosAddress,
        managerTimeline: [
          {
            manager: chain.cosmosAddress,
            timelineTimes: UintRangeArray.FullRanges()
          }
        ]
      }).convert(BigIntify)}
      isBitBadgesFollowProtocol
    />
  );
};

export const ExperiencesProtocolMessage = () => {
  return (
    <>
      This collection will have badges that you get to hand out based on your experiences. For example, give the authentic badge to users you trust.
      You will always have full control over who gets these badges. Updating the balances is instant, free, and does not require any blockchain
      transactions because balances are stored off-chain (learn more{' '}
      <a href="https://docs.bitbadges.io/overview/how-it-works/balances-types#off-chain" target="_blank" rel="noopener noreferrer">
        here
      </a>
      ).
      <br />
      <br />
      <BadgeAvatarDisplay collectionId={17n} badgeIds={UintRangeArray.From([{ start: 1n, end: 6n }])} showIds />
    </>
  );
};

export const ExperiencesProtocolSubmit = () => {
  const chain = useChainContext();

  return (
    <SubmitMsgNewCollection
      msgUniversalUpdateCollection={new MsgUniversalUpdateCollection({
        ...template1,
        creator: chain.cosmosAddress,
        managerTimeline: [
          {
            manager: chain.cosmosAddress,
            timelineTimes: UintRangeArray.FullRanges()
          }
        ]
      }).convert(BigIntify)}
      isExperiencesProtocol
    />
  );
};

export function TemplateCollectionSelect() {
  const [selectedIdx, setSelectedIdx] = useState<number>(0);

  return {
    title: 'Template Select',
    description: '',
    node: () => (
      <GenericFormStepWrapper
        documentationLink="https://docs.bitbadges.io/overview/ecosystem/bitbadges-follow-protocol"
        node={() => (
          <div>
            <SwitchForm
              options={[
                {
                  title: 'Follow Protocol',
                  message: <FollowProtocolMessage />,
                  isSelected: selectedIdx === 0,
                  additionalNode: () => <FollowProtocolSubmit />
                },
                {
                  title: 'Experiences',
                  message: <ExperiencesProtocolMessage />,
                  isSelected: selectedIdx === 1,
                  additionalNode: () => <ExperiencesProtocolSubmit />
                }
              ]}
              onSwitchChange={(idx) => {
                setSelectedIdx(idx);
              }}
            />
          </div>
        )}
      />
    )
  };
}
