# `GroundWork` - Instant Browser-based Assurance

My submission for the [Baseline Tooling Hackathon](https://baseline.devpost.com/).

See my Devpost submission [here](https://devpost.com/gongahkia/).

## Usage

Access the live site [***here***](). The below instructions are for running it locally.

```console
$ git clone https://github.com/gongahkia/baseline-tooling-hackathon-2025
$ cd baseline-tooling-hackathon-2025 && npm install
$ npm run compile
```

## Architecture

```mermaid
flowchart LR
    A["Official Baseline Sources<br/>web-features + baseline-browser-mapping"] --> B["Shared GroundWork Core<br/>config merge + feature registry + target resolution"]
    B --> C["Shared Analyzer<br/>HTML/CSS scanners + TypeScript AST detection + standardized report model"]

    C --> D["VS Code Extension"]
    D --> D1["Diagnostics + Hover"]
    D --> D2["Workspace Trees + Dashboard"]
    D --> D3["Status Bar + Commands"]

    C --> E["CLI Scanner"]
    E --> E1["baseline-report.json"]
    E --> E2["baseline-report.md"]

    C --> F["Build Tool Integrations"]
    F --> F1["Vite Plugin"]
    F --> F2["Webpack Plugin"]

    E --> G["GitHub Actions"]
    G --> G1["Artifact Upload"]
    G --> G2["PR Comment Summary"]
```
