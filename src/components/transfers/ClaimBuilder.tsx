import { Switch } from 'antd';
import { ClaimIntegrationPluginType, IntegrationPluginDetails } from 'bitbadgesjs-sdk';
import { useCallback, useEffect, useState } from 'react';
import { Plugins, getBlankPlugin, getPlugin, getPluginDetails } from '../../integrations/integrations';
import { PluginTextDisplay } from '../collection-page/transferability/DetailsCard';
import { ClaimCriteriaDisplay, generateCodesFromSeed } from '../collection-page/transferability/OffChainTransferabilityTab';
import { ErrDisplay } from '../common/ErrDisplay';
import { TableRow } from '../display/TableRow';
import { RadioGroup } from '../inputs/Selects';
import { Tabs } from '../navigation/Tabs';
import { OffChainClaim } from '../tx-timelines/step-items/OffChainBalancesStepItem';

export const ClaimBuilder = ({
  plugins,
  setPlugins,
  offChainSelect,
  setDisabled,
  isUpdate,
  claim,
  type
}: {
  plugins: IntegrationPluginDetails<ClaimIntegrationPluginType>[];
  setPlugins: (plugins: IntegrationPluginDetails<ClaimIntegrationPluginType>[]) => void;
  offChainSelect?: boolean;
  setDisabled: (disabled: boolean) => void;
  isUpdate: boolean;
  claim: Readonly<OffChainClaim<bigint>>;
  type: 'balances' | 'list';
}) => {
  const [disabledMap, setDisabledMap] = useState<{ [key: string]: string }>({});
  const [tab, setTab] = useState('criteria');

  useEffect(() => {
    setDisabled(Object.keys(disabledMap).some((x) => disabledMap[x] && plugins.find((y) => y.id == x)) || plugins.length === 0);
  }, [disabledMap, plugins]);

  const disabledPluginId = Object.keys(disabledMap).find((x) => disabledMap[x]);
  const disabledMessage = disabledPluginId ? disabledMap[disabledPluginId] : undefined;

  return (
    <>
      <div className="flex-center">
        {' '}
        <Tabs
          type="underline"
          tab={tab}
          setTab={setTab}
          tabInfo={[
            {
              content: 'Criteria',
              key: 'criteria'
            },
            {
              content: 'Preview',
              key: 'preview'
            }
          ]}
        />
      </div>
      {tab == 'preview' && (
        <>
          <div className="p-4 secondary-text text-center">This is just a preview. State data may not be accurate.</div>
          <div className="p-4">
            <ClaimCriteriaDisplay plugins={plugins} />
          </div>
          <br />
          <div className="flex-center">
            <button className="landing-button" disabled={true}>
              Claim
            </button>
          </div>
        </>
      )}
      {tab == 'criteria' && (
        <>
          {disabledMessage && <ErrDisplay err={disabledMessage} />}
          <br />
          {Object.keys(Plugins).map((_id: string) => {
            const id = _id as ClaimIntegrationPluginType;
            const pluginInstance = getPlugin(id);
            if (!pluginInstance.metadata.onChainCompatible && !offChainSelect) return null;
            if (pluginInstance.id === 'api') return null;

            return (
              <ClaimBuilderRow
                isUpdate={isUpdate}
                key={id}
                disabledMap={disabledMap}
                id={id}
                plugins={plugins}
                setPlugins={setPlugins}
                setDisabledMap={setDisabledMap}
                claim={claim}
                type={type}
              />
            );
          })}
          <div className="text-center">
            <b>Custom Queries</b>
          </div>
          <div className="text-center">
            <ErrDisplay warning err="Always use third party tools at your own risk!" />
          </div>
          <br />
          <CreateNodeFromPlugin
            id="api"
            plugins={plugins}
            disabledMap={disabledMap}
            setDisabledMap={setDisabledMap}
            isUpdate={isUpdate}
            type={type}
            claim={claim}
            setPlugins={setPlugins}
          />
        </>
      )}
    </>
  );
};

