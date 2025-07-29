# DynamoDB Stream To Aurora DSQL

An example of streaming data changes from DynamoDB to Amazon Aurora DSQL

![image](./docs/images/header.png)

> Note: If you choose to deploy these resources you may be charged for usage.

You can find the associated article here: https://blog.serverlessadvocate.com/amazon-dsql-sidecar-to-dynamodb-part-1-080c6698bf76

### Deploying the Solution

To deploy the solution do the following which will deploy the `develop` environment:

1. In the `sweet-orders` folder run `npm i`.
2. Modify the file `app-config/app-config.ts` to set your AWS account and region in the `env` section of `Stage.develop`.
3. If you haven't already configured a logging role for API Gateway, follow [these instructions](https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-logging.html#set-up-access-logging-permissions) to create an IAM role, copy the ARN, and configure API Gateway to use that ARN in the API Gateway settings section of the AWS Console.
4. In the `sweet-orders` folder run the following `npm run deploy:develop`.

To remove the solution run the following:

1. In the `sweet-orders` folder run the following `npm run remove:develop`.
