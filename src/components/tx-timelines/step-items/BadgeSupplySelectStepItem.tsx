import { DeleteOutlined, InfoCircleOutlined, MinusOutlined, PlusOutlined } from "@ant-design/icons";
import { Avatar, Button, Divider, Steps, Tooltip } from "antd";
import { BadgeSupplyAndAmount } from "bitbadgesjs-proto";
import { useState } from "react";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { BalanceDisplay } from "../../balances/BalanceDisplay";
import { DevMode } from "../../common/DevMode";
import { MSG_PREVIEW_ID } from "../TxTimeline";
import { BadgeSupply } from "../form-items/BadgeSupplySelect";
import { SwitchForm } from "../form-items/SwitchForm";

const { Step } = Steps;

export function BadgeSupplySelectStepItem(
  badgeSupplys: BadgeSupplyAndAmount<bigint>[],
  setBadgeSupplys: (badgeSupplys: BadgeSupplyAndAmount<bigint>[]) => void,
  existingCollectionId?: bigint,
) {
  const collections = useCollectionsContext();
  const collection = collections.getCollection(0n);
  const existingCollectionToExclude = existingCollectionId ? collections.getCollection(existingCollectionId) : undefined;

  const [currentStep, setCurrentStep] = useState(0);

  const onStepChange = (value: number) => {
    setCurrentStep(value);
  };

  const [fungible, setFungible] = useState(true);
  const [handledFungible, setHandledFungible] = useState(false);

  const [selectIsVisible, setSelectIsVisible] = useState(false);

  const [currentSupply, setCurrentSupply] = useState<BadgeSupplyAndAmount<bigint>>({
    amount: 0n,
    supply: 0n,
  });

  let collectionToShow = collection;
  if (existingCollectionToExclude && collection && collectionToShow) {
    collectionToShow.maxSupplys = collection.maxSupplys.filter((supply, idx) => {
      return supply !== existingCollectionToExclude.maxSupplys[idx];
    })
  }

  return {
    title: `Add Badges`,
    description: ``,
    node: <div className='primary-text'>
      <BalanceDisplay
        collectionId={MSG_PREVIEW_ID}
        balance={{
          balances: collectionToShow?.maxSupplys || [],
          approvals: []
        }}
        // size={40}
        message={'Badge Supplys'}
        showingSupplyPreview
      />
      {<div className='flex-center'>
        <Tooltip placement='bottom' title={!selectIsVisible ? 'Add More Badges' : 'Hide'}>
          <Avatar
            className='screen-button'
            onClick={() => setSelectIsVisible(!selectIsVisible)}
            // src={ }
            style={{
              cursor: 'pointer',
              margin: 10,
            }}
            size={40}
          >
            {!selectIsVisible ? <PlusOutlined size={40} /> : <MinusOutlined size={40} />}
          </Avatar>
        </Tooltip>

        <Tooltip placement='bottom' title={'Remove All Added Badges'}>
          <Avatar
            className='screen-button'
            onClick={() => setBadgeSupplys([])}
            // src={ }
            style={{
              cursor: 'pointer',
              margin: 10,
            }}
            size={40}
          >
            <DeleteOutlined size={40} />
          </Avatar>
        </Tooltip>
      </div>
      }
      <br />

      {selectIsVisible && <div>
        <h2 style={{ textAlign: 'center' }} className='primary-text'>Add Badges?</h2>
        {<div>
          <Steps
            current={currentStep}
            onChange={onStepChange}
          >

            <Step
              key={0}
              title={<b>{'Select Type'}</b>}
            />

            <Step
              key={0}
              title={<b>{'Select Amount'}</b>}
              disabled={!handledFungible}
            />


          </Steps>
          {currentStep === 0 && <div>
            <Divider />
            <SwitchForm
              noSelectUntilClick
              options={[
                {
                  title: 'Non-Fungible',
                  message: 'Add badges with unique characteristics (i.e. X badges each with a supply of 1).',
                  isSelected: !fungible,
                },
                {
                  title: 'Fungible',
                  message: 'Add a fungible badge (i.e. a single badge with X supply).',
                  isSelected: fungible,
                },

              ]}
              onSwitchChange={(idx) => {
                setFungible(idx === 1);
                setHandledFungible(true);
              }}
            />
          </div>
          }
          {currentStep === 1 && <div>
            <br />
            <BadgeSupply
              setCurrentSupply={setCurrentSupply}
              fungible={fungible}
            />
            <br />
            <div className='secondary-text' style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <InfoCircleOutlined style={{ marginRight: 4 }} />
              {' '}{`${currentSupply.amount}`}
              {' '}
              {fungible ? 'fungible' : 'non-fungible'}
              {' '}
              badge{currentSupply.amount !== 1n && 's'} with a supply of {`${currentSupply.supply}`} will be added to the collection.
              {' '}
              Note that the supply of each badge cannot be edited after they are created.
            </div>
            <Divider />
            <Button
              type="primary"
              disabled={currentSupply.amount <= 0 || currentSupply.supply <= 0}
              onClick={() => {
                setBadgeSupplys([...badgeSupplys, currentSupply]);
                setSelectIsVisible(false);
                setCurrentSupply({
                  amount: 1n,
                  supply: 1n,
                });
                setHandledFungible(false);
                setCurrentStep(0);
              }
              }
              className='full-width'

            >
              Add Badges
            </Button>
          </div>}
          <Divider />
        </div>}
      </div>
      }
      <Divider />
      <DevMode obj={badgeSupplys} />
    </div >,
    disabled: badgeSupplys?.length == 0
  }
}