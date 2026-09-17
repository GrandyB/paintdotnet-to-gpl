# Paint.NET → GIMP Palette

Convert Paint.NET palette files (`.txt`) to GIMP palette files (`.gpl`). Everything runs in the browser — nothing is uploaded or stored on a server.

## Features

- Drag-and-drop (or click-to-browse) Paint.NET palette upload
- Optional ignore-color filter (defaults to black `#000000`)
- Live swatch preview and `.gpl` download

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # static export to out/
npm start       # not used for static export; serve out/ with any static host
```

## Push to a new GitHub repo

This project is already a local git repo on `main`. To create a remote and push:

```bash
gh repo create pnet-to-gpl --public --source=. --remote=origin --push
```

Or create an empty repo on GitHub, then:

```bash
git remote add origin https://github.com/YOUR_USER/pnet-to-gpl.git
git push -u origin main
```

## Deploy on Vercel

1. Push the repo to GitHub (above).
2. Import the project in [Vercel](https://vercel.com/new) (framework: Next.js).
3. Deploy — no environment variables required. The app uses `output: 'export'` for a static site.
