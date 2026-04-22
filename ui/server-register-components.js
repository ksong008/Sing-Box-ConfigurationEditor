import { AppHeader } from './server-app-header.js';
import { ImportExportModal } from './server-import-export-modal.js';
import { JsonPreview } from './json-preview.js';
import { EditorPanel } from './server-tab-panels.js';

export function registerServerUIComponents(app) {
    app.component('app-header', AppHeader);
    app.component('import-export-modal', ImportExportModal);
    app.component('json-preview', JsonPreview);
    app.component('editor-panel', EditorPanel);
}
