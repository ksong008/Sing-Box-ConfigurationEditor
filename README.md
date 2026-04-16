# Sing-Box Configuration Editor

A simple HTML-based configuration editor for `sing-box` settings.

## Overview

This repository contains the frontend and supporting files for an editor that helps users create, modify, and export `sing-box` configuration files through a browser-based UI.

This `v1.12` branch keeps the packaged single-file `singbox.html` release for `sing-box` `v1.12`.

NOTE: sing-box v1.12 only

## Features

- Single-file `singbox.html` release
- Works offline after download; Vue, Tailwind, Font Awesome, and fonts are bundled into the HTML
- Supports panel backup JSON import/export
- Supports runtime `config.json` export for sing-box
- Includes DNS, route, TUN, TProxy, provider, node, and group editing panels

## Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/ksong008/Sing-Box-ConfigurationEditor.git
   cd Sing-Box-ConfigurationEditor
   ```

2. Open `singbox.html` in your browser.

3. Edit your configuration and export what you need:

- `Panel config`: for backup and later re-import into this editor
- `Runtime config (config.json)`: for sing-box runtime use

## Development

This branch is for the packaged release only.

If you want the split-source development version and build scripts, use the `test` branch.

## Usage

- Open the editor in a browser
- Edit the configuration values through the UI
- Export `Panel config` when you want to save and re-import later
- Export `Runtime config` when you want to run it with sing-box
- Only `Panel config` can be imported back into the editor

## Contributing

Contributions are welcome. Please open issues or pull requests for bug reports, enhancements, or feature requests.

## License

GPL-3.0 License
