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
      <MetadataForm
        isCollectionSelect
        badgeIds={[]}
        isAddressMappingSelect
      />
    </>,
  }
}