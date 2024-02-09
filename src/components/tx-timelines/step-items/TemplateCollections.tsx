import { BigIntify, convertMsgUniversalUpdateCollection } from "bitbadgesjs-sdk";
import { useState } from "react";
import { useChainContext } from "../../../bitbadges-api/contexts/ChainContext";
import { GO_MAX_UINT_64 } from "../../../utils/dates";
import { BadgeAvatarDisplay } from "../../badges/BadgeAvatarDisplay";
import { SubmitMsgNewCollection } from "../form-items/SubmitMsgUniversalUpdateCollection";
import { SwitchForm } from "../form-items/SwitchForm";
import { GenericFormStepWrapper } from "../form-items/GenericFormStepWrapper";

const template1 = require('./templates/template1.json');
const template2 = require('./templates/template2.json');

export function TemplateCollectionSelect() {
  const chain = useChainContext();
  const [selectedIdx, setSelectedIdx] = useState<number>(0);

  return {
    title: 'Template Select',
    description: '',
    node: () => <GenericFormStepWrapper
      documentationLink="https://docs.bitbadges.io/overview/ecosystem/bitbadges-follow-protocol"
      node={() => <div>
        <SwitchForm

          options={[

            {
              title: 'Follow Protocol',
              message: <>
                This collection will have one badge of infinite supply that you assign to who you want to follow.
                You will always have full control over who you follow.
                Updating your following is instant, free, and does not require any blockchain transactions
                because balances are stored off-chain (learn more <a href="https://docs.bitbadges.io/overview/how-it-works/balances-types#off-chain" target="_blank" rel="noopener noreferrer">here</a>).
                <br />
                <br />
                <BadgeAvatarDisplay collectionId={15n} badgeIds={[{ start: 1n, end: 1n }]} showIds />

              </>,
              isSelected: selectedIdx === 0,
              additionalNode: () => <>
                <SubmitMsgNewCollection
                  MsgUniversalUpdateCollection={convertMsgUniversalUpdateCollection({
                    ...template2,
                    creator: chain.cosmosAddress,
                    managerTimeline: [{
                      manager: chain.cosmosAddress,
                      timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                    }],
                  }, BigIntify)}
                  isBitBadgesFollowProtocol
                // afterTx={async (collectionId: bigint) => {
                //   await updateFollowDetails({ followingCollectionId: collectionId });
                // }}
                />
              </>
            },
            {
              title: 'Experiences',
              message: <>
                This collection will have badges that you get to hand out based on your experiences.
                For example, give the authentic badge to users you trust. You will always have full control over who gets these badges.
                Updating the balances is instant, free, and does not require any blockchain transactions
                because balances are stored off-chain (learn more <a href="https://docs.bitbadges.io/overview/how-it-works/balances-types#off-chain" target="_blank" rel="noopener noreferrer">here</a>).

                <br />
                <br />
                <BadgeAvatarDisplay collectionId={17n} badgeIds={[{ start: 1n, end: 6n }]} showIds />
              </>,
              isSelected: selectedIdx === 1,
              additionalNode: () => <>
                <SubmitMsgNewCollection
                  MsgUniversalUpdateCollection={convertMsgUniversalUpdateCollection({
                    ...template1,
                    creator: chain.cosmosAddress,
                    managerTimeline: [{
                      manager: chain.cosmosAddress,
                      timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                    }],
                  }, BigIntify)}
                  isExperiencesProtocol
                />
              </>
            },
          ]}
          onSwitchChange={(idx) => {
            setSelectedIdx(idx);
          }}

        />
      </div>
      }
    />
  }
}