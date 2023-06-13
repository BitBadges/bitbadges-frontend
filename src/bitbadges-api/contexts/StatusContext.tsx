/* eslint-disable react-hooks/exhaustive-deps */
import { StatusInfo } from 'bitbadgesjs-utils';
import { createContext, useContext, useState, useEffect } from 'react';
import { DesiredNumberType, getStatus } from '../api';

export type StatusContextType = {
  status: StatusInfo<DesiredNumberType>,
  updateStatus: () => Promise<void>,
}

const StatusContext = createContext<StatusContextType>({
  status: {
    _id: "status",
    block: {
      height: 0n,
      timestamp: 0n,
      txIndex: 0n,
    },
    nextCollectionId: 1n,
    gasPrice: 0n,
    lastXGasPrices: [],
  },
  updateStatus: async () => { }
});

type Props = {
  children?: React.ReactNode
};

export const StatusContextProvider: React.FC<Props> = ({ children }) => {
  const [status, setStatus] = useState<StatusInfo<DesiredNumberType>>({
    _id: 'status',
    block: {
      height: 0n,
      timestamp: 0n,
      txIndex: 0n,
    },
    nextCollectionId: 1n,
    gasPrice: 0n,
    lastXGasPrices: [],
  });

  useEffect(() => {
    async function fetchStatus() {
      const res = await getStatus();
      setStatus(res.status);
    }
    fetchStatus();
  }, [])

  const updateStatus = async () => {
    const res = await getStatus();
    setStatus(res.status);
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