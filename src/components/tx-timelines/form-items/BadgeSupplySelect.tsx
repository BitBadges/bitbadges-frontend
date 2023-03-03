import { InputNumber, Divider } from 'antd';
import { useState } from 'react';
import { BadgeSupplyAndAmount } from '../../../bitbadges-api/types';
import { PRIMARY_BLUE, PRIMARY_TEXT } from '../../../constants';

export function BadgeSupply({
    setCurrentSupply,
    fungible
}: {
    setCurrentSupply: (currentSupply: BadgeSupplyAndAmount) => void,
    fungible: boolean;
}) {
    const [supplyToCreate, setSupplyToCreate] = useState<number>(0);

    const addTokens = (supply: number) => {
        if (supply > 0) {
            if (!fungible) {
                setCurrentSupply({
                    amount: supply,
                    supply: 1
                })
            } else {
                setCurrentSupply({
                    amount: 1,
                    supply: supply
                })
            }
        }
    }

    return (
        <div>
            <div className='flex-between' style={{ flexDirection: 'column' }} >
                <b>Number of Badges</b>
                <InputNumber
                    value={supplyToCreate}
                    style={{
                        backgroundColor: PRIMARY_BLUE,
                        color: PRIMARY_TEXT,
                    }}
                    defaultValue={1}
                    min={1}
                    onChange={
                        (value) => {
                            setSupplyToCreate(value as number);
                            addTokens(value);
                        }
                    } />
            </div>
        </div >
    )
}