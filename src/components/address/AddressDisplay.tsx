import { ReactNode } from 'react';

import { AddressWithBlockies } from './AddressWithBlockies';
import { SupportedChain } from 'bitbadgesjs-utils';

export function AddressDisplayTitle({ title, icon }: { title: string | ReactNode, icon?: ReactNode }) {
  return <div className='flex-between' style={{ fontSize: 20 }}>
    <b>{title ? title : 'Add Addresses'}</b>
    <div>{icon}</div>
  </div>
}

export function AddressDisplay({
  addressOrUsername,
  title,
  icon,
  fontColor,
  fontSize,
  hidePortfolioLink,
  hideTooltip,
  overrideChain,
}: {
  addressOrUsername: string;
  title?: string | ReactNode,
  icon?: ReactNode,
  fontColor?: string
  fontSize?: number,
  hideChains?: boolean
  hidePortfolioLink?: boolean
  hideTooltip?: boolean,
  overrideChain?: SupportedChain
}) {
  return <>
    {title && AddressDisplayTitle({ title, icon })}
    <div className='flex-between flex-wrap' style={{ paddingRight: 0 }}>
      <AddressWithBlockies
        addressOrUsername={addressOrUsername}
        fontSize={fontSize}
        fontColor={fontColor ?? 'white'}
        hidePortfolioLink={hidePortfolioLink}
        hideTooltip={hideTooltip}
        overrideChain={overrideChain}
      />
      <div className='flex-center' style={{ color: fontColor ? 'white' : undefined }} >
        <div style={{ marginLeft: 8 }}>
          {icon}
        </div>
      </div>
    </div>
  </>
}