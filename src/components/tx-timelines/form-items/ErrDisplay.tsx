import { Divider } from "antd";

export function ErrDisplay({
  err
}: {
  err: Error | null | undefined
}) {
  return <>
    {err &&
      <div style={{ color: 'red', textAlign: 'center' }}>
        <b>Error: </b>You have updated a value that is not allowed to be updated according to the permissions set.
        <Divider />
      </div>}
  </>
}