# BISC 1254 — Biostatistics & Research Methods Study Lab

Interactive web study lab for **Biostatistics & Research Methods** (Ugandan higher-education context).  
Runs entirely in the browser: sampling simulators, histograms, regression plots, probability curves, and MathJax-rendered formulas.

**Live site (after you enable GitHub Pages):**  
`https://ojilon.github.io/biostatistics_personal_study_webiste/`

---

## 1. How to publish with GitHub Pages (for classmates to use)

Anyone with the link can open the site on a phone, tablet, or computer. You do **not** need a server.

### Steps (repo owner)

1. Open the repository on GitHub:  
   [https://github.com/ojilon/biostatistics_personal_study_webiste](https://github.com/ojilon/biostatistics_personal_study_webiste)
2. Click **Settings** → left sidebar **Pages**.
3. Under **Build and deployment**:
   - **Source:** Deploy from a branch  
   - **Branch:** `main`  
   - **Folder:** `/ (root)`  
4. Click **Save**.
5. Wait 1–2 minutes. GitHub will show a green message with the public URL, for example:  
   `https://ojilon.github.io/biostatistics_personal_study_webiste/`
6. Share that URL with classmates. They only need a browser (Chrome, Firefox, Safari, Edge).

### Optional: custom domain

In the same **Pages** settings you can add a custom domain later. Not required for class use.

### After you push updates

Every `git push` to `main` updates the live site automatically (usually within a minute). Tell users to hard-refresh (`Ctrl+Shift+R` / `Cmd+Shift+R`) if they still see an old version.

---

## 2. Phones, tablets, and different screen sizes

The site is built to work on small screens:

- Every page has `<meta name="viewport" content="width=device-width, initial-scale=1.0">`.
- Navigation scrolls horizontally on narrow screens.
- Simulator panels (`.sim-grid`) stack **controls above chart** on tablets and phones.
- Tables scroll horizontally when needed.
- Canvas charts scale to the available width.
- Buttons stretch full-width on very small phones so they are easy to tap.

**Tip for users:** Use landscape mode on a phone if you want a wider view of a chart. Interactive labs still work in portrait.

No install is required. MathJax (formulas) loads from a CDN on first visit, so the device needs internet once; after that, most of the site can work offline from browser cache until the cache is cleared.

---

## 3. Shared data — how many people can use the same site without overwriting each other

### How the site stores “data”

| Kind of data | Where it lives | Who can change it | Shared between users? |
|--------------|----------------|-------------------|------------------------|
| Course example datasets (eggs, milk, goats, …) | Files in `js/data/*.json` in the repo | Only people who can push to GitHub | Yes — same for everyone |
| Simulator state (sample draw, clicked regression points, slider values) | **Only in that browser session** (memory / page) | Each visitor independently | **No** — each person has their own session |
| Text typed into a page textarea | In that browser tab only | That visitor only | **No** |

So:

- **Classmates opening the live GitHub Pages URL** do not edit a shared database. Changing a slider or clicking “Execute Sample Draw” only updates **their** screen. Closing the tab loses that session state.
- **Nobody’s interactive work overwrites anyone else’s.** There is no central live database for student experiments.

### If several people edit the *repository* (code / JSON files)

If more than one person has write access to the GitHub repo (e.g. group project):

1. **Do not edit the same file at the same time without coordinating.** Use branches:
   ```bash
   git checkout -b your-name/feature
   # edit files
   git add .
   git commit -m "Describe your change"
   git push -u origin your-name/feature
   ```
   Then open a **Pull Request** on GitHub so changes are reviewed before merging to `main`.
2. **Keep course datasets in `js/data/`** as shared, read-only examples. Prefer adding a *new* JSON file (e.g. `js/data/my-trial.json`) rather than replacing `hen-eggs.json` unless the whole class agrees.
3. **Personal experiments** should stay in the browser (or export your own numbers to a notebook). Do not commit personal scratch data into `main` unless it is meant for everyone.
4. If two people change the same line and both push, Git will report a **merge conflict**. Resolve it by opening the conflicted file, choosing the correct content, then:
   ```bash
   git add <file>
   git commit -m "Resolve conflict"
   git push
   ```

### Summary for students

- **Using the website:** safe for the whole class at once; no conflict.
- **Editing the website source:** use branches + pull requests; do not all push straight to `main` on the same files.

---

## 4. Local use (optional)

```bash
git clone https://github.com/ojilon/biostatistics_personal_study_webiste.git
cd biostatistics_personal_study_webiste
# Open index.html in a browser, or:
# python3 -m http.server 8080
# then visit http://localhost:8080
```

---

## 5. Project structure

```
index.html                 # Home / module map
css/styles.css             # Layout + responsive rules
css/visualizations.css     # Simulator / chart layout
js/app.js                  # Shared UI
js/visualizations.js       # Shared chart helpers
js/modules/                # Sampling, regression, probability, …
js/data/                   # Shared example JSON datasets
pages/01-…html … 12-…html  # One page per module
```

---

## 6. Course modules

1. Intro to data & variables  
2. Sampling techniques (field grid simulator)  
3. Frequency distributions (histogram / bar / ogive)  
4. Central tendency  
5. Dispersion (box plot)  
6. Probability (binomial + Normal)  
7. Hypothesis testing (Z critical region)  
8. Correlation & regression (clickable scatter)  
9. Parametric vs non-parametric selection  
10. Excel & SPSS guide  
11. Experimental design & ANOVA  
12. Field data collection  

---

## Licence / use

Designed for teaching and personal study. Share the GitHub Pages link freely with classmates.
