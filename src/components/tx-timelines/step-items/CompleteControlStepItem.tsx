import { Switch } from "antd";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/collections/CollectionsContext";
import { MSG_PREVIEW_ID, useTxTimelineContext } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { PermissionsOverview } from "../../collection-page/PermissionsInfo";
import { SwitchForm } from "../form-items/SwitchForm";

export function ChooseControlTypeStepItem() {
  const collections = useCollectionsContext();
  const collection = collections.collections[MSG_PREVIEW_ID.toString()];

  const txTimelineContext = useTxTimelineContext();
  const completeControl = txTimelineContext.completeControl;
  const setCompleteControl = txTimelineContext.setCompleteControl;

  return {
    title: 'Complete Control?',
    description: <>
      Would you like the manager to have complete administrative control (all admin privileges enabled)?
      See full list of privileges
      <a href="https://docs.bitbadges.io/overview/how-it-works/manager" target="_blank" rel="noopener noreferrer">
        {' '}here.
      </a>
    </>,
    node: <div>
      <SwitchForm
        options={[
          {
            title: 'Custom',
            message: <>In the following steps, you will be able to customize which admin privileges are enabled vs disabled. </>,
            isSelected: !completeControl,
            additionalNode: <>
              <div className="flex-center">
                <PermissionsOverview
                  span={24}
                  collectionId={MSG_PREVIEW_ID}
                  tbd
                />
              </div>
            </>
          },
          {
            title: 'Complete Control',
            message: 'All admin privileges will be enabled. The manager will have complete control to be able to customize and update the collection as desired. Privileges can be disabled at any time.',
            isSelected: completeControl,
            additionalNode: <>
             

              <br />
              <div className="flex-center">
                <PermissionsOverview
                  span={24}
                  collectionId={MSG_PREVIEW_ID}
                />
              </div>
            </>
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
                canUpdateCollectionApprovals: [],
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