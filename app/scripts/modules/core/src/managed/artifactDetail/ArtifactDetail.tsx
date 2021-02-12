import React, { memo, useMemo } from 'react';
import classNames from 'classnames';
import { useRouter } from '@uirouter/react';
import { DateTime } from 'luxon';

import {
  IManagedArtifactSummary,
  IManagedArtifactVersion,
  IManagedEnvironmentSummary,
  IManagedResourceSummary,
  IManagedArtifactVersionEnvironment,
} from '../../domain';
import { Application } from '../../application';
import { useEventListener, Markdown, CollapsibleElement } from '../../presentation';

import { AbsoluteTimestamp } from '../AbsoluteTimestamp';
import { ArtifactDetailHeader } from './ArtifactDetailHeader';
import { ManagedResourceObject } from '../ManagedResourceObject';
import { EnvironmentRow } from '../environment/EnvironmentRow';
import { PreDeploymentRow } from './PreDeploymentRow';
import { PreDeploymentStepCard } from './PreDeploymentStepCard';
import { VersionStateCard } from './VersionStateCard';
import { StatusCard } from '../StatusCard';
import { Button } from '../Button';
import { showPinArtifactModal } from './PinArtifactModal';
import { showUnpinArtifactModal } from './UnpinArtifactModal';
import { showMarkArtifactAsBadModal } from './MarkArtifactAsBadModal';

import { ConstraintCard } from './constraints/ConstraintCard';
import { isConstraintSupported } from './constraints/constraintRegistry';
import { isResourceKindSupported } from '../resources/resourceRegistry';
import { VerificationCard } from './verifications/VerificationCard';

import { useLogEvent } from '../utils/logging';
import './ArtifactDetail.less';

const SUPPORTED_PRE_DEPLOYMENT_TYPES = ['BUILD', 'BAKE'];

function shouldDisplayResource(reference: string, resource: IManagedResourceSummary) {
  return isResourceKindSupported(resource.kind) && reference === resource.artifact?.reference;
}

type IEnvironmentCardsProps = Pick<
  IArtifactDetailProps,
  'application' | 'reference' | 'version' | 'allVersions' | 'resourcesByEnvironment'
> & {
  environment: IManagedArtifactVersionEnvironment;
  pinnedVersion: string;
};

const LOG_CATEGORY = 'Environments - artifact details';

const EnvironmentCards = memo(
  ({
    application,
    environment,
    reference,
    version: versionDetails,
    allVersions,
    pinnedVersion,
    resourcesByEnvironment,
  }: IEnvironmentCardsProps) => {
    const {
      name: environmentName,
      state,
      deployedAt,
      replacedAt,
      replacedBy,
      pinned,
      vetoed,
      statefulConstraints,
      statelessConstraints,
      compareLink,
    } = environment;
    const {
      stateService: { go },
    } = useRouter();

    const logEvent = useLogEvent(LOG_CATEGORY);

    const differentVersionPinnedCard = pinnedVersion &&
      pinnedVersion !== versionDetails.version &&
      !['vetoed', 'skipped'].includes(state) && (
        <StatusCard
          iconName="cloudWaiting"
          appearance="warning"
          background={true}
          title="A different version is pinned here"
          actions={<Button onClick={() => go('.', { version: pinnedVersion })}>See version</Button>}
        />
      );

    const pinnedCard = pinned && (
      <StatusCard
        iconName="pin"
        appearance="warning"
        background={true}
        timestamp={pinned?.at ? DateTime.fromISO(pinned.at) : null}
        title={
          <span className="sp-group-margin-xs-xaxis">
            <span>Pinned</span> <span className="text-regular">—</span>{' '}
            <span className="text-regular">by {pinned.by}</span>
          </span>
        }
        description={pinned.comment && <Markdown message={pinned.comment} tag="span" />}
        actions={
          <Button
            iconName="unpin"
            onClick={() =>
              showUnpinArtifactModal({
                application,
                reference,
                version: versionDetails,
                resourcesByEnvironment,
                environment: environmentName,
              }).then(({ status }) => status === 'CLOSED' && application.getDataSource('environments').refresh())
            }
          >
            Unpin
          </Button>
        }
      />
    );

    return (
      <>
        {differentVersionPinnedCard}
        {pinnedCard}
        <VersionStateCard
          key="versionStateCard"
          state={state}
          deployedAt={deployedAt}
          replacedAt={replacedAt}
          replacedBy={replacedBy}
          vetoed={vetoed}
          compareLink={compareLink}
          allVersions={allVersions}
          logClick={(action) => logEvent({ action, label: `${environmentName}:${reference}` })}
        />
        {environment.verifications?.map((verification) => (
          <VerificationCard
            key={verification.id}
            verification={verification}
            wasHalted={environment.state === 'skipped'}
            logClick={(action) => logEvent({ action, label: `${environmentName}:${reference}` })}
          />
        ))}
        {[...(statelessConstraints || []), ...(statefulConstraints || [])]
          .filter(({ type }) => isConstraintSupported(type))
          .map((constraint) => (
            <ConstraintCard
              key={constraint.type}
              application={application}
              environment={environment}
              reference={reference}
              version={versionDetails.version}
              constraint={constraint}
            />
          ))}
      </>
    );
  },
);

