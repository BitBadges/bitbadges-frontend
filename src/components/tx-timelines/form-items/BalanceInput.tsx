import { DeleteOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { Avatar, Button, DatePicker, Divider, Steps, Tooltip } from 'antd';
import { Balance } from 'bitbadgesjs-proto';
import moment from 'moment';
import { useState } from 'react';
import { BalanceDisplay } from '../../badges/balances/BalanceDisplay';
import { UintRangesInput } from '../../badges/balances/IdRangesInput';
import { NumberInput } from '../../display/NumberInput';
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

  //Top of the hour even :00:00
  const currTimeNextHour = new Date();
  currTimeNextHour.setHours(currTimeNextHour.getHours() + 1);
  currTimeNextHour.setMinutes(0);
  currTimeNextHour.setSeconds(0);
  currTimeNextHour.setMilliseconds(0);

  const [currentSupply, setCurrentSupply] = useState<Balance<bigint>>({
    amount: 1n,
    badgeIds: [],
    ownershipTimes: [{ start: BigInt(currTimeNextHour.valueOf()), end: BigInt(currTimeNextHour.valueOf() + 1000 * 60 * 60 * 24 * 365 * 1) }],
  });

  const AddBadgesButton = <>
    <Divider />
    <Button
      type="primary"
      disabled={currentSupply.amount <= 0 || currentSupply.badgeIds.length === 0 || currentSupply.ownershipTimes.length === 0}
      onClick={() => {
        onAddBadges(currentSupply);

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
            {currentStep === 0 && <div>
              <UintRangesInput
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
                title={'Select Amount to Add'}
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

                  <div style={{ textAlign: 'center', marginTop: 4 }} className='primary-text'>
                    <h3 style={{ textAlign: 'center' }} className='primary-text'>When can the badges be owned (circulating)?</h3>
                  </div>

                  <b>Start Time</b>
                  <DatePicker
                    showMinute
                    showTime
                    placeholder='Start Date'
                    value={currentSupply.ownershipTimes[0].start ? moment(new Date(Number(currentSupply.ownershipTimes[0].start))) : null}
                    className='primary-text primary-blue-bg full-width'
                    onChange={(_date, dateString) => {
                      if (new Date(dateString).valueOf() > new Date(Number(currentSupply.ownershipTimes[0].end)).valueOf()) {
                        alert('Start time must be before end time.');
                        return;
                      }

                      setCurrentSupply({
                        ...currentSupply,
                        ownershipTimes: [{ ...currentSupply.ownershipTimes[0], start: BigInt(new Date(dateString).valueOf()) }],
                      });
                    }}
                  />
                  <br />
                  <br />
                  <b>End Time</b>
                  <DatePicker
                    showMinute
                    showTime
                    placeholder='End Date'
                    value={currentSupply.ownershipTimes[0].end ? moment(new Date(Number(currentSupply.ownershipTimes[0].end))) : null}
                    className='primary-text primary-blue-bg full-width'
                    onChange={(_date, dateString) => {
                      if (new Date(dateString).valueOf() < new Date(Number(currentSupply.ownershipTimes[0].start)).valueOf()) {
                        alert('End time must be after start time.');
                        return;
                      }

                      setCurrentSupply({
                        ...currentSupply,
                        ownershipTimes: [{ ...currentSupply.ownershipTimes[0], end: BigInt(new Date(dateString).valueOf()) }],
                      });
                    }}
                  />
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