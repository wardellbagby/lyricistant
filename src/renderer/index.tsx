import '../css/default.css';
import React from 'react';
import ReactDOM from 'react-dom';
import { App } from './components/App';

const container: HTMLElement = document.getElementById('app');

if (module.hot) {
    module.hot.accept();
}

setupDOM();

ReactDOM.render(
    <App
        onShouldUpdateBackground={(newBackground: string) => {
            container.style.backgroundColor = newBackground;
        }} />,
    container);

function setupDOM(): void {
    const editorContainer: HTMLElement = document.createElement('div');
    editorContainer.id = 'editor';

    const detailColumn: HTMLElement = document.createElement('div');
    detailColumn.id = 'detail-column';

    const rhymeTable: HTMLElement = document.createElement('table');
    rhymeTable.id = 'rhyme-table';

    detailColumn.appendChild(rhymeTable);
    container.appendChild(editorContainer);
    container.appendChild(detailColumn);
    document.body.appendChild(container);
}