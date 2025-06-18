import * as lambda from 'aws-cdk-lib/aws-lambda';

import { Region, Stage } from '../types';

export interface EnvironmentConfig {
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
  stateful: {
    tableName: string;
  };
}

export const getEnvironmentConfig = (stage: Stage): EnvironmentConfig => {
  switch (stage) {
    case Stage.test:
      return {
        shared: {
          logging: {
            logLevel: 'DEBUG',
            logEvent: 'true',
          },
          serviceName: `lj-sweets-${Stage.test}`,
          metricNamespace: `lj-sweets-namespace-${Stage.test}`,
          stage: Stage.test,
        },
        stateless: {
          runtimes: lambda.Runtime.NODEJS_22_X,
        },
        env: {
          account: '123456789123',
          region: Region.london,
        },
        stateful: {
          tableName: `lj-sweets-table-${Stage.test}`,
        },
      };
    case Stage.staging:
      return {
        shared: {
          logging: {
            logLevel: 'DEBUG',
            logEvent: 'true',
          },
          serviceName: `lj-sweets-${Stage.staging}`,
          metricNamespace: `lj-sweets-namespace-${Stage.staging}`,
          stage: Stage.staging,
        },
        stateless: {
          runtimes: lambda.Runtime.NODEJS_22_X,
        },
        env: {
          account: '123456789123',
          region: Region.london,
        },
        stateful: {
          tableName: `lj-sweets-table-${Stage.staging}`,
        },
      };
    case Stage.prod:
      return {
        shared: {
          logging: {
            logLevel: 'INFO',
            logEvent: 'true',
          },
          serviceName: `lj-sweets-${Stage.prod}`,
          metricNamespace: `lj-sweets-namespace-${Stage.prod}`,
          stage: Stage.prod,
        },
        stateless: {
          runtimes: lambda.Runtime.NODEJS_22_X,
        },
        env: {
          account: '123456789123',
          region: Region.london,
        },
        stateful: {
          tableName: `lj-sweets-table-${Stage.prod}`,
        },
      };
    case Stage.develop:
      return {
        shared: {
          logging: {
            logLevel: 'DEBUG',
            logEvent: 'true',
          },
          serviceName: `lj-sweets-${Stage.develop}`,
          metricNamespace: `lj-sweets-namespace-${Stage.develop}`,
          stage: Stage.develop,
        },
        stateless: {
          runtimes: lambda.Runtime.NODEJS_22_X,
        },
        env: {
          account: '123456789123',
          region: Region.london,
        },
        stateful: {
          tableName: `lj-sweets-table-${Stage.develop}`,
        },
      };
    default:
      return {
        shared: {
          logging: {
            logLevel: 'DEBUG',
            logEvent: 'true',
          },
          serviceName: `lj-sweets-${stage}`,
          metricNamespace: `lj-sweets-namespace-${stage}`,
          stage: stage,
        },
        stateless: {
          runtimes: lambda.Runtime.NODEJS_22_X,
        },
        env: {
          account: '123456789123',
          region: Region.london,
        },
        stateful: {
          tableName: `lj-sweets-table-${stage}`,
        },
      };
  }
};
