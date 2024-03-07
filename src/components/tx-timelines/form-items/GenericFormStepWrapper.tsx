import { BookOutlined } from '@ant-design/icons';

import IconButton from '../../display/IconButton';
import { ReactNode } from 'react';

export function GenericFormStepWrapper({ node, documentationLink }: { node: () => ReactNode; documentationLink?: string }) {
  return (
    <>
      <div className="primary-text flex-center flex-column">
        <div style={{ alignItems: 'center' }} className="flex-center flex-wrap full-width">
          <IconButton
            src={<BookOutlined style={{ fontSize: 16 }} />}
            style={{ cursor: 'pointer' }}
            tooltipMessage={'Visit the BitBadges documentation to learn more about this concept.'}
            text={'Docs'}
            onClick={() => {
              window.open(documentationLink ?? `https://docs.bitbadges.io`, '_blank');
            }}
          />
        </div>
      </div>
      {node()}
    </>
  );
}
