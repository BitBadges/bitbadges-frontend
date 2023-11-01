import { Divider } from "antd";

export function ErrDisplay({
  err
}: {
  err: Error | null | undefined
}) {
  return <>
    {err &&
      <div style={{ color: 'red', textAlign: 'center' }}>
        <b>Error: </b>{err.toString()}
        <Divider />
      </div>}
  </>
}