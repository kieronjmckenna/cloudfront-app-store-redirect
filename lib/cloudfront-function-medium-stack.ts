import * as cdk from "aws-cdk-lib";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import { Construct } from "constructs";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront_origins from "aws-cdk-lib/aws-cloudfront-origins";

const DOMAIN = "yourdomain.com";

export class CloudfrontFunctionMediumStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const responseFunction = new cloudfront.Function(
      this,
      "AppStoreFunctions",
      {
        code: cloudfront.FunctionCode.fromFile({
          filePath: "src/functions/app-store-redirect.js",
        }),
      }
    );

    const certificate = new acm.Certificate(
      this,
      "AppStoreRedirectCertificate",
      {
        domainName: DOMAIN,
        validation: acm.CertificateValidation.fromDns(
          route53.HostedZone.fromHostedZoneId(
            this,
            "AppStoreRedirectHostedZoneFromId",
            "<Your Hosted Zone Arn>"
          )
        ),
      }
    );

    const bucket = new s3.Bucket(this, "AppStoreRedirectCloudfrontBucket");

    new cloudfront.Distribution(this, "AppStoreRedirectDistribution", {
      domainNames: [DOMAIN],
      certificate,
      // disable logging if not debugging, if enabled this will create a bucket for you
      enableLogging: true,
      defaultBehavior: {
        origin: new cloudfront_origins.S3Origin(bucket),
        originRequestPolicy:
          cloudfront.OriginRequestPolicy.ALL_VIEWER_AND_CLOUDFRONT_2022,
        functionAssociations: [
          {
            eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
            function: responseFunction,
          },
        ],
      },
    });
  }
}
