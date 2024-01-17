import { CheckCircleFilled, CloseCircleFilled, DeleteOutlined, InfoCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Input, InputNumber, Spin, Switch } from 'antd';
import { AddressList, convertUintRange } from 'bitbadgesjs-proto';
import { BigIntify, BlockinAuthSignatureDoc, convertToCosmosAddress, getAbbreviatedAddress, getChainForAddress, getReservedAddressList, isInAddressList } from 'bitbadgesjs-utils';
import { ChallengeParams, constructChallengeObjectFromString, constructChallengeStringFromChallengeObject, convertChallengeParams } from 'blockin';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { getAuthCode, verifySignInGeneric } from '../../bitbadges-api/api';
import { AddressDisplay } from '../../components/address/AddressDisplay';
import { AddressListSelect } from '../../components/address/AddressListsSelect';
import { EmptyIcon } from '../../components/common/Empty';
import { Divider } from '../../components/display/Divider';
import IconButton from '../../components/display/IconButton';
import { InformationDisplayCard } from '../../components/display/InformationDisplayCard';
import { Tabs } from '../../components/navigation/Tabs';
import { INFINITE_LOOP_MODE } from '../../constants';
import { AuthCode } from '../account/codes';

const NumberInputWithSwitch = ({ value, setValue, title, min, max, }: {
  value: number | undefined,
  setValue: (value: number | undefined) => void,
  title: string,
  min: number,
  max: number,
}) => {
  const switchValue = value !== undefined && value > 0;

  return <div className='flex-center flex-column'>
    <b style={{ marginBottom: 8, textAlign: 'center' }}>
      {title}
    </b>

    <div className='flex-center'>
      <Switch checkedChildren={"Custom"} unCheckedChildren={"N/A"} checked={switchValue} onChange={(checked) => {

        if (checked) setValue(1);
        else setValue(0);
      }} />
    </div>
    <br />

    {switchValue &&
      <div className='flex-center'>
        <InputNumber
          value={value}
          onChange={(value) => {
            if (!value) value = 1;

            setValue(value);
          }}
          min={min}
          max={max}
          className='primary-text inherit-bg'
        />
      </div>}
    <br />

  </div>
}


