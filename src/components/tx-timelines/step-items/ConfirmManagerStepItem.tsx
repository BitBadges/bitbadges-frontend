import { Avatar, Divider } from "antd";
import { convertToCosmosAddress, getCurrentValueForTimeline, validateManagerUpdate } from "bitbadgesjs-utils";
import { useEffect, useState } from "react";
import { useAccountsContext } from "../../../bitbadges-api/contexts/accounts/AccountsContext";
import { useChainContext } from "../../../bitbadges-api/contexts/ChainContext";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/collections/CollectionsContext";
import { EmptyStepItem, MSG_PREVIEW_ID, useTxTimelineContext } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { GO_MAX_UINT_64 } from "../../../utils/dates";
import { AddressDisplay } from "../../address/AddressDisplay";
import { AddressSelect } from "../../address/AddressSelect";
import { BlockiesAvatar } from "../../address/Blockies";
import { DevMode } from "../../common/DevMode";
import { SwitchForm } from "../form-items/SwitchForm";
import { UpdateSelectWrapper } from "../form-items/UpdateSelectWrapper";
import { PermissionsOverview } from "../../collection-page/PermissionsInfo";

export function ConfirmManagerStepItem() {
  const chain = useChainContext();
  const accounts = useAccountsContext();
  const collections = useCollectionsContext();
  const collection = collections.getCollection(MSG_PREVIEW_ID);

  const txTimelineContext = useTxTimelineContext();
  const canUpdateManager = txTimelineContext.updateManagerTimeline;
  const setCanUpdateManager = txTimelineContext.setUpdateManagerTimeline;
  const startingCollection = txTimelineContext.startingCollection;

  const currentManager = getCurrentValueForTimeline(collection?.managerTimeline ?? [])?.manager ?? '';
  const signedInAccount = accounts.getAccount(chain.address);
  const currentManagerAccount = accounts.getAccount(currentManager);
  const [address, setAddress] = useState<string>(currentManagerAccount?.address || signedInAccount?.address || '');
  const hasManager = collection?.managerTimeline.some(x => x.manager) ?? false

  useEffect(() => {
    setAddress(currentManagerAccount?.address || signedInAccount?.address || '');
  }, [currentManagerAccount, signedInAccount])

  if (!collection) return EmptyStepItem;

  const err = startingCollection ? validateManagerUpdate(startingCollection.managerTimeline, collection.managerTimeline, startingCollection.collectionPermissions.canUpdateManager) : undefined;



  return {
    title: 'Manager',
    disabled: !!err,
    description: <>{'The manager is a special role which can have custom admin privileges where applicable. See full list of privileges '}
      <a href="https://docs.bitbadges.io/overview/how-it-works/manager" target="_blank" rel="noopener noreferrer">
        {' '}here.
      </a>
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
                      collectionId: MSG_PREVIEW_ID,
                      managerTimeline: [],
                    })
                  } else {
                    collections.updateCollection({
                      collectionId: MSG_PREVIEW_ID,
                      managerTimeline: [{
                        manager: convertToCosmosAddress(address),
                        timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                      }],
                    })
                  }
                }}
                options={[{
                  title: 'No Manager',
                  message: 'Do not have a manager for this collection. No admin privileges will ever be available for this collection. All collection details will be frozen and final after this transaction.',
                  isSelected: !hasManager,
                  additionalNode: <>
                    <div className="flex-center">
                      <PermissionsOverview
                        span={24}
                        collectionId={collection.collectionId}
                      />
                    </div>
                  </>,
                },
                {
                  title: 'Manager',
                  message: <>{'Specify a manager for this collection that can execute admin privileges. You can select which permissions are enabled.'}</>,
                  additionalNode: <>
                    {hasManager && <div>
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


                      <div style={{ marginBottom: 10, marginTop: 4, display: 'flex', justifyContent: 'center' }}>
                        <AddressSelect
                          defaultValue={address}
                          onUserSelect={(address) => {
                            console.log("USER SELECT")
                            setAddress(address);
                            collections.updateCollection({
                              collectionId: MSG_PREVIEW_ID,
                              managerTimeline: [{
                                manager: convertToCosmosAddress(address),
                                timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                              }],
                            })
                          }}
                        />
                      </div>
                      <Divider />
                      <div className="flex-center">
                        <PermissionsOverview
                          span={24}

                          tbd
                          collectionId={collection.collectionId}
                        />
                      </div>
                    </div>
                    }
                  </>,
                  isSelected: hasManager,
                },
                ]}
              />




            </div>
            <DevMode obj={collection.managerTimeline} />
          </div >
        }
      />
  }
}