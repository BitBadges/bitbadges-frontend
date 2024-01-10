import { ReactNode, useEffect, useState } from 'react';
import { DEV_MODE } from '../../constants';
import { InformationDisplayCard } from '../display/InformationDisplayCard';
import Prism from 'prismjs';
import Editor from 'react-simple-code-editor';
import 'prismjs/components/prism-json'; // need this
import 'prismjs/components/prism-json.min';
import 'prismjs/themes/prism.css'; //Example style, you can use another

export function DevMode({ obj, override, subtitle, inheritBg, noBorder

}: {
  obj?: Object, override?: boolean, subtitle?: string | ReactNode,
  inheritBg?: boolean, noBorder?: boolean

}) {
  const [highlighted, setHighlighted] = useState('');

  useEffect(() => {
    if (!window.Prism) return;

    setHighlighted(Prism.highlight(JSON.stringify(obj, null, 2), Prism.languages.json, 'json'));
  }, [obj]);


  if (!obj) return <></>;



  return <>{(DEV_MODE || override) &&
    <InformationDisplayCard title='' span={24} style={{ marginTop: '10px' }} subtitle={subtitle} inheritBg={inheritBg} noBorder={noBorder}>
      <Editor
        value={JSON.stringify(obj, null, 2)}
        onValueChange={() => { }}
        disabled

        highlight={() => {
          return highlighted;
        }}
        padding={10}
        style={{ border: 'none' }}
      />
    </InformationDisplayCard>
  }</>
}