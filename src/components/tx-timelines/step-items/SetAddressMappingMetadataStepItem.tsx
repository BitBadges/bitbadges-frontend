import { MetadataAddMethod } from "bitbadgesjs-utils";
import { MetadataForm } from "../form-items/MetadataForm";
import { GenericFormStepWrapper } from "../form-items/GenericFormStepWrapper";

export function SetAddressMappingMetadataStepItem() {

  return {
    title: 'Set Address List Metadata',
    description: <>{'Provide details about the list you are creating.'}
    </>,
    node: () => <GenericFormStepWrapper
      documentationLink={"https://docs.bitbadges.io/overview/how-it-works/metadata"}
      node={() => <>
        <MetadataForm
          isCollectionSelect
          badgeIds={[]}
          isAddressMappingSelect
          addMethod={MetadataAddMethod.Manual}
        />
      </>
      }
    />,
  }
}