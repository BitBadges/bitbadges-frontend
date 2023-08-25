import { Avatar, Divider } from 'antd';
import { AddressMapping, Balance, MsgUpdateUserApprovedTransfers, createTxMsgUpdateUserApprovedTransfers, deepCopy } from 'bitbadgesjs-proto';
import { UserApprovedOutgoingTransferTimelineWithDetails, checkIfUintRangesOverlap, convertToCosmosAddress, getReservedAddressMapping } from 'bitbadgesjs-utils';
import React, { useEffect, useRef, useState } from 'react';
import { getBadgeBalanceByAddress } from '../../bitbadges-api/api';
import { useAccountsContext } from '../../bitbadges-api/contexts/AccountsContext';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { useCollectionsContext } from '../../bitbadges-api/contexts/CollectionsContext';
import { getTotalNumberOfBadges } from '../../bitbadges-api/utils/badges';
import { INFINITE_LOOP_MODE } from '../../constants';
import { FOREVER_DATE } from '../../utils/dates';
import { AddressDisplay } from '../address/AddressDisplay';
import { AddressSelect } from '../address/AddressSelect';
import { BlockiesAvatar } from '../address/Blockies';
import { UserApprovalsTab } from '../collection-page/ApprovalsTab';
import { BalanceInput } from '../tx-timelines/form-items/BalanceInput';
import { SwitchForm } from '../tx-timelines/form-items/SwitchForm';
import { TxModal } from './TxModal';
import { InfoCircleOutlined } from '@ant-design/icons';

const crypto = require('crypto');

