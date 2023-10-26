import { DEV_MODE } from '../../constants';

export function DevMode({ obj }: { obj?: Object }) {
  if (!obj) return <></>;

  return <>{DEV_MODE &&
    <pre className='full-width dark:text-white' style={{ marginTop: '10px', borderTop: '3px dashed white', alignContent: 'left', textAlign: 'left' }}>
      {JSON.stringify(obj, null, 2)}
    </pre>
  }</>
}