import { DeleteOutlined, InfoCircleOutlined, MinusOutlined, PlusOutlined } from "@ant-design/icons";
import { Avatar, Button, Divider, Steps, Tooltip } from "antd";
import { Balance } from "bitbadgesjs-proto";
import { useState } from "react";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/CollectionsContext";
import { BalanceDisplay } from "../../balances/BalanceDisplay";
import { DevMode } from "../../common/DevMode";
import { MSG_PREVIEW_ID } from "../TxTimeline";
import { SwitchForm } from "../form-items/SwitchForm";
import { BadgeSupply } from "../form-items/BadgeSupplySelect";
import { FOREVER_DATE } from "../../../utils/dates";
import { getTotalNumberOfBadges } from "../../../bitbadges-api/utils/badges";
import { removeUintRangeFromUintRange } from "bitbadgesjs-utils";

const { Step } = Steps;

export function BadgeSupplySelectStepItem(
  badgesToCreate: Balance<bigint>[],
  setBadgesToCreate: (badgesToCreate: Balance<bigint>[]) => void,
  existingCollectionId?: bigint,
) {
  const collections = useCollectionsContext();
  const collection = collections.collections[0n.toString()];
  const existingCollectionToExclude = existingCollectionId ? collections.collections[existingCollectionId.toString()] : undefined;

  const [currentStep, setCurrentStep] = useState(0);

  const onStepChange = (value: number) => {
    setCurrentStep(value);
  };

  const [fungible, setFungible] = useState(true);
  const [handledFungible, setHandledFungible] = useState(false);

  const [selectIsVisible, setSelectIsVisible] = useState(false);

  const [currentSupply, setCurrentSupply] = useState<Balance<bigint>>({
    amount: 0n,
    badgeIds: [],
    ownedTimes: [{ start: 1n, end: FOREVER_DATE }],
  });

  //TODO: Make more dynamic
  console.log(collection);
  let balancesToShow = collection?.owners.find(x => x.cosmosAddress === "Total")?.balances || []
  console.log(balancesToShow);
  let previousTotalNumberOfBadges = existingCollectionToExclude ? getTotalNumberOfBadges(existingCollectionToExclude) : 0n;
  if (existingCollectionToExclude && collection && previousTotalNumberOfBadges > 0n) {
    const idsToRemove = [{ start: 1n, end: previousTotalNumberOfBadges }];
    for (const balance of balancesToShow) {
      const [remaining, _] = removeUintRangeFromUintRange(idsToRemove, balance.badgeIds);
      balance.badgeIds = remaining;
    }
  }
  console.log(balancesToShow);

  let totalNumberOfBadges = 0n;
  for (const badgeIdRange of currentSupply.badgeIds) {
    totalNumberOfBadges += badgeIdRange.end - badgeIdRange.start + 1n;
  }

  let startBadgeId = existingCollectionToExclude ? previousTotalNumberOfBadges + 1n : 1n;
  for (const balance of badgesToCreate) {
    for (const badgeIdRange of balance.badgeIds) {
      if (badgeIdRange.end >= startBadgeId) {
        startBadgeId = badgeIdRange.end + 1n;
      }
    }
  }

  console.log("startBadgeId", startBadgeId);

  return {
    title: `Add Badges`,
    description: ``,
    node: <div className='primary-text'>
      <BalanceDisplay
        collectionId={MSG_PREVIEW_ID}
        balances={balancesToShow}
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
            onClick={() => setBadgesToCreate([])}
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
              startBadgeId={startBadgeId}
            />
            <br />
            <div className='secondary-text' style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <InfoCircleOutlined style={{ marginRight: 4 }} />
              {' '}{`${totalNumberOfBadges}`}
              {' '}
              {fungible ? 'fungible' : 'non-fungible'}
              {' '}
              badge{totalNumberOfBadges !== 1n && 's'} each with a supply of {`${currentSupply.amount}`} will be added to the collection.
            </div>
            <Divider />
            <Button
              type="primary"
              disabled={currentSupply.amount <= 0 || currentSupply.badgeIds.length === 0}
              onClick={() => {
                setBadgesToCreate([...badgesToCreate, currentSupply]);

                setSelectIsVisible(false);
                setCurrentSupply({
                  amount: 0n,
                  badgeIds: [],
                  ownedTimes: [{ start: 1n, end: FOREVER_DATE }],
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
      <DevMode obj={badgesToCreate} />
    </div >,
    disabled: badgesToCreate?.length == 0
  }
}