function BlockinCodesScreen() {
  const router = useRouter();

  const {
    generateNonce,
    allowAddressSelect,
    storeInAccount,
  } = router.query;

  const [inputtedQrCode, setInputtedQrCode] = useState('');
  const [verified, setVerified] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  interface QRSession {
    usedQrCodes: (BlockinAuthSignatureDoc<bigint> & { usedAt: bigint })[],

    id: string
    verificationOptions: {
      usesPerQrCode: number,
      usesPerAddress: number,
      addressList: AddressList
    }
  }

  const [loading, setLoading] = useState(false);
  const [sessions, _setSessions] = useState<QRSession[]>([]);
  const [currCodeDoc, setCurrCodeDoc] = useState<BlockinAuthSignatureDoc<bigint>>();
  const [currentSessionIdx, setCurrentSessionIdx] = useState<number>(-1);
  const [message, setMessage] = useState<string>('');

  const setSessions = (sessions: QRSession[]) => {
    if (window) window.localStorage.setItem('sessions', JSON.stringify(sessions));
    _setSessions(sessions);
  }

  const currentSession = currentSessionIdx >= 0 && currentSessionIdx < sessions.length ? sessions[currentSessionIdx] : undefined;

  const setCurrentSession = (session: QRSession) => {
    const index = sessions.findIndex((s) => s.id === session.id);
    updateSession(index, session);
  }

  const createSession = (id: string) => {
    const newSession = {
      usedQrCodes: [],
      id,
      verificationOptions: {
        usesPerQrCode: 1,
        usesPerAddress: 1,
        addressList: getReservedAddressList("All"),
      }
    };
    setSessions([...sessions, newSession]);
  };

  const updateSession = (index: number, session: QRSession) => {
    const updatedSessions = [...sessions];
    updatedSessions[index] = session;
    setSessions(updatedSessions);
  };

  const removeSession = (index: number) => {
    const updatedSessions = [...sessions];
    updatedSessions.splice(index, 1);
    setSessions(updatedSessions);
  };

  useEffect(() => {
    // You can add code here to load sessions from local storage on component mount.
    const savedSessions = JSON.parse(window.localStorage.getItem('sessions') || '[]');
    setSessions(savedSessions.map((x: any) => {
      return {
        ...x,
        verificationOptions: {
          ...x.verificationOptions,
          badgeIdBounds: x.verificationOptions.badgeIdBounds?.map((x: any) => convertUintRange(x, BigIntify)),
        }
      }
    }) || []);
  }, []);

  const expectedChallengeParams: Partial<ChallengeParams<bigint>> = useMemo(() => {
    try {
      const params = convertChallengeParams(JSON.parse(router.query.challengeParams as string), BigIntify);
      // console.log(expectedChallengeParams);
      return {
        address: allowAddressSelect ? undefined : params?.address,
        version: params?.version || undefined,
        chainId: params?.chainId || undefined,
        issuedAt: params?.issuedAt || undefined,
        expirationDate: params?.expirationDate || undefined,

        domain: params?.domain || undefined,
        resources: params?.resources || undefined,
        uri: params?.uri || undefined,
        statement: params?.statement || undefined,
        nonce: generateNonce ? undefined : params?.nonce || undefined,
        assets: params?.assets?.map((x) => {
          return {
            ...x,
            collectionId: BigInt(x.collectionId),
            assetIds: x.assetIds?.map((x) => {
              if (typeof x === 'object') {
                return convertUintRange(x, BigIntify)
              } else {
                return x
              }
            }),
          }
        }) ?? undefined,
      };
    } catch (e) {
      console.log("ADSJHKASFGHJJHGASFHGJK", e);
      return {}
    }
  }, [router.query.challengeParams, allowAddressSelect, generateNonce]);

  const verify = async () => {
    try {

      let params: ChallengeParams<bigint>;
      if (!storeInAccount) {
        params = constructChallengeObjectFromString(message, BigIntify);

        const newMessage = constructChallengeStringFromChallengeObject(params)

        const res = await verifySignInGeneric({
          message: newMessage,
          signature: inputtedQrCode,
          chain: getChainForAddress(params?.address ?? ''),
          options: { expectedChallengeParams: expectedChallengeParams }
        });
        if (!res.success) {
          throw new Error("Blockin verification failed");
        }

        //will throw if it fails

      } else {
        const res = await getAuthCode({
          signature: inputtedQrCode, options: {
            expectedChallengeParams: expectedChallengeParams,
          }
        });
        if (!res.verification.success) {
          throw new Error(res.verification.response);
        }
        console.log("RES", res);

        params = constructChallengeObjectFromString(res.message, BigIntify);
      }

      const doc: BlockinAuthSignatureDoc<bigint> = {
        signature: inputtedQrCode,
        cosmosAddress: convertToCosmosAddress(params.address),
        params: params,
        createdAt: 0n,
        name: '',
        description: '',
        image: '',
        _docId: inputtedQrCode,
      };
      if (currentSession) {
        const updatedSession = { ...currentSession };


        if (currentSession.verificationOptions.addressList && !isInAddressList(
          {
            ...currentSession.verificationOptions.addressList,
            addresses: currentSession.verificationOptions.addressList.addresses.map((x) => convertToCosmosAddress(x))
          },
          convertToCosmosAddress(params.address)
        )) {
          setVerified(false);
          setErrorMessage(`This address is not in the allowed address list.`);
          setLoading(false);
          return;
        }




        const usesPerQrCode = currentSession.usedQrCodes.filter((x) => x.signature === inputtedQrCode).length;
        const usesPerAddress = currentSession.usedQrCodes.filter((x) => x.cosmosAddress === convertToCosmosAddress(params.address)).length;
        if (currentSession.verificationOptions) {
          if (currentSession.verificationOptions.usesPerQrCode && currentSession.verificationOptions.usesPerQrCode <= usesPerQrCode) {
            setVerified(false);
            setErrorMessage(`This QR code has been used too many times. It can only be used ${currentSession.verificationOptions.usesPerQrCode} times.`);
            setLoading(false);

            setCurrCodeDoc(undefined);
            return;
          }
          if (currentSession.verificationOptions.usesPerAddress && currentSession.verificationOptions.usesPerAddress <= usesPerAddress) {
            setVerified(false);
            setErrorMessage(`This address has been used too many times. It can only be used ${currentSession.verificationOptions.usesPerAddress} times.`);
            setLoading(false);

            setCurrCodeDoc(undefined);
            return;
          }
        }

        updatedSession.usedQrCodes.push({
          signature: inputtedQrCode,
          cosmosAddress: convertToCosmosAddress(params.address),
          createdAt: 0n,
          name: '',
          description: '',
          image: '',
          params,
          _docId: inputtedQrCode,
          usedAt: BigInt(Date.now()),
        });

        setCurrentSession(updatedSession);
      }


      setVerified(true);
      setErrorMessage('');
      setCurrCodeDoc(doc);
      //add to used codes


    } catch (e: any) {
      setVerified(false);
      setErrorMessage(e.message);
    }
  }

  const DELAY_MS = 600;
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: uri select, badge uri changed ');
    setLoading(true);
    const delayDebounceFn = setTimeout(async () => {
      if (!inputtedQrCode) return

      if (autoClearMs > 0) {
        verify();
      }

      setLoading(false);
    }, DELAY_MS)

    return () => clearTimeout(delayDebounceFn)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputtedQrCode])

  const [autoClearMs, setAutoClearMs] = useState(0);

  //Auto clear the QR code after X seconds
  const AUTO_CLEAR_MS = autoClearMs;
  useEffect(() => {
    if (AUTO_CLEAR_MS <= 0) return;

    if (INFINITE_LOOP_MODE) console.log('useEffect: uri select, badge uri changed ');
    const delayDebounceFn = setTimeout(async () => {
      setInputtedQrCode('');

      setCurrCodeDoc(undefined);
    }, AUTO_CLEAR_MS)

    return () => clearTimeout(delayDebounceFn)
  }, [inputtedQrCode, AUTO_CLEAR_MS])

  return (

    <div
      style={{
        marginLeft: '3vw',
        marginRight: '3vw',
        paddingLeft: '1vw',
        paddingRight: '1vw',
        paddingTop: '20px',
        minHeight: '100vh'
      }}
    >
      <div className='flex flex-wrap'>
        <InformationDisplayCard title='Enter Authentication Details' md={12} xs={24} sm={24} >
          {!storeInAccount && <Input.TextArea
            rows={10}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value)
              setVerified(false);
              setErrorMessage('');
              setCurrCodeDoc(undefined);

            }}
            placeholder='Enter message here...'
          />}
          <br />
          <br />
          <Input.TextArea
            rows={10}
            value={inputtedQrCode}
            onChange={(e) => {
              setInputtedQrCode(e.target.value.trim());
              setVerified(false);
              setErrorMessage('');
              setCurrCodeDoc(undefined);

            }}
            placeholder='Enter code here...'
          />
          <br />
          <br />
          <div className='flex-center flex-wrap'>
            <div>
              <Switch
                checked={autoClearMs > 0}
                checkedChildren="Auto Clear (5s)" unCheckedChildren="Auto Clear" onChange={(checked) => {
                  if (checked) setAutoClearMs(5000);
                  else setAutoClearMs(0);
                }} />
            </div>
            <div className='secondary-text' style={{ marginLeft: 8, textAlign: 'center' }}>
              <InfoCircleOutlined />
              {autoClearMs > 0 ? ` Code will be auto verified upon entered and cleared after ${autoClearMs / 1000} seconds.` : ' To verify, you manually click "Verify Code"'}
            </div>
          </div>
          <br />
          {autoClearMs <= 0 && <div className='flex-center'>
            <button className='landing-button'
              style={{ width: '100%' }}
              onClick={async () => {
                verify();
              }}>Verify Code</button>
          </div>}
          <br />
          {Object.keys(expectedChallengeParams).length > 0 &&
            <>
              <AuthCode
                isExpected
                onlyShowDetails
                authCode={{
                  _docId: '',
                  name: '',
                  description: '',
                  image: '',
                  signature: '',

                  createdAt: 0n,
                  cosmosAddress: '',
                  params: {
                    address: expectedChallengeParams.address ?? '',
                    version: expectedChallengeParams.version ?? '',
                    chainId: expectedChallengeParams.chainId ?? '',
                    issuedAt: expectedChallengeParams.issuedAt ?? '',
                    expirationDate: expectedChallengeParams.expirationDate ?? '',
                    domain: expectedChallengeParams.domain ?? '',
                    uri: expectedChallengeParams.uri ?? '',
                    statement: expectedChallengeParams.statement ?? '',
                    nonce: expectedChallengeParams.nonce ?? '',
                    resources: expectedChallengeParams.resources ?? [],
                    assets: expectedChallengeParams.assets?.map((x) => {
                      return {
                        ...x,
                        collectionId: BigInt(x.collectionId),
                        assetIds: x.assetIds?.map((x) => {
                          if (typeof x === 'object') {
                            return convertUintRange(x, BigIntify)
                          } else {
                            return x
                          }
                        }),
                      }
                    }) ?? [],
                  },
                }}
              />
            </>
          }
        </InformationDisplayCard>
        <InformationDisplayCard
          title='Valid?'
          md={12}
          xs={24}
          sm={24}
        >
          {inputtedQrCode && loading && <div className='flex-center'><Spin size='large' /></div>}
          {inputtedQrCode && !loading && <>
            <div className='flex-center flex-column'>
              <div>
                {verified ? <CheckCircleFilled style={{ color: 'green', fontSize: 100 }} /> : errorMessage ? <CloseCircleFilled style={{ color: 'red', fontSize: 100 }} /> : <></>}
              </div>
              {errorMessage && <div className='secondary-text' style={{ fontSize: 16, marginBottom: 8, color: 'red' }}>
                {errorMessage}
              </div>}
              <br />
              {verified && <div className='secondary-text' style={{ fontSize: 16, marginBottom: 8, textAlign: 'center' }}>
                <InfoCircleOutlined /> Blockin has verified the code, all message details are as expected, address ownership (via the signature), and ownership of assets / badges.
                You should now implement any additional checks you require (e.g. one-time use only, verify nonces, etc). We leave this up to you.
              </div>}
            </div>
            <Divider />
            {verified && currCodeDoc &&
              <>
                <AuthCode
                  authCode={currCodeDoc}
                  onlyShowDetails
                />
              </>
            }
          </>}
        </InformationDisplayCard>
      </div>
      <br />


      <InformationDisplayCard title='Session Manager' md={24} xs={24} sm={24} >
        <div className='flex-center'>
          <div className='secondary-text' style={{ fontSize: 16, marginBottom: 8, textAlign: 'center' }}>
            <InfoCircleOutlined /> Sessions are used to track which codes have been used, which addresses have been used, etc.
            Sessions are stored in your browser, meaning their state will persist across page loads from the same device.
          </div>
        </div>
        <div className='flex-center'>
          <Tabs tabInfo={
            sessions.map((x, i) => {
              return {
                key: x.id, content: currentSession?.id === x.id ? <div className='flex-center'>
                  {x.id}
                  <IconButton src={<DeleteOutlined onClick={() => { removeSession(i) }} />} text='' />
                </div> : x.id,
              }
            })
          }
            tab={currentSession?.id ?? ''} setTab={(tab) => {
              setCurrentSessionIdx(sessions.findIndex((x) => x.id === tab));
            }}
            theme="dark" fullWidth type='underline' />
          <IconButton src={<PlusOutlined />} text='' onClick={() => {
            const id = new Date().getTime().toString();
            createSession(id);
            setCurrentSessionIdx(sessions.length);
          }}></IconButton>
        </div>
        <br />
        {currentSession && <>
          <div className='flex-center flex-wrap primary-text' style={{ marginBottom: 8, textAlign: 'center', alignItems: 'normal' }}>
            {/* <div className='' style={{ margin: 16 }}>
              <b>Collection ID</b>
              <br />
              <InputNumber
                title='Collection ID'
                value={Number(currentSession?.verificationOptions.collectionId ?? 1n)}
                onChange={(value) => {
                  if (!currentSession) return;

                  if (!value) value = 1;

                  const updatedSession = { ...currentSession };
                  updatedSession.verificationOptions.collectionId = BigInt(value);
                  setCurrentSession(updatedSession);

                  fetchCollections([BigInt(value)]);
                }}
                min={1}
                className='primary-text inherit-bg'
              />
            </div> */}
            <div style={{ margin: 16 }}>
              <b>Session ID</b>
              <br />
              <Input
                value={currentSession.id}
                onChange={(e) => {
                  const oldId = currentSession.id;
                  setSessions(sessions.map((s) => {
                    if (s.id === oldId) return { ...s, id: e.target.value };
                    return s;
                  }));
                }}
                className='primary-text inherit-bg'
                style={{
                  textAlign: 'center', width: 250, marginLeft: 8, marginRight: 8
                }}
              />
            </div>
            <div style={{ margin: 16 }}>
              <NumberInputWithSwitch
                value={currentSession?.verificationOptions.usesPerQrCode}
                setValue={(value) => {
                  if (!currentSession) return;

                  if (!value) value = 0;

                  const updatedSession = { ...currentSession };
                  updatedSession.verificationOptions.usesPerQrCode = value;
                  setCurrentSession(updatedSession);
                }}
                title='Uses Per Code'
                min={1}
                max={100}
              />
            </div>
            <div style={{ margin: 16 }}>
              <NumberInputWithSwitch
                value={currentSession?.verificationOptions.usesPerAddress}
                setValue={(value) => {
                  if (!currentSession) return;

                  if (!value) value = 0;

                  const updatedSession = { ...currentSession };
                  updatedSession.verificationOptions.usesPerAddress = value;
                  setCurrentSession(updatedSession);
                }}
                title='Uses Per Address'
                min={1}
                max={100}
              />
            </div>
            <div style={{ margin: 16 }}>
              <b>Approved</b>
              <AddressListSelect

                addressList={currentSession?.verificationOptions.addressList}
                setAddressList={(value) => {
                  if (!currentSession) return;

                  const updatedSession = { ...currentSession };
                  updatedSession.verificationOptions.addressList = value;
                  setCurrentSession(updatedSession);
                }}

              />
            </div>
            {/* <div style={{ margin: 16 }}>
              <NumberInputWithSwitch
                value={currentSession?.verificationOptions.usesPerBadge}
                setValue={(value) => {
                  if (!currentSession) return;

                  if (!value) value = 0;

                  const updatedSession = { ...currentSession };
                  updatedSession.verificationOptions.usesPerBadge = value;
                  setCurrentSession(updatedSession);
                }}
                title='Uses Per Badge'
                min={0}
                max={100}
              />
            </div> */}
          </div>
          {/* <div className='full-width'>

            <CollectionHeader collectionId={currentSession?.verificationOptions.collectionId ?? 1n} multiDisplay hideCollectionLink />
            <br />
            <BadgeIDSelectWithSwitch
              uintRanges={currentSession?.verificationOptions.badgeIdBounds ?? []}
              setUintRanges={(value) => {
                if (!currentSession) return;

                const updatedSession = { ...currentSession };
                updatedSession.verificationOptions.badgeIdBounds = value;
                setCurrentSession(updatedSession);
              }}
              collectionId={currentSession?.verificationOptions.collectionId ?? 1n}
            />
          </div> */}
        </>}


        <Divider />
        {!currentSession && <EmptyIcon description='No active session. Create a session to track used QR codes.' />}

        {currentSession && <div className='flex-center flex-column'>
          <b className='primary-text'>Used Codes {currentSession.usedQrCodes.length}</b>
          {currentSession.usedQrCodes.map((x, i) => {
            return <div key={i} style={{ margin: 8 }} className='flex'>

              <div className='secondary-text' style={{ fontSize: 12, textAlign: 'center' }}>

                <AddressDisplay addressOrUsername={x.cosmosAddress} />
                {i + 1}) Code ID: {getAbbreviatedAddress(x.signature)}
                <br />
                {x.usedAt > 0n && <>Used At: {new Date(Number(x.usedAt)).toLocaleString()}</>}
              </div>
              <div className='flex-center'>
                <IconButton onClick={() => {
                  const updatedSession = { ...currentSession };
                  updatedSession.usedQrCodes.splice(i, 1);
                  setCurrentSession(updatedSession);
                }} src={<DeleteOutlined />} text='Delete' tooltipMessage='Delete this code from the list of used codes' />
              </div>
            </div>
          })}
        </div>}
      </InformationDisplayCard>
    </div >
  );
}

export default BlockinCodesScreen;
