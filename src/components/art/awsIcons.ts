/**
 * Official AWS Architecture Icons (release 07/31/2026) copied into public/aws-icons/.
 * Usage rules (public/aws-icons/README.md): diagrams and service labels only; never recolor, crop,
 * rotate or distort (rendered as unmodified <img> files, scaled proportionally); never as our logo.
 */
import type { AwsIconName } from '@/data/types'
import { asset } from '@/lib/asset'

const BASE = asset('/aws-icons')

export const AWS_ICONS: Record<AwsIconName, { src: string; name: string }> = {
  bedrock: { src: `${BASE}/service/Arch_Amazon-Bedrock_64.svg`, name: 'Amazon Bedrock' },
  nova: { src: `${BASE}/service/Arch_Amazon-Nova_64.svg`, name: 'Amazon Nova' },
  lambda: { src: `${BASE}/service/Arch_AWS-Lambda_64.svg`, name: 'AWS Lambda' },
  s3: { src: `${BASE}/service/Arch_Amazon-Simple-Storage-Service_64.svg`, name: 'Amazon S3' },
  cloudwatch: { src: `${BASE}/service/Arch_Amazon-CloudWatch_64.svg`, name: 'Amazon CloudWatch' },
  iam: { src: `${BASE}/service/Arch_AWS-Identity-and-Access-Management_64.svg`, name: 'AWS IAM' },
  cli: { src: `${BASE}/service/Arch_AWS-Command-Line-Interface_64.svg`, name: 'AWS CLI' },
  cloudshell: { src: `${BASE}/service/Arch_AWS-CloudShell_64.svg`, name: 'AWS CloudShell' },
  lambdaFunction: { src: `${BASE}/resource/Res_AWS-Lambda_Lambda-Function_48.svg`, name: 'Lambda function' },
  s3Bucket: { src: `${BASE}/resource/Res_Amazon-Simple-Storage-Service_Bucket_48.svg`, name: 'S3 bucket' },
  s3BucketObjects: {
    src: `${BASE}/resource/Res_Amazon-Simple-Storage-Service_Bucket-With-Objects_48.svg`,
    name: 'S3 bucket with objects',
  },
  cloudwatchLogs: { src: `${BASE}/resource/Res_Amazon-CloudWatch_Logs_48.svg`, name: 'CloudWatch Logs' },
  iamRole: { src: `${BASE}/resource/Res_AWS-Identity-Access-Management_Role_48.svg`, name: 'IAM role' },
  iamPermissions: {
    src: `${BASE}/resource/Res_AWS-Identity-Access-Management_Permissions_48.svg`,
    name: 'IAM permissions',
  },
  user: { src: `${BASE}/resource/Res_User_48_Light.svg`, name: 'User' },
  client: { src: `${BASE}/resource/Res_Client_48_Light.svg`, name: 'Client' },
  chat: { src: `${BASE}/resource/Res_Chat_48_Light.svg`, name: 'Chat' },
  documents: { src: `${BASE}/resource/Res_Documents_48_Light.svg`, name: 'Documents' },
  multimedia: { src: `${BASE}/resource/Res_Multimedia_48_Light.svg`, name: 'Multimedia' },
  internet: { src: `${BASE}/resource/Res_Internet_48_Light.svg`, name: 'Internet' },
  awsCloudLogo: { src: `${BASE}/group/AWS-Cloud-logo_32.svg`, name: 'AWS Cloud' },
  region: { src: `${BASE}/group/Region_32.svg`, name: 'Region' },
}

/** An official AWS icon, unmodified. `alt=""` when a visible text label already names it. */
export function awsIconProps(name: AwsIconName, decorative: boolean) {
  const icon = AWS_ICONS[name]
  return { src: icon.src, alt: decorative ? '' : icon.name }
}
