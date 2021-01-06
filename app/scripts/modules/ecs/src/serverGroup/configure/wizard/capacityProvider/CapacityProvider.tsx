import React from 'react';
import { module } from 'angular';
import { react2angular } from 'react2angular';
import { HelpField, withErrorBoundary, TetheredSelect } from  '@spinnaker/core';
import {Option} from "react-select";
import {IEcsCapacityProviderStrategy, IEcsServerGroupCommand} from '../../serverGroupConfiguration.service';
import {IEcsAvailableCapacityProviders} from "../../../../ecsCluster/IEcsAvailableCapacityProviders";


export interface ICapacityProviderProps {
  command: IEcsServerGroupCommand;
  notifyAngular: (key: string, value: any) => void;
  configureCommand: (query: string) => PromiseLike<void>;
  capacityProviderState: () => void;
}

interface ICapacityProviderState {
  capacityProviderStrategy: IEcsCapacityProviderStrategy[],
  availableCapacityProviders: IEcsAvailableCapacityProviders[],
  capacityProviderForSelectedCluster: IEcsAvailableCapacityProviders,
  capacityProviderState: {},
  capacityProviderNames: {},
  ecsClusterName: string,
  credentials: string,
  region: string,
  useDefaultCapacityProviders: boolean
}

class CapacityProvider extends React.Component<ICapacityProviderProps, ICapacityProviderState>{
  constructor(props: ICapacityProviderProps) {
    super(props);
    const cmd = this.props.command;

    this.state = {
      capacityProviderState: this.props.capacityProviderState,
      availableCapacityProviders: cmd.backingData && cmd.backingData.availableCapacityProviders ? cmd.backingData.availableCapacityProviders : [],
      capacityProviderForSelectedCluster: {} as IEcsAvailableCapacityProviders,
      capacityProviderNames: [],
      ecsClusterName: cmd.ecsClusterName,
      credentials: cmd.credentials,
      region: cmd.region,
      useDefaultCapacityProviders: cmd.useDefaultCapacityProviders || cmd.capacityProviderStrategy && cmd.capacityProviderStrategy.length == 0,
      capacityProviderStrategy: cmd.capacityProviderStrategy.length > 0 ? cmd.capacityProviderStrategy : []
    };
  }

public componentDidMount() {
    this.props.configureCommand('1').then(() => {
      const cmd = this.props.command;

      const targetCapacityProvider = cmd && cmd.backingData && cmd.backingData.availableCapacityProviders ? cmd.backingData.availableCapacityProviders.filter(function (el) {
        return el.clusterName == (cmd.ecsClusterName);
      })[0] : {} as IEcsAvailableCapacityProviders;

      const defaultCapacityProviderStrategy = targetCapacityProvider && targetCapacityProvider.defaultCapacityProviderStrategy
      && targetCapacityProvider.defaultCapacityProviderStrategy.length > 0 ? targetCapacityProvider.defaultCapacityProviderStrategy : [];

      const useDefaultCapacityProviders = this.state.useDefaultCapacityProviders;

      this.setState({
        availableCapacityProviders: cmd.backingData.availableCapacityProviders,
        capacityProviderStrategy: useDefaultCapacityProviders && defaultCapacityProviderStrategy.length > 0 ? defaultCapacityProviderStrategy : this.state.capacityProviderStrategy,
        capacityProviderForSelectedCluster: targetCapacityProvider,
      });
      this.props.notifyAngular('capacityProviderStrategy', this.state.capacityProviderStrategy);
    });
  }

  private addCapacityProviderStrategy = () => {
    const capacityProviderStrategy = this.state.capacityProviderStrategy;
    capacityProviderStrategy.push({ capacityProvider: '', base: null, weight: null});
    this.setState({ capacityProviderStrategy : capacityProviderStrategy });
  };

  private removeCapacityProviderStrategy = (index: number) => {
    const capacityProviderStrategy = this.state.capacityProviderStrategy;
    capacityProviderStrategy.splice(index, 1);
    this.props.notifyAngular('capacityProviderStrategy', capacityProviderStrategy);
    this.setState({capacityProviderStrategy : capacityProviderStrategy });
  }

