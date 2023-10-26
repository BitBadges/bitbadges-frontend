import { MetadataAddMethod } from "bitbadgesjs-utils";
import { MetadataForm } from "../form-items/MetadataForm";

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
        addMethod={MetadataAddMethod.Manual}
      />
    </>,
  }
}