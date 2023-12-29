import { InfoCircleOutlined } from "@ant-design/icons";
import { Switch, Typography } from "antd";
import { Balance, Numberify } from "bitbadgesjs-proto";
import { DistributionMethod } from "bitbadgesjs-utils";
import { getBadgeIdsString } from "../../../utils/badgeIds";
import { BalanceDisplay } from "../../badges/BalanceDisplay";
import { TableRow } from "../../display/TableRow";
import { BalanceAmountInput } from "../../inputs/BalanceAmountInput";
import { NumberInput } from "../../inputs/NumberInput";
import { AmountType, CodeType, RequiredApprovalProps, getMaxIncrementsApplied } from "../ApprovalSelect";
import { MaxUses } from "./MaxUsesSelectComponent";

export const OrderCalculationMethod = ({ approvalToAdd,
  setApprovalToAdd,
  distributionMethod,
  codeType,
  increment,
  startBalances,
  collectionId,
  amountType,

  keyId, label }:
  {
    amountType: AmountType,
    distributionMethod: DistributionMethod, codeType: CodeType, increment: bigint, startBalances: Balance<bigint>[], collectionId: bigint,
    setApprovalToAdd: (approvalToAdd: RequiredApprovalProps) => void,
    approvalToAdd: RequiredApprovalProps, label: string, keyId: 'useOverallNumTransfers' | 'usePerToAddressNumTransfers' | 'usePerFromAddressNumTransfers' | 'usePerInitiatedByAddressNumTransfers' | 'useMerkleChallengeLeafIndex'

  }) => {
  const checked = approvalToAdd?.approvalCriteria?.predeterminedBalances?.orderCalculationMethod?.[keyId] || false;
  const setChecked = (checked: boolean) => {
    setApprovalToAdd({
      ...approvalToAdd,
      approvalCriteria: {
        ...approvalToAdd.approvalCriteria,
        predeterminedBalances: {
          ...approvalToAdd.approvalCriteria.predeterminedBalances,
          orderCalculationMethod: {
            ...approvalToAdd.approvalCriteria.predeterminedBalances.orderCalculationMethod,
            useMerkleChallengeLeafIndex: false,
            useOverallNumTransfers: false,
            usePerFromAddressNumTransfers: false,
            usePerInitiatedByAddressNumTransfers: false,
            usePerToAddressNumTransfers: false,
            [keyId]: checked,
          }
        }
      }
    });

  }

  const somethingElseChecked = Object.entries(approvalToAdd?.approvalCriteria?.predeterminedBalances?.orderCalculationMethod || {}).some(([key, val]) => key !== keyId && val === true);
  if (somethingElseChecked) return <></>

  let maxUsesErrorMessage = '';
  if ((keyId === 'useMerkleChallengeLeafIndex' || keyId === 'useOverallNumTransfers') && approvalToAdd.approvalCriteria.maxNumTransfers.overallMaxNumTransfers === 0n) {
    maxUsesErrorMessage = 'To calculate number of partitions, you must set an overall max uses.';
  } else if (keyId === 'usePerFromAddressNumTransfers' && approvalToAdd.approvalCriteria.maxNumTransfers.perFromAddressMaxNumTransfers === 0n && approvalToAdd.approvalCriteria.maxNumTransfers.overallMaxNumTransfers === 0n) {
    maxUsesErrorMessage = 'To calculate number of partitions, you must set overall max uses or max uses per sender.';
  } else if (keyId === 'usePerInitiatedByAddressNumTransfers' && approvalToAdd.approvalCriteria.maxNumTransfers.perInitiatedByAddressMaxNumTransfers === 0n && approvalToAdd.approvalCriteria.maxNumTransfers.overallMaxNumTransfers === 0n) {
    maxUsesErrorMessage = 'To calculate number of partitions, you must set overall max uses or max uses per approver.';
  } else if (keyId === 'usePerToAddressNumTransfers' && approvalToAdd.approvalCriteria.maxNumTransfers.perToAddressMaxNumTransfers === 0n && approvalToAdd.approvalCriteria.maxNumTransfers.overallMaxNumTransfers === 0n) {
    maxUsesErrorMessage = 'To calculate number of partitions, you must set overall max uses or max uses per recipient.';
  }

  const maxIncrementsApplied = getMaxIncrementsApplied(approvalToAdd);

  return <><TableRow labelSpan={16} valueSpan={8} label={label} value={<>
    <Switch
      disabled={keyId === 'useMerkleChallengeLeafIndex' && distributionMethod !== DistributionMethod.Codes && distributionMethod !== DistributionMethod.Whitelist}
      checked={checked}
      onChange={(checked) => {
        setChecked(checked);
      }}
    />
  </>
  } />
    {
      <div style={{ textAlign: 'start', marginLeft: 10, marginBottom: 10 }}>
        <Typography.Text className='secondary-text' style={{ fontSize: 12, textAlign: 'start' }}>
          <InfoCircleOutlined />
          {keyId == 'useOverallNumTransfers' ? ' First use of this approval by any user will be assigned partition #1, second use of this approval partition #2, and so on regardless of who sends, receives, or initiates.' : ''}
          {keyId == 'usePerFromAddressNumTransfers' ? ' Each unique sender will be assigned partition #1 upon first use of this approval, partition #2 upon second use, and so on.' : ''}
          {keyId == 'usePerInitiatedByAddressNumTransfers' ? ' Each unique approver will be assigned partition #1 upon first use of this approval, partition #2 upon second use, and so on.' : ''}
          {keyId == 'usePerToAddressNumTransfers' ? ' Each unique recipient will be assigned partition #1 upon first use of this approval, partition #2 upon second use, and so on.' : ''}
          {keyId == 'useMerkleChallengeLeafIndex' ?
            distributionMethod === DistributionMethod.Whitelist ? ' Reserve specific partitions for specific whitelisted users.' :
              distributionMethod === DistributionMethod.Codes ? codeType === CodeType.Unique ?
                ' Reserve specific partitions for specific codes.' :
                ' Reserve specific partitions for specific passwords.' :
                ' Reserve specific partitions for specific users / codes.' : ''}
        </Typography.Text>
      </div>
    }
    {checked && <>
      <hr />
      <b style={{ fontSize: 16 }}> Number of Partitions</b>
      <br />
      <Typography.Text className='secondary-text' style={{ fontSize: 12, textAlign: 'start' }}>
        <InfoCircleOutlined /> The number of partitions is calculated according to how many times users can send, receive, and / or initiate.
        Note the Max Uses selections are the same as above in the address boxes.
      </Typography.Text>
      <br />

      <br />
      {<div style={{}}>
        {maxUsesErrorMessage && <div style={{ color: 'red' }}>{maxUsesErrorMessage}</div>}
        {!maxUsesErrorMessage && <Typography.Text className='primary-text' strong style={{ fontSize: 16 }}>Total Partitions: {maxIncrementsApplied.toString()}</Typography.Text>}
        <br />
        <br />
      </div>}

      <MaxUses
        approvalToAdd={approvalToAdd} setApprovalToAdd={setApprovalToAdd} amountType={amountType} codeType={codeType} distributionMethod={distributionMethod}

        label={'Max uses (all cumulatively)'} type='overall' disabled={distributionMethod === DistributionMethod.Codes} />
      <MaxUses
        approvalToAdd={approvalToAdd} setApprovalToAdd={setApprovalToAdd} amountType={amountType} codeType={codeType} distributionMethod={distributionMethod}

        label={'Max uses per initiator'} type='initiatedBy' disabled={distributionMethod === DistributionMethod.Codes && codeType === CodeType.Reusable} />
      <MaxUses
        approvalToAdd={approvalToAdd} setApprovalToAdd={setApprovalToAdd} amountType={amountType} codeType={codeType} distributionMethod={distributionMethod}
        label={'Max uses per sender'} type='from' />
      <MaxUses
        approvalToAdd={approvalToAdd} setApprovalToAdd={setApprovalToAdd} amountType={amountType} codeType={codeType} distributionMethod={distributionMethod}
        label={'Max uses per recipient'} type='to' />
      <br />

      {maxIncrementsApplied > 0n && !maxUsesErrorMessage && <>
        <hr />
        <b style={{ fontSize: 16 }}> Amounts and IDs per Partition</b>
        <br />
        {(increment ? increment : 0) > 0 && <div style={{ textAlign: 'center', margin: 10 }}>
          {<div>
            {<div className='flex-center'>
              <NumberInput

                value={increment ? Numberify(increment.toString()) : 0}
                setValue={(value) => {
                  setApprovalToAdd({
                    ...approvalToAdd,
                    approvalCriteria: {
                      ...approvalToAdd.approvalCriteria,
                      predeterminedBalances: {
                        ...approvalToAdd.approvalCriteria.predeterminedBalances,
                        incrementedBalances: {
                          ...approvalToAdd.approvalCriteria.predeterminedBalances.incrementedBalances,
                          incrementBadgeIdsBy: BigInt(value),
                        }
                      }
                    }
                  });
                }}
                min={1}
                title="IDs Increment"
              />

              <div style={{ textAlign: 'center', margin: 10 }}>
                <BalanceAmountInput
                  title={'Amount'}
                  balances={startBalances}
                  setBalances={(balances) => {
                    setApprovalToAdd({
                      ...approvalToAdd,
                      approvalCriteria: {
                        ...approvalToAdd.approvalCriteria,
                        predeterminedBalances: {
                          ...approvalToAdd.approvalCriteria.predeterminedBalances,
                          incrementedBalances: {
                            ...approvalToAdd.approvalCriteria.predeterminedBalances.incrementedBalances,
                            startBalances: balances,
                          }
                        }
                      }
                    });
                  }}
                />
              </div>
            </div>}
          </div>}
        </div>}

        <div style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div>
            <div style={{ marginLeft: 8 }}>
              {increment === 0n && 'Each use of this approval will transfer the following badges: '}
              {increment ? `Partition #1 = x${startBalances[0].amount} of ID${increment > 1 ? 's' : ''} ${getBadgeIdsString(startBalances.map(x => x.badgeIds).flat())}.` : ''}
            </div>

            {maxIncrementsApplied > 1n &&
              <div style={{ marginLeft: 8 }}>

                {increment ? `Partition #2 = x${startBalances[0].amount} of ID${increment > 1 ? 's' : ''} ${getBadgeIdsString(startBalances.map(x => x.badgeIds).flat().map(x => { return { start: x.start + increment, end: x.end + increment } }))}.` : ''}

              </div>}

            {maxIncrementsApplied > 2n &&
              <div style={{ marginLeft: 8 }}>
                <div style={{ marginLeft: 8 }}>
                  ...
                </div>
                <div style={{ marginLeft: 8 }}>
                  {increment ? `Partition #${maxIncrementsApplied} = x${startBalances[0].amount} of ID${increment > 1 ? 's' : ''} ${getBadgeIdsString(startBalances.map(x => x.badgeIds).flat().map(x => { return { start: x.start + increment * (maxIncrementsApplied - 1n), end: x.end + increment * (maxIncrementsApplied - 1n) } }))}.` : ''}
                </div>
              </div>}
          </div>
        </div>
        <br />
        <BalanceDisplay
          message={'Approved Badges - All Partitions'}
          hideMessage
          collectionId={collectionId}
          balances={startBalances}
          incrementBadgeIdsBy={increment}
          numIncrements={maxIncrementsApplied}
        />
      </>}
    </>
    }
  </>
}

