import { CloseOutlined, DeleteOutlined, PlusOutlined, WarningOutlined } from '@ant-design/icons';
import { Avatar, Button, Col, Collapse, Divider, Empty, Row, StepProps, Steps, Tooltip, Typography } from 'antd';
import CollapsePanel from 'antd/lib/collapse/CollapsePanel';
import { Balance, IdRange, UserBalance, convertBalance, convertIdRange, convertUserBalance } from 'bitbadgesjs-proto';
import { BigIntify, ClaimDetails, ClaimInfoWithDetails, DistributionMethod, Numberify, TransferWithIncrements, checkIfIdRangesOverlap, getBalancesAfterTransfers, getBlankBalance } from 'bitbadgesjs-utils';
import { SHA256 } from 'crypto-js';
import MerkleTree from 'merkletreejs';
import { useEffect, useState } from 'react';
import { useAccountsContext } from '../../bitbadges-api/contexts/AccountsContext';
import { useCollectionsContext } from '../../bitbadges-api/contexts/CollectionsContext';
import { BalanceBeforeAndAfter } from '../balances/BalanceBeforeAndAfter';
import { BalanceDisplay } from '../balances/BalanceDisplay';
import { BalancesInput } from '../balances/BalancesInput';
import { IdRangesInput } from '../balances/IdRangesInput';
import { Pagination } from '../common/Pagination';
import { InformationDisplayCard } from '../display/InformationDisplayCard';
import { NumberInput } from '../display/NumberInput';
import { MSG_PREVIEW_ID } from '../tx-timelines/TxTimeline';
import { SwitchForm } from '../tx-timelines/form-items/SwitchForm';
import { ClaimCodesSelectStep } from './ClaimCodesSelectStep';
import { ClaimMetadataSelectSelectStep } from './ClaimMetadataSelectStep';
import { ClaimTimeRangeSelectStep } from './ClaimTimeRangeSelectStep';
import { RecipientsSelectStep } from './RecipientsSelectStep';
import { TransferDisplay } from './TransferDisplay';
import { ClaimsTab } from '../collection-page/ClaimsTab';
import { ClaimDisplay } from '../claims/ClaimDisplay';

const crypto = require('crypto');
const { Text } = Typography;

const { Step } = Steps;

export enum AmountSelectType {
  None,
  Custom,
  Increment,
}

export enum CodeType {
  None,
  Unique,
  Reusable
}
//export TransferSelect with alias of ClaimSelect
export { TransferSelect as ClaimSelect };

