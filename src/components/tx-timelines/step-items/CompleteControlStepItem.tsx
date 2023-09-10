import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { MSG_PREVIEW_ID } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { SwitchForm } from "../form-items/SwitchForm";

export function ChooseControlTypeStepItem(
  completeControl: boolean,
  setCompleteControl: (completeControl: boolean) => void,
) {
  const collections = useCollectionsContext();
  const collection = collections.collections[MSG_PREVIEW_ID.toString()];

  return {
    title: 'Complete Control?',
    description: <>See list of privileges
      <a href="https://docs.bitbadges.io/overview/how-it-works/manager" target="_blank" rel="noopener noreferrer">
        {' '}here.
      </a>
    </>,
    node: <div>
      <SwitchForm
        options={[
          {
            title: 'Custom',
            message: <>In the following steps, you will be able to customize which admin privileges you want enabled vs disabled. </>,
            isSelected: !completeControl
          },
          {
            title: 'Complete Control',
            message: 'To streamline the process, we will set all admin privileges to be enabled. Moving forward, you will have compelte control to be able to customize and update the collection details on the blockchain as you see fit.',
            isSelected: completeControl
          },
        ]}
        onSwitchChange={(idx) => {
          if (!collection) return;

          setCompleteControl(idx === 1);
          if (idx == 1) {
            collections.updateCollection({
              ...collection,
              collectionPermissions: {
                canArchiveCollection: [],
                canCreateMoreBadges: [],
                canDeleteCollection: [],
                canUpdateBadgeMetadata: [],
                canUpdateCollectionApprovedTransfers: [],
                canUpdateCollectionMetadata: [],
                canUpdateContractAddress: [],
                canUpdateCustomData: [],
                canUpdateManager: [],
                canUpdateOffChainBalancesMetadata: [],
                canUpdateStandards: [],
              },
            })
          }
        }
        }
      />
    </div>
  }
}