import { useState } from "react";
import { SwitchForm } from "../../common/SwitchForm";

export function FungibleSelectStepItem(
    fungible: boolean,
    setFungible: (fungible: boolean) => void
) {
    const [handledFungible, setHandledFungible] = useState(false);

    return {
        title: 'Identical or Unique Badges?',
        description: '',
        node: <SwitchForm
            noSelectUntilClick
            options={[
                {
                    title: 'Identical',
                    message: 'Badges will all be identical. The collection will consist of 1 badge with supply Y (fungible).',
                    isSelected: fungible,
                },
                {
                    title: 'Unique',
                    message: 'Badges will have their own unique characteristics. The collection will consist of X badges each with supply 1 (non-fungible).',
                    isSelected: !fungible,
                },
            ]}
            onSwitchChange={(idx) => {
                setFungible(idx === 0);
                setHandledFungible(true);
            }}
        />,
        disabled: !handledFungible
    }
}