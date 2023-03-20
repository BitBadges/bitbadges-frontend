import { Balance } from '../../bitbadges-api/types';
import { NumberInput } from '../display/NumberInput';

export function BalancesInput({
    balances,
    setBalances,
    darkMode,
    title
}: {
    balances: Balance[],
    setBalances: (balances: Balance[]) => void,
    darkMode?: boolean
    title?: string
}) {
    return <NumberInput
        min={1}
        value={balances[0]?.balance}
        setValue={(value: number) => {
            if (!value || value <= 0) {
                setBalances([
                    {
                        badgeIds: balances[0]?.badgeIds || [],
                        balance: 0,
                    }
                ]);
            }
            else {
                setBalances([
                    {
                        badgeIds: balances[0]?.badgeIds || [],
                        balance: value,
                    }
                ]);
            }
        }}
        darkMode={darkMode}
        title={"Amount to Transfer"}
    />
}
