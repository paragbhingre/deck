import React from 'react';
import { module } from 'angular';
import { react2angular } from 'react2angular';
import {IEcsCapacityProviderStrategy, IEcsServerGroupCommand} from '../../serverGroupConfiguration.service';
import { HelpField, withErrorBoundary } from  '@spinnaker/core';
import {IEcsAvailableCapacityProviders} from "ecs/ecsCluster/IEcsAvailableCapacityProviders";
import {Option} from "react-select";
import {TetheredSelect} from '@spinnaker/core';

export interface ICapacityProviderProps {
  command: IEcsServerGroupCommand;
  notifyAngular: (key: string, value: any) => void;
  configureCommand: (query: string) => PromiseLike<void>;
  capacityProviderState: () => void;
}

interface ICapacityProviderState {
  capacityProviderStrategy: IEcsCapacityProviderStrategy[],
  capacityProviderState: {},
  capacityProvidersAndStrategy: IEcsAvailableCapacityProviders[],
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

    const capacityProvidersAndStrategy = cmd && cmd.backingData && cmd.backingData.capacityProvidersAndStrategy ? cmd.backingData.capacityProvidersAndStrategy.filter(function (el) {
      return el.clusterName == (cmd.ecsClusterName);
    })[0] : [];

    const capacityProviderNamesValue = cmd && cmd.backingData && cmd.backingData.capacityProvidersAndStrategy ? cmd.backingData.capacityProvidersAndStrategy.filter(function (el) {
      return el.clusterName == (cmd.ecsClusterName);
    }).map(function (obj) {
      return obj.capacityProviders;
    })[0].map((capacityProviderNames) => {
      return { label: `${capacityProviderNames}`, value: capacityProviderNames };
    }) : [];

    cmd.launchType = '';

    this.state = {
      capacityProviderStrategy: cmd.capacityProviderStrategy.length > 0 ? cmd.capacityProviderStrategy : [],
      capacityProviderState: this.props.capacityProviderState,
      capacityProvidersAndStrategy: cmd.backingData && cmd.backingData.capacityProvidersAndStrategy ? cmd.backingData.capacityProvidersAndStrategy : [],
      capacityProviderNames: capacityProviderNamesValue,
      ecsClusterName: cmd.ecsClusterName,
      credentials: cmd.credentials,
      region: cmd.region,
      useDefaultCapacityProviders: cmd.choseDefaultCapacityProvider || cmd.capacityProviderStrategy && cmd.capacityProviderStrategy == 0,
    };

