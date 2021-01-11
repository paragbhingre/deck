import React from 'react';
import { module } from 'angular';
import { react2angular } from 'react2angular';
import { HelpField, withErrorBoundary, TetheredSelect } from  '@spinnaker/core';
import {Option} from "react-select";
import {IEcsCapacityProviderStrategyItem, IEcsServerGroupCommand} from '../../serverGroupConfiguration.service';
import {IEcsAvailableCapacityProviders} from "../../../../ecsCluster/IEcsAvailableCapacityProviders";


export interface IEcsCapacityProviderProps {
  command: IEcsServerGroupCommand;
  notifyAngular: (key: string, value: any) => void;
  configureCommand: (query: string) => PromiseLike<void>;
  capacityProviderState: () => void;
}

interface IEcsCapacityProviderState {
  capacityProviderStrategy: IEcsCapacityProviderStrategyItem[],
  availableCapacityProviders: IEcsAvailableCapacityProviders[],
  capacityProviderForSelectedCluster: IEcsAvailableCapacityProviders,
  capacityProviderState: {},
  capacityProviderNames: {},
  ecsClusterName: string,
  credentials: string,
  region: string,
  useDefaultCapacityProviders: boolean,
  capacityProviderLoadedFlag: boolean;
}

class CapacityProvider extends React.Component<IEcsCapacityProviderProps, IEcsCapacityProviderState>{
  constructor(props: IEcsCapacityProviderProps) {
    super(props);
    const cmd = this.props.command;

    const targetCapacityProvider = cmd && cmd.backingData && cmd.backingData.availableCapacityProviders ? cmd.backingData.availableCapacityProviders.filter(function (el) {
      return el.clusterName == (cmd.ecsClusterName);
    })[0] : {} as IEcsAvailableCapacityProviders; // change so that [0] is not being used

    this.state = {
      capacityProviderState: this.props.capacityProviderState,
      availableCapacityProviders: cmd.backingData && cmd.backingData.availableCapacityProviders ? cmd.backingData.availableCapacityProviders : [],
      capacityProviderForSelectedCluster: targetCapacityProvider,
      capacityProviderNames: [],
      ecsClusterName: cmd.ecsClusterName,
      credentials: cmd.credentials,
      region: cmd.region,
      useDefaultCapacityProviders: cmd.useDefaultCapacityProviders || targetCapacityProvider.defaultCapacityProviderStrategy && targetCapacityProvider.defaultCapacityProviderStrategy.length > 0,
      capacityProviderStrategy: cmd.capacityProviderStrategy.length > 0 ? cmd.capacityProviderStrategy : [],
      capacityProviderLoadedFlag: false
    };
  }

public componentDidMount() {
    this.props.configureCommand('1').then(() => {
      const cmd = this.props.command;

      const targetCapacityProvider = cmd && cmd.backingData && cmd.backingData.availableCapacityProviders ? cmd.backingData.availableCapacityProviders.filter(function (el) {
        return el.clusterName == (cmd.ecsClusterName);
      })[0] : {} as IEcsAvailableCapacityProviders; // change so that [0] is not being used

      const defaultCapacityProviderStrategy = targetCapacityProvider && targetCapacityProvider.defaultCapacityProviderStrategy
      && targetCapacityProvider.defaultCapacityProviderStrategy.length > 0 ? targetCapacityProvider.defaultCapacityProviderStrategy : [];

      const useDefaultCapacityProviders = this.state.useDefaultCapacityProviders;

      this.setState({
        availableCapacityProviders: cmd.backingData.availableCapacityProviders,
        capacityProviderStrategy: useDefaultCapacityProviders && defaultCapacityProviderStrategy.length > 0 ? defaultCapacityProviderStrategy : this.state.capacityProviderStrategy,
        capacityProviderForSelectedCluster: targetCapacityProvider,
      });
      this.props.notifyAngular('capacityProviderStrategy', this.state.capacityProviderStrategy);
      this.props.notifyAngular('useDefaultCapacityProviders', this.state.useDefaultCapacityProviders);
      this.setState({capacityProviderLoadedFlag: true});
    });
  }

/*  componentDidUpdate() {
    if (this.state.ecsClusterName !== this.props.command.ecsClusterName) {
      this.setState({ecsClusterName: this.props.command.ecsClusterName});
    }
  }*/

