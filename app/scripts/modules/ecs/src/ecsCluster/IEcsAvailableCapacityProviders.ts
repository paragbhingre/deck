export interface IEcsAvailableCapacityProviders {
  capacityProviders : string[],
  clusterArn : string,
  clusterName : string,
  defaultCapacityProviderStrategy : IEcsDefaultCapacityProviderStrategyItem[],
}

export interface IEcsDefaultCapacityProviderStrategyItem {
  base : number,
  capacityProvider : string,
  weight : number
}
