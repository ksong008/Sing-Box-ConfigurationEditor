# Sing-Box Configuration Editor

A simple HTML-based configuration editor for `sing-box` settings.

## Overview

This repository contains the frontend and supporting files for an editor that helps users create, modify, and export `sing-box` configuration files through a browser-based UI.

Current code structure:

```text
core/
  state.js
  config.js
  import-export.js
  storage.js
modules/
  dns.js
  groups.js
  nodes.js
  providers.js
  rules.js
  tproxy.js
  tun.js
main.js
singbox.html
```

NOTE：sing-box v1.12 only

## Features


## Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/ksong008/Sing-Box-ConfigurationEditor.git
   cd Sing-Box-ConfigurationEditor
   ```

2. Start a local static server in the project root:

   ```bash
   python3 -m http.server 8000
   ```

3. Open `http://127.0.0.1:8000/singbox.html` in your browser

## Development

- The page now uses browser ES modules, so opening `singbox.html` directly with `file://` is not recommended during development.
- Keep shared state and cross-cutting logic in `core/`.
- Put feature-specific logic in `modules/`.
- To build a single-file release HTML from the split source, run:

  ```bash
  node scripts/build-single-html.mjs
  ```


## Usage

- Open the editor in a browser
- Edit the configuration values through the UI
- Export the generated configuration file

## Contributing

Contributions are welcome. Please open issues or pull requests for bug reports, enhancements, or feature requests.

## License

GPL-3.0 License
