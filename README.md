# Sing-Box Server Configuration Editor

A simple HTML-based server-side configuration editor for `sing-box` settings.

## Overview

This repository contains the packaged single-file release for a server-side editor that helps users create, modify, and export `sing-box` configuration files through a browser-based UI.

This `server` branch keeps the packaged single-file `singboxserver.html` release for `sing-box` `v1.12`.

NOTE: sing-box v1.12 only

## Features

- Single-file `singboxserver.html` release
- Works offline after download; Vue, Tailwind, Font Awesome, and fonts are bundled into the HTML
- Supports server panel JSON import/export
- Supports server runtime `config.json` export for sing-box
- Includes DNS, inbound, route, remote outbound, and share-link editing panels

## Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/ksong008/Sing-Box-ConfigurationEditor.git
   cd Sing-Box-ConfigurationEditor
   ```

2. Open `singboxserver.html` in your browser.

3. Edit your configuration and export what you need:

- `Panel config`: for backup and later re-import into this editor
- `Runtime config (config.json)`: for sing-box runtime use

## Development

This branch is for the packaged release only.

If you want the split-source development version and build scripts, use the `testserver` branch.

## Usage

- Open the editor in a browser
- Edit the server configuration values through the UI
- Export `Panel config` when you want to save and re-import later
- Export `Runtime config` when you want to run it with sing-box
- Both panel config and runtime config can be imported in this server editor

## Contributing

Contributions are welcome. Please open issues or pull requests for bug reports, enhancements, or feature requests.

## License

GPL-3.0 License