  private updateCapacityProviderName = (index: number, targetCapacityProviderName: any) => {
    const capacityProviderStartegy = this.state.capacityProviderStrategy;
    const targetCapacityProviderStrategy = capacityProviderStartegy[index];
    targetCapacityProviderStrategy.capacityProvider = targetCapacityProviderName.label;
    this.props.notifyAngular('capacityProviderStrategy', capacityProviderStartegy);
    this.setState({ capacityProviderStrategy: capacityProviderStartegy });
  };

  private updateCapacityProviderBase = (index: number, targetCapacityProviderBase: number) => {
    const capacityProviderStartegy = this.state.capacityProviderStrategy;
    const targetCapacityProviderStrategy = capacityProviderStartegy[index];
    targetCapacityProviderStrategy.base = targetCapacityProviderBase;
    this.props.notifyAngular('capacityProviderStrategy', capacityProviderStartegy);
    this.setState({ capacityProviderStrategy: capacityProviderStartegy });
  };

  private updateCapacityProviderWeight = (index: number, targetCapacityProviderWeight: number) => {
    const capacityProviderStartegy = this.state.capacityProviderStrategy;
    const targetCapacityProviderStrategy = capacityProviderStartegy[index];
    targetCapacityProviderStrategy.weight= targetCapacityProviderWeight;
    this.props.notifyAngular('capacityProviderStrategy', capacityProviderStartegy);
    this.setState({ capacityProviderStrategy: capacityProviderStartegy });
  };

  private updateCapacityProviderStrategy = (targetCapacityProviderType: string) => {
    const useDefaultCapacityProviders = targetCapacityProviderType == 'defaultCapacityProvider';
    this.setState({useDefaultCapacityProviders : useDefaultCapacityProviders});

    if (useDefaultCapacityProviders) {
      if (this.state.capacityProviderForSelectedCluster.defaultCapacityProviderStrategy.length > 0)
       this.setState({capacityProviderStrategy : this.state.capacityProviderForSelectedCluster.defaultCapacityProviderStrategy});
       this.props.notifyAngular('capacityProviderStrategy', this.state.capacityProviderForSelectedCluster.defaultCapacityProviderStrategy );
    } else if (!useDefaultCapacityProviders) {
      this.setState({capacityProviderStrategy : []});
      this.props.notifyAngular('capacityProviderStrategy', {});
      if (this.state.capacityProviderForSelectedCluster.capacityProviders.length > 0) {
        this.setState({capacityProviderNames : this.state.capacityProviderForSelectedCluster.capacityProviders.map((capacityProviderNames) => {
            return { label: `${capacityProviderNames}`, value: capacityProviderNames };
          })});
      }
    }

  };


