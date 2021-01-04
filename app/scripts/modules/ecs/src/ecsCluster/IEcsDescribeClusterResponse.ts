//TODO: Failures associated with describe cluster call is not being handled,
// need to implement in the future if failures are needed to be surfaced on the UI
export interface IEcsDescribeClusterResponse {
  activeServicesCount : number,
  attachments : IEcsAttachment[],
  attachmentsStatus : string,
  capacityProviders : string[],
  clusterArn : string,
  clusterName : string,
  defaultCapacityProviderStrategy : IEcsDefaultCapacityProviderStrategyItem[],
  pendingTasksCount : number,
  registeredContainerInstancesCount : number,
  runningTasksCount : number,
  settings : IEcsClusterSetting[],
  statistics : IEcsClusterStatistics[],
  status : string,
  tags : IEcsTag[],
}

export interface IEcsAttachment {
  details : IEcsAttachmentDetails[],
  id : string,
  Status : string,
  type : string
}

export interface IEcsAttachmentDetails {
  name : string,
  value : string
}

export interface IEcsDefaultCapacityProviderStrategyItem {
  base : number,
  capacityProvider : string,
  weight : number
}

export interface IEcsClusterSetting {
  name : string,
  value : string
}

export interface IEcsClusterStatistics {
  name : string,
  value : string
}

export interface IEcsTag {
  key : string,
  value : string
}
