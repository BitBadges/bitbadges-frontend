import { CopyOutlined, DownloadOutlined, InfoCircleOutlined, WarningOutlined } from "@ant-design/icons";
import { Divider, Empty, Row, Spin, Tooltip, Typography, notification } from "antd";
import { ClaimAlertDoc, CollectionApprovalWithDetails, PaginationInfo, convertToCosmosAddress, getAbbreviatedAddress, isAddressValid } from "bitbadgesjs-utils";
import { useEffect, useState } from "react";

import { getClaimAlerts, sendClaimAlert } from "../../bitbadges-api/api";
import { NEW_COLLECTION_ID } from "../../bitbadges-api/contexts/TxTimelineContext";
import { useAccount } from "../../bitbadges-api/contexts/accounts/AccountsContext";
import { useCollection } from "../../bitbadges-api/contexts/collections/CollectionsContext";
import { WEBSITE_HOSTNAME } from "../../constants";
import { downloadJson, downloadTxt } from "../../utils/downloadJson";
import { BatchAddressSelect } from "../address/AddressListSelect";
import { AddressSelect } from "../address/AddressSelect";
import { ClaimAlertsTab } from "../collection-page/ClaimAlertsTab";
import { Pagination } from "../common/Pagination";
import { InformationDisplayCard } from "../display/InformationDisplayCard";
import QrCodeDisplay from "../display/QrCodeDisplay";
import { NumberInput } from "../inputs/NumberInput";
import { Tabs } from "../navigation/Tabs";

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
  const [codePage, setCodePage] = useState(1);
  const [loading, setLoading] = useState(false);
  const printStr = approval.details?.challengeDetails?.hasPassword ? 'password' : 'code';
  const urlSuffix = approval.details?.challengeDetails?.hasPassword ? `password=${claimPassword}` : codes ? `code=${codes[codePage - 1]}` : '';
  const hasPassword = approval.details?.challengeDetails?.hasPassword;
  const approvalCriteria = approval.approvalCriteria;
  const merkleChallenge = approvalCriteria ? approvalCriteria.merkleChallenge : undefined;
  const approvalId = approval.challengeTrackerId;
  const challengeTracker = collection?.merkleChallenges.find(x => x.challengeId === approvalId);

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

    setClaimAlerts([...claimAlerts, ...res.claimAlerts].filter((x, i, a) => a.findIndex(y => y._docId === x._docId) === i));
    setClaimAlertPagination(res.pagination);
  }

  useEffect(() => {
    if (tab == 'claimAlerts') {
      fetchNextClaimAlerts();
    }
  }, [tab])

  const NewCollectionWarning = <>
    {cantShowUrl && <>
      <div className="secondary-text" style={{ textAlign: 'center' }}>
        <WarningOutlined style={{ color: 'orange' }} /> Since this is a new collection, we do not have the collection ID yet.
        As a result, we cannot generate certain QR codes or send claim alerts yet. If you choose URLs now, you will need to replace the ADD_COLLECTION_ID_HERE placeholder
        with the collection ID once the collection is created.

        All features will be fully supported once the collection is officially created.
        However, note that moving forward, codes are only ever viewable to the current manager.
      </div>
      <br />
    </>}
  </>

  const AllInOneJson = <>
    <button
      onClick={() => {
        if (!codes) return;

        const today = new Date();

        const dateString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
        const timeString = `${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`;
        const collectionIdStr = cantShowUrl ? 'ADD_COLLECTION_ID_HERE' : collectionId.toString();

        downloadJson({
          prefixUrl: WEBSITE_HOSTNAME + '/collections/' + collectionIdStr + '?approvalId=' + approvalId + '&code=ADD_CODE_HERE',
          codes,
          claimLinkUrls: codes.map(x => WEBSITE_HOSTNAME + '/collections/' + collectionIdStr + '?approvalId=' + approvalId + '&code=' + x),
          saveForLaterUrls: codes.map(x => WEBSITE_HOSTNAME + '/saveforlater?value=' + x)
        }, `codes-${collection?.cachedCollectionMetadata?.name}-approvalId=${approvalId}-${dateString}-${timeString}.json`);
      }}
      className="landing-button primary-text" style={{ width: 100 }}
    >
      JSON <DownloadOutlined />
    </button>
  </>

  return <>

    <Row className='flex-center primary-text' style={{ textAlign: 'center', width: '100%' }}>
      <InformationDisplayCard md={24} xs={24} sm={24} title=''>


        <div className="flex-center flex-column" style={{ margin: 8, fontSize: 24 }}>
          <b>Distribution</b>
        </div>
        <div className="secondary-text" style={{ textAlign: 'center' }}>
          To be able to claim, users will need to go to the claim page and enter the code / password and sign the claim transaction.{' '}
          <InfoCircleOutlined style={{ color: 'orange' }} /> So, note that wallets must be handy at claim time.


          Distribution can be facilitated in a variety of way
          according to your application requirements. You know your users best.
          Codes / passwords are not crypto-native, so you can use any method you prefer to distribute them,
          such as via email, social media sites, SMS, or even physical printouts.
          We also support claim alerts which are in-app notifications that alert the user to claim with a link to the claim page.
          {' '}<WarningOutlined style={{ color: 'orange' }} />  However, always use third-party services at your own risk.

          <br /><br />

          {<>
            {hasPassword && <>
              <span style={{ color: '#FF5733' }}>
                <WarningOutlined /> Anyone with the password can claim the badge!
              </span>
            </>}
            {codes && codes.length > 0 && !hasPassword && <>
              <span style={{ color: '#FF5733' }}>
                <WarningOutlined /> Keep these codes safe and secure! Anyone with the code can claim the badge! Codes can only be used once.
              </span>
            </>}
            {' '}
            If leaked, unwanted parties can claim the badge.
            Use best practices to prevent spam and leaks, such as short claim windows, only sending to trusted parties,
            and using secure communication methods.
          </>}
        </div>
        <br />
        <Tabs
          tab={tab}
          setTab={setTab}
          fullWidth
          type="underline"
          hideOnSingleTab
          tabInfo={[
            {
              key: 'individual',
              content: 'Individual',
            },
            codes && codes.length > 1 && !hasPassword ? {
              key: 'batch',
              content: 'Batch',
            } : undefined,
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
                <div style={{ textAlign: 'center' }}>
                  <br />

                  <div className='secondary-text'>
                    <InfoCircleOutlined /> You can use a service like <a href="https://qrexplore.com/generate/" target="_blank" rel="noopener noreferrer">this QR code generator</a> to generate QR codes in batch for URLs.
                  </div>
                  <br />
                  <div className="flex flex-wrap">
                    <InformationDisplayCard md={12} xs={24} sm={24} title='Codes' subtitle='Download/share/copy the plaintext codes.'>
                      <br />
                      <div className="flex-center">

                        {AllInOneJson}

                        <button
                          onClick={() => {
                            const today = new Date();

                            const dateString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
                            const timeString = `${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`;

                            downloadTxt(codes.join('\n'), `codes-${collection?.cachedCollectionMetadata?.name}-approvalId=${approvalId}-${dateString}-${timeString}.txt`);
                          }}
                          className="landing-button primary-text" style={{ width: 150, margin: 2 }}
                        >
                          Codes .txt  <DownloadOutlined />
                        </button>

                        <button className="landing-button primary-text" style={{ width: 150, margin: 2 }}
                          onClick={() => {
                            navigator.clipboard.writeText(codes.join('\n'));
                            notification.success({
                              message: 'Copied!',
                              description: 'We have copied the codes to your clipboard.'
                            })
                          }}
                        >
                          Copy Codes
                          <CopyOutlined />
                        </button>
                        {!!global.navigator.canShare && global.navigator.canShare({
                          title: 'Claim Badge',
                          text: `test`,
                        }) && <button className="landing-button primary-text" style={{ width: 150, margin: 2 }}
                          onClick={async () => {

                            await navigator.share({
                              title: `BitBadges Claim ${printStr[0].toUpperCase() + printStr.slice(1)}`,
                              text: codes.join('\n'),
                            });
                          }}
                        >
                            Share Codes
                          </button>}
                      </div>
                    </InformationDisplayCard>
                    <InformationDisplayCard md={12} xs={24} sm={24} title='Unique Claim Links' subtitle='When users navigate to this link, they will be taken directly to the claim page with everything auto-populated for them. Note claiming requires a wallet, so users are expected to have wallets handy.'>
                      <br />
                      <div className="flex-center">
                        {AllInOneJson}
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
                          className="landing-button primary-text" style={{ width: 150, margin: 2 }}
                        >
                          Claim URLs .txt <DownloadOutlined />
                        </button>

                        <button className="landing-button primary-text" style={{ width: 175, margin: 2 }}
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
                          Copy Claim URLs  <CopyOutlined />
                        </button>
                        {/* //share text */}
                        {!!global.navigator.canShare && global.navigator.canShare({
                          title: 'Claim Badge',
                          text: `test`,
                        }) && <button className="landing-button primary-text" style={{ width: 175, margin: 2 }}
                          onClick={async () => {

                            await navigator.share({
                              title: `BitBadges Claim ${printStr[0].toUpperCase() + printStr.slice(1)}`,
                              text: codes.map(x => WEBSITE_HOSTNAME + '/collections/' + collectionIdStr + '?approvalId=' + approvalId + '&code=' + x).join('\n'),
                            });
                          }}
                        >
                            Share Claim URLs
                          </button>}

                      </div>
                      <br />
                      {NewCollectionWarning}
                    </InformationDisplayCard>
                    <InformationDisplayCard md={12} xs={24} sm={24} title='Save for Later Links' subtitle='When users navigate to this link, they will be taken directly to the claim page with everything auto-populated for them. Note claiming requires a wallet, so users are expected to have wallets handy.'>
                      <br />
                      <div className="flex-center">
                        {AllInOneJson}
                        <button
                          onClick={() => {
                            const today = new Date();

                            const dateString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
                            const timeString = `${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`;

                            downloadTxt(codes.map(x => WEBSITE_HOSTNAME + '/saveforlater?value=' + x).join('\n'), `code-urls-${collection?.cachedCollectionMetadata?.name}-approvalId=${approvalId}-${dateString}-${timeString}.txt`);
                          }}
                          className="landing-button primary-text" style={{ width: 200, margin: 2 }}
                        >
                          Save for Later URLs .txt <DownloadOutlined />
                        </button>
                        <button className="landing-button primary-text" style={{ width: 222, margin: 2 }}
                          onClick={() => {
                            navigator.clipboard.writeText(codes.map(x => WEBSITE_HOSTNAME + '/saveforlater?value=' + x).join('\n'));
                            notification.success({
                              message: 'Copied!',
                              description: 'We have copied the URLs to your clipboard.'
                            })
                          }}
                        >
                          Copy Save for Later URLs  <CopyOutlined />
                        </button>


                        {!!global.navigator.canShare && global.navigator.canShare({
                          title: 'Claim Badge',
                          text: `test`,
                        }) && <button className="landing-button primary-text" style={{ width: 222, margin: 2 }}
                          onClick={async () => {

                            await navigator.share({
                              title: `BitBadges Claim ${printStr[0].toUpperCase() + printStr.slice(1)}`,
                              text: codes.map(x => WEBSITE_HOSTNAME + '/saveforlater?value=' + x).join('\n'),
                            });
                          }}
                        >
                            Share Save for Later URLs
                          </button>}



                      </div>
                    </InformationDisplayCard>
                    {<>
                      <InformationDisplayCard md={12} xs={24} sm={24} title='Claim Alerts' subtitle='Send claim alerts to users. The selected addresses will receive a BitBadges notification with the respective code / password and a link to claim.'>

                        <div className="flex-center">
                          <div className="flex-center flex-column" style={{ maxWidth: 750 }}>
                            {cantShowUrl && <>
                              <div className="secondary-text" style={{ textAlign: 'center' }}>
                                <WarningOutlined style={{ color: 'orange' }} /> Claim alerts require the collection ID, which we currently do not have.
                                They will be fully supported once the collection is officially created.
                                However, note that claim alerts can only be sent by the current manager.
                              </div>
                            </>}

                            {!cantShowUrl && <>
                              <div className="full-width" style={{ margin: 8, }}>
                                <BatchAddressSelect users={claimAlertAddresses} setUsers={setClaimAlertAddresses} />
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
                                      value={startCodeIdx + 1 + claimAlertAddresses.length - 1}
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
                                <InfoCircleOutlined />  We will send claim alerts for the codes {startCodeIdx + 1} to {startCodeIdx + 1 + claimAlertAddresses.length - 1} to the selected addresses ({claimAlertAddresses.length}) in the order they were entered, respectively.
                              </div>}
                            </>}
                          </div>
                        </div>
                      </InformationDisplayCard>
                    </>}

                  </div>

                </div>
                <br />

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
            <div>
              Password: <Typography.Text copyable strong className='primary-text' style={{ fontSize: 20 }}> {claimPassword}</Typography.Text>
            </div>
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
            Code: <Tooltip color='black' title={`${codes?.[codePage - 1] ?? ''}`}>
              <Typography.Text className="primary-text" copyable={{ text: codes?.[codePage - 1] ?? '' }}>
                {getAbbreviatedAddress(codes?.[codePage - 1] ?? '')}
              </Typography.Text>
            </Tooltip>
          </Typography.Text>
            <br /><br />
            {merkleChallenge && !merkleChallenge.details?.challengeDetails?.hasPassword && !!merkleChallenge.maxUsesPerLeaf && codes && <Typography.Text strong className='secondary-text'>

              Current Status: {
                challengeTracker && (challengeTracker.usedLeafIndices?.find(x => x == BigInt(codePage - 1)) ?? -1) >= 0 ? <span style={{ color: 'red' }}>USED</span> : <span style={{ color: 'green' }}>UNUSED</span>
              }
            </Typography.Text>}

            <br />
            <br />
            {!(challengeTracker?.usedLeafIndices?.find(x => x == BigInt(codePage - 1)) ?? -1 >= 0) && <>
              <div className="flex-center flex-wrap">

                {/* //share text */}
                {!!global.navigator.canShare && global.navigator.canShare({
                  title: 'Claim Badge',
                  text: `test`,
                }) && <button className="landing-button primary-text" style={{ width: 150, margin: 2 }}
                  onClick={async () => {

                    await navigator.share({
                      title: `BitBadges Claim ${printStr[0].toUpperCase() + printStr.slice(1)}`,
                      text: (hasPassword ? claimPassword : codes?.[codePage - 1]) ?? '',
                    });
                  }}
                >
                    Share {printStr[0].toUpperCase() + printStr.slice(1)}
                  </button>}
              </div>

            </>
            }
          </>}
          <div className="flex flex-wrap">

            <InformationDisplayCard md={12} xs={24} sm={24} title='Unique Claim Link' subtitle='When users navigate to this link, they will be taken directly to the claim page with everything auto-populated for them. Note claiming requires a wallet, so users are expected to have wallets handy.'>
              <br />
              {cantShowUrl ? <>
                <div className="flex-center flex-wrap">
                  <Tooltip color="black" title={`${WEBSITE_HOSTNAME}/collections/${collectionIdStr}?approvalId=${approvalId}&${urlSuffix}`}>
                    <button className="landing-button primary-text" style={{ width: 150, margin: 2 }}
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
                  {!!global.navigator.canShare && global.navigator.canShare({
                    title: 'Claim Badge',
                    text: `test`,
                  }) && <button className="landing-button primary-text" style={{ width: 150, margin: 2 }}
                    onClick={async () => {

                      await navigator.share({
                        title: `BitBadges Claim ${printStr[0].toUpperCase() + printStr.slice(1)}`,
                        text: `${WEBSITE_HOSTNAME}/collections/${collectionIdStr}?approvalId=${approvalId}&${urlSuffix}`,
                      });
                    }}
                  >
                      Share URL
                    </button>}


                </div>
                <br />
                {codes && codes.length > 0 && !hasPassword && <>

                  {NewCollectionWarning}
                </>}
              </> : <>
                <QrCodeDisplay
                  isUrl
                  size={256} value={`${WEBSITE_HOSTNAME}/collections/${collectionIdStr}?approvalId=${approvalId}&${urlSuffix}`}
                /></>
              }
            </InformationDisplayCard>
            <InformationDisplayCard md={12} xs={24} sm={24} title='Save for Later Link' subtitle='This QR code will direct users to a site similar to this where they can save the code or password for later in different formats (text, emailing to themselves, copy, etc).'>
              <br />
              <QrCodeDisplay
                isUrl
                size={256} value={`https://bitbadges.io/saveforlater?value=${hasPassword ? claimPassword : codes?.[codePage - 1] ?? ''}`}
              />
            </InformationDisplayCard>
            <InformationDisplayCard md={12} xs={24} sm={24} title='Claim Alert' subtitle='Send a claim alert to a user. The selected address will receive a BitBadges notification with the code / password and a link to claim.'>
              <br />
              {cantShowUrl && <>
                <div className="secondary-text" style={{ textAlign: 'center' }}>
                  <WarningOutlined style={{ color: 'orange' }} /> Claim alerts require the collection ID, which we currently do not have.
                  They will be fully supported once the collection is officially created.
                  However, note that claim alerts can only be sent by the current manager.
                </div>
              </>}
              {!cantShowUrl && <>
                <AddressSelect onUserSelect={(address) => {
                  setClaimAlertAddress(address);
                }} />
                <div className="flex-center">
                  <button className="landing-button primary-text " style={{ width: 150, margin: 2 }}
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
                </div>
              </>}
            </InformationDisplayCard>
          </div>

        </>}
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