  render(): React.ReactElement<CapacityProvider> {

    const updateCapacityProviderName = this.updateCapacityProviderName;
    const updateCapacityProviderBase = this.updateCapacityProviderBase;
    const updateCapacityProviderWeight = this.updateCapacityProviderWeight;
    const addCapacityProviderStrategy = this.addCapacityProviderStrategy;
    const removeCapacityProviderStrategy = this.removeCapacityProviderStrategy;
    const updateCapacityProviderStrategy = this.updateCapacityProviderStrategy;
    const capacityProviderStrategy = this.state.capacityProviderStrategy;
    const useDefaultCapacityProviders = this.state.useDefaultCapacityProviders;

    const capacityProviderNames = this.state.capacityProviderForSelectedCluster.capacityProviders ? this.state.capacityProviderForSelectedCluster.capacityProviders.map((capacityProviderNames) => {
      return { label: `${capacityProviderNames}`, value: capacityProviderNames };
    }) : [];

    const capacityProviderInputs = capacityProviderStrategy.length > 0 ? capacityProviderStrategy.map(function (mapping, index) {
      return (
        <tr key={index}>
          {useDefaultCapacityProviders ? (
            <td>
              <input
                type="string"
                className="form-control input-sm no-spel"
                required={true}
                value={mapping.capacityProvider}
                disabled={true}
              />
            </td>
          ) : (
            <td>
              <TetheredSelect
                placeholder="Select capacity provider"
                options={capacityProviderNames}
                value={mapping.capacityProvider}
                onChange={(e: Option) => {
                  updateCapacityProviderName(index, e as Option<string>)
                }}
                clearable={false}
              />
            </td>
          )}
          <td>
            <input
              disabled= {useDefaultCapacityProviders}
              type="number"
              className="form-control input-sm no-spel"
              required={true}
              value={mapping.base}
              onChange={(e) => updateCapacityProviderBase(index, e.target.valueAsNumber)}
            />
          </td>
          <td>
            <input
              disabled= {useDefaultCapacityProviders}
              type="number"
              className="form-control input-sm no-spel"
              required={true}
              value={mapping.weight}
              onChange={(e) => updateCapacityProviderWeight(index, e.target.valueAsNumber)}
            />
          </td>
          <td>
            <div className="form-control-static">
              <a className="btn-link sm-label" onClick={() => removeCapacityProviderStrategy(index)}>
                <span className="glyphicon glyphicon-trash" />
                <span className="sr-only">Remove</span>
              </a>
            </div>
          </td>
        </tr>
      );
    }) : useDefaultCapacityProviders && this.state.capacityProviderStrategy.length == 0 ?  ( <span style= {{ color : '#c00', position: 'absolute' }}>The cluster does not have a default capacity provider strategy defined. Set a default capacity provider strategy or use a custom strategy.</span> )
    : '';

    const newCapacityProviderStrategy =   this.state.ecsClusterName && this.state.credentials && this.state.region && !useDefaultCapacityProviders ? (
      <button className="btn btn-block btn-sm add-new" onClick={addCapacityProviderStrategy}>
        <span className="glyphicon glyphicon-plus-sign" />
        Add New Capacity Provider
    </button>
    ) : '';


    return (
      <div>
      <div className="sm-label-left">
        <b>Capacity Provider Strategy</b>
        <HelpField id="ecs.capacityProviderStrategy" />
      </div>
        <div className="radio">
          <label>
            <input
              data-test-id="CapacityProviders.default"
              type="radio"
              checked={useDefaultCapacityProviders}
              onClick={() => updateCapacityProviderStrategy("defaultCapacityProvider")}
              id="computeOptionsLaunchType1"
            />
            Use cluster default
          </label>
        </div>
        <div className="radio">
          <label>
            <input
              data-test-id="CapacityProviders.custom"
              type="radio"
              checked= {!useDefaultCapacityProviders}
              onClick={() => updateCapacityProviderStrategy('customCapacityProvider')}
              id="computeOptionsCapacityProviders2"
            />
            Use custom (Advanced)
          </label>
        </div>

        <table className="table table-condensed packed tags">
          <thead>
          <th style={{ width: '50%' }}> Provider name <HelpField id="ecs.capacityProviderName" /></th>
          <th style={{ width: '25%' }}> Base <HelpField id="ecs.capacityProviderBase" /></th>
          <th style={{ width: '25%' }}>Weight <HelpField id="ecs.capacityProviderWeight" /></th>
          </thead>
          <tbody>
          {capacityProviderInputs}
          </tbody>
          <tfoot>
          <tr>
            <td colSpan={4}>{newCapacityProviderStrategy}</td>
          </tr>
          </tfoot>
        </table>

      </div>

    );
  }
}

export const CAPACITY_PROVIDER_REACT = 'spinnaker.ecs.serverGroup.configure.wizard.capacityProvider.react';
module(CAPACITY_PROVIDER_REACT, []).component(
  'capacityProviderReact',
  react2angular(withErrorBoundary(CapacityProvider, 'capacityProviderReact'), [
    'command',
    'notifyAngular',
    'configureCommand',
    'capacityProviderState']),
);
