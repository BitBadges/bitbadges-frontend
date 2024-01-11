import { ReactNode } from 'react';
import { DEV_MODE } from '../../constants';
import { InformationDisplayCard } from '../display/InformationDisplayCard';
import { MarkdownDisplay } from '../../pages/account/[addressOrUsername]/settings';

export function DevMode({ obj, override, subtitle, inheritBg, noBorder, isJsonDisplay = true

}: {
  obj?: Object, override?: boolean, subtitle?: string | ReactNode,
  inheritBg?: boolean, noBorder?: boolean,
  isJsonDisplay?: boolean,
}) {
  // const [highlighted, setHighlighted] = useState('');

  // useEffect(() => {
  //   if (!window.Prism) return;

  //   setHighlighted(Prism.highlight(JSON.stringify(obj, null, 2), Prism.languages.json, 'json'));
  // }, [obj]);


  if (!obj) return <></>;



  return <>{(DEV_MODE || override) &&
    <InformationDisplayCard title='' span={24} style={{ marginTop: '10px' }} subtitle={subtitle} inheritBg={isJsonDisplay || inheritBg} noBorder={isJsonDisplay || noBorder}>
      {/* <Editor
        value={JSON.stringify(obj, null, 2)}
        onValueChange={() => { }}
        disabled

        highlight={() => {
          return highlighted;
        }}
        padding={10}
        style={{ border: 'none' }}
      /> */}
      {isJsonDisplay ? <>
        {/* <b className='primary-text' style={{ fontSize: 16 }}>JSON</b> */}
        <MarkdownDisplay

          showMoreHeight={10000}
          markdown={
            "```json\n" +
            JSON.stringify(obj, null, 2) +
            "\n```"
          } /></>
        :
        <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', textAlign: 'start' }}>
          {JSON.stringify(obj, null, 2)}
        </pre>
      }
    </InformationDisplayCard>
  }</>
}