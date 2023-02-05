import React, { useState, useEffect } from 'react';
import { Balance, BitBadgeCollection } from '../../bitbadges-api/types';
import { InputNumber } from 'antd';
import { IdRangesInput } from './IdRangesInput';

//TODO: support multiple balances
export function BalancesInput({
    collection,
    balances,
    setBalances,
}: {
    collection?: BitBadgeCollection
    balances: Balance[],
    setBalances: (balances: Balance[]) => void,
}) {
    const [amount, setAmount] = useState<number>(0);

    return <div>
        <div className='flex-between'>
            Amount to Transfer Per Recipient:
            <InputNumber
                min={1}
                title='Amount to Transfer'
                value={amount} onChange={
                    (value: number) => {
                        if (!value || value <= 0) {
                            setAmount(0);
                        }
                        else {
                            setAmount(value);
                        }
                    }
                }
            />
        </div>
        <IdRangesInput
            idRanges={balances[0]?.badgeIds}
            setIdRanges={(badgeIds) => {
                setBalances([
                    {
                        ...balances[0],
                        badgeIds
                    }
                ]);
            }}
            maximum={collection?.nextBadgeId ? collection?.nextBadgeId - 1 : undefined}
        />
    </div>
}
