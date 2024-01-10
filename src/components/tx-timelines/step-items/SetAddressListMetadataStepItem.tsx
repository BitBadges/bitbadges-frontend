import { MetadataAddMethod } from "bitbadgesjs-utils";
import { MetadataForm } from "../form-items/MetadataForm";
import { GenericFormStepWrapper } from "../form-items/GenericFormStepWrapper";

export function SetAddressListMetadataStepItem() {

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
          isAddressListSelect
          addMethod={MetadataAddMethod.Manual}
        />
      </>}
    />,
  }
}