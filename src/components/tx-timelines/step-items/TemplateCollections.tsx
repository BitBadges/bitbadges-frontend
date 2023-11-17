import { useState } from "react";
import { SwitchForm } from "../form-items/SwitchForm";
import { SubmitMsgNewCollection } from "../form-items/SubmitMsgUpdateCollection";
import { BigIntify, convertMsgUpdateCollection } from "bitbadgesjs-proto";
import { useChainContext } from "../../../bitbadges-api/contexts/ChainContext";
import { BadgeAvatarDisplay } from "../../badges/BadgeAvatarDisplay";

const template1 = require('./templates/template1.json');

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
            title: 'My Experiences',
            message: <>
              This collection will have six badges of infinite supply that you get to hand out based on your experiences.
              You will always have full control over who gets these badges.
              Updating the balances (who owns which badge?) is instant, free, and does not require any blockchain transactions
              because balances are stored off-chain (learn more <a href="https://docs.bitbadges.io/overview/how-it-works/balances-types#off-chain" target="_blank" rel="noopener noreferrer">here</a>).

              <br />
              <br />
              <BadgeAvatarDisplay collectionId={1n} badgeIds={[{ start: 1n, end: 10n }]} showIds />
              <br />
              <ul>
                {/* //following, met IRL, GM badge, scammer, trustworthy, untrustworthy  */}
                <li><b>Following (ID 1): </b>Give this badge to users you want to follow.</li>
                <li><b>Met IRL (ID 2): </b>Give this badge to users you have met in real life.</li>
                <li><b>GM Badge (ID 3): </b>Give this badge to users you want to give a good morning to.</li>
                <li><b>Scammer (ID 4): </b>Give this badge to users you think are scammers.</li>
                <li><b>Trustworthy (ID 5): </b>Give this badge to users you think are trustworthy.</li>
                <li><b>Untrustworthy (ID 6): </b>Give this badge to users you think are untrustworthy.</li>
              </ul>
            </>,
            isSelected: selectedIdx === 0,
            additionalNode: <>
              <SubmitMsgNewCollection
                msgUpdateCollection={convertMsgUpdateCollection({
                  ...template1,
                  creator: chain.cosmosAddress,
                  //TODO: manager timeline?
                }, BigIntify)}
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