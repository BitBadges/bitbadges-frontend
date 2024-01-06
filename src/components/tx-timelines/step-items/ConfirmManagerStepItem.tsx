import { Divider } from "antd";
import { checkIfUintRangesOverlap, convertToCosmosAddress, getCurrentValueForTimeline } from "bitbadgesjs-utils";
import { useEffect, useState } from "react";
import { useChainContext } from "../../../bitbadges-api/contexts/ChainContext";
import { EmptyStepItem, NEW_COLLECTION_ID, useTxTimelineContext } from "../../../bitbadges-api/contexts/TxTimelineContext";


import { useAccount } from "../../../bitbadges-api/contexts/accounts/AccountsContext";
import { updateCollection, useCollection } from "../../../bitbadges-api/contexts/collections/CollectionsContext";
import { GO_MAX_UINT_64 } from "../../../utils/dates";
import { AddressDisplay } from "../../address/AddressDisplay";
import { AddressSelect } from "../../address/AddressSelect";
import { PermissionsOverview } from "../../collection-page/PermissionsInfo";
import { DevMode } from "../../common/DevMode";
import { TimelineEditor } from "../../wrappers/TimelineFieldWrapper";
import { SwitchForm } from "../form-items/SwitchForm";
import { UpdateSelectWrapper } from "../form-items/UpdateSelectWrapper";

const AddManagerNode = ({ address, setAddress }: { address: string, setAddress: (address: string) => void }) => {
  return <div style={{ marginBottom: 10, marginTop: 4, display: 'flex', justifyContent: 'center' }}>
    <AddressSelect
      defaultValue={address}
      onUserSelect={(address) => {
        setAddress(address);

      }}
    />
  </div>
}

export function ConfirmManagerStepItem() {
  const chain = useChainContext();


  const collection = useCollection(NEW_COLLECTION_ID);

  const txTimelineContext = useTxTimelineContext();
  const canUpdateManager = txTimelineContext.updateManagerTimeline;
  const setCanUpdateManager = txTimelineContext.setUpdateManagerTimeline;

  const currentManager = getCurrentValueForTimeline(collection?.managerTimeline ?? [])?.manager ?? '';
  const signedInAccount = useAccount(chain.address);
  const currentManagerAccount = useAccount(currentManager);

  const [address, setAddress] = useState<string>(currentManagerAccount?.address || signedInAccount?.address || '');
  const [err, setErr] = useState<Error | null>(null);

  useEffect(() => {
    setAddress(currentManagerAccount?.address || signedInAccount?.address || '');
  }, [currentManagerAccount?.address, signedInAccount?.address])

  if (!collection) return EmptyStepItem;

  const hasManager = !!collection.managerTimeline.find(x => x.manager)

  return {
    title: 'Manager',
    disabled: !!err || checkIfUintRangesOverlap(collection.managerTimeline.map(x => x.timelineTimes).flat()),
    description: <>{'The manager is a special role which can have custom admin privileges. See full list of privileges '}
      <a href="https://docs.bitbadges.io/overview/how-it-works/manager" target="_blank" rel="noopener noreferrer">
        {' '}here.
      </a>
    </>,
    node: () => <UpdateSelectWrapper
      documentationLink={"https://docs.bitbadges.io/overview/how-it-works/manager"}
      err={err}
      setErr={(err) => { setErr(err) }}
      updateFlag={canUpdateManager}
      setUpdateFlag={setCanUpdateManager}
      jsonPropertyPath="managerTimeline"
      permissionName="canUpdateManager"
      node={() => <div className='primary-text' style={{ padding: '0', textAlign: 'center', justifyContent: 'center', alignItems: 'center' }}>
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
                updateCollection({
                  collectionId: NEW_COLLECTION_ID,
                  managerTimeline: [],
                })
              } else {
                updateCollection({
                  collectionId: NEW_COLLECTION_ID,
                  managerTimeline: [{
                    manager: convertToCosmosAddress(address),
                    timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                  }],
                })
              }
            }}
            options={[{
              title: 'No Manager',
              message: <>Do not have a manager for this collection. No admin privileges will ever be available for this collection. <span style={{ fontWeight: 'bold', color: 'orange' }}>All collection details will be frozen and final after this transaction. No manager permissions will be executable moving forward.</span></>,
              isSelected: !hasManager,
              additionalNode: () => <>
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
              additionalNode: () => <>
                {hasManager && <div>

                  <TimelineEditor
                    emptyValue="No Manager"
                    timelineName="Manager"
                    valueToAdd={{
                      manager: convertToCosmosAddress(address),
                      timelineTimes: [], //overriden
                    }}
                    timeline={collection.managerTimeline} displayNode={(item) => {
                      return <div className='flex' style={{ alignItems: 'center' }}>
                        <AddressDisplay addressOrUsername={item.manager} />
                      </div>
                    }}
                    createNode={<AddManagerNode address={address} setAddress={setAddress} />}
                    setTimeline={(timeline) => {
                      updateCollection({
                        collectionId: NEW_COLLECTION_ID,
                        managerTimeline: timeline,
                      })
                    }}
                  />

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

