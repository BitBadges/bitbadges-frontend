import {
  ClaimIntegrationPluginType,
  ClaimIntegrationPrivateParamsType,
  ClaimIntegrationPublicParamsType,
  ClaimIntegrationPublicStateType
} from 'bitbadgesjs-sdk';
import { ReactNode } from 'react';
import { DiscordPluginDetails, ProofOfAddressPluginDetails, TwitterPluginDetails } from './auth';
import { CodesPluginDetails } from './codes';
import { MinBalancesPluginDetails } from './minBalances';
import { NumUsesPluginDetails } from './numUses';
import { PasswordPluginDetails } from './passwords';
import { TransferTimesPluginDetails } from './transferTimes';
import { WhitelistPluginDetails } from './whitelist';
import { MustOwnPluginDetails } from './mustOwn';

interface ContextInfo {
  address: string;
  claimId: string;
}

interface IntegrationMetadata {
  name: string;
  description: string;
  image: string | ReactNode;
  createdBy: string;
  stateless: boolean;
  scoped: boolean;
  onChainCompatible: boolean;
}

export interface IntegrationPluginDetails<T extends ClaimIntegrationPluginType> {
  id: T;
  publicParams: ClaimIntegrationPublicParamsType<T>;
  privateParams: ClaimIntegrationPrivateParamsType<T>;
  publicState: ClaimIntegrationPublicStateType<T>;
  resetState?: boolean;
}

export interface ClaimIntegrationPlugin<P extends ClaimIntegrationPluginType = ClaimIntegrationPluginType> {
  id: P;
  metadata: IntegrationMetadata;
  createNode?: ({
    id,
    metadata,
    publicParams,
    privateParams,
    setParams,
    numClaims,
    disabled,
    setDisabled
  }: {
    id: P;
    metadata: IntegrationMetadata;
    publicParams: ClaimIntegrationPublicParamsType<P>;
    privateParams: ClaimIntegrationPrivateParamsType<P>;
    setParams: (publicParams: ClaimIntegrationPublicParamsType<P>, privateParams: ClaimIntegrationPrivateParamsType<P>) => void;
    numClaims: number;
    disabled: string;
    setDisabled: (disabled: string) => void;
  }) => ReactNode;
  inputNode?: ({
    id,
    metadata,
    publicParams,
    context,
    setCustomBody,
    publicState,
    disabled,
    setDisabled
  }: {
    id: P;
    metadata: IntegrationMetadata;
    publicParams: ClaimIntegrationPublicParamsType<P>;
    context: ContextInfo;
    setCustomBody: (customBody: object) => void;
    publicState: ClaimIntegrationPublicStateType<P>;
    disabled: string;
    setDisabled: (disabled: string) => void;
  }) => ReactNode;
  detailsString?: ({
    metadata,
    publicParams,
    id,
    publicState,
    unknownPublicState
  }: {
    metadata: IntegrationMetadata;
    publicParams: ClaimIntegrationPublicParamsType<P>;
    id: P;
    publicState: ClaimIntegrationPublicStateType<P>;
    unknownPublicState?: boolean;
  }) => string | ReactNode;
  detailsNode?: ({
    metadata,
    publicParams,
    id,
    publicState,
    unknownPublicState
  }: {
    metadata?: IntegrationMetadata;
    publicParams?: ClaimIntegrationPublicParamsType<P>;
    id: P;
    publicState?: ClaimIntegrationPublicStateType<P>;
    unknownPublicState?: boolean;
  }) => ReactNode;
  getBlankPublicParams: () => ClaimIntegrationPublicParamsType<P>;
  getBlankPrivateParams: () => ClaimIntegrationPrivateParamsType<P>;
  getBlankPublicState: () => ClaimIntegrationPublicStateType<P>;
  stateString: () => string;
}

export const getPlugin = <T extends ClaimIntegrationPluginType>(id: T): ClaimIntegrationPlugin<T> => {
  return Plugins[id];
};

export const getPluginDetails = <T extends ClaimIntegrationPluginType>(
  id: T,
  detailsArr: IntegrationPluginDetails<ClaimIntegrationPluginType>[]
): IntegrationPluginDetails<T> | undefined => {
  const plugin = detailsArr.find((details) => details.id === id);
  if (!plugin) return undefined;

  return plugin as IntegrationPluginDetails<T>;
};

export const getBlankPlugin = <T extends ClaimIntegrationPluginType>(id: T): IntegrationPluginDetails<T> => {
  return {
    id: id,
    publicParams: getPlugin(id).getBlankPublicParams(),
    privateParams: getPlugin(id).getBlankPrivateParams(),
    publicState: getPlugin(id).getBlankPublicState()
  };
};

export const getMaxUses = (plugins: IntegrationPluginDetails<ClaimIntegrationPluginType>[]) => {
  return getPluginDetails('numUses', plugins)?.publicParams.maxUses || 0;
};

export const Plugins: { [key in ClaimIntegrationPluginType]: ClaimIntegrationPlugin<key> } = {
  numUses: NumUsesPluginDetails,
  requiresProofOfAddress: ProofOfAddressPluginDetails,
  transferTimes: TransferTimesPluginDetails,
  whitelist: WhitelistPluginDetails,
  twitter: TwitterPluginDetails,
  discord: DiscordPluginDetails,
  codes: CodesPluginDetails,
  password: PasswordPluginDetails,
  greaterThanXBADGEBalance: MinBalancesPluginDetails,
  mustOwnBadges: MustOwnPluginDetails
};