import { Divider, Input, Switch, Typography } from 'antd';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { addMetadataToIpfs, createAddressLists, updateAddressLists } from '../../../bitbadges-api/api';
import { useChainContext } from '../../../bitbadges-api/contexts/ChainContext';

import { NEW_COLLECTION_ID, useTxTimelineContext } from '../../../bitbadges-api/contexts/TxTimelineContext';
import { CreateTxMsgCreateAddressListModal } from '../../tx-modals/CreateTxMsgCreateAddressLists';

import { InfoCircleOutlined } from '@ant-design/icons';
import { BitBadgesAddressList } from 'bitbadgesjs-sdk';
import { useCollection } from '../../../bitbadges-api/contexts/collections/CollectionsContext';
import { getBlankPlugin } from '../../../integrations/integrations';
import { InformationDisplayCard } from '../../display/InformationDisplayCard';
import { TableRow } from '../../display/TableRow';
import { ClaimBuilder } from '../../transfers/ClaimBuilder';
import { ClaimPaginationWithEditButtons } from '../step-items/OffChainBalancesStepItem';
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
  const [claimIdx, setClaimIdx] = useState<number>(0);

  const router = useRouter();

  const [onChainStorage, setOnChainStorage] = useState<boolean>(false);
  const [clicked, setClicked] = useState<boolean>(!!isUpdateAddressList);

  const [disabledArr, setDisabledArr] = useState<boolean[]>([]);
  const collection = useCollection(NEW_COLLECTION_ID);

  useEffect(() => {
    if (disabledArr.length < addressList.editClaims.length) {
      setDisabledArr((disabledArr) => [...disabledArr, ...Array(addressList.editClaims.length - disabledArr.length).fill(false)]);
    }

    if (disabledArr.length > addressList.editClaims.length) {
      setDisabledArr((disabledArr) => disabledArr.slice(0, addressList.editClaims.length));
    }
    console.log('in use effect');
  }, [addressList.editClaims]);

  useEffect(() => {
    if (!isUpdateAddressList) {
      setAddressList(
        new BitBadgesAddressList({
          ...addressList,
          listId: ''
        })
      );
    }
  }, []);

  const ListIDInput = () => (
    <>
      <div>
        <Typography.Text strong style={{ fontSize: 18 }} className="primary-text">
          List ID
        </Typography.Text>
      </div>
      <Input
        defaultValue={addressList.listId}
        placeholder="Enter a unique identifier for your list."
        value={addressList.listId}
        onChange={async (e) => {
          setAddressList(
            new BitBadgesAddressList({
              ...addressList,
              listId: e.target.value.trim()
            })
          );
        }}
        className="form-input"
        size="large"
      />
    </>
  );

  const privateMode = addressList.private;
  const viewableWithLink = addressList.viewableWithLink;

  return (
    <div className="full-width" style={{ marginTop: 20 }}>
      {!isUpdateAddressList && (
        <>
          <SwitchForm
            options={[
              {
                title: 'Off-Chain',
                message: (
                  <div>
                    {`We handle the storage for you! We will store your list info on our centralized servers and IPFS. This is completely free!  `}
                  </div>
                ),
                isSelected: clicked && !onChainStorage,
                additionalNode: () => <>{ListIDInput()}</>
              },
              {
                title: 'On-Chain',
                message: (
                  <>
                    The address list will be stored on-chain. This will cost a transaction fee to store it.{' '}
                    <span style={{ color: 'orange', fontWeight: 'bolder' }}>
                      The list will be permanently frozen, meaning it can never be updated or deleted.
                    </span>{' '}
                    If you need an on-chain solution that can be updated, please create a badge collection instead.
                  </>
                ),
                isSelected: clicked && onChainStorage,
                additionalNode: ListIDInput
              }
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
      )}
      {clicked && !onChainStorage && (
        <>
          {!isUpdateAddressList && <Divider />}
          <div className="flex-center full-width" style={{ textAlign: 'start' }}>
            <InformationDisplayCard md={12} xs={24} sm={24} title="Additional Options" subtitle="">
              <TableRow
                label="Show in search results?"
                value={
                  <Switch
                    checked={!addressList.private}
                    checkedChildren="Yes"
                    unCheckedChildren="No"
                    onChange={(checked) => {
                      setAddressList(
                        new BitBadgesAddressList({
                          ...addressList,
                          private: !checked
                        })
                      );
                    }}
                  />
                }
                labelSpan={12}
                valueSpan={12}
              />
              <div className="secondary-text" style={{ fontSize: 14, marginLeft: 10 }}>
                <InfoCircleOutlined />{' '}
                {privateMode ? 'The list will not show up in search results.' : 'The list will be public and will show up in search results.'}
              </div>

              {privateMode && (
                <>
                  <TableRow
                    label="Viewable with link?"
                    value={
                      <Switch
                        checked={viewableWithLink}
                        checkedChildren="Viewable with Link"
                        unCheckedChildren="Private to You Only"
                        onChange={(checked) => {
                          setAddressList(
                            new BitBadgesAddressList({
                              ...addressList,
                              viewableWithLink: checked
                            })
                          );
                        }}
                      />
                    }
                    labelSpan={12}
                    valueSpan={12}
                  />{' '}
                  <div className="secondary-text" style={{ fontSize: 14, marginLeft: 10 }}>
                    <InfoCircleOutlined />{' '}
                    {viewableWithLink
                      ? 'Those who have the list ID can see the list (e.g. navigating to list page directly). If this option is selected, it is important to not leak the list ID to unwanted parties.'
                      : 'Only you will be able to view the list when signed in.'}
                  </div>
                </>
              )}
              <TableRow
                label="Claimable?"
                value={
                  <Switch
                    checked={addressList.editClaims.length > 0}
                    checkedChildren="Claimable"
                    unCheckedChildren="Admin Mode"
                    onChange={(checked) => {
                      setAddressList(
                        new BitBadgesAddressList({
                          ...addressList,
                          editClaims: checked
                            ? [
                                {
                                  plugins: [getBlankPlugin('numUses'), getBlankPlugin('requiresProofOfAddress')],
                                  claimId: crypto.randomBytes(32).toString('hex')
                                }
                              ]
                            : []
                        })
                      );
                    }}
                  />
                }
                labelSpan={12}
                valueSpan={12}
              />
              <div className="secondary-text" style={{ fontSize: 14, marginLeft: 10 }}>
                <InfoCircleOutlined />{' '}
                {addressList.editClaims.length > 0
                  ? 'Others can also claim a spot on the list, according to the criteria specified. You can also edit and delete if necessary.'
                  : 'Only you will be able to update and delete the list.'}
              </div>

              {addressList.editClaims.length > 0 && (
                <>
                  <br />
                  <ClaimPaginationWithEditButtons
                    idx={claimIdx}
                    setIdx={setClaimIdx}
                    total={addressList.editClaims.length}
                    claims={addressList.editClaims}
                    setClaims={(claims) => {
                      setAddressList(
                        new BitBadgesAddressList({
                          ...addressList,
                          editClaims: claims
                        })
                      );
                    }}
                  />

                  {addressList.editClaims.map((claim, i) => {
                    const plugins = claim.plugins;

                    if (i !== claimIdx) return <></>;

                    return (
                      <>
                        <br />
                        <ClaimBuilder
                          type="list"
                          claim={claim}
                          isUpdate={!!txState.isUpdateAddressList}
                          plugins={plugins}
                          setPlugins={(plugins) => {
                            setAddressList(
                              new BitBadgesAddressList({
                                ...addressList,
                                editClaims: addressList.editClaims.map((x, j) => {
                                  if (j === i) {
                                    return {
                                      ...x,
                                      plugins: plugins
                                    };
                                  }
                                  return x;
                                })
                              })
                            );
                          }}
                          offChainSelect={true}
                          setDisabled={(disabled) => {
                            setDisabledArr((disabledArr) => {
                              const newArr = [...disabledArr];
                              newArr[i] = disabled;
                              return newArr;
                            });
                          }}
                        />
                      </>
                    );
                  })}
                </>
              )}
            </InformationDisplayCard>
          </div>
        </>
      )}
      <br />
      <button
        className="landing-button"
        disabled={loading || !clicked || !addressList.listId || disabledArr.some((x) => x)}
        style={{ width: '100%' }}
        onClick={async () => {
          if (!collection) return;

          setLoading(true);
          if (onChainStorage) {
            setVisible(true);
          } else {
            const metadataRes = await addMetadataToIpfs({
              collectionMetadata: collection.cachedCollectionMetadata
            });

            const metadataUrl = metadataRes.collectionMetadataResult?.cid ? 'ipfs://' + metadataRes.collectionMetadataResult?.cid : '';
            const listId = onChainStorage ? addressList.listId : chain.cosmosAddress + '_' + addressList.listId;

            const body = {
              addressLists: [
                {
                  ...addressList,
                  listId: !isUpdateAddressList ? listId : addressList.listId,
                  uri: metadataUrl,
                  editClaims: addressList.editClaims,
                  private: privateMode,
                  viewableWithLink: viewableWithLink
                }
              ]
            };

            if (isUpdateAddressList) {
              updateAddressLists(body);
            } else {
              createAddressLists(body);
            }

            router.push(`/lists/${!isUpdateAddressList ? listId : addressList.listId}`);
          }
          setLoading(false);
        }}>
        Submit
      </button>
      <div className="flex-center" style={{ color: 'red' }}>
        {addressList.listId === '' && clicked && 'Please enter a list ID.'}
      </div>
      <CreateTxMsgCreateAddressListModal visible={visible} setVisible={setVisible} inheritedTxState={txState} />
    </div>
  );
}
