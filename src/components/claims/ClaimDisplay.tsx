import { ClockCircleOutlined, InfoCircleOutlined, TeamOutlined, WarningOutlined } from "@ant-design/icons";
import { Button, Card, Divider, Empty, Input, Pagination, Row, Tooltip, Typography } from "antd";
import { ClaimInfoWithDetails, DistributionMethod } from "bitbadgesjs-utils";
import { SHA256 } from "crypto-js";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { QRCode } from 'react-qrcode-logo';
import { useChainContext } from "../../bitbadges-api/contexts/ChainContext";
import { useCollectionsContext } from "../../bitbadges-api/contexts/CollectionsContext";
import { WEBSITE_HOSTNAME } from "../../constants";
import { getTimeRangeString } from "../../utils/dates";
import { downloadJson } from "../../utils/downloadJson";
import { AddressDisplay } from "../address/AddressDisplay";
import { BalanceDisplay } from "../balances/BalanceDisplay";
import { BlockinDisplay } from "../blockin/BlockinDisplay";
import { ToolIcon, tools } from "../display/ToolIcon";
import { TransferDisplay } from "../transfers/TransferDisplay";

//TODO: Support multiple challenges per claim
export function ClaimDisplay({
  claim,
  collectionId,
  openModal,
  isCodeDisplay,
  codes,
  claimPassword
}: {
  claim: ClaimInfoWithDetails<bigint>,
  collectionId: bigint,
  openModal: (code?: string, whitelistIndex?: number) => void,
  isCodeDisplay?: boolean
  codes?: string[]
  claimPassword?: string
}) {
  const chain = useChainContext();
  const router = useRouter();
  const collections = useCollectionsContext();
  const collection = collections.getCollection(collectionId);
  const claimId = claim.claimId;

  const query = router.query;
  const codeQuery = query.code as string;
  const passwordQuery = query.password as string;

  const [codePage, setCodePage] = useState(1);
  const [currCode, setCurrCode] = useState(codeQuery ? codeQuery as string : passwordQuery ? passwordQuery as string : '');
  const [showClaimDisplay, setShowClaimDisplay] = useState(!isCodeDisplay);

  useEffect(() => {
    if (codeQuery) {
      setCurrCode(codeQuery as string);
    } else if (passwordQuery) {
      setCurrCode(passwordQuery as string);
    }
  }, [codeQuery, passwordQuery]);

  let isExpired = Date.now() > claim.timeRange.end;

  let timeStr = '';
  if (isExpired) {
    timeStr = 'This claim has expired!';
  } else {
    timeStr = getTimeRangeString(claim.timeRange, 'Open');
  }

  if (claim.undistributedBalances.length === 0) return <></>

  //There are many different cases that can happen here as to why a user can not claim
  //1. Not connected to wallet
  //2. Not logged in to wallet and password claim (requires login)
  //3. Only one claim per address and user has already claimed
  //4. Only one claim per code and code has been used
  //5. Could not fetch claim data when it was created (most likely due to not being created through BitBadges website and being incompatible)

  let errorMessage = '';
  let cantClaim = false;
  let notConnected = false;
  let whitelistIndex: number | undefined = undefined;
  //Cases 1-5
  if (!chain.connected) {
    cantClaim = true;
    notConnected = true;
    errorMessage = 'Please connect your wallet!';
  } else if (claim.details?.hasPassword && !chain.loggedIn) {
    cantClaim = true;
    notConnected = true;
    errorMessage = 'Please sign in with your wallet!';
  } else if (claim.numClaimsPerAddress && claim.claimsPerAddressCount[chain.cosmosAddress] >= claim.numClaimsPerAddress) {
    cantClaim = true;
    errorMessage = 'You have exceeded the maximum number of times you can claim!';
  } else if (claim.usedLeaves && claim.usedLeaves[0]?.find(x => x === SHA256(currCode).toString())) {
    cantClaim = true;
    errorMessage = 'This code has already been used!';
  } else if (!claim.details) {
    cantClaim = true;
    errorMessage = 'The details for this claim were not found. This is usually the case when a badge collection is not created through the BitBadges website and incompatible.';
  }

  const printStr = claim.details?.hasPassword ? 'password' : 'code';
  const urlSuffix = claim.details?.hasPassword ? `password=${claimPassword}` : codes ? `code=${codes[codePage - 1]}` : '';

  return <>
    <Card
      className="primary-text primary-blue-bg"
      style={{
        // width: 650,
        // margin: 8,
        textAlign: 'center',
        border: `1px solid white`,
        borderRadius: 10,
      }}
    >
      <div style={{ textAlign: 'center', alignItems: 'center', justifyContent: 'center' }} >
        <Row className='flex-center' >
          <h1 className='primary-text'>{'Claim #' + (claimId) + `${claim.details?.name ? ': ' + claim.details?.name : ''}`}</h1>
        </Row>
        {isCodeDisplay && <Row>
          <div className="full-width">
            <Button className='screen-button primary-blue-bg' onClick={() => setShowClaimDisplay(!showClaimDisplay)}>{showClaimDisplay ? 'Show Codes/Passwords' : 'Show Claim Details'}</Button>
            <br />
            <hr />
            <br />
          </div>
        </Row>}

        {showClaimDisplay ?
          <div>
            <Row className='flex-center' >
              <h3 className='primary-text'><ClockCircleOutlined /> {timeStr}</h3>
            </Row>


            <br />
            {claim.details?.description &&
              <Row className='flex-center' >
                <div className='primary-text'>{claim.details?.description}</div>
              </Row>}
            <br />
            <BalanceDisplay
              message={'Unclaimed Badges Left'}
              collectionId={collectionId}
              balance={{
                approvals: [],
                balances: claim.undistributedBalances
              }}
            />
            <hr />
            <div>
              <BalanceDisplay
                message={'Current Claim'}
                collectionId={collectionId}
                balance={{
                  approvals: [],
                  balances: claim.currentClaimAmounts
                }}
              />

              {claim.incrementIdsBy > 0 && <div>
                <br />
                <Row className='flex-center' >
                  <p className='primary-text'>
                    <WarningOutlined style={{ color: 'orange' }} /> Each time a user claims, the claimable badge IDs increment by {`${claim.incrementIdsBy}`}. {"So if other claims are processed before yours, you will receive different badge IDs than the ones displayed."}
                  </p>
                </Row>
                <br />
              </div>}

              <div style={{ alignItems: 'center', justifyContent: 'center', overflow: 'auto' }} >
                {notConnected ? <>
                  <hr />
                  <br />
                  <div>
                    <BlockinDisplay hideLogo />
                  </div>
                </> : <>
                  {claim.challenges && claim.challenges[0].root && !claim.challenges[0].useCreatorAddressAsLeaf &&
                    <>
                      <hr />
                      <h3 className='primary-text'>Enter {claim.details?.hasPassword ? 'Password' : 'Code'} to Claim</h3>
                      <Input
                        placeholder={`Enter ${claim.details?.hasPassword ? 'Password' : 'Code'}`}
                        value={currCode}
                        onChange={(e: any) => {
                          setCurrCode(e.target.value);
                        }}
                        className="primary-text primary-blue-bg"
                        style={{
                          textAlign: 'center'
                        }}
                      />
                    </>
                  }

                  {claim.challenges && claim.challenges[0].root && claim.challenges[0].useCreatorAddressAsLeaf &&
                    <>
                      <hr />
                      <br />
                      {!claim.details?.challengeDetails[0].leavesDetails.leaves.find(y => y.includes(chain.cosmosAddress))
                        ? <div>
                          <h3 className='primary-text'>You are not on the whitelist.</h3>
                          <div className='flex-between' style={{ justifyContent: 'center' }}>
                            <AddressDisplay
                              addressOrUsername={chain.cosmosAddress}
                            />
                          </div>
                        </div> :
                        <div>
                          {chain.connected && <div>
                            <h3 className='primary-text'>You have been whitelisted!</h3>=
                          </div>}
                          <div>
                            <TransferDisplay
                              hideBalances
                              collectionId={collectionId}
                              from={['Mint']}
                              transfers={[
                                {
                                  toAddresses: [chain.cosmosAddress],
                                  balances: claim.currentClaimAmounts
                                }
                              ]}
                              setTransfers={() => { }}
                            />
                          </div>
                        </div>}
                    </>
                  }
                </>}

                <br />
                <br />

                <Tooltip className='flex full-width' title={errorMessage}>
                  <Button disabled={cantClaim} type='primary' onClick={() => openModal(currCode, whitelistIndex)} className='full-width'>Claim</Button>
                </Tooltip>

                {claim.numClaimsPerAddress > 0 && <div className='secondary-text' style={{ textAlign: 'center' }}>
                  <p>*Only {claim.numClaimsPerAddress.toString()} claim(s) allowed per account</p>
                </div>}
              </div>
            </div>
          </div>
          :
          // Show authenticated manager information (passwords, codes, distribution methods, etc...)
          <div>
            <Row className='flex-center' >
              <h3 className='primary-text'>{claim.details?.hasPassword ? 'Password' : 'Codes'}</h3>
            </Row>
            <Row className='flex-center' style={{ textAlign: 'center' }}>
              <div>
                <div>
                  {"There are many ways you can distribute these codes. Select the option that best suits your needs."}
                </div>
                <br />


                {!claim.details?.hasPassword && codes && codes.length > 0 && <>
                  <div>
                    <b>Option 1: Copy / Download Codes</b>
                    <br />
                    <button
                      style={{
                        backgroundColor: 'inherit',
                      }}
                      onClick={() => {
                        alert('Downloaded codes to a file!\n\nWARNING: Your badges can be redeemed by anyone who has these codes. Please keep these codes in safe hands and only give them to trusted parties (including tools)!');
                        const today = new Date();

                        const dateString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
                        const timeString = `${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`;

                        downloadJson({
                          prefixUrl: WEBSITE_HOSTNAME + '/collections/' + collectionId + '?claimId=' + claimId + '&code=ADD_CODE_HERE',
                          codes
                        }, `codes-${collection?.collectionMetadata?.name}-claimId=${claimId}-${dateString}-${timeString}.json`);
                      }}
                      className="opacity link-button primary-text"
                    >
                      Click here to download a file
                    </button>
                    {" "}containing all codes. Or, <button
                      style={{
                        backgroundColor: 'inherit',
                      }}
                      className="opacity link-button primary-text"
                      onClick={() => {
                        alert('Copied codes to clipboard!\n\nWARNING: Your badges can be redeemed by anyone who has these codes. Please keep these codes in safe hands and only give them to trusted parties (including tools)!');
                        //copy to clipboard
                        navigator.clipboard.writeText(JSON.stringify(codes.join('\n')));
                      }}
                    >
                      click here
                    </button> to copy the codes to your clipboard.
                    <br />
                    Keep these codes safe and secure!

                    <Divider />
                  </div>
                  <div>
                    <b>Option 2: Use a Distribution Tool</b>
                    <br />
                    <div>
                      <WarningOutlined style={{ color: 'orange', marginRight: 4 }} />
                      {"Tools marked with a "} <TeamOutlined style={{ marginLeft: 10, marginRight: 10 }} />{"are community built. Use at your own risk."}
                    </div>
                    <br />
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-around' }}>
                      {tools.map((tool, idx) => {
                        if (tool.distributionMethod !== DistributionMethod.Codes) return <></>

                        return <div style={{ margin: 8 }} key={idx}>
                          <ToolIcon
                            name={tool.name}
                          />
                        </div>
                      })}
                    </div>
                    <Divider />
                  </div>
                  <b>Option 3: Manually Distribute Individual Codes</b>
                  <br />
                  <Pagination
                    className='primary-text'
                    current={codePage}
                    total={codes.length}
                    pageSize={1}
                    onChange={(page) => {
                      setCodePage(page);
                    }}
                    size='small'
                    showSizeChanger={false}
                  />
                  <br />
                </>
                }
                {claimPassword && <div>
                  <h3 className='primary-text'>Password: {claimPassword}</h3>
                </div>}
                <br />
                <br />
                <Typography.Text className='secondary-text'>
                  There are three ways you can distribute this {printStr}: manually, by URL, or by QR code.
                </Typography.Text>
                <Divider />

                {!claim.details?.hasPassword && codes && <Typography.Text strong className='secondary-text'>
                  <InfoCircleOutlined /> Note that this code can only be used once.
                  <br />
                  Current Status: {
                    claim.usedLeaves && claim.usedLeaves[0]?.find(x => x === SHA256(codes[codePage - 1]).toString()) ? <span style={{ color: 'red' }}>USED</span> : <span style={{ color: 'green' }}>UNUSED</span>
                  }
                </Typography.Text>}

                <Divider />
                <h3 className='primary-text'>Manual</h3>
                <Typography.Text strong copyable className='primary-text' style={{ fontSize: 16 }}>
                  {claim.details?.hasPassword ? claimPassword : codes ? codes[codePage - 1] : ''}
                </Typography.Text>
                <br />
                <Typography.Text className='secondary-text'>
                  The {printStr} can be manually distributed, and the users will enter it on the claim page.
                </Typography.Text>
                <Divider />
                <h3 className='primary-text'>URL</h3>
                <Typography.Link strong copyable style={{ fontSize: 14 }}>
                  {`${WEBSITE_HOSTNAME}/collections/${collectionId}?claimId=${claimId}&${urlSuffix}`}
                </Typography.Link>
                <br />

                <Typography.Text className='secondary-text'>
                  When a user navigates to the above URL, the {printStr} will be automatically inputted.
                </Typography.Text>
                <Divider />
                <h3 className='primary-text'>QR Code</h3>
                <QRCode value={`${WEBSITE_HOSTNAME}/collections/${collectionId}?claimId=${claimId}&${urlSuffix}`} />
                <br />

                <Typography.Text className='secondary-text'>
                  When a user scans this QR code, it will take them to the claim page with the {printStr} automatically inputted.
                </Typography.Text>
              </div>
            </Row>
            {!claim.details?.hasPassword && (!codes || codes.length === 0) &&
              <Empty
                description={<span className='primary-text'>There are no {printStr}s for this claim.</span>}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                className='primary-text'
              />}
          </div>}
      </div>
    </Card >
  </>
}
