import { Checkbox } from 'antd';

export function UpdateSelectWrapper({
  updateFlag,
  setUpdateFlag,
  existingCollectionId,
  node,
}: {
  setUpdateFlag: (val: boolean) => void,
  updateFlag: boolean,
  existingCollectionId?: bigint,
  node: JSX.Element,
}) {

  if (!existingCollectionId) return node;

  return (
    <>
      <div className='primary-text flex-center flex-column' >
        <div style={{ alignItems: 'center' }}>


          <br />
          <Checkbox
            checked={updateFlag}
            onChange={(e) => {
              setUpdateFlag(e.target.checked);
            }}
            className='primary-text'
            style={{ textAlign: 'left', alignItems: 'center' }}

          >
            {updateFlag ? 'This property will be updated to the selected value below.' : 'Do not update this property. It will remain as currently set.'}
          </Checkbox>
        </div>
      </div>
      {updateFlag && <>
        <br />
        {node}
      </>}
    </>
  )
}