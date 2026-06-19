# Sing-Box Configuration Editor

A simple HTML-based configuration editor for `sing-box` settings.

## Overview

This repository contains the frontend and supporting files for an editor that helps users create, modify, and export `sing-box` configuration files through a browser-based UI.

Current code structure:

```text
core/
  state.js
  config.js
  config-utils.js
  import-export.js
  json-scroll.js
  node-capability-schema.js
  node-capabilities.js
  protocol-codecs/
    anytls.js
    dns.js
    http.js
    hysteria.js
    hysteria2.js
    index.js
    naive.js
    shadowsocks.js
    shadowtls.js
    shared.js
    socks.js
    ssh.js
    tor.js
    trojan.js
    tuic.js
    vless.js
    vmess.js
    wireguard.js
  runtime-import.js
  state-snapshot.js
  storage.js
modules/
  dns.js
  groups.js
  nodes/
    defaults.js
    dial-fields.js
  nodes.js
  providers.js
  provider-parsers/
    hysteria2.js
    index.js
    shadowsocks.js
    trojan.js
    tuic.js
    utils.js
    vless.js
    vmess.js
  rules/
    defaults.js
    normalize.js
    route-options.js
    schema.js
  rules.js
  tproxy/
    conflicts.js
    extra-inbounds.js
    marks.js
    nft.js
  tproxy.js
  tun.js
ui/
  app-header.js
  import-export-modal.js
  json-preview.js
  register-components.js
  shared.js
  tab-panels.js
  tabs/
    advanced-tab.js
    create-injected-component.js
    dns-tab.js
    dns/
      basic-settings-section.js
      dns-servers-section.js
      extra-inbounds-section.js
      fakeip-section.js
    groups-tab.js
    nodes-tab.js
    nodes/
      manual-import-section.js
      node-card.js
      node-dial-fields.js
      node-multiplex-fields.js
      node-protocol-fields.js
      node-tls-fields.js
      node-transport-fields.js
      nodes-footer.js
      nodes-toolbar.js
      providers-section.js
    rules/
      route-options-fields.js
      route-rule-card.js
      route-rules-toolbar.js
      rule-action-fields.js
      rule-conditions.js
      rule-sets-section.js
      rules-footer.js
    rules-tab.js
    tproxy-tab.js
    tun-tab.js
scripts/
  build-single-html.mjs
  smoke-singbox.mjs
  lib/
    smoke-helpers.mjs
main.js
singbox.html
```

NOTE：sing-box v1.12 only

## Features

- Browser-based editor for `sing-box` v1.12
- Supports importing panel backup JSON and exporting both panel/runtime config JSON
- Can build a fully self-contained single-file release HTML for offline use

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
- Reusable Vue UI components live in `ui/`.
- Vendored third-party assets used for release packaging live in `vendor/`.
- To build a single-file release HTML from the split source, run:

  ```bash
  node scripts/build-single-html.mjs
  ```

- The generated `dist/singbox.test.html` inlines Vue, Tailwind, Font Awesome, local modules, and fonts, so it can be opened offline without network access.
- To run smoke checks for both the live page and the offline bundle, run:

  ```bash
  node scripts/smoke-singbox.mjs
  ```

- The browser stage in `scripts/smoke-singbox.mjs` requires `playwright` to be resolvable from local `node_modules` or `NODE_PATH`. When it is unavailable, the script still performs build + syntax checks and reports that browser coverage was skipped.


## Usage

- Open the editor in a browser
- Edit the configuration values through the UI
- Export the generated configuration file

## Contributing

Contributions are welcome. Please open issues or pull requests for bug reports, enhancements, or feature requests.

## License

GPL-3.0 License
