// JS for home.html

import { appendClipSpan, linkClick, showToast } from './export.js'

chrome.storage.onChanged.addListener(onChanged)

document.addEventListener('DOMContentLoaded', domContentLoaded)

document
    .querySelectorAll('a[href]')
    .forEach((el) => el.addEventListener('click', linkClick))

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
        cell.classList.add('text-capitalize')
        cell.textContent = info.action
        console.log(info.action)
        if (info.action === 'install') {
            cell.classList.add('text-success')
        } else if (info.action === 'uninstall') {
            cell.classList.add('text-danger')
        } else if (info.action === 'enable') {
            cell.classList.add('text-success-emphasis')
        } else if (info.action === 'disable') {
            cell.classList.add('text-warning-emphasis')
        }

        // Version
        appendClipSpan(row.cells[1], info.version)

        // Name
        appendClipSpan(row.cells[2], info.name)

        // ID
        appendClipSpan(row.cells[3], info.id)

        // Name, Version, ID, UUID
        const date = new Date(info.date)
        appendClipSpan(row.cells[4], date.toLocaleString())

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