export function CreateTxMsgUpdateUserApprovedOutgoingTransfersModal({ collectionId, visible, setVisible, children }: {
  collectionId: bigint,
  visible: boolean,
  setVisible: (visible: boolean) => void,
  children?: React.ReactNode
}) {
  const chain = useChainContext();
  const accounts = useAccountsContext();
  const collections = useCollectionsContext();
  const collection = collections.collections[collectionId.toString()];
  const originalBalances = collections.collections[`${collectionId}`]?.owners.find(x => x.cosmosAddress === chain.cosmosAddress)?.balances ?? [];


  const [balances, setBalances] = useState<Balance<bigint>[]>(originalBalances);
  const [allInOne, setAllInOne] = useState<boolean>(false);
  const [approvee, setApprovee] = useState<string>(chain.address);

  const [fetchedOutgoingTransfers, setFetchedOutgoingTransfers] = useState<UserApprovedOutgoingTransferTimelineWithDetails<bigint>[]>([]);
  const approveeAccount = accounts.getAccount(approvee);



  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: approvee balance ');
    async function getApproveeBalance() {
      await collections.fetchBalanceForUser(collectionId, chain.cosmosAddress);


      const balances = await getBadgeBalanceByAddress(collectionId, chain.cosmosAddress, { doNotHandleAllAndAppendDefaults: true });

      // setNewApprovedOutgoingTransfers(balances.balance.approvedOutgoingTransfersTimeline);
      setFetchedOutgoingTransfers(balances.balance.approvedOutgoingTransfersTimeline);
      console.log('balances', balances);
    }
    getApproveeBalance();
  }, []);

  const approvalId = useRef(crypto.randomBytes(32).toString('hex'));
  const newApprovedOutgoingTransfers = [{
    timelineTimes: [{ start: 1n, end: FOREVER_DATE }],
    approvedOutgoingTransfers: [

      ...(allInOne ? [{
        badgeIds: [{ start: 1n, end: FOREVER_DATE }],
        ownershipTimes: [{ start: 1n, end: FOREVER_DATE }],
        toMappingId: "AllWithMint",
        initiatedByMappingId: convertToCosmosAddress(approvee),
        transferTimes: [{ start: 1n, end: FOREVER_DATE }],
        toMapping: getReservedAddressMapping("AllWithMint", '') as AddressMapping,
        initiatedByMapping: getReservedAddressMapping(convertToCosmosAddress(approvee), '') as AddressMapping,
        approvalDetails: [
          {
            approvalId: approvalId.current,
            uri: '',
            customData: '',
            mustOwnBadges: [],
            approvalAmounts: {
              overallApprovalAmount: 0n,
              perFromAddressApprovalAmount: 0n,
              perToAddressApprovalAmount: 0n,
              perInitiatedByAddressApprovalAmount: 0n,
            },
            maxNumTransfers: {
              overallMaxNumTransfers: 0n,
              perFromAddressMaxNumTransfers: 0n,
              perToAddressMaxNumTransfers: 0n,
              perInitiatedByAddressMaxNumTransfers: 0n,
            },
            predeterminedBalances: {
              manualBalances: [{ balances: balances }],
              incrementedBalances: {
                startBalances: [],
                incrementBadgeIdsBy: 0n,
                incrementOwnershipTimesBy: 0n,
              },
              orderCalculationMethod: {
                useMerkleChallengeLeafIndex: false,
                useOverallNumTransfers: true,
                usePerFromAddressNumTransfers: false,
                usePerInitiatedByAddressNumTransfers: false,
                usePerToAddressNumTransfers: false,
              },
            },
            merkleChallenges: [],
            requireToEqualsInitiatedBy: false,
            requireToDoesNotEqualInitiatedBy: false,
          }],
        allowedCombinations: [{
          isApproved: true,
          toMappingOptions: {
            invertDefault: false,
            allValues: false,
            noValues: false
          },

          initiatedByMappingOptions: {
            invertDefault: false,
            allValues: false,
            noValues: false
          },
          badgeIdsOptions: {
            invertDefault: false,
            allValues: false,
            noValues: false
          },
          ownershipTimesOptions: {
            invertDefault: false,
            allValues: false,
            noValues: false
          },
          transferTimesOptions: {
            invertDefault: false,
            allValues: false,
            noValues: false
          },
        }]
      }] : [...balances.map(x => {
        return {
          badgeIds: [...x.badgeIds],
          ownershipTimes: [...x.ownershipTimes],
          toMappingId: "AllWithMint",
          initiatedByMappingId: convertToCosmosAddress(approvee),
          transferTimes: [{ start: 1n, end: FOREVER_DATE }],
          toMapping: getReservedAddressMapping("AllWithMint", '') as AddressMapping,
          initiatedByMapping: getReservedAddressMapping(convertToCosmosAddress(approvee), '') as AddressMapping,
          approvalDetails: [
            {
              approvalId: approvalId.current,
              uri: '',
              customData: '',
              mustOwnBadges: [],
              approvalAmounts: {
                overallApprovalAmount: x.amount,
                perFromAddressApprovalAmount: 0n,
                perToAddressApprovalAmount: 0n,
                perInitiatedByAddressApprovalAmount: 0n,
              },
              maxNumTransfers: {
                overallMaxNumTransfers: 0n,
                perFromAddressMaxNumTransfers: 0n,
                perToAddressMaxNumTransfers: 0n,
                perInitiatedByAddressMaxNumTransfers: 0n,
              },
              predeterminedBalances: {
                manualBalances: [],
                incrementedBalances: {
                  startBalances: [],
                  incrementBadgeIdsBy: 0n,
                  incrementOwnershipTimesBy: 0n,
                },
                orderCalculationMethod: {
                  useMerkleChallengeLeafIndex: false,
                  useOverallNumTransfers: false,
                  usePerFromAddressNumTransfers: false,
                  usePerInitiatedByAddressNumTransfers: false,
                  usePerToAddressNumTransfers: false,
                },
              },
              merkleChallenges: [],
              requireToEqualsInitiatedBy: false,
              requireToDoesNotEqualInitiatedBy: false,
            }],
          allowedCombinations: [{
            isApproved: true,
            toMappingOptions: {
              invertDefault: false,
              allValues: false,
              noValues: false
            },

            initiatedByMappingOptions: {
              invertDefault: false,
              allValues: false,
              noValues: false
            },
            badgeIdsOptions: {
              invertDefault: false,
              allValues: false,
              noValues: false
            },
            ownershipTimesOptions: {
              invertDefault: false,
              allValues: false,
              noValues: false
            },
            transferTimesOptions: {
              invertDefault: false,
              allValues: false,
              noValues: false
            },
          }]
        }
      })]),
      {
        badgeIds: [{ start: 1n, end: FOREVER_DATE }],
        ownershipTimes: [{ start: 1n, end: FOREVER_DATE }],
        toMappingId: "AllWithMint",
        initiatedByMappingId: convertToCosmosAddress(approvee),
        transferTimes: [{ start: 1n, end: FOREVER_DATE }],
        toMapping: getReservedAddressMapping("AllWithMint", '') as AddressMapping,
        initiatedByMapping: getReservedAddressMapping(convertToCosmosAddress(approvee), '') as AddressMapping,
        approvalDetails: [],
        allowedCombinations: [{
          isApproved: false,
          toMappingOptions: {
            invertDefault: false,
            allValues: false,
            noValues: false
          },

          initiatedByMappingOptions: {
            invertDefault: false,
            allValues: false,
            noValues: false
          },
          badgeIdsOptions: {
            invertDefault: false,
            allValues: false,
            noValues: false
          },
          ownershipTimesOptions: {
            invertDefault: false,
            allValues: false,
            noValues: false
          },
          transferTimesOptions: {
            invertDefault: false,
            allValues: false,
            noValues: false
          },
        }]
      },
      ...(fetchedOutgoingTransfers.length > 0 ? fetchedOutgoingTransfers[0].approvedOutgoingTransfers : []),
    ]
  }]

  const txCosmosMsg: MsgUpdateUserApprovedTransfers<bigint> = {
    creator: chain.cosmosAddress,
    collectionId: collectionId,
    updateUserPermissions: false,
    userPermissions: {
      canUpdateApprovedIncomingTransfers: [],
      canUpdateApprovedOutgoingTransfers: [],
    },
    updateApprovedIncomingTransfersTimeline: false,
    updateApprovedOutgoingTransfersTimeline: true,
    approvedIncomingTransfersTimeline: [],
    approvedOutgoingTransfersTimeline: newApprovedOutgoingTransfers,
  };
  const uintRangesOverlap = checkIfUintRangesOverlap(balances[0]?.badgeIds || []);
  const uintRangesLengthEqualsZero = balances[0]?.badgeIds.length === 0;

  const items = [
    {
      title: 'Select Approvee',
      description: <div>
        <div
          style={{
            padding: '0',
            textAlign: 'center',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 20,
          }}
        >
          <Avatar
            size={150}
            src={
              <BlockiesAvatar
                avatar={approveeAccount?.profilePicUrl ?? approveeAccount?.avatar}
                address={approveeAccount?.address.toLowerCase() ?? ''}
                fontSize={150}
                shape='circle'
              />
            }
          />

          <div className='flex-center' style={{ marginBottom: 10, marginTop: 4 }}>
            <AddressDisplay
              addressOrUsername={approvee}
              hidePortfolioLink
            />
          </div>



          <AddressSelect
            defaultValue={approveeAccount?.username ?? approveeAccount?.address ?? ''}
            onUserSelect={setApprovee}
          />
        </div>
        <Divider />
        <div className='primary-text flex-center'>
          <InfoCircleOutlined style={{ marginRight: 4 }} />
          Note that setting an approval for this address will overwrite all existing approvals for this address.
        </div>
      </div >
    },
    {
      title: 'Select Transfer Type',
      description: <div>
        <br />

        <SwitchForm
          noSelectUntilClick
          options={[
            {
              title: 'All Or Nothing',
              message: 'All badges selected in the next step must be transferred at once.',
              isSelected: allInOne,
            },
            {
              title: 'Tally',
              message: 'Badges selected in the next step can be transferred across multiple transfers, but the cumulative tally of all badges transferred must not exceed what was selected.',
              isSelected: !allInOne,
            },
          ]}
          onSwitchChange={(value) => {
            setAllInOne(value == 0);
          }}
        />
      </div>,
    },
    {
      title: 'Select Badges',
      description: <div>
        <br />

        <BalanceInput
          balancesToShow={balances}
          onAddBadges={(balance) => {
            // const newBalances = deepCopy([...balances, balance]);
            setBalances(deepCopy([...balances, balance]));


          }}
          onRemoveAll={() => {
            setBalances([]);
          }}
          minimum={1n}
          maximum={collection ? getTotalNumberOfBadges(collection) : 0n}
          collectionId={collectionId}
        />
      </div>,
      disabled: uintRangesOverlap || uintRangesLengthEqualsZero,
    },
    {
      title: 'Confirm',
      description: <div style={{ textAlign: 'center', }}>
        <UserApprovalsTab
          collectionId={collectionId}
          // setUserApprovedIncomingTransfers={async (newApprovals) => {
          //   setNewApprovedIncomingTransfers(newApprovals);
          // }}
          // userApprovedIncomingTransfers={newApprovedIncomingTransfers}
          // setUserApprovedOutgoingTransfers={async (newApprovals) => {
          //   setNewApprovedOutgoingTransfers(newApprovals);
          // }}
          isOutgoingApprovalEdit
          userApprovedOutgoingTransfers={newApprovedOutgoingTransfers}
        />
        <br />
      </div>
    },
  ];

  return (
    <TxModal
      msgSteps={items}
      visible={visible}
      setVisible={setVisible}
      txName="Update Approvals"
      txCosmosMsg={txCosmosMsg}
      style={{ minWidth: '95%' }}
      createTxFunction={createTxMsgUpdateUserApprovedTransfers}
      onSuccessfulTx={async () => {
        await collections.fetchCollections([collectionId], true);
        // await collections.fetchBalanceForUser(collectionId, chain.cosmosAddress, true);
      }}
      requireRegistration
    >
      {children}
    </TxModal>
  );
}