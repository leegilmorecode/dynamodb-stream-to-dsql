#!/usr/bin/env node

import 'source-map-support/register';

import * as cdk from 'aws-cdk-lib';

import { Stage } from 'types';
import { getEnvironmentConfig } from '../app-config';
import { SweetOrdersStatefulStack } from '../stateful/stateful';
import { SweetOrdersStatelessStack } from '../stateless/stateless';
import { getStage } from '../utils';

const stage = getStage(process.env.STAGE as Stage) as Stage;
const appConfig = getEnvironmentConfig(stage);

const app = new cdk.App();

const statefulStack = new SweetOrdersStatefulStack(
  app,
  'SweetOrdersStatefulStack',
  {
    env: appConfig.env,
    stateful: appConfig.stateful,
    shared: appConfig.shared,
  },
);
new SweetOrdersStatelessStack(app, 'SweetOrdersStatelessStack', {
  env: appConfig.env,
  shared: appConfig.shared,
  stateless: appConfig.stateless,
  table: statefulStack.table,
  clusterId: statefulStack.clusterId,
});
