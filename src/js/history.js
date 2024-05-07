// JS for home.html

import { showToast } from './export.js'

chrome.storage.onChanged.addListener(onChanged)

document.addEventListener('DOMContentLoaded', domContentLoaded)

const historyTable = document.getElementById('history-table')

/**
 * DOMContentLoaded
 * @function domContentLoaded
 */
async function domContentLoaded() {
    console.debug('domContentLoaded')
    const { history } = await chrome.storage.local.get(['history'])
    console.debug('updateExtensions:', history)
    updateHistory(history)

    if (chrome.runtime.lastError) {
        showToast(chrome.runtime.lastError.message, 'warning')
    }
}

/**
 * Update History Table
 * @function updateExtensions
 */
async function updateHistory(history) {
    console.debug('updateExtensions:', history)
    const tbody = historyTable.querySelector('tbody')
    tbody.innerHTML = ''
    const tr = historyTable.querySelector('tfoot tr')
    for (const info of history.reverse()) {
        // console.debug('info:', info)
        const row = tr.cloneNode(true)
        let cell

        // Name, Version, ID, UUID
        cell = row.cells[0]
        cell.textContent = info.action

        // Name
        cell = row.cells[1]
        cell.textContent = info.name

        // ID
        cell = row.cells[2]
        cell.textContent = info.id

        // Name, Version, ID, UUID
        cell = row.cells[3]
        const date = new Date(info.date)
        cell.textContent = date.toLocaleString()

        tbody.appendChild(row)
    }
}

/**
 * On Changed Callback
 * @function onChanged
 * @param {Object} changes
 * @param {String} namespace
 */
function onChanged(changes, namespace) {
    console.debug('onChanged:', changes, namespace)
    for (const [key, { newValue }] of Object.entries(changes)) {
        if (namespace === 'local' && key === 'history' && newValue) {
            updateHistory(newValue)
        }
    }
}