export function TransferSelect({
  transfers,
  setTransfers,
  collectionId,
  plusButton,
  sender,
  originalSenderBalance,
  distributionMethod,
  hideTransferDisplay,
  claims,
  setClaims,
}: {
  transfers?: (TransferWithIncrements<bigint>)[],
  setTransfers?: (transfers: (TransferWithIncrements<bigint>)[]) => void;
  sender: string,
  claims?: (ClaimInfoWithDetails<bigint> & { password: string, codes: string[] })[],
  setClaims?: (claims: (ClaimInfoWithDetails<bigint> & { password: string, codes: string[] })[]) => void;
  hideTransferDisplay?: boolean;
  collectionId: bigint;
  distributionMethod: DistributionMethod;
  originalSenderBalance: UserBalance<bigint>
  plusButton?: boolean;
}) {
  const collections = useCollectionsContext();
  const collection = collections.getCollection(collectionId);
  const accounts = useAccountsContext();
  const doNotUseTransferWithIncrements = distributionMethod === DistributionMethod.DirectTransfer ? true : false;

  const isClaimSelect = distributionMethod === DistributionMethod.Codes || distributionMethod === DistributionMethod.FirstComeFirstServe || distributionMethod === DistributionMethod.Whitelist ? true : false;
  const isTransferSelect = !isClaimSelect;
  if (!isClaimSelect || !isTransferSelect) throw new Error('Must be either claims or transfers select');

  const [numRecipients, setNumRecipients] = useState<bigint>(0n);
  const [increment, setIncrement] = useState<bigint>(0n);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [warningMessage, setWarningMessage] = useState<string>('');
  const [postTransferBalance, setPostTransferBalance] = useState<UserBalance<bigint>>();
  const [preTransferBalance, setPreTransferBalance] = useState<UserBalance<bigint>>();
  const [amountSelectType, setAmountSelectType] = useState(AmountSelectType.None);
  const [addTransferIsVisible, setAddTransferIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [currPage, setCurrPage] = useState(1);

  //For the current transfer we are going to add (we also use these fields to calculate the claim amounts and badges)
  const [balances, setBalances] = useState<Balance<bigint>[]>(originalSenderBalance.balances.map((x) => convertBalance(x, BigIntify)));
  const [toAddresses, setToAddresses] = useState<string[]>([]);
  const [transfersToAdd, setTransfersToAdd] = useState<TransferWithIncrements<bigint>[]>([]);


  //Claim information - Not used if transfer select
  const [claimDetails, setClaimDetails] = useState<ClaimDetails<bigint>>({
    name: '',
    description: '',
    hasPassword: false,
    challengeDetails: [], //handled in CreateClaims.tsx
  });
  const [claimTimeRange, setClaimTimeRange] = useState<IdRange<bigint>>({ start: 0n, end: 0n });
  const [claimPassword, setClaimPassword] = useState('');

  const claimBalance = preTransferBalance && postTransferBalance ? getBalancesAfterTransfers(preTransferBalance?.balances, [{
    toAddresses: [],
    toAddressesLength: 1n,
    balances: postTransferBalance?.balances
  }]) : [];

  const claimId = (collection?.nextClaimId ?? 1n) + BigInt(claims?.length ?? 0);
  const claimToAdd: ClaimInfoWithDetails<bigint> & { password: string, codes: string[] } = {
    undistributedBalances: claimBalance,
    collectionId: MSG_PREVIEW_ID,
    claimId,
    totalClaimsProcessed: 0n,
    challenges: [], //handled in CreateClaims.tsx
    claimsPerAddressCount: {},
    usedLeaves: [],
    usedLeafIndices: [],
    timeRange: claimTimeRange,
    numClaimsPerAddress: distributionMethod === DistributionMethod.FirstComeFirstServe ? 1n : 0n, //TODO:
    incrementIdsBy: increment,
    currentClaimAmounts: balances,
    uri: '',
    _id: `${MSG_PREVIEW_ID}:${claimId}`,
    password: claimPassword,
    details: claimDetails,
    codes: [],
  };

  const onStepChange = (value: number) => {
    setCurrentStep(value);
  };

  let totalNumBadges = 0n;
  for (const balance of balances) {
    for (const badgeIdRange of balance.badgeIds) {
      totalNumBadges += badgeIdRange.end - badgeIdRange.start + 1n;
    }
  }

  let convertedTransfers = transfers ?? [];
  if (isClaimSelect) {
    convertedTransfers = claims?.map((claim) => {
      return {
        toAddresses: [],
        toAddressesLength: 1n,
        balances: claim.undistributedBalances
      }
    }) || [];
  }

  //Reset the balances whenever the sender balance changes
  useEffect(() => {
    setBalances(originalSenderBalance.balances.map((x) => convertBalance(x, BigIntify)));
  }, [originalSenderBalance]);

  //Whenever something changes, update the pre and post transfer balances
  useEffect(() => {
    let convertedTransfers = transfers ?? [];
    if (isClaimSelect) {
      convertedTransfers = claims?.map((claim) => {
        return {
          toAddresses: [],
          toAddressesLength: 1n,
          balances: claim.undistributedBalances
        }
      }) || [];
    }

    //Calculate from beginning
    let postTransferBalanceObj = convertUserBalance(originalSenderBalance, BigIntify);
    let preTransferBalanceObj = convertUserBalance(originalSenderBalance, BigIntify);

    if (!postTransferBalanceObj || postTransferBalanceObj === getBlankBalance()) return;
    if (!preTransferBalanceObj || preTransferBalanceObj === getBlankBalance()) return;

    preTransferBalanceObj.balances = getBalancesAfterTransfers(preTransferBalanceObj.balances, [...convertedTransfers]);
    postTransferBalanceObj.balances = getBalancesAfterTransfers(postTransferBalanceObj.balances, [...convertedTransfers]);

    //Deduct transfers to add
    postTransferBalanceObj.balances = getBalancesAfterTransfers(postTransferBalanceObj.balances, [...transfersToAdd]);

    setPostTransferBalance(postTransferBalanceObj);
    setPreTransferBalance(preTransferBalanceObj);
  }, [transfersToAdd, originalSenderBalance, transfers, claims, isClaimSelect, isTransferSelect]);

  useEffect(() => {
    //Generate any error or warning messages for undistributed or overflowing badge amounts
    const checkForErrorsAndWarnings = () => {
      let errorMessage = '';
      let warningMessage = '';
      for (const balance of balances) {
        for (const badgeIdRange of balance.badgeIds) {
          if ((badgeIdRange.start + (increment * numRecipients) - 1n) > badgeIdRange.end) {
            errorMessage = `You are attempting to distribute badges you didn't previously select (IDs  ${balance.badgeIds.map((range) => {
              if ((range.start + (increment * numRecipients) - 1n) > range.end) {
                return `${range.end + 1n}-${range.start + (increment * numRecipients) - 1n}`;
              } else {
                return undefined;
              }
            }).filter(x => !!x).join(', ')}).`;
          } else if ((badgeIdRange.start + (increment * numRecipients) - 1n) < badgeIdRange.end) {
            warningMessage = `This will not distribute the following badges: IDs ${balance.badgeIds.map((range) => {
              if ((range.start + (increment * numRecipients) - 1n) < range.end) {
                return `${range.start + (increment * numRecipients)}-${range.end}`;
              } else {
                return undefined;
              }
            }).filter(x => !!x).join(', ')} `;
          }
        }
      }
      setErrorMessage(errorMessage);
      setWarningMessage(warningMessage);
    }

    if (numRecipients === 0n) return;

    const incrementIsSelected = amountSelectType === AmountSelectType.Increment;
    let newTransfersToAdd: TransferWithIncrements<bigint>[] = [];

    //We have a couple combinations here
    //1. Normal transfer - no increments, can be used with everything (codes, direct transfers, whitelist, etc)
    //2. Increment IDs after every claim/transfer - for claims (whitelist, code, etc.), this supports numIncrements / incrementIdsBy, but for direct transfers, we need to add N unique transfers with each increment manually added

    // If we are not using increments at all, then we can just add the transfers as is (normal transfer)
    if (!incrementIsSelected) {
      newTransfersToAdd = [{
        toAddresses: toAddresses,
        balances: balances,
        toAddressesLength: numRecipients,
      }];
    } else if (amountSelectType === AmountSelectType.Increment) {
      let numPerAddress = increment;

      checkForErrorsAndWarnings();

      const currBadgeIds: IdRange<bigint>[] = [];
      for (const balance of balances) {
        for (const badgeIdRange of balance.badgeIds) {
          currBadgeIds.push(convertIdRange(badgeIdRange, BigIntify));
        }
      }

      //If we are using increments and directly transferring (doNotUseTransferWithIncrements = true), then we need to add N unique transfers with each increment manually added
      if (doNotUseTransferWithIncrements) {
        //Add N transfers, each with a different increment
        for (let i = 0; i < numRecipients; i++) {
          newTransfersToAdd.push({
            toAddresses: [toAddresses[i]],
            balances: [{
              amount: balances[0]?.amount || 1n,
              badgeIds: currBadgeIds.map((badgeIdRange) => convertIdRange(badgeIdRange, BigIntify)),
            }],
          });

          //Increment the badge IDs for the next transfer
          for (let j = 0; j < currBadgeIds.length; j++) {
            currBadgeIds[j].start += increment;
            currBadgeIds[j].end += increment;
          }
        }
      } else {
        //Else, we can just add the transfer with increments and it'll be handled
        newTransfersToAdd.push({
          toAddresses: toAddresses,
          balances: [{
            amount: balances[0]?.amount || 1n,
            badgeIds: currBadgeIds,
          }],
          toAddressesLength: numRecipients,
          incrementIdsBy: numPerAddress,
        });
      }
    }

    setTransfersToAdd(newTransfersToAdd);
  }, [balances, numRecipients, increment, amountSelectType, toAddresses, doNotUseTransferWithIncrements]);

  const idRangesOverlap = checkIfIdRangesOverlap(balances[0]?.badgeIds || []);
  const idRangesLengthEqualsZero = balances[0]?.badgeIds.length === 0;

  //We have five potential steps
  //1. Select recipients, number of codes, max number of claims depending on distribution method
  //2. Select badges to distribute
  //3. Select amount to distribute
  //4. Select time range (if claim)
  //5. Review and confirm
  const steps: StepProps[] = [];

  //Add first step (calculating number of recipients and who the recipients are in the case of a typical transfer)
  if (distributionMethod === DistributionMethod.Codes) {
    steps.push(ClaimCodesSelectStep(distributionMethod, setNumRecipients, claimPassword, setClaimPassword));
  } else if (distributionMethod === DistributionMethod.FirstComeFirstServe) {
    steps.push(ClaimCodesSelectStep(distributionMethod, setNumRecipients));
  } else {
    steps.push(RecipientsSelectStep({
      sender: sender,
      collectionId: collectionId,
      senderBalance: originalSenderBalance,
      setNumRecipients
    }));
  }

  //Add second step
  steps.push({
    title: 'Badges',
    description: <div>
      <br />

      <IdRangesInput
        idRanges={balances[0]?.badgeIds || []}
        // defaultAllSelected={false}
        setIdRanges={(badgeIds) => {
          setBalances([{
            amount: balances[0]?.amount || 0n,
            badgeIds
          }]);
        }}
        minimum={1n}
        maximum={collection?.nextBadgeId ? collection?.nextBadgeId - 1n : undefined}
        collectionId={collectionId}

      />
    </div>,
    disabled: idRangesOverlap || idRangesLengthEqualsZero,
  });

  //Add third step
  steps.push({
    title: 'Amounts',
    description: <div>
      {numRecipients > 1 && <div>
        {balances[0]?.badgeIds && (increment ? increment : 0) >= 0 && setIncrement && <div>
          {numRecipients > 1 && <div>
            <SwitchForm
              options={[{
                title: 'Standard',
                message: 'An equal amount of all badge IDs will be sent to each recipient (often used for fungible collections).',
                isSelected: amountSelectType === AmountSelectType.Custom,
              },
              {
                title: 'Incremented',
                message: `After each claim, the badge IDs will be incremented by X before the next claim (often used with non-fungible collections).`,
                isSelected: amountSelectType === AmountSelectType.Increment,
              }]}
              onSwitchChange={(option, _title) => {

                if (option === 0) {
                  setAmountSelectType(AmountSelectType.Custom);
                  setIncrement(0n);
                  setErrorMessage('');
                  setWarningMessage('');
                } else {
                  setAmountSelectType(AmountSelectType.Increment);
                  setIncrement(1n);
                }
              }}
            />
          </div>}


          {amountSelectType === AmountSelectType.Increment && < div >
            <NumberInput
              value={increment ? Numberify(increment.toString()) : 0}
              setValue={(value) => {
                setIncrement(BigInt(value));
              }}
              min={1}
              title="Increment"
            />

            <div style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

              <div>
                <div style={{ marginLeft: 8 }}>
                  {increment === 0n && 'All recipients will receive all of the previously selected badge IDs.'}
                  {increment ? `The first recipient to claim will receive the badge ID${increment > 1 ? 's' : ''} ${balances[0]?.badgeIds.map(({ start }) => `${start}${increment > 1 ? `-${start + increment - 1n}` : ''}`).join(', ')}.` : ''}
                </div>
                <div style={{ marginLeft: 8 }}>

                  {increment ? `The second recipient to claim will receive the badge ID${increment > 1 ? 's' : ''} ${balances[0]?.badgeIds.map(({ start }) => `${start + increment}${increment > 1 ? `-${start + increment + increment - 1n}` : ''}`).join(', ')}.` : ''}

                </div>

                {numRecipients > 3 && <div style={{ marginLeft: 8 }}>
                  <div style={{ marginLeft: 8 }}>
                    {increment ? `...` : ''}
                  </div>
                </div>}
                {numRecipients > 2 && <div style={{ marginLeft: 8 }}>
                  <div style={{ marginLeft: 8 }}>
                    {increment ? `The ${numRecipients === 3n ? 'third' : numRecipients + 'th'} selected recipient to claim will receive the badge ID${increment > 1 ? 's' : ''} ${balances[0]?.badgeIds.map(({ start }) => `${start + (numRecipients - 1n) * increment}${increment > 1 ? `-${start + (numRecipients - 1n) * increment + increment - 1n}` : ''}`).join(', ')}.` : ''}
                  </div>
                </div>}
              </div>
            </div>
            {increment !== 0n && increment !== totalNumBadges / numRecipients && <div style={{ textAlign: 'center' }}>
              <br />
              {warningMessage &&
                <div style={{ textAlign: 'center' }}>
                  <div>
                    <WarningOutlined style={{ color: 'orange' }} />
                    <span style={{ marginLeft: 8 }}>
                      {warningMessage}. The undistributed badges will be deselected.
                    </span>
                  </div>
                </div>

              }
              {errorMessage &&
                <div style={{ textAlign: 'center' }}>
                  <WarningOutlined style={{ color: 'red' }} />
                  <span style={{ marginLeft: 8, color: 'red' }}>
                    {errorMessage}
                  </span>
                </div>
              }
              <br />
            </div>}

            <hr />
          </div>}

        </div>}

      </div>
      }

      <br />
      {<div>
        <BalancesInput
          balances={balances}
          setBalances={setBalances}
        />

        {(numRecipients <= 1 || amountSelectType === AmountSelectType.Custom) && <div>
          {/* <hr /> */}
          <TransferDisplay
            transfers={transfersToAdd}
            collectionId={collectionId}
            from={[sender]}
            hideAddresses
          />
        </div>}
        <Divider />

        {
          postTransferBalance && <div>
            <BalanceBeforeAndAfter collectionId={collectionId} balance={preTransferBalance ? preTransferBalance : originalSenderBalance} newBalance={postTransferBalance} partyString='' beforeMessage='Before Transfer Is Added' afterMessage='After Transfer Is Added' />
            {/* {transfers.length >= 1 && <p style={{ textAlign: 'center' }} className='secondary-text'>*These balances assum.</p>} */}
          </div>
        }
      </div>}
    </div >,
    disabled: balances.length == 0 || !!postTransferBalance?.balances?.find((balance) => balance.amount < 0) || errorMessage ? true : false,
  });

  //Add time select step
  if (isClaimSelect) {
    steps.push(ClaimTimeRangeSelectStep(claimTimeRange, setClaimTimeRange));
    steps.push(ClaimMetadataSelectSelectStep(claimDetails, setClaimDetails));
  }

  steps.push({
    title: 'Confirm',
    description: <div>
      {isClaimSelect ? <div>
        <ClaimDisplay
          claim={claimToAdd}
          collectionId={collectionId}
          openModal={() => { }}
        />
      </div> :
        <TransferDisplay
          transfers={transfersToAdd}
          collectionId={collectionId}
          from={[sender]}
        />
      }
      <br />
      <Button type='primary'
        className='full-width'
        onClick={async () => {
          if (isTransferSelect && setTransfers && transfers) {
            setTransfers([...transfers, ...transfersToAdd]);
            setBalances(getBalancesAfterTransfers(originalSenderBalance.balances, [...transfers, ...transfersToAdd]));
          } else if (isClaimSelect && setClaims && claims) {
            const convertedTransfers: TransferWithIncrements<bigint>[] = [...claims, claimToAdd].map(claim => {
              return {
                toAddresses: [],
                toAddressesLength: 1n,
                balances: claim.undistributedBalances
              }
            })
            setBalances(getBalancesAfterTransfers(originalSenderBalance.balances, convertedTransfers));

            //Previously we just set challenges and challengeDetails to []
            //Set them here
            const codes = [];
            const addresses = [];


            if (distributionMethod === DistributionMethod.Codes) {
              for (let i = 0; i < numRecipients; i++) {
                const code = crypto.randomBytes(32).toString('hex');
                codes.push(code);
              }

              const hashedCodes = codes.map(x => SHA256(x).toString());
              const codesTree = new MerkleTree(hashedCodes, SHA256, { fillDefaultHash: '0000000000000000000000000000000000000000000000000000000000000000' });
              const codesRoot = codesTree.getRoot().toString('hex');

              claimToAdd.challenges = [{
                root: codesRoot ? codesRoot : '',
                expectedProofLength: BigInt(codesTree.getLayerCount() - 1),
                useCreatorAddressAsLeaf: false,
              }];

              claimDetails.hasPassword = claimPassword ? true : false;
              claimToAdd.codes = codes;
              claimToAdd.password = claimPassword;

              claimDetails.challengeDetails = [{
                leavesDetails: {
                  leaves: hashedCodes,
                  isHashed: true,
                  preimages: codes,
                },
                numLeaves: BigInt(numRecipients),
              }];

              claimToAdd.details = claimDetails;

            } else if (distributionMethod === DistributionMethod.Whitelist) {
              const accountsFetched = await accounts.fetchAccounts(toAddresses);
              for (let i = 0; i < toAddresses.length; i++) {
                addresses.push(accountsFetched[i].cosmosAddress);
              }

              const addressesTree = new MerkleTree(addresses.map(x => SHA256(x)), SHA256, { fillDefaultHash: '0000000000000000000000000000000000000000000000000000000000000000' });
              const addressesRoot = addressesTree.getRoot().toString('hex');

              claimToAdd.challenges = [{
                root: addressesRoot ? addressesRoot : '',
                expectedProofLength: BigInt(addressesTree.getLayerCount() - 1),
                useCreatorAddressAsLeaf: true,
              }];

              claimDetails.hasPassword = false;
              claimToAdd.codes = [];
              claimToAdd.password = '';


              claimDetails.challengeDetails = [{
                leavesDetails: {
                  leaves: addresses,
                  isHashed: false,
                },
                numLeaves: BigInt(numRecipients),
              }];

              claimToAdd.details = claimDetails;
            } else {
              claimDetails.hasPassword = false;
              claimToAdd.codes = [];
              claimToAdd.password = '';
            }

            setClaims([...claims, claimToAdd]);
          }

          setToAddresses([]);
          setAmountSelectType(AmountSelectType.None);
          setIncrement(0n);
          setAddTransferIsVisible(false);
          setCurrentStep(0);
          setNumRecipients(0n);
        }}>
        Add Transfer(s)
      </Button>
      {distributionMethod === DistributionMethod.Codes && !claimDetails?.password &&
        <div className='flex-center secondary-text full-width'>
          <h5 className='primary-text'>Once this collection has been created, distribute the codes via the Claims tab.</h5>
        </div>}
    </div >,
    disabled: false
  });


  return <>

    <div style={{ textAlign: 'center', justifyContent: 'center', display: 'flex', width: '100%' }} className='primary-text'>
      <Row style={{ width: '100%', display: 'flex', justifyContent: 'space-around' }}>
        <Col md={11} sm={24} xs={24} className='flex'>
          <InformationDisplayCard
            title='Undistributed Badges'
          >
            {balances.length > 0 && <BalanceDisplay
              collectionId={MSG_PREVIEW_ID}
              balance={{ balances: balances, approvals: [] }}
            />}
            {balances.length === 0 && <Empty
              className='primary-text'
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description='No badges to distribute.'
            />}
          </InformationDisplayCard>
        </Col>

        <Col md={11} sm={24} xs={24} className='flex'>
          <InformationDisplayCard
            title={distributionMethod}
          >
            <>
              {[...(transfers ?? []), ...(claims ?? [])].length === 0 && <Empty
                className='primary-text'
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={distributionMethod === DistributionMethod.Codes ? 'No codes generated.' : distributionMethod === DistributionMethod.Whitelist ? 'No users added.' : 'No claims added.'} />}

              {[...(transfers ?? []), ...(claims ?? [])].length > 0 && <>
                {distributionMethod === DistributionMethod.Codes && <>
                  <Typography.Text className='primary-text'>
                    Once the badge(s) have been created, navigate to the Claims tab to distribute these codes.
                  </Typography.Text>
                  <br />
                  <br />
                </>}
                <div className='flex-center'>
                  <Pagination currPage={currPage} onChange={setCurrPage} total={[...(transfers ?? []), ...(claims ?? [])].length} pageSize={1} />
                </div>
                <Collapse accordion className='primary-text primary-blue-bg' style={{ margin: 0 }}>
                  {[...(transfers ?? []), ...(claims ?? [])].map((item, index) => {
                    if (index < (currPage - 1) * (distributionMethod === DistributionMethod.Codes ? 20 : 10) || index >= currPage * (distributionMethod === DistributionMethod.Codes ? 20 : 10)) {
                      return <></>
                    }

                    // const transferItem = item as TransferWithIncrements<bigint>;
                    const claimItem = item as ClaimInfoWithDetails<bigint> & { password: string, codes: string[] };

                    return <CollapsePanel
                      header={
                        <div className='primary-text' style={{ margin: 0, textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', fontSize: 14 }}>
                            <Text strong className='primary-text'>
                              ({index}) {distributionMethod} {distributionMethod === DistributionMethod.Codes ?
                                claimItem.password ? '(Claim Password: ' + claimItem.password + ')' : claimItem.codes.length + ' Codes'
                                : ''} {distributionMethod === DistributionMethod.Whitelist ? '(Addresses: ' + claimItem.details?.challengeDetails[0].numLeaves + ')' : ''}
                            </Text>
                          </div>

                          <div>
                            <Tooltip title='Delete'>
                              <DeleteOutlined onClick={
                                () => {
                                  if (isClaimSelect && setClaims && claims) setClaims(claims.filter((_, i) => i !== index));
                                  if (isTransferSelect && setTransfers && transfers) setTransfers(transfers.filter((_, i) => i !== index));
                                }
                              } />
                            </Tooltip>
                          </div>
                        </div>
                      }
                      key={index}
                      className='primary-text primary-blue-bg'
                    >
                      <div className='primary-text primary-blue-bg' >
                        <TransferDisplay
                          collectionId={collectionId}
                          from={[sender]}
                          transfers={convertedTransfers}
                        />
                        <Divider />
                      </div>
                    </CollapsePanel>
                  })}
                </Collapse>
                <Divider />
              </>}
            </>
          </InformationDisplayCard>
        </Col>
      </Row>

    </div >
    <div style={{ width: 800, alignItems: 'center' }} className='primary-text'>
      <div>
        {
          !addTransferIsVisible && !hideTransferDisplay && <div>
            {!isClaimSelect && <div>
              <div className='flex-between'>
                <div></div>
                <h2 style={{ textAlign: 'center' }} className='primary-text'>Transfers Added ({convertedTransfers.length})</h2>
                <div></div>
              </div>
              <TransferDisplay
                transfers={convertedTransfers}
                setTransfers={setTransfers}
                collectionId={collectionId}
                from={[sender]}
                deletable
              />
            </div>}

            {isClaimSelect && claims && <div>
              <div className='flex-between'>
                <div></div>
                <h2 style={{ textAlign: 'center' }} className='primary-text'>Claims Added ({claims.length})</h2>
                <div></div>
              </div>
              <ClaimsTab
                collectionId={collectionId}
                codes={claims.map(x => x.codes)}
                passwords={claims.map(x => x.password)}
              />
            </div>
            }

            <Divider />
            <hr />
            <br />
          </div>
        }

        {
          addTransferIsVisible ?
            <div>
              < div className='flex-between' >
                <div></div>
                <h2 style={{ textAlign: 'center' }} className='primary-text'>Add {distributionMethod ? 'Claim' : 'Transfer'}?</h2>
                <div>
                  <Tooltip title='Cancel' placement='bottom'>
                    <CloseOutlined
                      onClick={() => {
                        setAddTransferIsVisible(false);
                      }}
                      style={{ fontSize: 20, cursor: 'pointer' }} className='primary-text'
                    />
                  </Tooltip>
                </div>
              </div>
              <Steps
                current={currentStep}
                onChange={onStepChange}
              >
                {steps.map((item, index) => (
                  <Step
                    key={index}
                    title={<b>{item.title}</b>}
                    disabled={item.disabled || (steps && steps.find((step, idx) => step.disabled && idx < index) ? true : false)}
                  />
                ))}
              </Steps>
              {steps.map((item, index) => (
                <div key={index} className='primary-text'>
                  {currentStep === index && <div>
                    {item.description}
                  </div>}
                </div>
              ))}
            </div>
            : <>
              {plusButton ? <div className='flex-center'>
                <Avatar
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setAddTransferIsVisible(true);
                  }}
                  src={<PlusOutlined />}
                  className='screen-button'
                >
                </Avatar>
              </div> :
                <div className='flex-center'>
                  <Button
                    type='primary'
                    onClick={() => {
                      setAddTransferIsVisible(true);
                    }}
                    style={{ marginTop: 20, width: '100%' }}
                  >
                    Add New Transfer
                  </Button>
                </div>}
            </>}
        <br />
      </div>
    </div >
  </>
}