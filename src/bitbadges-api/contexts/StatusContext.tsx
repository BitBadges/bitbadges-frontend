/* eslint-disable react-hooks/exhaustive-deps */
import { StatusDoc } from 'bitbadgesjs-utils';
import { createContext, useContext, useState, useEffect } from 'react';
import { DesiredNumberType, getStatus } from '../api';
import { INFINITE_LOOP_MODE } from '../../constants';

export type StatusContextType = {
  status: StatusDoc<DesiredNumberType>,
  updateStatus: () => Promise<StatusDoc<DesiredNumberType>>
}

const StatusContext = createContext<StatusContextType>({
  status: {
    _legacyId: "status",
    block: {
      height: 0n,
      timestamp: 0n,
      txIndex: 0n,
    },
    nextCollectionId: 1n,
    gasPrice: 0,
    lastXGasAmounts: [],
    lastXGasLimits: [],
  },
  updateStatus: async () => {
    return {
      _legacyId: "status",
      block: {
        height: 0n,
        timestamp: 0n,
        txIndex: 0n,
      },
      nextCollectionId: 1n,
      gasPrice: 0,
      lastXGasAmounts: [],
      lastXGasLimits: [],
    }
  }
});

type Props = {
  children?: React.ReactNode
};

export const StatusContextProvider: React.FC<Props> = ({ children }) => {
  const [status, setStatus] = useState<StatusDoc<DesiredNumberType>>({
    _legacyId: 'status',
    block: {
      height: 0n,
      timestamp: 0n,
      txIndex: 0n,
    },
    nextCollectionId: 1n,
    gasPrice: 0,
    lastXGasAmounts: [],
    lastXGasLimits: [],
  });

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: status');
    async function fetchStatus() {
      const res = await getStatus();
      setStatus(res.status);
    }
    fetchStatus();
  }, [])

  const updateStatus = async () => {
    const res = await getStatus();
    setStatus(res.status);
    return res.status;
  }

  const statusContext: StatusContextType = {
    status,
    updateStatus
  };

  return <StatusContext.Provider value={statusContext}>
    {children}
  </StatusContext.Provider>;
}

export const useStatusContext = () => useContext(StatusContext);