import { CollectionPermissionsWithDetails } from 'bitbadgesjs-sdk';
import { NEW_COLLECTION_ID, useTxTimelineContext } from '../../../bitbadges-api/contexts/TxTimelineContext';
import { updateCollection, useCollection } from '../../../bitbadges-api/contexts/collections/CollectionsContext';

import { PermissionsOverview } from '../../collection-page/PermissionsInfo';
import { GenericFormStepWrapper } from '../form-items/GenericFormStepWrapper';
import { SwitchForm } from '../form-items/SwitchForm';

export function ChooseControlTypeStepItem() {
  const collection = useCollection(NEW_COLLECTION_ID);
  const txTimelineContext = useTxTimelineContext();
  const completeControl = txTimelineContext.completeControl;
  const setCompleteControl = txTimelineContext.setCompleteControl;

  return {
    title: 'Complete Control?',
    description: (
      <>
        Would you like the manager to have complete administrative control (all admin privileges enabled)? See full list of privileges
        <a href="https://docs.bitbadges.io/overview/how-it-works/manager" target="_blank" rel="noopener noreferrer">
          {' '}
          here.
        </a>
      </>
    ),
    node: () => (
      <GenericFormStepWrapper
        documentationLink="https://docs.bitbadges.io/overview/how-it-works/manager"
        node={() => (
          <div>
            <SwitchForm
              options={[
                {
                  title: 'Custom',
                  message: <>In the following steps, you will be able to customize which admin privileges are enabled vs disabled. </>,
                  isSelected: !completeControl,
                  additionalNode: () => (
                    <>
                      <div className="flex-center">
                        <PermissionsOverview span={24} collectionId={NEW_COLLECTION_ID} tbd />
                      </div>
                    </>
                  )
                },
                {
                  title: 'Complete Control',
                  message:
                    'To streamline the process, we will enable all admin privileges. The manager will have complete control to be able to customize and update the collection as desired. Privileges can be disabled at any time.',
                  isSelected: completeControl,
                  additionalNode: () => (
                    <>
                      <br />
                      <div className="flex-center">
                        <PermissionsOverview span={24} collectionId={NEW_COLLECTION_ID} />
                      </div>
                    </>
                  )
                }
              ]}
              onSwitchChange={(idx) => {
                if (!collection) return;

                setCompleteControl(idx === 1);
                if (idx == 1) {
                  updateCollection({
                    collectionId: NEW_COLLECTION_ID,
                    collectionPermissions: CollectionPermissionsWithDetails.InitEmpty() as CollectionPermissionsWithDetails<bigint>
                  });
                }
              }}
            />
          </div>
        )}
      />
    )
  };
}
