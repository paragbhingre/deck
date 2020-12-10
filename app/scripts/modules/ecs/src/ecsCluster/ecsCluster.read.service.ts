import { module } from 'angular';

import { API } from '@spinnaker/core';
import { IEcsClusterDescriptor } from './IEcsCluster';
import {IEcsDescribeCluster} from "ecs/ecsCluster/IEcsDescribeCluster";

export class EcsClusterReader {
  public listClusters(): PromiseLike<IEcsClusterDescriptor[]> {
    return API.all('ecs').all('ecsClusters').getList();
  }

  public listDescribeClusters(account: string, region: string): PromiseLike<IEcsDescribeCluster[]> {
    if(account != null && region != null){
      return API.all('ecs').all('getEcsClusterDescriptions').all(account).all(region).getList();
    }
  }

}

export const ECS_CLUSTER_READ_SERVICE = 'spinnaker.ecs.ecsCluster.read.service';

module(ECS_CLUSTER_READ_SERVICE, []).service('ecsClusterReader', EcsClusterReader);
