import React, { useState, useEffect } from 'react';
import { Balance, BitBadgeCollection } from '../../bitbadges-api/types';
import { Divider, InputNumber } from 'antd';
import { IdRangesInput } from './IdRangesInput';
import { PRIMARY_BLUE, PRIMARY_TEXT } from '../../constants';

//TODO: support multiple balances
export function BalancesInput({
    collection,
    balances,
    setBalances,
    darkMode,
}: {
    collection?: BitBadgeCollection
    balances: Balance[],
    setBalances: (balances: Balance[]) => void,
    darkMode?: boolean,
}) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
        <div className='flex-between' style={{ flexDirection: 'column' }} >
            <b>Amount to Transfer</b>
            <InputNumber
                min={1}
                title='Amount to Transfer'
                value={balances[0]?.balance} onChange={
                    (value: number) => {
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
                    }
                }
                style={darkMode ? {
                    backgroundColor: PRIMARY_BLUE,
                    color: PRIMARY_TEXT,
                } : undefined}
            />
        </div>
        <IdRangesInput
            idRanges={balances[0]?.badgeIds}
            setIdRanges={(badgeIds) => {
                setBalances([
                    {
                        balance: balances[0]?.balance || 0,
                        badgeIds
                    }
                ]);
            }}
            maximum={collection?.nextBadgeId ? collection?.nextBadgeId - 1 : undefined}
            darkMode={darkMode}
        />
    </div>
}
