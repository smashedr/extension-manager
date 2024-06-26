// JS for home.html

// import { showToast } from './export.js'

// chrome.storage.onChanged.addListener(onChanged)

document.addEventListener('DOMContentLoaded', domContentLoaded)

const dtOptions = {
    info: true,
    processing: true,
    stateSave: false,
    stateSaveParams: function (settings, data) {
        data.search.search = ''
    },
    responsive: true,
    order: [[4, 'des']],
    pageLength: -1,
    lengthMenu: [
        [-1, 10, 25, 50, 100, 250, 500, 1000],
        ['All', 10, 25, 50, 100, 250, 500, 1000],
    ],
    language: {
        emptyTable: 'No Extensions',
        lengthMenu: '_MENU_ History',
        search: 'Filter:',
        searchPlaceholder: 'Type to Filter...',
        zeroRecords: 'No Results',
    },
    layout: {
        top2Start: {
            buttons: {
                dom: {
                    button: {
                        className: 'btn btn-sm btn-outline-primary',
                    },
                },
                buttons: [
                    {
                        extend: 'colvis',
                        text: 'Column Visibility',
                        // className: 'btn-primary',
                        columns: [1, 2, 3],
                        postfixButtons: ['colvisRestore'],
                    },
                    {
                        extend: 'copy',
                        text: 'Copy',
                        // className: 'btn-primary',
                        title: null,
                        exportOptions: {
                            orthogonal: 'export',
                            columns: ':visible',
                        },
                    },
                    {
                        extend: 'csv',
                        text: 'CSV',
                        // className: 'btn-primary',
                        title: 'alltime',
                        exportOptions: {
                            orthogonal: 'export',
                            columns: ':visible',
                        },
                    },
                    {
                        extend: 'pdf',
                        text: 'PDF',
                        // className: 'btn-primary',
                        exportOptions: {
                            orthogonal: 'export',
                            columns: ':visible',
                        },
                    },
                    {
                        extend: 'print',
                        text: 'Print',
                        // className: 'btn-primary',
                        exportOptions: {
                            orthogonal: 'export',
                            columns: ':visible',
                        },
                    },
                ],
            },
        },
        topStart: 'pageLength',
        // top2End: {
        //     buttons: ['copy', 'csv', 'excel', 'pdf', 'print'],
        // },
        topEnd: 'search',
    },
    columns: [
        { data: 'name' },
        { data: 'version' },
        { data: 'id' },
        // { data: 'description' },
        { data: 'date' },
    ],
    columnDefs: [
        {
            targets: 0,
        },
        {
            targets: 1,
        },
        {
            targets: 2,
        },
        // {
        //     targets: 3,
        // },
        {
            targets: 3,
            render: DataTable.render.datetime('kk:mm MMM DD, YYYY'),
        },
        {
            targets: '_all',
            visible: true,
        },
    ],
}

let table

/**
 * DOMContentLoaded
 * @function domContentLoaded
 */
async function domContentLoaded() {
    console.debug('domContentLoaded')
    const { alltime } = await chrome.storage.sync.get(['alltime'])
    console.debug('alltime:', alltime)
    const data = []
    for (const [key, value] of Object.entries(alltime)) {
        value.id = key
        data.push(value)
    }
    console.debug('data:', data)
    table = new DataTable('#alltime-table', dtOptions)
    table.rows.add(data).draw()
    window.dispatchEvent(new Event('resize'))

    // if (chrome.runtime.lastError) {
    //     showToast(chrome.runtime.lastError.message, 'warning')
    // }
}

// /**
//  * On Changed Callback
//  * @function onChanged
//  * @param {Object} changes
//  * @param {String} namespace
//  */
// function onChanged(changes, namespace) {
//     console.debug('onChanged:', changes, namespace)
//     for (const [key, { newValue }] of Object.entries(changes)) {
//         if (namespace === 'local' && key === 'alltime' && newValue?.length) {
//             // console.log('newValue:', newValue)
//             const item = newValue.slice(-1)[0]
//             console.log('table.row.add:', item)
//             table.row.add(item).draw()
//         }
//     }
// }

function renderAction(data, type, row, meta) {
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
