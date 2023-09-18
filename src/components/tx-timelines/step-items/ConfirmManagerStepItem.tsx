import { Avatar, Divider } from "antd";
import { convertToCosmosAddress, getCurrentValueForTimeline, validateManagerUpdate } from "bitbadgesjs-utils";
import { useState } from "react";
import { useAccountsContext } from "../../../bitbadges-api/contexts/AccountsContext";
import { useChainContext } from "../../../bitbadges-api/contexts/ChainContext";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { EmptyStepItem, MSG_PREVIEW_ID, useTxTimelineContext } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { GO_MAX_UINT_64 } from "../../../utils/dates";
import { AddressDisplay } from "../../address/AddressDisplay";
import { AddressSelect } from "../../address/AddressSelect";
import { BlockiesAvatar } from "../../address/Blockies";
import { DevMode } from "../../common/DevMode";
import { SwitchForm } from "../form-items/SwitchForm";
import { UpdateSelectWrapper } from "../form-items/UpdateSelectWrapper";

export function ConfirmManagerStepItem() {
  const chain = useChainContext();
  const accounts = useAccountsContext();
  const collections = useCollectionsContext();
  const collection = collections.collections[MSG_PREVIEW_ID.toString()];

  const txTimelineContext = useTxTimelineContext();
  const canUpdateManager = txTimelineContext.updateManagerTimeline;
  const setCanUpdateManager = txTimelineContext.setUpdateManagerTimeline;
  const startingCollection = txTimelineContext.startingCollection;

  const currentManager = getCurrentValueForTimeline(collection?.managerTimeline ?? [])?.manager ?? '';
  const signedInAccount = accounts.getAccount(chain.address);
  const [address, setAddress] = useState<string>(currentManager || signedInAccount?.address || '');
  const hasManager = collection?.managerTimeline.some(x => x.manager) ?? false

  if (!collection) return EmptyStepItem;

  const err = startingCollection ? validateManagerUpdate(startingCollection.managerTimeline, collection.managerTimeline, startingCollection.collectionPermissions.canUpdateManager) : undefined;

  return {
    title: 'Select Manager',
    disabled: !!err,
    description: <>{'Every badge can specify a manager who has custom admin privileges, such as updating the collection in the future, revoking badges, and more. See full list '}
      <a href="https://docs.bitbadges.io/overview/how-it-works/manager" target="_blank" rel="noopener noreferrer">
        {' '}here.
      </a>
      {' '}
      <br />
      <br />
      If no manager is selected, no admin privileges will be available moving forward, and the collection details will be frozen and final.
      <br />
    </>,
    node:
      <UpdateSelectWrapper
        updateFlag={canUpdateManager}
        setUpdateFlag={setCanUpdateManager}
        jsonPropertyPath="managerTimeline"
        permissionName="canUpdateManager"
        validationErr={err}
        node={

          <div className='primary-text' style={{ padding: '0', textAlign: 'center', justifyContent: 'center', alignItems: 'center' }}>
            <div className='primary-text'
              style={{
                padding: '0',
                textAlign: 'center',
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: 20,
              }}
            >


              <SwitchForm
                showCustomOption
                onSwitchChange={(idx) => {
                  if (idx == 0) {
                    collections.updateCollection({
                      ...collection,
                      managerTimeline: [],
                    })
                  } else {
                    collections.updateCollection({
                      ...collection,
                      managerTimeline: [{
                        manager: convertToCosmosAddress(address),
                        timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                      }],
                    })
                  }
                }}
                options={[{
                  title: 'No Manager',
                  message: 'Do not have a manager for this collection. No admin privileges will ever be available for this collection.',
                  isSelected: !hasManager,
                },
                {
                  title: 'Manager',
                  message: 'Specify a manager for this collection that can execute admin privileges.',
                  isSelected: hasManager,
                },
                ]}
              />


              {hasManager && <div>
                <Divider />
                <Avatar
                  size={150}
                  src={
                    <BlockiesAvatar
                      address={accounts.getAccount(currentManager)?.address ?? ''}
                      avatar={accounts.getAccount(currentManager)?.profilePicUrl ?? accounts.getAccount(currentManager)?.avatar}
                      fontSize={150}
                      shape='circle'
                    />
                  }
                />

                <AddressDisplay
                  addressOrUsername={currentManager}
                  hidePortfolioLink
                />
                <Divider />

                <div style={{ marginBottom: 10, marginTop: 4, display: 'flex', justifyContent: 'center' }}>
                  <AddressSelect
                    defaultValue={address}
                    onUserSelect={(address) => {
                      setAddress(address);
                      collections.updateCollection({
                        ...collection,
                        managerTimeline: [{
                          manager: convertToCosmosAddress(address),
                          timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                        }],
                      })
                    }}
                  />
                </div>
              </div>
              }
            </div>
            <DevMode obj={collection.managerTimeline} />
          </div >
        }
      />
  }
}