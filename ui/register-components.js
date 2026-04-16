import { AppHeader } from './app-header.js';
import { ImportExportModal } from './import-export-modal.js';
import { JsonPreview } from './json-preview.js';
import { EditorPanel } from './tab-panels.js';

export function registerUIComponents(app) {
    app.component('app-header', AppHeader);
    app.component('import-export-modal', ImportExportModal);
    app.component('json-preview', JsonPreview);
    app.component('editor-panel', EditorPanel);
}
