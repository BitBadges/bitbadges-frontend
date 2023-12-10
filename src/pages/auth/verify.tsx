import { CheckCircleFilled, CloseCircleFilled, DeleteOutlined, InfoCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Input, InputNumber, Spin, Switch } from 'antd';
import { BigIntify, BlockinAuthSignatureDoc, convertToCosmosAddress, getAbbreviatedAddress } from 'bitbadgesjs-utils';
import { constructChallengeObjectFromString } from 'blockin';
import { useEffect, useState } from 'react';
import { getAuthCode } from '../../bitbadges-api/api';
import { AddressDisplay } from '../../components/address/AddressDisplay';
import { EmptyIcon } from '../../components/common/Empty';
import { Divider } from '../../components/display/Divider';
import IconButton from '../../components/display/IconButton';
import { InformationDisplayCard } from '../../components/display/InformationDisplayCard';
import { Tabs } from '../../components/navigation/Tabs';
import { INFINITE_LOOP_MODE } from '../../constants';

function BlockinCodesScreen() {

  const [inputtedQrCode, setInputtedQrCode] = useState('');
  const [verified, setVerified] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  interface QRSession {
    usedQrCodes: (BlockinAuthSignatureDoc<bigint> & { usedAt: bigint })[],

    id: string
    verificationOptions: {
      usesPerQrCode: number,
      usesPerAddress: number,
    }
  }

  const [loading, setLoading] = useState(false);
  const [sessions, _setSessions] = useState<QRSession[]>([]);
  const [currentSessionIdx, setCurrentSessionIdx] = useState<number>(-1);

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
    setSessions(savedSessions || []);
  }, []);

  const verify = async () => {
    try {

      const res = await getAuthCode({ signature: inputtedQrCode, options: {} });
      console.log(res);
      setVerified(res.verificationResponse.success);
      if (!res.verificationResponse.success) setErrorMessage(res.verificationResponse.verificationMessage);
      else {
        setErrorMessage('');
        //add to used codes
        if (currentSession) {
          const updatedSession = { ...currentSession };
          const params = constructChallengeObjectFromString(res.message, BigIntify);

          const usesPerQrCode = currentSession.usedQrCodes.filter((x) => x.signature === inputtedQrCode).length;
          const usesPerAddress = currentSession.usedQrCodes.filter((x) => x.cosmosAddress === convertToCosmosAddress(params.address)).length;

          if (currentSession.verificationOptions) {
            if (currentSession.verificationOptions.usesPerQrCode <= usesPerQrCode) {
              setVerified(false);
              setErrorMessage(`This QR code has been used too many times. It can only be used ${currentSession.verificationOptions.usesPerQrCode} times.`);
              setLoading(false);
              return;
            }
            if (currentSession.verificationOptions.usesPerAddress <= usesPerAddress) {
              setVerified(false);
              setErrorMessage(`This address has been used too many times. It can only be used ${currentSession.verificationOptions.usesPerAddress} times.`);
              setLoading(false);
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
            _legacyId: inputtedQrCode,
            usedAt: BigInt(Date.now()),
          });

          setCurrentSession(updatedSession);
        }
      }
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

  const [autoClearMs, setAutoClearMs] = useState(5000);

  //Auto clear the QR code after X seconds
  const AUTO_CLEAR_MS = autoClearMs;
  useEffect(() => {
    if (AUTO_CLEAR_MS <= 0) return;

    if (INFINITE_LOOP_MODE) console.log('useEffect: uri select, badge uri changed ');
    const delayDebounceFn = setTimeout(async () => {
      setInputtedQrCode('');
    }, AUTO_CLEAR_MS)

    return () => clearTimeout(delayDebounceFn)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputtedQrCode])

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
      <div className='flex'>
        <InformationDisplayCard title='Enter QR Code' md={12} xs={24} sm={24} >
          <Input.TextArea
            rows={10}
            value={inputtedQrCode}
            onChange={(e) => {
              setInputtedQrCode(e.target.value.trim());
            }}
            placeholder='Enter QR Code text here...'
          />
          <br />
          <br />
          <div className='flex-center'>
            <Switch checkedChildren="Auto Clear (5s)" unCheckedChildren="Auto Clear" onChange={(checked) => {
              if (checked) setAutoClearMs(5000);
              else setAutoClearMs(0);
            }} />
            <div className='secondary-text' style={{ marginLeft: 8 }}>
              <InfoCircleOutlined />
              {autoClearMs > 0 ? ` QR Code will be auto verified upon entered and cleared after ${autoClearMs / 1000} seconds.` : ' To verify, you manually click "Verify QR Code"'}
            </div>
          </div>
          <br />
          {autoClearMs <= 0 && <div className='flex-center'>
            <button className='landing-button'
              style={{ width: '100%' }}
              onClick={async () => {
                verify();
              }}>Verify QR Code</button>
          </div>}
          {/* 
          {inputtedQrCode && <>
            <Divider /> <div className='flex-center'>
              <QRCode value={inputtedQrCode} size={256} />
            </div>
          </>} */}
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
              <div className='secondary-text' style={{ fontSize: 16, marginBottom: 8 }}>
                {verified ? <CheckCircleFilled style={{ color: 'green' }} /> : <CloseCircleFilled style={{ color: 'red' }} />}
                The QR Code is {verified ? 'valid' : 'invalid'}.
              </div>
              <br />

              <div>
                {verified ? <CheckCircleFilled style={{ color: 'green', fontSize: 100 }} /> : <CloseCircleFilled style={{ color: 'red', fontSize: 100 }} />}
              </div>
              {errorMessage && <div className='secondary-text' style={{ fontSize: 16, marginBottom: 8, color: 'red' }}>
                {errorMessage}
              </div>}
              {verified && <div className='secondary-text' style={{ fontSize: 16, marginBottom: 8, textAlign: 'center' }}>
                <InfoCircleOutlined /> Blockin has verified 1) the QR code signature and 2) ownership of assets / badges.
                You should now implement any additional checks you require (e.g. one-time use only, verify nonces, etc). We leave this up to you.
              </div>}
            </div>
          </>}
        </InformationDisplayCard>
      </div>
      <br />


      <InformationDisplayCard title='Session Manager' md={24} xs={24} sm={24} >
        <div className='flex-center'>
          <div className='secondary-text' style={{ fontSize: 16, marginBottom: 8, textAlign: 'center' }}>
            <InfoCircleOutlined /> Sessions are used to track which QR codes have been used, which addresses have been used, etc.
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
          <IconButton src={<PlusOutlined />} text='Add Session' onClick={() => {
            const id = new Date().getTime().toString();
            createSession(id);
            setCurrentSessionIdx(sessions.length);
          }}></IconButton>
        </div>
        <br />
        {currentSession && <>
          {/* Session ID */}
          <div className='flex-center primary-text' style={{ marginBottom: 8, textAlign: 'center' }}>
            <div>
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
              <b>Max Uses per QR Code</b>
              <br />
              <InputNumber
                title='Uses Per QR Code'
                value={currentSession?.verificationOptions.usesPerQrCode}
                onChange={(value) => {
                  if (!currentSession) return;

                  if (!value) value = 1;

                  const updatedSession = { ...currentSession };
                  updatedSession.verificationOptions.usesPerQrCode = value;
                  setCurrentSession(updatedSession);
                }}
                min={1}
                max={100}

                className='primary-text inherit-bg'
              />
            </div>
            <div style={{ margin: 16 }}>
              <b>Max Uses per Address</b>
              <br />
              <InputNumber
                title='Uses Per Address'
                value={currentSession?.verificationOptions.usesPerAddress}
                onChange={(value) => {
                  if (!currentSession) return;

                  if (!value) value = 1;

                  const updatedSession = { ...currentSession };
                  updatedSession.verificationOptions.usesPerAddress = value;
                  setCurrentSession(updatedSession);
                }}
                min={1}
                max={100}
                className='primary-text inherit-bg'
              />
            </div>
          </div>
        </>}
        <Divider />

        {!currentSession && <EmptyIcon description='No active session. Create a session to track used QR codes.' />}

        {currentSession && <div className='flex-center flex-column'>
          <b className='primary-text'>Used Codes {currentSession.usedQrCodes.length}</b>
          {currentSession.usedQrCodes.map((x, i) => {
            return <div key={i} style={{ margin: 8 }} className='flex'>

              <div className='secondary-text' style={{ fontSize: 12, textAlign: 'center' }}>

                <AddressDisplay addressOrUsername={x.cosmosAddress} />
                {i + 1}) QR Code ID: {getAbbreviatedAddress(x.signature)}
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
    </div>

  );
}

export default BlockinCodesScreen;
