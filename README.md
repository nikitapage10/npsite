# nikita.page

Personal site for Nikita Page. Static HTML with no build dependencies: `index.html`, `resume.html` and `hero-loop.mp4` at the repo root are the whole site.

## Layout

| Path | What it is |
| --- | --- |
| `index.html`, `resume.html` | The site. Generated from `design/` by `tools/build.js` — edit the sources, then rebuild. |
| `hero-loop.mp4` | Hero background: the original clip played forward then reversed, H.264 1080p, so it loops seamlessly. |
| `design/*.dc.html`, `design/canvas.json` | Design sources from the Claude Design canvas (site, resume, logo options). |
| `design/hero-original.mp4` | Original hero clip (HEVC), kept for re-encoding. |
| `tools/build.js` | Converts the design sources into the plain HTML pages. |
| `tools/serve.js` | Tiny local static server with video range support. |

## Working on it

```bash
node tools/build.js
```

```bash
node tools/serve.js
```

Then open http://localhost:8123. Opening `index.html` straight from disk works, but some browsers won't loop the video from a `file://` page.

## Regenerating the hero loop

```bash
ffmpeg -i design/hero-original.mp4 -filter_complex "[0:v]split[a][b];[b]reverse,trim=start_frame=1,setpts=PTS-STARTPTS[r];[a][r]concat=n=2:v=1[v]" -map "[v]" -an -c:v libx264 -crf 20 -preset slow -pix_fmt yuv420p -movflags +faststart hero-loop.mp4
```

## Before going live

The company marks in the timeline (Penn State, KPMG, Verizon, Microsoft) are hand-drawn approximations. Swap in official logo files and check each brand's usage guidelines.
