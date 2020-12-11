import { module } from 'angular';

import { API } from '@spinnaker/core';
import { IEcsClusterDescriptor } from './IEcsCluster';
import {IEcsDescribeCluster} from "./IEcsDescribeCluster";

export class EcsClusterReader {
  public listClusters(): PromiseLike<IEcsClusterDescriptor[]> {
    return API.all('ecs').all('ecsClusters').getList();
  }

  public listDescribeClusters(account: string, region: string): PromiseLike<IEcsDescribeCluster[]> {
    if(account != null && region != null) {
      return API.all('ecs').all('ecsClusterDescriptions').all(account).all(region).getList();
    }
    return null;
  }
}

export const ECS_CLUSTER_READ_SERVICE = 'spinnaker.ecs.ecsCluster.read.service';

module(ECS_CLUSTER_READ_SERVICE, []).service('ecsClusterReader', EcsClusterReader);
