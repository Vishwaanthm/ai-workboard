# Sign-in with Amazon Cognito

The site's Log in and Create account pages can use real OAuth sign-in: Google, Microsoft, or email and
password, all handled by Amazon Cognito's hosted pages. The site never sees a password. It uses the
authorization code flow with PKCE straight from the browser, so there is no backend and no client secret.

It is **off until two build settings are given**. Without them the site keeps its browser-only demo login.

## What you need

- An AWS account (any Region; the examples use `us-east-1`).
- For Google: a Google Cloud project. For Microsoft: a Microsoft Entra app registration. Both are optional:
  leave their parameters empty and that button simply is not offered by Cognito (email still works).

## 1. Pick the sign-in address

Cognito gives the sign-in pages an address like `https://<prefix>.auth.<region>.amazoncognito.com`. Choose a
unique `<prefix>` now (for example `ai-workboard-vishwaanth`), because Google and Microsoft need the return
address `https://<prefix>.auth.<region>.amazoncognito.com/oauth2/idpresponse` before you deploy.

## 2. Google (optional)

1. Google Cloud console, **APIs and Services**, **OAuth consent screen**: set the app name and your email.
2. **Credentials**, **Create credentials**, **OAuth client ID**, type **Web application**.
3. Under **Authorised redirect URIs** add the return address from step 1.
4. Keep the **client ID** and **client secret**.

## 3. Microsoft (optional)

1. Microsoft Entra admin centre, **App registrations**, **New registration**.
2. **Supported account types**: personal Microsoft accounts only works with the default issuer below. For
   your own organisation, choose single tenant and use the tenant issuer (see the parameter).
3. **Redirect URI**: platform **Web**, the return address from step 1.
4. **Certificates and secrets**, **New client secret**. Copy the secret **Value** at once.
5. Keep the **Application (client) ID** and the secret value.

## 4. Deploy the stack

```bash
aws cloudformation deploy \
  --template-file infra/cognito.yaml \
  --stack-name ai-workboard-auth \
  --parameter-overrides \
    DomainPrefix=ai-workboard-vishwaanth \
    SiteUrl=https://vishwaanthm.github.io/ai-workboard/ \
    GoogleClientId=... GoogleClientSecret=... \
    MicrosoftClientId=... MicrosoftClientSecret=... \
    MicrosoftIssuer=https://login.microsoftonline.com/consumers/v2.0

aws cloudformation describe-stacks --stack-name ai-workboard-auth --query "Stacks[0].Outputs"
```

`SiteUrl` ends with a slash and is where the live site runs. When the site moves (for example to
CloudFront), deploy again with the new `SiteUrl`; the old return address stops working.

## 5. Turn it on in the site

The two outputs are public values, not secrets. Add them as GitHub repository **variables**:

```bash
gh variable set COGNITO_DOMAIN --body "<CognitoDomain output>"
gh variable set COGNITO_CLIENT_ID --body "<ClientId output>"
```

When Google or Microsoft is connected (steps 2 to 4), also show its button, then push or re-run the deploy:

```bash
gh variable set COGNITO_PROVIDERS --body "google,microsoft"   # or just one of them
```

Until then only the email button is shown, so no button leads to an error. The next push to `main` rebuilds
the site with real sign-in. To try it locally, copy `.env.example` to
`.env.local`, fill in the same two values, and run `npm run dev` (the dev address `http://localhost:5173/`
is already allowed).

## Good to know

- **The login decides what the page shows; it does not lock files.** The site is static, so the video and
  caption files stay reachable by anyone who has their address. To truly protect videos, serve them from
  CloudFront with signed cookies (part of the AWS hosting plan, not done yet).
- **Progress stays in this browser**, keyed by the learner's email. A new device starts with no progress.
- **Sessions last up to 24 hours** (the ID token's life), then the learner signs in again, usually in one
  click. A tab left open past that moment signs out on its next reload.
- **One email through two routes makes two Cognito users** (for example Google and email/password). Cognito
  only links them with an extra Lambda trigger, which this setup does not include. In the site both map to the
  same email, so progress is shared.
- **Microsoft accounts:** Cognito checks the issuer, so one app can allow personal accounts (`consumers`) or one
  organisation (its tenant ID), not both at once.
- **Deployed 2026-11-02** as the stack `ai-workboard-auth` in `ap-southeast-2` (Sydney), with email sign-in
  only. The AWS Organization that owns that account allows Cognito only in Sydney, so use that Region. Email
  sign-up, sign-in and sign-out were tested end to end. Google and Microsoft are not added yet: create their
  apps (steps 2 and 3) and update the stack with their parameters. That path is untested until then.
- The template is checked by CloudFormation itself: a `DependsOn` on a switched-off provider is rejected, so
  the app client reads each provider's name from the provider resource instead.
