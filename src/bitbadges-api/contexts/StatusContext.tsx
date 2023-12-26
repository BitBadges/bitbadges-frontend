/* eslint-disable react-hooks/exhaustive-deps */
import { StatusDoc } from 'bitbadgesjs-utils';
import { createContext, useContext, useState, useEffect } from 'react';
import { DesiredNumberType, getStatus } from '../api';
import { INFINITE_LOOP_MODE } from '../../constants';
import { notification } from 'antd';

export type StatusContextType = {
  status: StatusDoc<DesiredNumberType>,
  updateStatus: () => Promise<StatusDoc<DesiredNumberType>>

  maintenanceMode: boolean
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
  },
  maintenanceMode: false,
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

  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false);
  const [warned, setWarned] = useState<boolean>(false);

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: status');
    async function fetchStatus() {
      const res = await getStatus();
      setStatus(res.status);

      //If out of sync for > 2 minutes, show maintenance mode
      if (res.status.block.timestamp < Date.now() - 120000) {
        setMaintenanceMode(true);
        if (!warned) {
          notification.info({
            message: 'Out of Sync',
            description: `BitBadges is currently experiencing difficulties. It was last synced at ${new Date(Number(res.status.block.timestamp)).toLocaleString()}.
            This could be for multiple reasons like planned maintenance, heavy load, or an unexpected error. 
            You can still interact with the site, but any data after ${new Date(Number(res.status.block.timestamp)).toLocaleTimeString()} may not be shown.`,
            duration: 0,
          });

          setWarned(true);
        }
      } else {
        setMaintenanceMode(false);
        setWarned(false);
      }
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
    updateStatus,
    maintenanceMode,
  };

  return <StatusContext.Provider value={statusContext}>
    {children}
  </StatusContext.Provider>;
}

export const useStatusContext = () => useContext(StatusContext);