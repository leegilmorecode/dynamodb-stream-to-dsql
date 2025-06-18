import * as cdk from 'aws-cdk-lib';
import * as dsql from 'aws-cdk-lib/aws-dsql';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

import { Construct } from 'constructs';
import { Stage } from '../types';
import { getRemovalPolicyFromStage } from '../utils';

export interface SweetOrdersStatefulStackProps extends cdk.StackProps {
  stateful: {
    tableName: string;
  };
  shared: {
    stage: Stage;
  };
}

export class SweetOrdersStatefulStack extends cdk.Stack {
  public readonly table: dynamodb.Table;
  public readonly cluster: dsql.CfnCluster;
  public readonly clusterId: string;

  constructor(
    scope: Construct,
    id: string,
    props: SweetOrdersStatefulStackProps,
  ) {
    super(scope, id, props);

    const {
      stateful: { tableName },
      shared: { stage },
    } = props;

    this.table = new dynamodb.Table(this, 'Table', {
      tableName,
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES, // ensure we have streams enabled
      removalPolicy: getRemovalPolicyFromStage(stage),
    });

    // we create the DSQL cluster
    this.cluster = new dsql.CfnCluster(this, 'DsqlCluster', {
      deletionProtectionEnabled: false,
      tags: [
        {
          key: 'Name',
          value: `dsql-cluster-${stage}`,
        },
      ],
    });
    this.cluster.applyRemovalPolicy(getRemovalPolicyFromStage(stage));

    // we set the clusterId so it is available for other stacks (stateless)
    this.clusterId = this.cluster.attrIdentifier;

    // we also push this to the outputs for easy reference
    new cdk.CfnOutput(this, 'ClusterId', {
      value: this.cluster.attrIdentifier,
      description: 'The cluster ID for the DSQL cluster',
      exportName: 'ClusterId',
    });
  }
}
