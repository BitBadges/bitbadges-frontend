import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { SwitchForm } from "../form-items/SwitchForm";
import { DistributionMethod } from "bitbadgesjs-utils";

export function ChooseBadgeTypeStepItem(
  newCollectionMsg: MessageMsgNewCollection, 
  setNewCollectionMsg: (newCollectionMsg: MessageMsgNewCollection) => void, 
  setManualSend: (manualSend: boolean) => void,
  setDistributionMethod: (distributionMethod: DistributionMethod) => void,
) {
    return {
        title: 'Choose Badge Type',
        description: 'Select a badge type.',
        node: <SwitchForm
            options={[
                {
                    title: 'On-Chain',
                    message: 'Everything about a badge is stored on the blockchain and updated via blockchain transactions. Most customizable option but also the most expensive. ',
                    isSelected: newCollectionMsg.standard === 0,
                },
                {
                    title: 'Off-Chain Balances',
                    message: 'Badges are stored on the blockchain, but all balances (i.e. the owners of each badge) are stored off-chain to make it less expensive. This option should only in two cases: a) it is okay for the manager (you) to have complete control over the badge balances and can update them at all times, or b) the badge is non-transferable (soulbound) and balances are to be permanent forever.',
                    isSelected: newCollectionMsg.standard === 1,
                },
            ]}
            onSwitchChange={(idx) => { 
              setNewCollectionMsg({
                ...newCollectionMsg,
                standard: idx,
              })

              if (idx === 1) {
                setManualSend(true);
                setDistributionMethod(DistributionMethod.Whitelist);
              }
            }}
        />
    }
}