import * as cdk from 'aws-cdk-lib';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import type * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodeLambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cr from 'aws-cdk-lib/custom-resources';
import * as path from 'node:path';

import { DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Construct } from 'constructs';
import { Stage } from '../types';
import { getRemovalPolicyFromStage } from '../utils';

export interface SweetOrdersStatelessStackProps extends cdk.StackProps {
  shared: {
    stage: Stage;
    serviceName: string;
    metricNamespace: string;
    logging: {
      logLevel: 'DEBUG' | 'INFO' | 'ERROR';
      logEvent: 'true' | 'false';
    };
  };
  env: {
    account: string;
    region: string;
  };
  stateless: {
    runtimes: lambda.Runtime;
  };
  table: dynamodb.Table;
  clusterId: string;
}

export class SweetOrdersStatelessStack extends cdk.Stack {
  private table: dynamodb.Table;
  private api: apigw.RestApi;
  private managementApi: apigw.RestApi;

  constructor(
    scope: Construct,
    id: string,
    props: SweetOrdersStatelessStackProps,
  ) {
    super(scope, id, props);

    const {
      shared: {
        stage,
        serviceName,
        metricNamespace,
        logging: { logLevel, logEvent },
      },
      env: { account, region },
      stateless: { runtimes },
      table,
      clusterId,
    } = props;

    this.table = table;

    const lambdaConfig = {
      LOG_LEVEL: logLevel,
      POWERTOOLS_LOGGER_LOG_EVENT: logEvent,
      POWERTOOLS_LOGGER_SAMPLE_RATE: '1',
      POWERTOOLS_TRACE_ENABLED: 'enabled',
      POWERTOOLS_TRACER_CAPTURE_HTTPS_REQUESTS: 'true',
      POWERTOOLS_SERVICE_NAME: serviceName,
      POWERTOOLS_TRACER_CAPTURE_RESPONSE: 'true',
      POWERTOOLS_METRICS_NAMESPACE: metricNamespace,
    };

    // Create Lambda function for creating DSQL tables
    const createTablesLambda: nodeLambda.NodejsFunction =
      new nodeLambda.NodejsFunction(this, 'CreateTablesLambda', {
        functionName: `create-tables-${stage}`,
        runtime: runtimes,
        timeout: cdk.Duration.seconds(60),
        entry: path.join(
          __dirname,
          './src/adapters/primary/create-tables/create-tables.adapter.ts',
        ),
        memorySize: 1024,
        description: 'Create DSQL Tables Lambda',
        logRetention: logs.RetentionDays.ONE_DAY,
        handler: 'handler',
        architecture: lambda.Architecture.ARM_64,
        tracing: lambda.Tracing.ACTIVE,
        environment: {
          ...lambdaConfig,
          STAGE: stage,
          REGION: region,
          CLUSTER_ID: clusterId,
          DATABASE_USER: 'admin',
          DATABASE_PORT: '5432',
          DATABASE_LOGGING: 'true',
        },
        bundling: {
          minify: true,
          bundleAwsSDK: true, // bundle the AWS SDK as @aws-sdk/dsql-signer is not available yet
        },
      });
    createTablesLambda.applyRemovalPolicy(getRemovalPolicyFromStage(stage));

    // Create custom resource to create tables
    new cr.AwsCustomResource(this, 'CreateTablesCustomResource', {
      onCreate: {
        service: 'Lambda',
        action: 'invoke',
        parameters: {
          FunctionName: createTablesLambda.functionName,
          Payload: '{}',
        },
        physicalResourceId: cr.PhysicalResourceId.of('CreateTables'),
      },
      onUpdate: {
        service: 'Lambda',
        action: 'invoke',
        parameters: {
          FunctionName: createTablesLambda.functionName,
          Payload: '{}',
        },
        physicalResourceId: cr.PhysicalResourceId.of('CreateTables'),
      },
      policy: cr.AwsCustomResourcePolicy.fromStatements([
        new iam.PolicyStatement({
          actions: ['lambda:InvokeFunction'],
          resources: [createTablesLambda.functionArn],
        }),
      ]),
    });

    // create a basic lambda function for creating a new sweet order
    const createSweetOrderLambda: nodeLambda.NodejsFunction =
      new nodeLambda.NodejsFunction(this, 'CreateSweetOrderLambda', {
        functionName: `create-sweet-order-${stage}`,
        runtime: runtimes,
        timeout: cdk.Duration.seconds(10),
        entry: path.join(
          __dirname,
          './src/adapters/primary/create-order/create-order.adapter.ts',
        ),
        memorySize: 1024,
        description: 'Create Sweet Order Lambda',
        logRetention: logs.RetentionDays.ONE_DAY,
        handler: 'handler',
        architecture: lambda.Architecture.ARM_64,
        tracing: lambda.Tracing.ACTIVE,
        environment: {
          ...lambdaConfig,
          TABLE_NAME: this.table.tableName,
          STAGE: stage,
        },
        bundling: {
          minify: true,
          externalModules: ['@aws-sdk/*'],
        },
      });
    createSweetOrderLambda.applyRemovalPolicy(getRemovalPolicyFromStage(stage));

    // create a basic lambda function for updating a sweet order
    const updateSweetOrderLambda: nodeLambda.NodejsFunction =
      new nodeLambda.NodejsFunction(this, 'UpdateSweetOrderLambda', {
        functionName: `update-sweet-order-${stage}`,
        runtime: runtimes,
        timeout: cdk.Duration.seconds(10),
        entry: path.join(
          __dirname,
          './src/adapters/primary/update-order/update-order.adapter.ts',
        ),
        memorySize: 1024,
        description: 'Update Sweet Order Lambda',
        logRetention: logs.RetentionDays.ONE_DAY,
        handler: 'handler',
        architecture: lambda.Architecture.ARM_64,
        tracing: lambda.Tracing.ACTIVE,
        environment: {
          ...lambdaConfig,
          TABLE_NAME: this.table.tableName,
          STAGE: stage,
        },
        bundling: {
          minify: true,
          externalModules: ['@aws-sdk/*'],
        },
      });
    updateSweetOrderLambda.applyRemovalPolicy(getRemovalPolicyFromStage(stage));

    // create a basic lambda function for creating a new product
    const createProductLambda: nodeLambda.NodejsFunction =
      new nodeLambda.NodejsFunction(this, 'CreateProductLambda', {
        functionName: `create-product-${stage}`,
        runtime: runtimes,
        timeout: cdk.Duration.seconds(10),
        entry: path.join(
          __dirname,
          './src/adapters/primary/create-product/create-product.adapter.ts',
        ),
        memorySize: 1024,
        description: 'Create Product Lambda',
        logRetention: logs.RetentionDays.ONE_DAY,
        handler: 'handler',
        architecture: lambda.Architecture.ARM_64,
        tracing: lambda.Tracing.ACTIVE,
        environment: {
          ...lambdaConfig,
          TABLE_NAME: this.table.tableName,
          STAGE: stage,
        },
        bundling: {
          minify: true,
          externalModules: ['@aws-sdk/*'],
        },
      });
    createProductLambda.applyRemovalPolicy(getRemovalPolicyFromStage(stage));

    // create a basic lambda function for our dynamodb stream processor to send the data to DSQL
    const streamProcessorLambda: nodeLambda.NodejsFunction =
      new nodeLambda.NodejsFunction(this, 'StreamProcessorLambda', {
        functionName: `stream-processor-${stage}`,
        runtime: runtimes,
        entry: path.join(
          __dirname,
          './src/adapters/primary/stream-changes-processor/stream-changes-processor.adapter.ts',
        ),
        memorySize: 1024,
        description: 'Stream Processor Lambda',
        logRetention: logs.RetentionDays.ONE_DAY,
        handler: 'handler',
        architecture: lambda.Architecture.ARM_64,
        tracing: lambda.Tracing.ACTIVE,
        timeout: cdk.Duration.minutes(5),
        environment: {
          ...lambdaConfig,
          STAGE: stage,
          REGION: region,
          CLUSTER_ID: clusterId,
          DATABASE_USER: 'admin', // Note: You could pass these from app-config
          DATABASE_PORT: '5432',
          DATABASE_LOGGING: 'true',
        },
        bundling: {
          minify: true,
          bundleAwsSDK: true, // bundle the AWS SDK as @aws-sdk/dsql-signer is not available yet
        },
      });
    streamProcessorLambda.applyRemovalPolicy(getRemovalPolicyFromStage(stage));

    // create a basic lambda function for getting orders
    const getOrdersLambda: nodeLambda.NodejsFunction =
      new nodeLambda.NodejsFunction(this, 'GetOrdersLambda', {
        functionName: `get-orders-${stage}`,
        runtime: runtimes,
        timeout: cdk.Duration.seconds(60),
        entry: path.join(
          __dirname,
          './src/adapters/primary/get-orders/get-orders.adapter.ts',
        ),
        memorySize: 1024,
        description: 'Get Orders Management API',
        logRetention: logs.RetentionDays.ONE_DAY,
        handler: 'handler',
        architecture: lambda.Architecture.ARM_64,
        tracing: lambda.Tracing.ACTIVE,
        environment: {
          ...lambdaConfig,
          STAGE: stage,
          REGION: region,
          CLUSTER_ID: clusterId,
          DATABASE_USER: 'admin',
          DATABASE_PORT: '5432',
          DATABASE_LOGGING: 'true',
        },
        bundling: {
          minify: true,
          bundleAwsSDK: true, // bundle the AWS SDK as @aws-sdk/dsql-signer is not available yet
        },
      });
    getOrdersLambda.applyRemovalPolicy(getRemovalPolicyFromStage(stage));

    // create a basic lambda function for getting order events
    const getOrderEventsLambda: nodeLambda.NodejsFunction =
      new nodeLambda.NodejsFunction(this, 'GetOrderEventsLambda', {
        functionName: `get-order-events-${stage}`,
        runtime: runtimes,
        timeout: cdk.Duration.seconds(60),
        entry: path.join(
          __dirname,
          './src/adapters/primary/get-order-events/get-order-events.adapter.ts',
        ),
        memorySize: 1024,
        description: 'Get Order Events Management API',
        logRetention: logs.RetentionDays.ONE_DAY,
        handler: 'handler',
        architecture: lambda.Architecture.ARM_64,
        tracing: lambda.Tracing.ACTIVE,
        environment: {
          ...lambdaConfig,
          STAGE: stage,
          REGION: region,
          CLUSTER_ID: clusterId,
          DATABASE_USER: 'admin',
          DATABASE_PORT: '5432',
          DATABASE_LOGGING: 'true',
        },
        bundling: {
          minify: true,
          bundleAwsSDK: true, // bundle the AWS SDK as @aws-sdk/dsql-signer is not available yet
        },
      });
    getOrderEventsLambda.applyRemovalPolicy(getRemovalPolicyFromStage(stage));

    const dslConnectedFunctions: nodeLambda.NodejsFunction[] = [
      getOrdersLambda,
      streamProcessorLambda,
      createTablesLambda,
      getOrderEventsLambda,
    ];

    // allow our function to connect to the DSQL cluster
    dslConnectedFunctions.forEach((func) => {
      func.addToRolePolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['dsql:DbConnectAdmin', 'dsql:DbConnect'],
          resources: [`arn:aws:dsql:${region}:${account}:cluster/${clusterId}`],
        }),
      );
    });

    // add the dynamodb streams to invoke the lambda to produce events on eventbridge
    streamProcessorLambda.addEventSource(
      new DynamoEventSource(this.table, {
        startingPosition: lambda.StartingPosition.TRIM_HORIZON,
        batchSize: 100,
        retryAttempts: 3,
        maxBatchingWindow: cdk.Duration.seconds(10),
        bisectBatchOnError: true,
        reportBatchItemFailures: true,
        parallelizationFactor: 1,
      }),
    );

    // give the lambda function permissions to write to the dynamodb table
    this.table.grantWriteData(createSweetOrderLambda);
    this.table.grantWriteData(createProductLambda);
    this.table.grantWriteData(updateSweetOrderLambda);

    // create our api for sweet orders
    this.api = new apigw.RestApi(this, 'Api', {
      description: `(${stage}) Sweet Orders API`,
      restApiName: `${stage}-sweet-orders-api`,
      endpointTypes: [apigw.EndpointType.EDGE],
      deploy: true,
      deployOptions: {
        stageName: 'api',
        loggingLevel: apigw.MethodLoggingLevel.INFO,
      },
    });

    const root: apigw.Resource = this.api.root.addResource('v1');
    const orders: apigw.Resource = root.addResource('orders');
    const orderItem = orders.addResource('{orderId}');
    const products: apigw.Resource = root.addResource('products');

    // rest api endpoints for the oms
    orders.addMethod(
      'POST',
      new apigw.LambdaIntegration(createSweetOrderLambda, {
        proxy: true,
      }),
    );

    orderItem.addMethod(
      'PUT',
      new apigw.LambdaIntegration(updateSweetOrderLambda, {
        proxy: true,
      }),
    );

    products.addMethod(
      'POST',
      new apigw.LambdaIntegration(createProductLambda, {
        proxy: true,
      }),
    );

    // rest api endpoints for the management api
    this.managementApi = new apigw.RestApi(this, 'ManagementApi', {
      description: `(${stage}) Sweet Orders Management API`,
      restApiName: `${stage}-sweet-orders-management-api`,
      endpointTypes: [apigw.EndpointType.EDGE],
      deploy: true,
      deployOptions: {
        stageName: 'api',
        loggingLevel: apigw.MethodLoggingLevel.INFO,
      },
    });

    const managementRoot: apigw.Resource =
      this.managementApi.root.addResource('v1');
    const managementOrders: apigw.Resource =
      managementRoot.addResource('orders');
    const managementOrderItem = managementOrders.addResource('{orderId}');
    const managementOrderItemEvents = managementOrderItem.addResource('events');

    managementOrders.addMethod(
      'GET',
      new apigw.LambdaIntegration(getOrdersLambda, {
        proxy: true,
      }),
    );

    managementOrderItemEvents.addMethod(
      'GET',
      new apigw.LambdaIntegration(getOrderEventsLambda, {
        proxy: true,
      }),
    );
  }
}
