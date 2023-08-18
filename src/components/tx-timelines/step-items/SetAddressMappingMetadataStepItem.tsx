import { Divider, Typography } from "antd";
import { CollectionHeader } from "../../badges/CollectionHeader";
import { MetadataForm } from "../form-items/MetadataForm";

import { MetadataAddMethod } from "bitbadgesjs-utils";
import { ToolIcon } from "../../display/ToolIcon";
import { MSG_PREVIEW_ID } from "../TxTimeline";

export function SetAddressMappingMetadataStepItem() {

  return {
    title: 'Set Address List Metadata',
    description: <>{'Provide details about the list you are creating.'}
    </>,

    node: <>

      {
        <div>
          <div>
            <br />
            <br />
            <CollectionHeader collectionId={MSG_PREVIEW_ID} hideCollectionLink />
          </div>
        </div>
      }

      <MetadataForm
        collectionId={MSG_PREVIEW_ID}
        isCollectionSelect
        addMethod={MetadataAddMethod.Manual}
        startId={1n}
        endId={1n}
        isAddressMappingSelect
      />
      <Divider />
      {
        <>
          <Typography.Text strong style={{ fontSize: 20 }} className='primary-text'>Useful Tools</Typography.Text>
          <div className='flex'>
            <ToolIcon name="Sketch.io" />
            <ToolIcon name="Excalidraw" />
          </div>
        </>
      }
    </>,
  }
}