import { ReactNode } from 'react';
import { DEV_MODE } from '../../constants';
import { InformationDisplayCard } from '../display/InformationDisplayCard';

export function DevMode({ obj, override, subtitle, inheritBg, noBorder

}: { obj?: Object, override?: boolean, subtitle?: string | ReactNode,
  inheritBg?: boolean, noBorder?: boolean

}) {
  if (!obj) return <></>;

  return <>{(DEV_MODE || override) &&
    <InformationDisplayCard title='' span={24} style={{ marginTop: '10px' }} subtitle={subtitle} inheritBg={inheritBg} noBorder={noBorder}>
      <pre className='full-width primary-text' style={{ marginTop: '10px', alignContent: 'left', textAlign: 'left' }}>
        {JSON.stringify(obj, null, 2)}
      </pre>
    </InformationDisplayCard>
  }</>
}