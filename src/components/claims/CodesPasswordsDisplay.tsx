import { InfoCircleOutlined, WarningOutlined } from "@ant-design/icons";
import { Divider, Empty, Row, Spin, Tooltip, Typography, notification } from "antd";
import { ClaimAlertDoc, CollectionApprovalWithDetails, PaginationInfo, convertToCosmosAddress, getAbbreviatedAddress, isAddressValid } from "bitbadgesjs-utils";
import { useEffect, useState } from "react";

import { getClaimAlerts, sendClaimAlert } from "../../bitbadges-api/api";
import { NEW_COLLECTION_ID } from "../../bitbadges-api/contexts/TxTimelineContext";
import { useAccount } from "../../bitbadges-api/contexts/accounts/AccountsContext";
import { useCollection } from "../../bitbadges-api/contexts/collections/CollectionsContext";
import { WEBSITE_HOSTNAME } from "../../constants";
import { downloadJson, downloadTxt } from "../../utils/downloadJson";
import { AddressSelect } from "../address/AddressSelect";
import { Pagination } from "../common/Pagination";
import { InformationDisplayCard } from "../display/InformationDisplayCard";
import QrCodeDisplay from "../display/QrCodeDisplay";
import { AddressListSelect } from "../address/AddressListSelect";
import { Tabs } from "../navigation/Tabs";
import { NumberInput } from "../inputs/NumberInput";
import { ClaimAlertsTab } from "../collection-page/ClaimAlertsTab";

