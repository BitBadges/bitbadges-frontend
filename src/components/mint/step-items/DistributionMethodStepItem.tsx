import { DistributionMethod } from "../../../bitbadges-api/types";
import { SwitchForm } from "../../common/SwitchForm";

export function DistributionMethodStepItem(
    distributionMethod: DistributionMethod,
    setDistributionMethod: (newDistributionMethod: DistributionMethod) => void,
    fungible: boolean,
    hideUnminted: boolean = false,
    hideFirstComeFirstServe: boolean = false,
) {
    const options = [];
    if (!hideFirstComeFirstServe) {
        options.push({
            title: 'Anyone Can Claim (First Come, First Serve)',
            message: `First come, first serve. ${fungible ? 'Anyone can claim badges until the supply runs out (one claim per account).' : 'The first user to claim will receive the badge with ID 0, the second user will receive ID 1, and so on.'}`,
            isSelected: distributionMethod == DistributionMethod.FirstComeFirstServe,
        });
    }
    options.push(
        {
            title: 'Claim by Codes',
            message: 'Generate secret codes that can be redeemed for badges. You choose how to distribute these codes.',
            isSelected: distributionMethod == DistributionMethod.Codes,
        },
        {
            title: 'Claim by Whitelist',
            message: 'Whitelist specific addresses to receive badges.',
            isSelected: distributionMethod == DistributionMethod.Whitelist,
        }
    );

    if (!hideUnminted) {
        options.push({
            title: 'Unminted',
            message: 'Do nothing now. Leave the distribution of badges for a later time.',
            isSelected: distributionMethod == DistributionMethod.Unminted,
        })
    }



    return {
        title: `How Would You Like To Distribute These Badges?`,
        description: '',
        node: <SwitchForm
            noSelectUntilClick
            options={options}
            onSwitchChange={(_idx, newTitle) => {
                if (newTitle == 'Anyone Can Claim (First Come, First Serve) ') {
                    setDistributionMethod(DistributionMethod.FirstComeFirstServe);
                } else if (newTitle == 'Claim by Codes') {
                    setDistributionMethod(DistributionMethod.Codes);
                } else if (newTitle == 'Claim by Whitelist') {
                    setDistributionMethod(DistributionMethod.Whitelist);
                } else if (newTitle == 'Unminted') {
                    setDistributionMethod(DistributionMethod.Unminted);
                }
            }}
        />,
        disabled: distributionMethod == DistributionMethod.None
    }
}