    if(this.state.useDefaultCapacityProviders){
      this.setState({capacityProviderStrategy : capacityProvidersAndStrategy.defaultCapacityProviderStrategy});
    }
  }

  /*public componentDidMount() {
    this.props.configureCommand('1').then(() => {
      this.setState({
        capacityProvidersAndStrategy: this.props.command.backingData.capacityProvidersAndStrategy,
      });
    });
  }*/

  private pushCapacityProviderStrategy = () => {
    const capacityProviderStrategy = this.state.capacityProviderStrategy;
    capacityProviderStrategy.push({ capacityProvider: '', base: null, weight: null});
    this.setState({ capacityProviderStrategy : capacityProviderStrategy });
  };

  private removeCapacityProviderStrategy = (index: number) => {
    const capacityProviderStrategy = this.state.capacityProviderStrategy;
    capacityProviderStrategy.splice(index, 1);
    //this.props.notifyAngular('capacityProviderStrategy', capacityProviderStrategy);
    this.setState({capacityProviderStrategy : capacityProviderStrategy });
  }

  private updateCapacityProviderName = (index: number, targetCapacityProviderName: string) => {
    const currentCapacityProviderStartegy = this.state.capacityProviderStrategy;
    const targetCapacityProviderStrategy = currentCapacityProviderStartegy[index];
    targetCapacityProviderStrategy.capacityProvider = targetCapacityProviderName.value;
    //this.props.notifyAngular('capacityProviderStrategy', currentCapacityProviderStartegy);
    this.setState({ capacityProviderStrategy: currentCapacityProviderStartegy });
  };

  private updateCapacityProviderBase = (index: number, targetCapacityProviderBase: number) => {
    const currentCapacityProviderStartegy = this.state.capacityProviderStrategy;
    const targetCapacityProviderStrategy = currentCapacityProviderStartegy[index];
    targetCapacityProviderStrategy.base = targetCapacityProviderBase;
    //this.props.notifyAngular('capacityProviderStrategy', currentCapacityProviderStartegy);
    this.setState({ capacityProviderStrategy: currentCapacityProviderStartegy });
  };

  private updateCapacityProviderWeight = (index: number, targetCapacityProviderWeight: number) => {
    const currentCapacityProviderStartegy = this.state.capacityProviderStrategy;
    const targetCapacityProviderStrategy = currentCapacityProviderStartegy[index];
    targetCapacityProviderStrategy.weight= targetCapacityProviderWeight;
    //this.props.notifyAngular('capacityProviderStrategy', currentCapacityProviderStartegy);
    this.setState({ capacityProviderStrategy: currentCapacityProviderStartegy });
  };

  private updateCapacityProviderType = (targetCapacityProviderType: string) => {
    let useDefaultCapacityProviders = this.state.useDefaultCapacityProviders;
    useDefaultCapacityProviders = targetCapacityProviderType == 'defaultCapacityProvider';
    this.setState({useDefaultCapacityProviders : useDefaultCapacityProviders});
    const data = (this.state.capacityProvidersAndStrategy).filter((el) => {
      return el.clusterName == (this.state.ecsClusterName)
    })[0];

    if (useDefaultCapacityProviders) {
      if (data.defaultCapacityProviderStrategy.length > 0)
       this.setState({capacityProviderStrategy : data.defaultCapacityProviderStrategy});
    } else if (!useDefaultCapacityProviders) {
      this.setState({capacityProviderStrategy : []});
      if (data.capacityProviders.length > 0) {
        this.setState({capacityProviderNames : data.capacityProviders.map((capacityProviderNames) => {
            return { label: `${capacityProviderNames}`, value: capacityProviderNames };
          })});
      }
    }
  };


  render(): React.ReactElement<CapacityProvider> {

    const updateCapacityProviderName = this.updateCapacityProviderName;
    const updateCapacityProviderBase = this.updateCapacityProviderBase;
    const updateCapacityProviderWeight = this.updateCapacityProviderWeight;
    const pushCapacityProviderStrategy = this.pushCapacityProviderStrategy;
    const removeCapacityProviderStrategy = this.removeCapacityProviderStrategy;
    const updateCapacityProviderType = this.updateCapacityProviderType;
    const capacityProviderNames = this.state.capacityProviderNames;
    const capacityProviderState = this.state.capacityProviderState;
    const capacityProviderStrategy = this.state.capacityProviderStrategy;
    const useDefaultCapacityProviders = this.state.useDefaultCapacityProviders;

    const capacityProviderInputs = capacityProviderStrategy ? capacityProviderStrategy.map(function (mapping, index) {
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
                  updateCapacityProviderName(index, e as string)
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
    }) : '';

    const newCapacityProviderStrategy =   this.state.ecsClusterName && this.state.credentials && this.state.region && !useDefaultCapacityProviders ? (
      <button className="btn btn-block btn-sm add-new" onClick={pushCapacityProviderStrategy}>
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
              checked={useDefaultCapacityProviders ? "checked" : false}
              onClick={() => updateCapacityProviderType("defaultCapacityProvider")}
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
              checked= {!useDefaultCapacityProviders ? "checked" : false}
              onClick={() => updateCapacityProviderType('customCapacityProvider')}
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
  react2angular(withErrorBoundary(CapacityProvider, 'capacityProviderReact'), ['command', 'notifyAngular', 'configureCommand', 'capacityProviderState']),
);