  private addCapacityProviderStrategy = () => {
    const capacityProviderStrategy = this.state.capacityProviderStrategy;
    capacityProviderStrategy.push({ capacityProvider: '', base: null, weight: null});
    this.props.notifyAngular('capacityProviderStrategy', capacityProviderStrategy);
    this.setState({ capacityProviderStrategy : capacityProviderStrategy });
  };

  private removeCapacityProviderStrategy = (index: number) => {
    const capacityProviderStrategy = this.state.capacityProviderStrategy;
    capacityProviderStrategy.splice(index, 1);
    this.props.notifyAngular('capacityProviderStrategy', capacityProviderStrategy);
    this.setState({capacityProviderStrategy : capacityProviderStrategy });
  }

  private updateCapacityProviderName = (index: number, targetCapacityProviderName: any) => {
    const capacityProviderStrategy = this.state.capacityProviderStrategy;
    const targetCapacityProviderStrategy = capacityProviderStrategy[index];
    targetCapacityProviderStrategy.capacityProvider = targetCapacityProviderName.label;
    this.props.notifyAngular('capacityProviderStrategy', capacityProviderStrategy);
    this.setState({ capacityProviderStrategy: capacityProviderStrategy });
  };

  private updateCapacityProviderBase = (index: number, targetCapacityProviderBase: number) => {
    const capacityProviderStrategy = this.state.capacityProviderStrategy;
    const targetCapacityProviderStrategy = capacityProviderStrategy[index];
    targetCapacityProviderStrategy.base = targetCapacityProviderBase;
    this.props.notifyAngular('capacityProviderStrategy', capacityProviderStrategy);
    this.setState({ capacityProviderStrategy: capacityProviderStrategy });
  };

  private updateCapacityProviderWeight = (index: number, targetCapacityProviderWeight: number) => {
    const capacityProviderStrategy = this.state.capacityProviderStrategy;
    const targetCapacityProviderStrategy = capacityProviderStrategy[index];
    targetCapacityProviderStrategy.weight= targetCapacityProviderWeight;
    this.props.notifyAngular('capacityProviderStrategy', capacityProviderStrategy);
    this.setState({ capacityProviderStrategy: capacityProviderStrategy });
  };

  private updateCapacityProviderStrategy = (targetCapacityProviderType: string) => {
    const useDefaultCapacityProviders = targetCapacityProviderType == 'defaultCapacityProvider';
    this.setState({useDefaultCapacityProviders : useDefaultCapacityProviders});
    this.props.notifyAngular("useDefaultCapacityProviders", useDefaultCapacityProviders);

    if (useDefaultCapacityProviders) {
      this.setState({capacityProviderStrategy : []});
      this.props.notifyAngular('capacityProviderStrategy', []);
      if (this.state.capacityProviderForSelectedCluster.defaultCapacityProviderStrategy.length > 0)
       this.setState({capacityProviderStrategy : this.state.capacityProviderForSelectedCluster.defaultCapacityProviderStrategy});
       this.props.notifyAngular('capacityProviderStrategy', this.state.capacityProviderForSelectedCluster.defaultCapacityProviderStrategy );
    } else {
      this.setState({capacityProviderStrategy : []});
      this.props.notifyAngular('capacityProviderStrategy', []);
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
    const capacityProviderLoadedFlag = this.state.capacityProviderLoadedFlag;

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
        {capacityProviderLoadedFlag ? (
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
        </table>) : (
          <div className="load medium">
            <div className="message">Loading capacity providers...</div>
            <div className="bars">
              <div className="bar"></div>
              <div className="bar"></div>
              <div className="bar"></div>
            </div>
          </div>
          )}
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
