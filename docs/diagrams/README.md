# Diagram Sources

This folder contains the editable source files for the LYDO Connect general use case diagram.

- `use-case-diagram.mmd` is the Mermaid source.
- `use-case-diagram.puml` is the PlantUML source.
- `use-case-diagram.svg` is the exported/rendered SVG output.

The current repository also has an existing exported methodology diagram at `Methodology/diagrams/use-case-overall-lydo-connect.svg`. That file is kept as an export artifact. The files in this `docs/diagrams` folder are the easier-to-edit source-based versions.

## Preferred Source

For final thesis export, prefer `use-case-diagram.puml` because PlantUML is better suited for UML-style use case maintenance.

For quick repo-side editing and SVG regeneration, `use-case-diagram.mmd` is also available.

## Regenerate The SVG

PlantUML:

```bash
plantuml -tsvg docs/diagrams/use-case-diagram.puml
```

Mermaid CLI:

```bash
mmdc -i docs/diagrams/use-case-diagram.mmd -o docs/diagrams/use-case-diagram.svg
```

If you regenerate from Mermaid, the exported SVG will overwrite `docs/diagrams/use-case-diagram.svg`.

## Notes

- Actor associations should remain solid.
- `<<include>>` and `<<extend>>` relationships should remain dashed.
- The Mermaid file is a readable approximation using a flowchart layout.
- The PlantUML file is the preferred editable UML source for long-term maintenance.
