import { WarningOutlined } from '@ant-design/icons';

export function ErrDisplay({ err, warning }: { err: Error | string | null | undefined; warning?: boolean }) {
  return (
    <>
      {err && (
        <div style={{ color: warning ? 'orange' : 'red', textAlign: 'center' }}>
          <b>{warning ? <WarningOutlined /> : 'Error:'} </b>
          {err.toString()}
          <br />
        </div>
      )}
    </>
  );
}