const CreateNodeFromPlugin = ({
  id,
  plugins,
  disabledMap,
  setDisabledMap,
  isUpdate,
  type,
  claim,
  setPlugins
}: {
  id: ClaimIntegrationPluginType;
  plugins: IntegrationPluginDetails<ClaimIntegrationPluginType>[];
  disabledMap: { [key: string]: string };
  setDisabledMap: (disabledMap: { [key: string]: string }) => void;
  isUpdate?: boolean;
  type: 'balances' | 'list';
  claim: Readonly<OffChainClaim<bigint>>;
  setPlugins: (plugins: IntegrationPluginDetails<ClaimIntegrationPluginType>[]) => void;
}) => {
  const pluginInstance = getPlugin(id);
  const currPlugin = getPluginDetails(id, plugins);

  const setDisabled = useCallback((disabled: string) => {
    setDisabledMap({ ...disabledMap, [id]: disabled });
  }, []);

  if (!pluginInstance) return <></>;
  if (!pluginInstance.createNode) return null;

  return (
    <>
      {pluginInstance?.createNode?.({
        disabled: disabledMap[id],
        setDisabled,
        claim: claim,
        numClaims: getPluginDetails('numUses', plugins)?.publicParams?.maxUses || 0,
        id: id,
        metadata: pluginInstance.metadata,
        privateParams: currPlugin?.privateParams ?? getBlankPlugin(id).privateParams,
        publicParams: currPlugin?.publicParams ?? getBlankPlugin(id).publicParams,
        type,
        isUpdate: !!isUpdate,
        setParams: (publicParams, privateParams) => {
          const newPlugins = plugins;
          if (newPlugins.find((x) => x.id === id)) {
            newPlugins.find((x) => x.id === id)!.publicParams = publicParams;
            newPlugins.find((x) => x.id === id)!.privateParams = privateParams;
          } else {
            newPlugins.push({
              ...getBlankPlugin(id),
              publicParams: publicParams,
              privateParams: privateParams
            });
          }

          if (getPluginDetails('api', plugins)?.publicParams.apiCalls.length === 0) {
            setPlugins(newPlugins.filter((x) => x.id !== 'api'));
          } else {
            setPlugins(newPlugins);
          }
        }
      })}
    </>
  );
};

