# Non-Holonomic Gradient Play — interactive project page

Static website for the paper **“Non-Holonomic Gradient Play: Stability and Deception in Games on Manifolds.”**

## Preview locally

```bash
python3 -m http.server 8000
```
Then open `http://localhost:8000`.

## GitHub Pages

1. Create a repository.
2. Upload the contents of this folder to the repository root.
3. In **Settings → Pages**, choose **Deploy from a branch** and select `main` / root.
4. GitHub Pages will publish the site.

The site is plain HTML/CSS/JavaScript and requires no build step. MathJax is loaded from a CDN.


Latest update: the sphere example now explicitly shows the upper hemisphere, the chart map phi(x)=(x1,x2), and linked interactive actuation directions. Equation (3) is displayed directly below the hero as the main object of study.


## Refinement
- Fixed the sphere/chart interactive card so its canvases have bounded heights and cannot recursively expand the layout.
- Removed the standalone Equation (3) banner below the hero.
- Integrated Equation (3) directly into the “Gradient play, without pretending the world is flat.” section.
- Reworded the hero caption to avoid repeating the same message.
