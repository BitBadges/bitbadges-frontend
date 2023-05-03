import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { DistributionMethod } from "bitbadgesjs-utils";
import { SwitchForm } from "../form-items/SwitchForm";

export function ChooseBadgeTypeStepItem(
  newCollectionMsg: MessageMsgNewCollection,
  setNewCollectionMsg: (newCollectionMsg: MessageMsgNewCollection) => void,
  setManualSend: (manualSend: boolean) => void,
  setDistributionMethod: (distributionMethod: DistributionMethod) => void,
) {
  return {
    title: 'Choose Badge Type',
    description: 'Select a badge type.',
    node: <div>
      <SwitchForm
        options={[
          {
            title: 'On-Chain',
            message: 'Everything about a badge is stored on the blockchain and updated via blockchain transactions. Most customizable option but also the most expensive. ',
            isSelected: newCollectionMsg.standard === 0,
          },
          {
            title: 'Off-Chain Balances',
            message: 'Badges are stored on the blockchain, but all balances are stored off-chain to make it less expensive. Because balances are off-chain, they must either a) be permanent and frozen forever or b) only updatable by the manager of the collection.',
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
          } else {
            setManualSend(false);
            setDistributionMethod(DistributionMethod.None);
          }
        }}
      />

    </div>
  }
}