const ClaimBuilderRow = ({
  id,
  plugins,
  setPlugins,
  disabledMap,
  setDisabledMap,
  isUpdate,
  claim,
  type
}: {
  id: ClaimIntegrationPluginType;
  plugins: IntegrationPluginDetails<ClaimIntegrationPluginType>[];
  setPlugins: (plugins: IntegrationPluginDetails<ClaimIntegrationPluginType>[]) => void;
  disabledMap: { [key: string]: string };
  setDisabledMap: (disabledMap: { [key: string]: string }) => void;
  isUpdate?: boolean;
  claim: Readonly<OffChainClaim<bigint>>;
  type: 'balances' | 'list';
}) => {
  const pluginInstance = getPlugin(id);
  const currPlugin = getPluginDetails(id, plugins);

  if (!pluginInstance) return <></>;
  if (!pluginInstance.createNode) return null;

  const usedClaimNumbers: number[] = [];
  const numUsesPlugin = getPluginDetails('numUses', plugins);
  if (!numUsesPlugin?.resetState) {
    for (const [, val] of Object.entries(numUsesPlugin?.publicState.claimedUsers ?? {})) {
      usedClaimNumbers.push(...val.map((x) => x + 1));
    }
    usedClaimNumbers.sort((a, b) => a - b);
  }

  const usedCodeClaimNumbers: number[] = [];
  const codesPlugin = getPluginDetails('codes', plugins);
  if (codesPlugin && !codesPlugin.resetState) {
    const usedCodes = codesPlugin.publicState.usedCodes ?? [];
    const codes = codesPlugin.privateParams.seedCode
      ? generateCodesFromSeed(codesPlugin.privateParams.seedCode, codesPlugin.publicParams.numCodes)
      : codesPlugin.privateParams.codes;

    for (let i = 0; i < codes.length; i++) {
      if (usedCodes.includes(codes[i])) {
        usedCodeClaimNumbers.push(i + 1);
      }
    }

    usedCodeClaimNumbers.sort((a, b) => a - b);
  }

  let inconsistentClaimNumbers = [];
  let inconsistentStr = '';
  for (let i = 0; i < usedClaimNumbers.length; i++) {
    if (!usedCodeClaimNumbers.includes(usedClaimNumbers[i])) {
      inconsistentClaimNumbers.push(usedClaimNumbers[i]);
    }

    inconsistentStr = inconsistentStr || `claim #${usedClaimNumbers[i]} is used but code #${usedClaimNumbers[i]} is not.`;
  }

  for (let i = 0; i < usedCodeClaimNumbers.length; i++) {
    if (!usedClaimNumbers.includes(usedCodeClaimNumbers[i])) {
      inconsistentClaimNumbers.push(usedCodeClaimNumbers[i]);
    }

    inconsistentStr = inconsistentStr || `code #${usedCodeClaimNumbers[i]} is used but claim #${usedCodeClaimNumbers[i]} is not.`;
  }

  return (
    <div key={id}>
      <TableRow
        labelSpan={16}
        valueSpan={8}
        label={<PluginTextDisplay pluginId={id} text={<b>{pluginInstance.metadata.name}</b>} />}
        value={
          <Switch
            checked={!!currPlugin}
            disabled={!!currPlugin && id == 'numUses'}
            onChange={(checked) => {
              if (checked) {
                setPlugins([
                  ...plugins,
                  {
                    ...getBlankPlugin(id),
                    resetState: isUpdate ? false : true
                  }
                ]);
              } else {
                setPlugins(plugins.filter((x) => x.id !== id));
                setDisabledMap({ ...disabledMap, [id]: '' });
              }
            }}
          />
        }
      />

      <TableRow
        labelSpan={24}
        valueSpan={0}
        label={
          <div className="secondary-text" style={{ fontSize: 12 }}>
            {pluginInstance.metadata.description}
          </div>
        }
        value={<></>}
      />
      {!!currPlugin && isUpdate && !pluginInstance.metadata.stateless && (
        <div className="flex-center flex-column mb-2">
          <RadioGroup
            value={currPlugin.resetState ? 'yes' : 'no'}
            onChange={(e) => {
              setPlugins(
                plugins.map((x) => {
                  if (x.id === id) {
                    return {
                      ...x,
                      resetState: e === 'yes'
                    };
                  }
                  return x;
                })
              );
            }}
            options={[
              {
                label: 'Reset State',
                value: 'yes'
              },
              {
                label: 'Keep State',
                value: 'no'
              }
            ]}
          />
          <div className="secondary-text text-center mt-2">
            Reset the state?{' '}
            {pluginInstance.stateString({
              privateParams: currPlugin.privateParams,
              publicParams: currPlugin.publicParams,
              publicState: currPlugin.publicState,
              unknownPublicState: false,
              resetState: getPluginDetails(id, plugins)?.resetState
            })}
          </div>
        </div>
      )}
      {currPlugin && isUpdate && (
        <>
          {(currPlugin.id === 'numUses' || currPlugin.id === 'codes') && (
            <>
              {inconsistentClaimNumbers.length > 0 && (
                <div className="secondary-text mb-1">
                  <ErrDisplay
                    warning
                    err={`The current update will result in inconsistent claim numbers due to the code # assign method. ${inconsistentClaimNumbers.length} claims inconsistent which may result in unexpected behavior. For example, ${inconsistentStr}`}
                  />
                </div>
              )}
            </>
          )}
        </>
      )}
      {currPlugin && <CreateNodeFromPlugin {...{ id, plugins, disabledMap, setDisabledMap, isUpdate, type, claim, setPlugins }} />}
      <br />
    </div>
  );
};
