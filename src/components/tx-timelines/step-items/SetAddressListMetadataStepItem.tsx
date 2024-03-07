import { UintRangeArray } from 'bitbadgesjs-sdk';
import { MetadataForm } from '../form-items/MetadataForm';
import { GenericFormStepWrapper } from '../form-items/GenericFormStepWrapper';
import { MetadataAddMethod } from '../../../bitbadges-api/types';

export function SetAddressListMetadataStepItem() {
  return {
    title: 'Set Address List Metadata',
    description: <>{'Provide details about the list you are creating.'}</>,
    node: () => (
      <GenericFormStepWrapper
        documentationLink={'https://docs.bitbadges.io/overview/how-it-works/metadata'}
        node={() => (
          <>
            <MetadataForm isCollectionSelect badgeIds={new UintRangeArray()} isAddressListSelect addMethod={MetadataAddMethod.Manual} />
          </>
        )}
      />
    )
  };
}
