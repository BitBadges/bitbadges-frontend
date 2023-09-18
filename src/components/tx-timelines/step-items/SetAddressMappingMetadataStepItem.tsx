import { Divider, Typography } from "antd";
import { CollectionHeader } from "../../badges/CollectionHeader";
import { MetadataForm } from "../form-items/MetadataForm";

import { MSG_PREVIEW_ID } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { ToolIcon } from "../../display/ToolIcon";

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
        isCollectionSelect
        badgeIds={[]}
        isAddressMappingSelect
      />
      <Divider />
      {
        <>
          <Typography.Text strong style={{ fontSize: 20 }} className='primary-text'>Useful Tools</Typography.Text>
          <div style={{ display: 'flex' }} className='flex-wrap'>
            <ToolIcon name="Sketch.io" />
            <ToolIcon name="Excalidraw" />
          </div>
        </>
      }
    </>,
  }
}