export function CodesDisplay({
  approval,
  collectionId,
  codes,
  claimPassword,
}: {
  approval: CollectionApprovalWithDetails<bigint>,
  collectionId: bigint,
  codes?: string[]
  claimPassword?: string
}) {

  const collection = useCollection(collectionId)

  const [tab, setTab] = useState('individual');

  const approvalCriteria = approval.approvalCriteria;
  const merkleChallenge = approvalCriteria ? approvalCriteria.merkleChallenge : undefined;

  const approvalId = approval.challengeTrackerId;
  const challengeTracker = collection?.merkleChallenges.find(x => x.challengeId === approvalId);

  const [codePage, setCodePage] = useState(1);
  const [loading, setLoading] = useState(false);

  const printStr = approval.details?.challengeDetails?.hasPassword ? 'password' : 'code';
  const urlSuffix = approval.details?.challengeDetails?.hasPassword ? `password=${claimPassword}` : codes ? `code=${codes[codePage - 1]}` : '';
  const hasPassword = approval.details?.challengeDetails?.hasPassword;

  const cantShowUrl = collectionId === NEW_COLLECTION_ID;
  const collectionIdStr = cantShowUrl ? 'ADD_COLLECTION_ID_HERE' : collectionId.toString();

  const [claimAlertAddress, setClaimAlertAddress] = useState<string>('');
  const claimAlertAccount = useAccount(claimAlertAddress);

  const [claimAlertAddresses, setClaimAlertAddresses] = useState<string[]>([]);

  const [startCodeIdx, setStartCodeIdx] = useState<number>(0);

  const [claimAlerts, setClaimAlerts] = useState<ClaimAlertDoc<bigint>[]>([]);
  const [claimAlertPagination, setClaimAlertPagination] = useState<PaginationInfo>({
    bookmark: '',
    hasMore: true,
  });


  async function fetchNextClaimAlerts() {
    const res = await getClaimAlerts({
      collectionId,
      bookmark: claimAlertPagination.bookmark,
    });

    setClaimAlerts([...claimAlerts, ...res.claimAlerts].filter((x, i, a) => a.findIndex(y => y._legacyId === x._legacyId) === i));
    setClaimAlertPagination(res.pagination);
  }

  useEffect(() => {

    if (tab == 'claimAlerts') {
      fetchNextClaimAlerts();
    }
  }, [tab])

  return <>

    <Row className='flex-center primary-text' style={{ textAlign: 'center', width: '100%' }}>

      <InformationDisplayCard inheritBg noBorder md={24} xs={24} sm={24} title={hasPassword ? 'Password' : 'Codes'} subtitle={'Codes / passwords will be auto-populated on the claim page if the user navigates to the uniquely generated URL or scans the QR code. Users can also enter them manually.'}>


        <br />
        {hasPassword && <>
          <div style={{ color: '#FF5733' }}>
            <WarningOutlined /> Anyone with the password can claim the badge!
          </div>
          <br />
        </>}
        {codes && codes.length > 0 && <>
          <div style={{ color: '#FF5733' }}>
            <WarningOutlined /> Keep these codes safe and secure! Anyone with the code can claim the badge!
          </div>
          <br />
          <div className="secondary-text">
            <InfoCircleOutlined /> Codes can only be used once.
          </div>
        </>}
        <br />
        <Tabs
          tab={tab}
          setTab={setTab}
          fullWidth
          type="underline"
          tabInfo={[
            {
              key: 'individual',
              content: 'Individual',
            },
            codes && codes.length > 1 ? {
              key: 'batch',
              content: 'Batch',
            } : undefined,
            {
              key: 'other',
              content: 'Other',
            },
            collectionId > 0n ? {
              key: "claimAlerts",
              content: 'Sent Claim Alerts',
            } : undefined
          ]}
        />
        {
          tab === 'claimAlerts' && <div>
            <ClaimAlertsTab claimAlerts={claimAlerts} fetchMore={fetchNextClaimAlerts} hasMore={claimAlertPagination.hasMore} showToAddress />
          </div>}
        {!approval.details?.challengeDetails?.hasPassword && codes && codes.length > 0 && <>
          {
            codes.length > 1 && tab === 'batch' && <>
              <div>
                <br />
                <Typography.Text strong className='primary-text' style={{ fontSize: 18 }}>Batch Download</Typography.Text>
                <br />
                <br />
                <div style={{ textAlign: 'center' }}>
                  <div className="flex-center flex-wrap">
                    <button
                      onClick={() => {
                        const today = new Date();

                        const dateString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
                        const timeString = `${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`;
                        const collectionIdStr = cantShowUrl ? 'ADD_COLLECTION_ID_HERE' : collectionId.toString();

                        downloadJson({
                          prefixUrl: WEBSITE_HOSTNAME + '/collections/' + collectionIdStr + '?approvalId=' + approvalId + '&code=ADD_CODE_HERE',
                          codes,
                          codeUrls: codes.map(x => WEBSITE_HOSTNAME + '/collections/' + collectionIdStr + '?approvalId=' + approvalId + '&code=' + x)
                        }, `codes-${collection?.cachedCollectionMetadata?.name}-approvalId=${approvalId}-${dateString}-${timeString}.json`);
                      }}
                      className="landing-button primary-text" style={{ width: 100 }}
                    >
                      JSON
                    </button>
                    <button
                      onClick={() => {
                        const today = new Date();

                        const dateString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
                        const timeString = `${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`;

                        downloadTxt(codes.join('\n'), `codes-${collection?.cachedCollectionMetadata?.name}-approvalId=${approvalId}-${dateString}-${timeString}.txt`);
                      }}
                      className="landing-button primary-text" style={{ width: 100 }}
                    >
                      Codes .txt
                    </button>
                    <button
                      onClick={() => {
                        if (cantShowUrl) {
                          notification.warn({
                            duration: 0,
                            message: 'Since this is a new collection, we do not have the collection ID yet. You will need to manually replace ADD_COLLECTION_ID_HERE with the collection ID once the collection is created.'
                          });
                        }

                        const today = new Date();

                        const dateString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
                        const timeString = `${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`;

                        const collectionIdStr = cantShowUrl ? 'ADD_COLLECTION_ID_HERE' : collectionId.toString();

                        downloadTxt(codes.map(x => WEBSITE_HOSTNAME + '/collections/' + collectionIdStr + '?approvalId=' + approvalId + '&code=' + x).join('\n'), `code-urls-${collection?.cachedCollectionMetadata?.name}-approvalId=${approvalId}-${dateString}-${timeString}.txt`);
                      }}
                      className="landing-button primary-text" style={{ width: 100 }}
                    >
                      URLs .txt
                    </button>
                  </div>
                  <br />
                  <br />
                  <Typography.Text strong className='primary-text' style={{ fontSize: 18 }}>Batch Copy</Typography.Text>
                  <br />
                  <br />
                  <div className="flex-center flex-wrap">
                    <button className="landing-button primary-text" style={{ width: 150 }}
                      onClick={() => {
                        navigator.clipboard.writeText(codes.join('\n'));
                        notification.success({
                          message: 'Copied!',
                          description: 'We have copied the codes to your clipboard.'
                        })
                      }}
                    >
                      Copy Codes
                    </button>
                    <button className="landing-button primary-text" style={{ width: 150 }}
                      onClick={() => {
                        const collectionIdStr = cantShowUrl ? 'ADD_COLLECTION_ID_HERE' : collectionId.toString();

                        if (cantShowUrl) {
                          notification.warn({
                            duration: 0,
                            message: 'Since this is a new collection, we do not have the collection ID yet. You will need to manually replace ADD_COLLECTION_ID_HERE with the collection ID once the collection is created.'
                          });
                        }

                        navigator.clipboard.writeText(codes.map(x => WEBSITE_HOSTNAME + '/collections/' + collectionIdStr + '?approvalId=' + approvalId + '&code=' + x).join('\n'));
                        notification.success({
                          message: 'Copied!',
                          description: 'We have copied the URLs to your clipboard.'
                        })
                      }}
                    >
                      Copy URLs
                    </button>


                  </div>
                  <br />
                  <div>
                    Use a service like <a href="https://qrexplore.com/generate/" target="_blank" rel="noopener noreferrer">this QR code generator</a> to generate QR codes in batch for each unique URL.
                  </div>
                </div>
                <br />
                <Typography.Text strong className='primary-text' style={{ fontSize: 18 }}>Batch Send Claim Alerts</Typography.Text>
                <div className="flex-center flex-column">
                  {!cantShowUrl && <>
                    <div className='secondary-text'>
                      <InfoCircleOutlined /> Distribute this code via claim alerts. The selected addresses will receive a BitBadges notification with the respective code / password and a link to claim.

                    </div>

                    <div className="full-width" style={{ margin: 8 }}>
                      <AddressListSelect users={claimAlertAddresses} setUsers={setClaimAlertAddresses} />
                    </div>
                    {!hasPassword && claimAlertAddresses.length > 0 && <>
                      <div className=" flex-center">
                        <div className="flex-center flex-column" style={{ margin: 8 }}>
                          <b>Start Code #</b>
                          <NumberInput
                            value={startCodeIdx + 1}
                            setValue={(val) => {
                              setStartCodeIdx(val - 1);
                            }}
                            min={1}
                            max={codes.length}
                          />
                        </div>
                        <div className="flex-center flex-column" style={{ margin: 8 }}>
                          <b>End Code #</b>
                          <NumberInput
                            value={startCodeIdx + 1 + claimAlertAddresses.length}
                            setValue={() => { }}
                            min={0}
                            max={codes.length}
                            disabled
                          />
                        </div>
                      </div><Divider /></>}


                    <button className="landing-button primary-text" style={{ width: '100%' }}
                      disabled={loading || claimAlertAddresses.length == 0 || (hasPassword && !claimPassword) || (!hasPassword && (codes.length !== claimAlertAddresses.length))}
                      onClick={async () => {
                        setLoading(true);
                        const password = claimPassword ?? '';


                        const convertedClaimAlertAddresses = claimAlertAddresses.map(x => convertToCosmosAddress(x));
                        if (convertedClaimAlertAddresses.some(x => !isAddressValid(x))) {
                          notification.error({
                            message: 'Invalid address(es)',
                          });

                        }

                        const codesToDistribute = codes.slice(startCodeIdx, startCodeIdx + claimAlertAddresses.length);
                        if (codesToDistribute.some(x => !x)) {
                          notification.error({
                            message: 'Invalid code(s)',
                          });
                        }

                        //If already used
                        if (codesToDistribute.some(x => challengeTracker && (challengeTracker.usedLeafIndices?.find(y => y == BigInt(codes?.indexOf(x) ?? -1)) ?? -1) >= 0)) {
                          notification.error({
                            message: 'One or more codes have already been used.',
                          });
                        }

                        const claimAlerts = [];
                        for (let i = 0; i < convertedClaimAlertAddresses.length; i++) {
                          const claimAlertAddress = convertedClaimAlertAddresses[i];
                          if (hasPassword) {
                            const message = `You are able to claim badges from collection ${collectionId}! To claim, go to ${WEBSITE_HOSTNAME}/collections/${collectionIdStr}?approvalId=${approvalId}&password=${password}`;
                            claimAlerts.push({
                              collectionId,
                              recipientAddress: claimAlertAddress,
                              message,
                            });

                          } else {
                            const code = codes?.[startCodeIdx + i] ?? '';
                            const message = `You are able to claim badges from collection ${collectionId}! To claim, go to ${WEBSITE_HOSTNAME}/collections/${collectionIdStr}?approvalId=${approvalId}&code=${code}`;
                            claimAlerts.push({
                              collectionId,
                              recipientAddress: claimAlertAddress,
                              message,
                            });
                          }
                        }

                        await sendClaimAlert({
                          claimAlerts
                        });
                        notification.success({
                          message: 'Claim Alerts Sent!',
                          description: 'We have sent the claim alerts to the selected addresses.'
                        })

                        setClaimAlertAddresses([]);

                        setLoading(false);

                      }
                      } >Send {loading && <Spin />}</button>
                    {!hasPassword && codes && <div className="secondary-text">
                      <InfoCircleOutlined />  We will send claim alerts for the codes {startCodeIdx + 1} to {startCodeIdx + 1 + claimAlertAddresses.length} to the selected addresses ({claimAlertAddresses.length}) in the order they were entered, respectively.
                    </div>}
                  </>}
                </div>

                <Divider />
              </div>
            </>
          }




        </>
        }
        {tab == 'individual' && <>
          <br />
          {hasPassword && <div>
            <Divider />
            <Typography.Text strong className='primary-text' style={{ fontSize: 20 }}> Password: {claimPassword}</Typography.Text>
          </div>}
          <br />
          <Pagination
            currPage={codePage}
            total={Number(codes?.length ?? 0n)}
            pageSize={1}
            onChange={(page) => {
              setCodePage(page);
            }}
          />


          <br />
          {!hasPassword && <><Typography.Text strong className='primary-text' style={{ fontSize: 20 }}>
            Code: <Tooltip color='black' title={`${codes?.[codePage - 1] ?? ''}`}>{getAbbreviatedAddress(codes?.[codePage - 1] ?? '')}</Tooltip>
          </Typography.Text>
            <br /><br />
            {merkleChallenge && !merkleChallenge.details?.challengeDetails?.hasPassword && !!merkleChallenge.maxUsesPerLeaf && codes && <Typography.Text strong className='secondary-text'>

              Current Status: {
                challengeTracker && (challengeTracker.usedLeafIndices?.find(x => x == BigInt(codePage - 1)) ?? -1) >= 0 ? <span style={{ color: 'red' }}>USED</span> : <span style={{ color: 'green' }}>UNUSED</span>
              }
            </Typography.Text>}

            <br />
            <br />
          </>}
          {!(challengeTracker?.usedLeafIndices?.find(x => x == BigInt(codePage - 1)) ?? -1 >= 0) && <>
            <div className="flex-center flex-wrap">
              <button className="landing-button primary-text" style={{ width: 150 }}
                onClick={() => {

                  navigator.clipboard.writeText((hasPassword ? claimPassword : codes?.[codePage - 1]) ?? '').catch(e => { console.error(e) });
                  notification.success({
                    message: 'Copied!',
                    description: 'We have copied them to your clipboard.'
                  })
                }}
              >
                Copy {printStr[0].toUpperCase() + printStr.slice(1)}
              </button>
              <Tooltip color="black" title={`${WEBSITE_HOSTNAME}/collections/${collectionIdStr}?approvalId=${approvalId}&${urlSuffix}`}>
                <button className="landing-button primary-text" style={{ width: 150 }}
                  onClick={() => {

                    if (cantShowUrl) {
                      notification.warn({
                        duration: 0,
                        message: 'Since this is a new collection, we do not have the collection ID yet. You will need to manually replace ADD_COLLECTION_ID_HERE with the collection ID once the collection is created.'
                      });
                    }

                    navigator.clipboard.writeText(`${WEBSITE_HOSTNAME}/collections/${collectionIdStr}?approvalId=${approvalId}&${urlSuffix}`);
                    notification.success({
                      message: 'Copied!',
                      description: 'We have copied the URL to your clipboard.'
                    })
                  }}
                >
                  Copy URL
                </button>
              </Tooltip>

            </div>
            <br />

            <div className="flex-center flex-column">
              {!cantShowUrl && <>
                <Typography.Text strong className='primary-text' style={{ fontSize: 14 }}>Send Claim Alert</Typography.Text>

                <div className='secondary-text'>
                  <InfoCircleOutlined /> Distribute all the codes via a claim alert. The selected address will receive a BitBadges notification with the code / password and a link to claim.
                </div>
                <AddressSelect onUserSelect={(address) => {
                  setClaimAlertAddress(address);
                }} />

                <button className="landing-button primary-text" style={{ width: 150 }}
                  disabled={loading || !claimAlertAddress || !claimAlertAccount || (hasPassword && !claimPassword) || (!hasPassword && (!(codes?.[codePage - 1] ?? '')))}
                  onClick={async () => {
                    setLoading(true);
                    const code = codes?.[codePage - 1] ?? '';
                    const password = claimPassword ?? '';
                    //// You have been whitelisted to claim badges from collection ${collectionDoc.collectionId}! ${orderMatters ? `You have been reserved specific badges which are only claimable to you. Your claim number is #${idx + 1}` : ''}`,

                    if (claimAlertAddress && claimAlertAccount) {
                      if (hasPassword) {
                        const message = `You are able to claim badges from collection ${collectionId}! To claim, go to ${WEBSITE_HOSTNAME}/collections/${collectionIdStr}?approvalId=${approvalId}&password=${password}`;

                        await sendClaimAlert({
                          claimAlerts: [{
                            collectionId,
                            recipientAddress: claimAlertAccount.address,
                            message,
                          }]
                        });
                      } else {
                        const message = `You are able to claim badges from collection ${collectionId}! To claim, go to ${WEBSITE_HOSTNAME}/collections/${collectionIdStr}?approvalId=${approvalId}&code=${code}`;
                        await sendClaimAlert({
                          claimAlerts: [{
                            collectionId,
                            recipientAddress: claimAlertAccount.address,
                            message,
                          }]
                        });
                      }

                      notification.success({
                        message: 'Claim Alert Sent!',
                        description: 'We have sent the claim alert to the selected address.'
                      })

                      setClaimAlertAddress('');
                    }

                    setLoading(false);

                  }} >Send {loading && <Spin />}</button>

              </>}
            </div>


            {cantShowUrl ? <></> : <>
              <br />
              <br />
              <Typography.Text strong className='primary-text' style={{ fontSize: 14 }}>QR Code</Typography.Text>
              <div className="">
                <QrCodeDisplay size={256} value={`${WEBSITE_HOSTNAME}/collections/${collectionIdStr}?approvalId=${approvalId}&${urlSuffix}`} />
              </div>
              <br />
            </>}<br />
          </>
          }


        </>}
        {tab == 'other' && <>
          <br />
          <div className="secondary-text">
            We provide some tools to help you distribute your codes, but codes can be distributed using any method you prefer,
            such as via email, social media sites, SMS, or even physical printouts.
            Consider using widely-used tools such as <a href="https://www.mailchimp.com" target="_blank" rel="noopener noreferrer">Mailchimp</a> (email) or <a href="https://www.twilio.com" target="_blank" rel="noopener noreferrer">Twilio</a> (SMS) to help you distribute your codes.

            <br />
            <br />
            <WarningOutlined style={{ color: 'orange' }} /> Use third-party services at your own risk.
          </div>
        </>}
        <Divider />

      </InformationDisplayCard>
    </Row >

    {
      merkleChallenge && !merkleChallenge.details?.challengeDetails?.hasPassword && (!codes || codes.length === 0) &&
      <Empty
        description={<span className='primary-text'>There are no {printStr}s for this claim.</span>}
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        className='primary-text'
      />
    }
  </>
}