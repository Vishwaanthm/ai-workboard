# AI Workboard (AWS)

A front-end learning platform for the video course **Amazon Bedrock for Beginners**: 12 episodes in
5 parts, with a video player (captions, language switch, chapters, resume), hands-on labs, quizzes,
a printable certificate and a learner dashboard. It is a static site: progress and sign-in are kept
in the browser's local storage, with no backend.

Live site: https://vishwaanthm.github.io/ai-workboard/

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
```

Requires Node.js 22.

## Deploy

Every push to `main` builds the site and publishes it to GitHub Pages through
`.github/workflows/deploy.yml`.

## Credits

Stock video and photos (Pixabay), fonts (SIL Open Font License) and the official AWS Architecture
Icons are listed with their sources and licences in [CREDITS.md](CREDITS.md).

Amazon Web Services, AWS and Amazon Bedrock are trademarks of Amazon.com, Inc. or its affiliates.
AI Workboard is not affiliated with or endorsed by AWS.
