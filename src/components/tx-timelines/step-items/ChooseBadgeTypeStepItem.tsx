import { DistributionMethod } from "bitbadgesjs-utils";
import { SwitchForm } from "../form-items/SwitchForm";
import { EmptyStepItem } from "../TxTimeline";

export function ChooseBadgeTypeStepItem(
  distributionMethod: DistributionMethod,
  setDistributionMethod: (distributionMethod: DistributionMethod) => void,
) {
  return EmptyStepItem;

  return {
    title: 'Choose Badge Type',
    description: 'Select a badge type.',
    node: <div>
      <SwitchForm
        options={[
          {
            title: 'On-Chain',
            message: 'Everything about a badge is stored on the blockchain and updated via blockchain transactions. Most customizable option but also the most expensive. ',
            isSelected: distributionMethod !== DistributionMethod.OffChainBalances
          },
          {
            title: 'Off-Chain Balances',
            message: 'Badges are stored on the blockchain, but all balances are stored off-chain to make it less expensive. Because balances are off-chain, they must either a) be permanent and frozen forever or b) only updatable by the manager of the collection.',
            isSelected: distributionMethod === DistributionMethod.OffChainBalances
          },
        ]}
        onSwitchChange={(idx) => {
          if (idx === 1) {
            setDistributionMethod(DistributionMethod.OffChainBalances);
          } else {
            setDistributionMethod(DistributionMethod.None);
          }
        }}
      />
    </div>
  }
}