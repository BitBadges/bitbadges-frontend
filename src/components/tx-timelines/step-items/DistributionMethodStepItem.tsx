import { DistributionMethod } from "../../../bitbadges-api/types";
import { SwitchForm } from "../form-items/SwitchForm";

export function DistributionMethodStepItem(
    distributionMethod: DistributionMethod,
    setDistributionMethod: (newDistributionMethod: DistributionMethod) => void,
    fungible: boolean,
    nonFungible: boolean,
    hideUnminted: boolean = false,
    hideFirstComeFirstServe: boolean = false,
) {
    const options = [];
    if (!hideFirstComeFirstServe && (fungible || nonFungible)) {
        options.push({
            title: 'Open to Anyone (First Come, First Serve)',
            message: `First come, first serve. Limit one claim per address. ${fungible ? 'Any address can claim badges until the supply runs out.' : nonFungible ? 'The first user to claim will receive the badge with ID 1, the second user will receive ID 2, and so on until all badges are claimed.' : ''}`,
            isSelected: distributionMethod == DistributionMethod.FirstComeFirstServe,
        });
    }
    options.push(
        {
            title: 'Codes',
            message: 'Generate secret codes or passwords that can be redeemed for badges.',
            isSelected: distributionMethod == DistributionMethod.Codes,
        },
        {
            title: 'Whitelist',
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

            options={options}
            onSwitchChange={(_idx, newTitle) => {
                if (newTitle == 'Open to Anyone (First Come, First Serve)') {
                    setDistributionMethod(DistributionMethod.FirstComeFirstServe);
                } else if (newTitle == 'Codes') {
                    setDistributionMethod(DistributionMethod.Codes);
                } else if (newTitle == 'Whitelist') {
                    setDistributionMethod(DistributionMethod.Whitelist);
                } else if (newTitle == 'Unminted') {
                    setDistributionMethod(DistributionMethod.Unminted);
                }
            }}
        />,
        disabled: distributionMethod == DistributionMethod.None
    }
}