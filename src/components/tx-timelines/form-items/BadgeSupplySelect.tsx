import { InputNumber } from 'antd';
import { BadgeSupplyAndAmount } from 'bitbadgesjs-proto';
import { useState } from 'react';

export function BadgeSupply({
  setCurrentSupply,
  fungible
}: {
  setCurrentSupply: (currentSupply: BadgeSupplyAndAmount<bigint>) => void,
  fungible: boolean;
}) {
  const [supplyToCreate, setSupplyToCreate] = useState<number>(0);

  const addTokens = (supply: number) => {
    if (supply > 0) {
      if (!fungible) {
        setCurrentSupply({
          amount: BigInt(supply),
          supply: 1n
        })
      } else {
        setCurrentSupply({
          amount: 1n,
          supply: BigInt(supply)
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
          className='primary-text primary-blue-bg'
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