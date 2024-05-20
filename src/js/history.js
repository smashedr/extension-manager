// JS for home.html

import { showToast } from './export.js'

chrome.storage.onChanged.addListener(onChanged)

document.addEventListener('DOMContentLoaded', domContentLoaded)

const dtOptions = {
    info: true,
    processing: true,
    saveState: true,
    responsive: true,
    order: [[4, 'des']],
    pageLength: 100,
    lengthMenu: [
        [-1, 10, 25, 50, 100, 250, 500, 1000],
        ['All', 10, 25, 50, 100, 250, 500, 1000],
    ],
    language: {
        emptyTable: 'No History',
        lengthMenu: '_MENU_ items',
        search: 'Filter:',
        zeroRecords: 'No Results',
    },
    layout: {
        top2Start: {
            buttons: ['columnsToggle'],
        },
        topStart: 'pageLength',
    },
    columns: [
        { data: 'action' },
        { data: 'version' },
        { data: 'name' },
        { data: 'id' },
        { data: 'date' },
    ],
    columnDefs: [
        {
            targets: 0,
            responsivePriority: 1,
            className: 'text-capitalize',
            render: renderAction,
        },
        { targets: 2, responsivePriority: 1, render: renderName },
        {
            targets: 4,
            render: DataTable.render.datetime('kk:mm - MMM DD, YYYY'),
        },
        { targets: '_all', visible: true },
    ],
}

let table

/**
 * DOMContentLoaded
 * @function domContentLoaded
 */
async function domContentLoaded() {
    console.debug('domContentLoaded')
    const { history } = await chrome.storage.local.get(['history'])
    console.debug('history:', history)
    table = new DataTable('#history-table', dtOptions)
    const data = history.reverse()
    table.rows.add(data).draw()
    window.dispatchEvent(new Event('resize'))

    if (chrome.runtime.lastError) {
        showToast(chrome.runtime.lastError.message, 'warning')
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
        if (namespace === 'local' && key === 'history' && newValue?.length) {
            // console.log('newValue:', newValue)
            const item = newValue.slice(-1)[0]
            console.log('table.row.add:', item)
            table.row.add(item).draw()
        }
    }
}

function renderAction(data, type, row, meta) {
    // TODO: Determine how to set className from this function
    // console.debug('renderAction:', data, type, row, meta)
    const span = document.createElement('span')
    span.textContent = data
    if (data === 'install') {
        span.classList.add('text-success')
    } else if (data === 'uninstall') {
        span.classList.add('text-danger')
    } else if (data === 'enable') {
        span.classList.add('text-success-emphasis')
    } else if (data === 'disable') {
        span.classList.add('text-warning-emphasis')
    }
    return span
}

function renderName(data, type, row, meta) {
    if (row.installType === 'development') {
        return `${data} (dev)`
    } else {
        return data
    }
}

// function renderDate(data, type, row, meta) {
//     const date = new Date(data)
//     return date.toLocaleString()
// }
