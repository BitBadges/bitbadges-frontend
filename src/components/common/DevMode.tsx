import { ReactNode } from 'react';
import { DEV_MODE } from '../../constants';
import { MarkdownDisplay } from '../../pages/account/[addressOrUsername]/settings';
import { InformationDisplayCard } from '../display/InformationDisplayCard';

export function DevMode({
  obj,
  override,
  subtitle,
  inheritBg,
  noBorder,
  isJsonDisplay = true
}: {
  obj?: Object;
  override?: boolean;
  subtitle?: string | ReactNode;
  inheritBg?: boolean;
  noBorder?: boolean;
  isJsonDisplay?: boolean;
}) {
  if (!obj) return <></>;

  return (
    <>
      {(DEV_MODE || override) && (
        <InformationDisplayCard
          title=""
          span={24}
          subtitle={subtitle}
          inheritBg={isJsonDisplay || inheritBg}
          noBorder={isJsonDisplay || noBorder}
          noPadding>
          {isJsonDisplay ? (
            <>
              {/* <b className='primary-text' style={{ fontSize: 16 }}>JSON</b> */}
              <MarkdownDisplay showMoreHeight={10000} markdown={'```json\n' + JSON.stringify(obj, null, 2) + '\n```'} />
            </>
          ) : (
            <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', textAlign: 'start' }}>{JSON.stringify(obj, null, 2)}</pre>
          )}
        </InformationDisplayCard>
      )}
    </>
  );
}
