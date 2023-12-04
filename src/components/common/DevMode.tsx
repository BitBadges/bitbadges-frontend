import { ReactNode } from 'react';
import { DEV_MODE } from '../../constants';
import { InformationDisplayCard } from '../display/InformationDisplayCard';

export function DevMode({ obj, override, subtitle }: { obj?: Object, override?: boolean, subtitle?: string | ReactNode }) {
  if (!obj) return <></>;

  return <>{(DEV_MODE || override) &&
    <InformationDisplayCard title='' span={24} style={{ marginTop: '10px' }} subtitle={subtitle}>
      <pre className='full-width primary-text' style={{ marginTop: '10px', alignContent: 'left', textAlign: 'left' }}>
        {JSON.stringify(obj, null, 2)}
      </pre>
    </InformationDisplayCard>
  }</>
}