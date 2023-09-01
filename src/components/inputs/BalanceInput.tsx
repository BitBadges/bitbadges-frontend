import { DeleteOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { Avatar, Button, Divider, Steps, Tooltip } from 'antd';
import { Balance, deepCopy } from 'bitbadgesjs-proto';
import { useState } from 'react';
import { GO_MAX_UINT_64 } from '../../utils/dates';
import { BalanceDisplay } from '../badges/balances/BalanceDisplay';
import { BadgeIdRangesInput } from './BadgeIdRangesInput';
import { NumberInput } from './NumberInput';
import { DateRangeInput } from './DateRangeInput';
import { SwitchForm } from '../tx-timelines/form-items/SwitchForm';
const { Step } = Steps;

export function BalanceInput({
  balancesToShow,
  onAddBadges,
  onRemoveAll,
  maximum,
  minimum,
  collectionId,
  message,
  hideOwnershipTimes,
  isMustOwnBadgesInput
}: {
  balancesToShow: Balance<bigint>[],
  onAddBadges: (balance: Balance<bigint>) => void,
  onRemoveAll: () => void,
  maximum?: bigint,
  minimum?: bigint,
  collectionId?: bigint,
  message?: string,
  hideOwnershipTimes?: boolean
  isMustOwnBadgesInput?: boolean
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectIsVisible, setSelectIsVisible] = useState(false);

  const onStepChange = (value: number) => {
    setCurrentStep(value);
  };

  const [defaultBalancesToShow] = useState<Balance<bigint>[]>(balancesToShow);

  // //Top of the hour even :00:00
  const currTimeNextHour = new Date();
  currTimeNextHour.setHours(currTimeNextHour.getHours());
  currTimeNextHour.setMinutes(0);
  currTimeNextHour.setSeconds(0);
  currTimeNextHour.setMilliseconds(0);

  const [currentSupply, setCurrentSupply] = useState<Balance<bigint>>({
    amount: 1n,
    badgeIds: [],
    ownershipTimes: [{ start: BigInt(1n), end: GO_MAX_UINT_64 }],
  });

  const AddBadgesButton = <>
    <Divider />
    <Button
      type="primary"
      disabled={currentSupply.amount <= 0 || currentSupply.badgeIds.length === 0 || currentSupply.ownershipTimes.length === 0}
      onClick={() => {
        onAddBadges(deepCopy(currentSupply));

        setCurrentSupply({
          amount: 1n,
          badgeIds: [{ start: 1n, end: 1n }],
          ownershipTimes: [{ start: BigInt(Date.now()), end: BigInt(Date.now() + 1000 * 60 * 60 * 24 * 365 * 100) }],
        });
        setCurrentStep(0);

        setSelectIsVisible(false);
      }}
      className='full-width'

    >
      Add Badges
    </Button>
  </>

  return <>
    <BalanceDisplay
      collectionId={collectionId ?? 0n}
      isMustOwnBadgesInput={isMustOwnBadgesInput}
      balances={balancesToShow}
      message={message ?? 'Balances'}
      showingSupplyPreview={message == "Circulating Supplys"}
    />
    <br />
    {<div className='flex-center'>
      <Tooltip placement='bottom' title={!selectIsVisible ? 'Add More Badges' : 'Hide'}>
        <Avatar
          className='styled-button'
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
          className='styled-button'
          onClick={() => onRemoveAll()}
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
    {selectIsVisible &&
      < div >
        {
          <div>
            <Steps
              current={currentStep}
              onChange={onStepChange}
              type="navigation"
            >

              <Step
                key={0}
                title={<b>{'Select Badge IDs'}</b>}
              />

              <Step
                key={1}
                title={<b>{'Select Amount'}</b>}
                disabled={currentSupply.badgeIds.length === 0}
              />

              {!hideOwnershipTimes &&
                <Step
                  key={2}
                  title={<b>{'Select Ownership Times'}</b>}
                  disabled={currentSupply.amount <= 0 || currentSupply.badgeIds.length === 0}
                />}




            </Steps>
            {currentStep === 0 && <div className='full-width'>



              <BadgeIdRangesInput
                uintRanges={currentSupply.badgeIds}
                setUintRanges={(uintRanges) => {
                  setCurrentSupply({ ...currentSupply, badgeIds: uintRanges });
                }}
                minimum={minimum ?? 1n}
                maximum={maximum ?? 100000n}
                collectionId={collectionId ?? 0n}
                hideSelect
              />

            </div>
            }
            {currentStep === 1 && <div>
              <br />
              <NumberInput
                title={'Select Amount'}
                value={Number(currentSupply.amount)}
                setValue={(value) => {
                  setCurrentSupply({ ...currentSupply, amount: BigInt(value) });
                }}
                min={1}

              />

              {hideOwnershipTimes && AddBadgesButton}
            </div>}
            {currentStep === 2 && !hideOwnershipTimes &&
              <>

                <div>
                  <SwitchForm
                    options={[{
                      title: "Custom",
                      message: message == "Circulating Supplys" ? "Badges can be owned only at custom times." : "Ownership of the selected badges is to be transferred only for custom times.",
                      isSelected: !(currentSupply.ownershipTimes[0].start === 1n && currentSupply.ownershipTimes[0].end === GO_MAX_UINT_64),
                    },
                    {
                      title: "All Times",
                      message: message == "Circulating Supplys" ? "Badges can be owned at all times." : "Ownership of the selected badges is to be transferred for all times.",
                      isSelected: currentSupply.ownershipTimes[0].start === 1n && currentSupply.ownershipTimes[0].end === GO_MAX_UINT_64,

                    },]}
                    onSwitchChange={(value) => {
                      if (value === 1) {
                        setCurrentSupply({
                          ...currentSupply,
                          ownershipTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                        });
                      } else {
                        setCurrentSupply({
                          ...currentSupply,
                          ownershipTimes: [{ start: BigInt(currTimeNextHour.valueOf()), end: BigInt(currTimeNextHour.valueOf() + 1000 * 60 * 60 * 24 * 365 * 1) }],
                        });
                      }
                    }}
                  />
                  <br />
                  {currentSupply.ownershipTimes[0].start === 1n && currentSupply.ownershipTimes[0].end === GO_MAX_UINT_64 ? <></> : <>

                    <DateRangeInput
                      timeRanges={currentSupply.ownershipTimes}
                      setTimeRanges={(timeRanges) => {
                        setCurrentSupply({ ...currentSupply, ownershipTimes: timeRanges });
                      }}
                      suggestedTimeRanges={defaultBalancesToShow.map(x => x.ownershipTimes).flat()}
                    // hideSelect
                    />
                  </>}
                </div>

                {AddBadgesButton}
              </>

            }
            <Divider />
          </div>

        }
      </div >}
  </>
}