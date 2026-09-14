# Non-Holonomic Gradient Play — rebuilt project page

A static, GitHub-Pages-ready project website for:

**Non-Holonomic Gradient Play: Stability and Deception in Games on Manifolds**  
Mahmoud Abdelgalil, Miroslav Krstic, Jorge I. Poveda

## Files

- `index.html`
- `style.css`
- `script.js`
- `assets/paper.pdf`
- `assets/mahmoud.png`
- `assets/miroslav.png`
- `assets/jorge.png`

## Deploy on GitHub Pages

1. Create or open the repository for the project page.
2. Upload the **contents** of this folder to the repository root.
3. Confirm that `index.html` is in the root.
4. In GitHub: **Settings → Pages**.
5. Under **Build and deployment**, select:
   - Source: **Deploy from a branch**
   - Branch: `main`
   - Folder: `/ (root)`
6. Save and wait for GitHub Pages to deploy.

No build step is required.

## Design notes

This rebuild intentionally avoids the earlier card-heavy layout. It uses:
- a restrained animated bundle-field hero;
- Equation (3) integrated directly into the core idea;
- one bounded, linked sphere→disk geometry visualization;
- a clean stability decomposition;
- a light-background deception section as the visual centerpiece;
- a single `gamma` slider for the sphere deception example;
- minimal examples, model-free connection, paper, and author sections.


## Running examples update
The sphere and simplex panels now contain live canvas animations. The sphere animation shows the moving state and state-dependent directions e1/e2; the simplex animation sweeps gamma and traces the exact equilibrium displacement from Example 7.
