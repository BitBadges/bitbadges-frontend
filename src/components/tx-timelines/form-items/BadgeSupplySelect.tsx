import { InputNumber } from 'antd';
import { Balance } from 'bitbadgesjs-proto';
import { useState } from 'react';
import { FOREVER_DATE } from '../../../utils/dates';

export function BadgeSupply({
  setCurrentSupply,
  fungible,
  startBadgeId,

}: {
  setCurrentSupply: (currentSupply: Balance<bigint>) => void,
  fungible: boolean;
  startBadgeId: bigint;
}) {
  const [supplyToCreate, setSupplyToCreate] = useState<bigint>(0n);

  const addTokens = (supply: bigint) => {
    if (supply > 0) {
      if (!fungible) {
        setCurrentSupply({
          amount: 1n,
          badgeIds: [{ start: startBadgeId, end: startBadgeId + BigInt(supply) - 1n }],
          ownedTimes: [{ start: 1n, end: FOREVER_DATE }],
        })
      } else {
        setCurrentSupply({
          amount: BigInt(supply),
          badgeIds: [{ start: startBadgeId, end: startBadgeId }],
          ownedTimes: [{ start: 1n, end: FOREVER_DATE }],
        })
      }
    }
  }

  return (
    <div>
      <div className='flex-between' style={{ flexDirection: 'column' }} >
        <b>Number of Badges</b>
        <InputNumber
          value={Number(supplyToCreate)}
          className='primary-text primary-blue-bg'
          defaultValue={1}
          min={1}
          max={Number.MAX_SAFE_INTEGER}
          onChange={
            (value) => {
              setSupplyToCreate(BigInt(value));
              addTokens(BigInt(value));
            }
          } />
      </div>
    </div >
  )
}