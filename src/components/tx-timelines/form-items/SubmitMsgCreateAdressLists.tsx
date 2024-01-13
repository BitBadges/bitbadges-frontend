import { DatePicker, Divider, Input, Switch, Typography } from 'antd';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { addMetadataToIpfs, updateAddressLists } from '../../../bitbadges-api/api';
import { useChainContext } from '../../../bitbadges-api/contexts/ChainContext';

import { NEW_COLLECTION_ID, useTxTimelineContext } from '../../../bitbadges-api/contexts/TxTimelineContext';
import { CreateTxMsgCreateAddressListModal } from '../../tx-modals/CreateTxMsgCreateAddressLists';

import { InfoCircleOutlined } from '@ant-design/icons';
import { AddressListEditKey } from 'bitbadgesjs-utils';
import moment from 'moment';
import { useCollection } from '../../../bitbadges-api/contexts/collections/CollectionsContext';
import { GO_MAX_UINT_64 } from '../../../utils/dates';
import { InformationDisplayCard } from '../../display/InformationDisplayCard';
import { TableRow } from '../../display/TableRow';
import { SwitchForm } from './SwitchForm';
const crypto = require('crypto');

export function SubmitMsgCreateAddressList() {
  const chain = useChainContext();
  const txState = useTxTimelineContext();
  const addressList = txState.addressList;
  const setAddressList = txState.setAddressList;
  const isUpdateAddressList = txState.isUpdateAddressList;

  const [loading, setLoading] = useState<boolean>(false);
  const [visible, setVisible] = useState<boolean>(false);

  const router = useRouter();

  const [onChainStorage, setOnChainStorage] = useState<boolean>(false);
  const [clicked, setClicked] = useState<boolean>(!!isUpdateAddressList);

  const collection = useCollection(NEW_COLLECTION_ID);

  const [privateMode, setPrivateMode] = useState<boolean>(false);
  const [editKeys, setEditKeys] = useState<AddressListEditKey<bigint>[]>(addressList.editKeys ?? []);

  useEffect(() => {
    if (!isUpdateAddressList) {
      setAddressList({
        ...addressList,
        listId: '',
      });
    }
  }, [])

  const ListIDInput = () => <><div >
    <Typography.Text strong style={{ fontSize: 18 }} className='primary-text'>List ID</Typography.Text>
  </div>
    <Input
      defaultValue={addressList.listId}
      placeholder="Enter a unique identifier for your list."
      value={addressList.listId}
      onChange={async (e) => {

        setAddressList({
          ...addressList,
          listId: e.target.value,
        });
      }}
      className='form-input'
      size='large'
    />
  </>


  return <div className='full-width'
    style={{ marginTop: 20, }} >
    {!isUpdateAddressList && <>
      <SwitchForm
        options={[

          {
            title: 'Off-Chain',
            message: <div>{`We handle the storage for you! We will store your list info on our centralized servers and IPFS. This is completely free!  `}
            </div>,
            isSelected: clicked && !onChainStorage,
            additionalNode: () => <>
              <>{ListIDInput()}</>
              {<>
                {clicked && !onChainStorage &&
                  <>{!isUpdateAddressList && <Divider />}
                    <div className='flex-center full-width' style={{ textAlign: 'start' }}>
                      <InformationDisplayCard md={24} xs={24} sm={24} title='Additional Options' subtitle='These options are only applicable to off-chain lists.'>
                        <TableRow label='Public?' value={<Switch
                          checked={!privateMode}
                          checkedChildren="Public"
                          unCheckedChildren="Private"
                          onChange={(checked) => {
                            setPrivateMode(!checked);
                          }}
                        />}
                          labelSpan={12}
                          valueSpan={12}
                        />
                        <div className='secondary-text' style={{ fontSize: 14, marginLeft: 10 }}>
                          <InfoCircleOutlined /> {privateMode ? 'Only you will be able to see the list.' : 'The list will be public and will show up in search results.'}
                        </div>
                        <TableRow label='Survey Mode?' value={<Switch
                          checked={editKeys.length > 0}
                          checkedChildren="Survey Mode"
                          unCheckedChildren="Admin Mode"
                          onChange={(checked) => {
                            setEditKeys(checked ? [{
                              key: crypto.randomBytes(32).toString('hex'),
                              expirationDate: GO_MAX_UINT_64,
                              mustSignIn: false,
                            }] : []);
                          }}
                        />}
                          labelSpan={12}
                          valueSpan={12}
                        />
                        <div className='secondary-text' style={{ fontSize: 14, marginLeft: 10 }}>
                          <InfoCircleOutlined /> {editKeys.length > 0 ? 'You can update and delete, but also, others can add to the list, according to the criteria specified.' : 'Only you will be able to update and delete the list.'}
                        </div>

                        {editKeys.length > 0 && <>
                          <TableRow label='Require sign in?' value={<Switch
                            checked={editKeys[0].mustSignIn}
                            checkedChildren="Require Sign In"
                            unCheckedChildren="No Sign In Required"
                            onChange={(checked) => {
                              setEditKeys([{
                                ...editKeys[0],
                                mustSignIn: checked,
                              }]);
                            }}
                          />}
                            labelSpan={12}
                            valueSpan={12}
                          />
                          <div className='secondary-text' style={{ fontSize: 14, marginLeft: 10 }}>
                            <InfoCircleOutlined /> Users must sign in to add to the list, and they can only add the address they signed in with.
                            This means users are expected to have their crypto wallets ready to sign.
                          </div>
                          <TableRow label='Expiration?' value={<>
                            <Switch checked={editKeys[0].expirationDate === GO_MAX_UINT_64}
                              checkedChildren="Never"
                              unCheckedChildren="Set Expiration"
                              onChange={(checked) => {
                                if (checked) {
                                  setEditKeys([{
                                    ...editKeys[0],
                                    expirationDate: GO_MAX_UINT_64,
                                  }]);
                                } else {
                                  setEditKeys([{
                                    ...editKeys[0],
                                    expirationDate: BigInt(Date.now() + 1000 * 60 * 60 * 24 * 7) // 7 days
                                  }]);
                                }
                              }}
                            />
                          </>}
                            labelSpan={12}
                            valueSpan={12}
                          />
                          <div className='flex-between' style={{ marginLeft: 10, marginTop: 6 }}>
                            <div className='primary-text inherit-bg full-width'>


                              {!editKeys[0].expirationDate || editKeys[0].expirationDate !== GO_MAX_UINT_64 && <>

                                <DatePicker
                                  showMinute
                                  showTime
                                  allowClear={false}
                                  placeholder='Start'
                                  value={editKeys[0].expirationDate ? moment(new Date(Number(editKeys[0].expirationDate))) : null}
                                  className='primary-text inherit-bg full-width'
                                  onChange={(_date, dateString) => {
                                    setEditKeys([{
                                      ...editKeys[0],
                                      expirationDate: dateString ? BigInt(new Date(dateString).getTime()) : 0n,
                                    }]);
                                  }}
                                />
                              </>
                              }
                            </div>

                          </div>
                          <div className='secondary-text' style={{ fontSize: 14, marginLeft: 10 }}>
                            <InfoCircleOutlined /> Users can only add to the list until the expiration date (if set).
                          </div>
                        </>}
                      </InformationDisplayCard>
                    </div></>}
              </>}
            </>
          },
          {
            title: 'On-Chain',
            message: <>
              The address list will be stored on-chain. This will cost a transaction fee to store it. <span style={{ color: 'orange', fontWeight: 'bolder' }}>The list will be permanently frozen, meaning it can never be updated or deleted.</span>{' '}If you need an on-chain solution that can be updated, please create a badge collection instead.
            </>,
            isSelected: clicked && onChainStorage,
            additionalNode: ListIDInput
          },
        ]}
        onSwitchChange={(idx) => {
          setClicked(true);
          if (idx === 1) {
            setOnChainStorage(true);

          } else if (idx === 0) {
            setOnChainStorage(false);
          }
        }}
      />

    </>
    }

    < br />
    <button
      className='landing-button'
      disabled={loading || !clicked || !addressList.listId}
      style={{ width: '100%' }}
      onClick={async () => {
        if (!collection) return;

        setLoading(true)
        if (onChainStorage) {
          setVisible(true)
        } else {
          const metadataRes = await addMetadataToIpfs({
            collectionMetadata: collection.cachedCollectionMetadata,
          });

          const metadataUrl = metadataRes.collectionMetadataResult?.cid ? 'ipfs://' + metadataRes.collectionMetadataResult?.cid : '';
          const listId = onChainStorage ? addressList.listId : chain.cosmosAddress + "_" + addressList.listId;

          await updateAddressLists({
            addressLists: [{
              ...addressList,
              listId: !isUpdateAddressList ? listId : addressList.listId,
              uri: metadataUrl,
              editKeys: editKeys,
              private: privateMode,
            }],
          });
          router.push(`/lists/${!isUpdateAddressList ? listId : addressList.listId}`);

        }
        setLoading(false);
      }}
    >
      Submit
    </button>
    <div className='flex-center' style={{ color: 'red' }}>
      {addressList.listId === '' && clicked && 'Please enter a list ID.'}
    </div>
    <CreateTxMsgCreateAddressListModal
      visible={visible}
      setVisible={setVisible}
      inheritedTxState={txState}
    />
  </div >
}