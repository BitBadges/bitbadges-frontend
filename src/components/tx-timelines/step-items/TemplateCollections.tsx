import { useState } from "react";
import { SwitchForm } from "../form-items/SwitchForm";
import { SubmitMsgNewCollection } from "../form-items/SubmitMsgUniversalUpdateCollection";
import { BigIntify, convertMsgUniversalUpdateCollection } from "bitbadgesjs-proto";
import { useChainContext } from "../../../bitbadges-api/contexts/ChainContext";
import { BadgeAvatarDisplay } from "../../badges/BadgeAvatarDisplay";
import { updateFollowDetails } from "../../../bitbadges-api/api";
import { GO_MAX_UINT_64 } from "../../../utils/dates";

const template1 = require('./templates/template1.json');
const template2 = require('./templates/template2.json');

export function TemplateCollectionSelect() {
  const chain = useChainContext();
  const [selectedIdx, setSelectedIdx] = useState<number>(0);

  return {
    title: 'Template Select',
    description: '',
    node: <div>
      <SwitchForm
        options={[
          {
            title: 'Experiences',
            message: <>
              This collection will have badges of infinite supply that you get to hand out based on your experiences.
              For example, give the trustworthy badge to users you trust.
              <br />
              <br />
              You will always have full control over who gets these badges.
              Updating the balances (who owns which badge?) is instant, free, and does not require any blockchain transactions
              because balances are stored off-chain (learn more <a href="https://docs.bitbadges.io/overview/how-it-works/balances-types#off-chain" target="_blank" rel="noopener noreferrer">here</a>).

              <br />
              <br />
              <BadgeAvatarDisplay collectionId={1n} badgeIds={[{ start: 1n, end: 10n }]} showIds />
            </>,
            isSelected: selectedIdx === 0,
            additionalNode: <>
              <SubmitMsgNewCollection
                MsgUniversalUpdateCollection={convertMsgUniversalUpdateCollection({
                  ...template1,
                  creator: chain.cosmosAddress,
                  managerTimeline: [{
                    manager: chain.cosmosAddress,
                    timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                  }],
                }, BigIntify)}
              />
            </>
          },
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
            isSelected: selectedIdx === 1,
            additionalNode: <>
              <SubmitMsgNewCollection
                MsgUniversalUpdateCollection={convertMsgUniversalUpdateCollection({
                  ...template2,
                  creator: chain.cosmosAddress,
                  managerTimeline: [{
                    manager: chain.cosmosAddress,
                    timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                  }],
                }, BigIntify)}
                afterTx={async (collectionId: bigint) => {
                  await updateFollowDetails({ followingCollectionId: collectionId });
                }}
              />
            </>
          }
        ]}
        onSwitchChange={(idx) => {
          setSelectedIdx(idx);
        }}

      />
    </div>
  }
}