const VersionMetadataItem = ({ label, value }: { label: string; value: JSX.Element | string }) => (
  <div className="flex-container-h sp-margin-xs-bottom">
    <div className="metadata-label text-bold text-right sp-margin-l-right flex-none">{label}</div>
    <CollapsibleElement maxHeight={150}>{value}</CollapsibleElement>
  </div>
);

export interface IArtifactDetailProps {
  application: Application;
  name: string;
  reference: string;
  version: IManagedArtifactVersion;
  allVersions: IManagedArtifactSummary['versions'];
  allEnvironments: IManagedEnvironmentSummary[];
  showReferenceNames: boolean;
  resourcesByEnvironment: { [environment: string]: IManagedResourceSummary[] };
  onRequestClose: () => any;
}

export const ArtifactDetail = ({
  application,
  reference,
  version: versionDetails,
  allVersions,
  allEnvironments,
  showReferenceNames,
  resourcesByEnvironment,
  onRequestClose,
}: IArtifactDetailProps) => {
  const { environments, lifecycleSteps, git, createdAt } = versionDetails;
  const logEvent = useLogEvent(LOG_CATEGORY);

  const keydownCallback = ({ keyCode }: KeyboardEvent) => {
    if (keyCode === 27 /* esc */) {
      onRequestClose();
    }
  };
  useEventListener(document, 'keydown', keydownCallback);

  const isPinnedEverywhere = environments.every(({ pinned }) => pinned);
  const isBadEverywhere = environments.every(({ state }) => state === 'vetoed');
  const createdAtTimestamp = useMemo(() => createdAt && DateTime.fromISO(createdAt), [createdAt]);

  // These steps come in with chronological ordering, but we need reverse-chronological orddering for display
  const preDeploymentSteps = lifecycleSteps
    ?.filter(({ scope, type }) => scope === 'PRE_DEPLOYMENT' && SUPPORTED_PRE_DEPLOYMENT_TYPES.includes(type))
    .reverse();

  return (
    <>
      <ArtifactDetailHeader
        reference={showReferenceNames ? reference : null}
        version={versionDetails}
        onRequestClose={onRequestClose}
      />

      <div className="ArtifactDetail flex-grow">
        <div className="flex-container-h top sp-margin-xl-bottom">
          <div className="flex-container-h sp-group-margin-s-xaxis flex-none">
            <Button
              iconName="pin"
              appearance="primary"
              disabled={isPinnedEverywhere || isBadEverywhere}
              onClick={() =>
                showPinArtifactModal({ application, reference, version: versionDetails, resourcesByEnvironment }).then(
                  ({ status }) => status === 'CLOSED' && application.getDataSource('environments').refresh(),
                )
              }
            >
              Pin...
            </Button>
            <Button
              iconName="artifactBad"
              appearance="primary"
              disabled={isPinnedEverywhere || isBadEverywhere}
              onClick={() =>
                showMarkArtifactAsBadModal({
                  application,
                  reference,
                  version: versionDetails,
                  resourcesByEnvironment,
                }).then(({ status }) => status === 'CLOSED' && application.getDataSource('environments').refresh())
              }
            >
              Mark as bad...
            </Button>
          </div>
          <div className="detail-section-right flex-container-v flex-pull-right sp-margin-l-right">
            {createdAtTimestamp && (
              <VersionMetadataItem
                label="Created"
                value={<AbsoluteTimestamp timestamp={createdAtTimestamp} clickToCopy={true} />}
              />
            )}
            {git?.author && <VersionMetadataItem label="Author" value={git.author} />}
            {git?.pullRequest?.number && git?.pullRequest?.url && (
              <VersionMetadataItem
                label="Pull Request"
                value={
                  <a
                    href={git.pullRequest.url}
                    onClick={() => logEvent({ action: 'PR link clicked', label: reference })}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    #{git.pullRequest.number}
                  </a>
                }
              />
            )}
            {git?.commitInfo && (
              <>
                <VersionMetadataItem
                  label="Commit"
                  value={
                    <a
                      href={git.commitInfo.link}
                      onClick={() => logEvent({ action: 'Commit link clicked', label: reference })}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {git.commitInfo.sha.substring(0, 7)}
                    </a>
                  }
                />
                <VersionMetadataItem
                  label="Message"
                  value={
                    <span style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                      <Markdown message={git.commitInfo.message} tag="span" />
                    </span>
                  }
                />
              </>
            )}
            {git?.branch && <VersionMetadataItem label="Branch" value={git.branch} />}
            {git?.repo && <VersionMetadataItem label="Repository" value={`${git.project}/${git.repo.name}`} />}
          </div>
        </div>
        {environments.map((environment) => {
          const { name: environmentName, state } = environment;

          const { pinnedVersion } = allEnvironments
            .find(({ name }) => name === environmentName)
            .artifacts.find(({ reference: referenceToMatch }) => referenceToMatch === reference);

          return (
            <EnvironmentRow
              key={environmentName}
              name={environmentName}
              resources={resourcesByEnvironment[environmentName]}
            >
              <EnvironmentCards
                application={application}
                environment={environment}
                reference={reference}
                version={versionDetails}
                allVersions={allVersions}
                pinnedVersion={pinnedVersion}
                resourcesByEnvironment={resourcesByEnvironment}
              />
              <div className="resources-section">
                {resourcesByEnvironment[environmentName]
                  .filter((resource) => shouldDisplayResource(reference, resource))
                  .sort((a, b) => `${a.kind}${a.displayName}`.localeCompare(`${b.kind}${b.displayName}`))
                  .map((resource) => (
                    <div key={resource.id} className="flex-container-h middle">
                      {state === 'deploying' && (
                        <div
                          className={classNames(
                            'resource-badge flex-container-h center middle sp-margin-s-right',
                            state,
                          )}
                        />
                      )}
                      <ManagedResourceObject
                        application={application}
                        key={resource.id}
                        resource={resource}
                        depth={state === 'deploying' ? 0 : 1}
                      />
                    </div>
                  ))}
              </div>
            </EnvironmentRow>
          );
        })}
        {preDeploymentSteps && preDeploymentSteps.length > 0 && (
          <PreDeploymentRow>
            {preDeploymentSteps.map((step) => (
              <PreDeploymentStepCard key={step.id} step={step} application={application} reference={reference} />
            ))}
          </PreDeploymentRow>
        )}
      </div>
    </>
  );
};