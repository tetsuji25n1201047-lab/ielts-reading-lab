# Reading Lab — original IELTS-style Reading practice

This repository hosts an **unofficial** IELTS-style practice website. It is not associated with or endorsed by IELTS, Cambridge, the British Council or IDP.

## What is available now

- Practice library and test introduction
- Computer-style Reading: passage and questions side by side on desktop; switchable tabs on mobile
- 20-minute practice timer, question navigation, flags and highlighting
- Save/resume in browser local storage, submit confirmation, automatic marking, evidence and Japanese explanations
- One original sample: **The Return of Urban Wetlands** (13 questions)
- Static website, no account/backend required, no payment collection

## Publish using Cloudflare Pages + GitHub

1. In [Cloudflare Dashboard](https://dash.cloudflare.com/) navigate to **Workers & Pages**, choose **Create application** → **Pages** → **Connect to Git** (wording may vary).
2. Authorize/select GitHub and choose **tetsuji25n1201047-lab/ielts-reading-lab**.
3. Select production branch **main** and choose **Framework preset: None**.
4. There is no install or build step. Set **Build command** to empty (if validation requires one, use `exit 0`), and **Build output directory** to `.` (repository root).
5. Deploy. Cloudflare assigns a `*.pages.dev` URL. Changes pushed to main redeploy automatically.

GitHub is the source of truth. Do not create a separate Direct Upload-only project if you want Git-based auto deployment.

The project contains an `index.html` at root, so it does not require a build tool or framework.

## Add new original question sets

1. Add a new test object to `data/tests.json`; keep a **unique** `id`. The existing example shows the schema.
2. Every test has `passages`, with `paragraphs` and `sections`; each section has a `questions` array. Supported question `type` values: `choice`, `select`, `text`.
3. Provide answers, evidence paragraph labels, and original Japanese explanations. Number questions consecutively and uniquely per test.
4. Run `python3 tools/build_tests_js.py`. This generates **data/tests.js**, which the browser loads. Commit **both** `data/tests.json` and `data/tests.js`.
5. Once the commit reaches main, Cloudflare Pages automatically deploys it.

If editing through a GitHub browser without Python, update `data/tests.js` carefully with the same information, as it is the runtime file. Prefer the JSON+generator process to prevent desynchronization.

## Files

- `index.html` — page structure
- `styles.css` — design and mobile responsive layout
- `app.js` — test engine, autosave, timer, scoring
- `data/tests.json` — editable source for questions
- `data/tests.js` — browser-loadable test catalogue
- `tools/build_tests_js.py` — regenerate JavaScript catalogue
- `favicon.svg` — tab icon

## Content and score safeguards

Use Engnovate, Cambridge, and other published materials to **study patterns and difficulty** and then produce independently written passages and questions. Do not publish copyrighted material without permission.

A single 13-question practice test does not accurately predict an official IELTS band score; show **correct / total** and actionable explanations.

## Important limitations

Answers are stored in client JavaScript and progress is saved only in the same browser/device. There is no sign-in, cross-device sync, admin CMS, paid-content access control, or server-side analytics. Those features require further implementation.

Before widespread release, review question correctness, originality, explanation quality, contrast/keyboard behavior, and the actual Cloudflare deployment.
