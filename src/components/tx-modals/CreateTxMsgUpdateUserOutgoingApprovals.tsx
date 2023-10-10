import { InfoCircleOutlined } from '@ant-design/icons';
import { Avatar, Divider } from 'antd';
import { AddressMapping, Balance, MsgUpdateUserApprovals, createTxMsgUpdateUserApprovals, deepCopy } from 'bitbadgesjs-proto';
import { UserOutgoingApprovalWithDetails, checkIfUintRangesOverlap, convertToCosmosAddress, getReservedAddressMapping } from 'bitbadgesjs-utils';
import React, { useEffect, useRef, useState } from 'react';
import { getBadgeBalanceByAddress } from '../../bitbadges-api/api';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { useAccountsContext } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { useCollectionsContext } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { getTotalNumberOfBadges } from '../../bitbadges-api/utils/badges';
import { INFINITE_LOOP_MODE } from '../../constants';
import { GO_MAX_UINT_64 } from '../../utils/dates';
import { AddressDisplay } from '../address/AddressDisplay';
import { AddressSelect } from '../address/AddressSelect';
import { BlockiesAvatar } from '../address/Blockies';
import { UserApprovalsTab } from '../collection-page/ApprovalsTab';
import { BalanceInput } from '../inputs/BalanceInput';
import { SwitchForm } from '../tx-timelines/form-items/SwitchForm';
import { TxModal } from './TxModal';

const crypto = require('crypto');

export function CreateTxMsgUpdateUserOutgoingApprovalsModal({ collectionId, visible, setVisible, children }: {
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
  const [fetchedOutgoingTransfers, setFetchedOutgoingTransfers] = useState<UserOutgoingApprovalWithDetails<bigint>[]>([]);
  const approveeAccount = accounts.getAccount(approvee);



  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: approvee balance ');
    async function getApproveeBalance() {
      await collections.fetchBalanceForUser(collectionId, chain.cosmosAddress);

      const balances = await getBadgeBalanceByAddress(collectionId, chain.cosmosAddress, { doNotHandleAllAndAppendDefaults: true });
      console.log(JSON.stringify(balances.balance.outgoingApprovals, null, 2));
      setFetchedOutgoingTransfers(balances.balance.outgoingApprovals);
    }
    getApproveeBalance();
  }, []);

  const amountTrackerId = useRef(crypto.randomBytes(32).toString('hex'));
  const newOutgoingApprovals: UserOutgoingApprovalWithDetails<bigint>[] = [
    ...(allInOne ? [{
      badgeIds: [{ start: 1n, end: GO_MAX_UINT_64 }],
      ownershipTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
      toMappingId: "AllWithMint",
      initiatedByMappingId: convertToCosmosAddress(approvee),
      transferTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
      toMapping: getReservedAddressMapping("AllWithMint") as AddressMapping,
      initiatedByMapping: getReservedAddressMapping(convertToCosmosAddress(approvee)) as AddressMapping,
      amountTrackerId: amountTrackerId.current,
      approvalId: amountTrackerId.current,
      challengeTrackerId: amountTrackerId.current,
      approvalCriteria: {
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
      }
    }] : [...balances.map((x, idx) => {
      return {
        badgeIds: [...x.badgeIds],
        ownershipTimes: [...x.ownershipTimes],
        toMappingId: "AllWithMint",
        initiatedByMappingId: convertToCosmosAddress(approvee),
        transferTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
        toMapping: getReservedAddressMapping("AllWithMint") as AddressMapping,
        initiatedByMapping: getReservedAddressMapping(convertToCosmosAddress(approvee)) as AddressMapping,
        amountTrackerId: idx + "-" + amountTrackerId.current,
        approvalId: idx + "-" + amountTrackerId.current,
        challengeTrackerId: idx + "-" + amountTrackerId.current,
        approvalCriteria: {
          approvalAmounts: {
            overallApprovalAmount: x.amount,
            perFromAddressApprovalAmount: 0n,
            perToAddressApprovalAmount: 0n,
            perInitiatedByAddressApprovalAmount: 0n,
          },
        },

      }
    })]),
    ...(fetchedOutgoingTransfers.length > 0 ? fetchedOutgoingTransfers : []),
  ]

  const txCosmosMsg: MsgUpdateUserApprovals<bigint> = {
    creator: chain.cosmosAddress,
    collectionId: collectionId,
    updateUserPermissions: false,
    userPermissions: {
      canUpdateIncomingApprovals: [],
      canUpdateOutgoingApprovals: [],
      canUpdateAutoApproveSelfInitiatedIncomingTransfers: [],
      canUpdateAutoApproveSelfInitiatedOutgoingTransfers: [],
    },
    updateIncomingApprovals: false,
    updateOutgoingApprovals: true,
    incomingApprovals: [],
    outgoingApprovals: newOutgoingApprovals,
    autoApproveSelfInitiatedIncomingTransfers: false,
    autoApproveSelfInitiatedOutgoingTransfers: false,
    updateAutoApproveSelfInitiatedIncomingTransfers: false,
    updateAutoApproveSelfInitiatedOutgoingTransfers: false,
  };
  const uintRangesOverlap = balances.some(x => checkIfUintRangesOverlap(x.badgeIds));
  const uintRangesLengthEqualsZero = balances.some(x => x.badgeIds.length === 0);

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
          // noSelectUntilClick
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
          isOutgoingApprovalEdit
          userOutgoingApprovals={newOutgoingApprovals}
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
      createTxFunction={createTxMsgUpdateUserApprovals}
      onSuccessfulTx={async () => {
        await collections.fetchCollections([collectionId], true);
      }}
      requireRegistration
    >
      {children}
    </TxModal>
  );
}