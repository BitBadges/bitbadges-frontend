import { useState } from "react";
import { SwitchForm } from "../tx-timelines/form-items/SwitchForm";
import { DistributionMethod } from "bitbadgesjs-utils";

export function OrderMattersSelectStepItem(
  orderMatters: boolean,
  setOrderMatters: (orderMatters: boolean) => void,
  distributionMethod: DistributionMethod,
) {
  const [handled, setHandled] = useState(false);

  return {
    title: 'Claim Order',
    description: <div>
      <SwitchForm
        onSwitchChange={(idx) => {
          setOrderMatters(idx == 1);
          setHandled(true);
        }}
        options={[{
          title: 'Increasing',
          message: 'Increments will be calculated based on the total number of processed claims. First user to claim will receive the first increment of badges, second user will receive the second increment, etc.',
          isSelected: !orderMatters
        }, {
          title: 'Reserved',
          message: `According to the order of the ${distributionMethod === DistributionMethod.Whitelist ? "addresses you entered" : "codes"}, the first ${distributionMethod === DistributionMethod.Whitelist ? "address will always receive" : "code will always correspond to"
            } the first increment of badges, second to the second increment, and so on.`,
          isSelected: orderMatters
        }]}
        // noSelectUntilClick
      />
    </div>,
    disabled: !handled
  }
}