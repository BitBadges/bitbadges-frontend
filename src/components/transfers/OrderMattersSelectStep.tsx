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

      <div style={{ textAlign: 'center', marginTop: 4 }} className='primary-text'>
        <h3 style={{ textAlign: 'center' }} className='primary-text'>Who should receive what badges?</h3>
      </div>

      <SwitchForm
        onSwitchChange={(idx) => {
          setOrderMatters(idx == 1);
          setHandled(true);
        }}
        options={[{
          title: 'Incremental',
          message: 'First user to claim will receive the first increment of badges, second user will receive the second increment, etc.',
          isSelected: !orderMatters
        }, {
          title: 'Reserved',
          message: `According to the order of the ${distributionMethod === DistributionMethod.Whitelist ? "addresses you entered" : "codes"}, the first ${distributionMethod === DistributionMethod.Whitelist ? "address will receive" : "code will correspond to"
            } the first increment of badges, second to the second increment, and so on.`,
          isSelected: orderMatters
        }]}
        noSelectUntilClick
      />
    </div>,
    disabled: !handled
  }
}