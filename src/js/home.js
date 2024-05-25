// JS for home.html

import { appendClipSpan, getExtensions, showToast } from './export.js'

chrome.management.onInstalled.addListener(updateExtensions)
chrome.management.onUninstalled.addListener(updateExtensions)
chrome.management.onEnabled.addListener(updateExtensions)
chrome.management.onDisabled.addListener(updateExtensions)

document.addEventListener('DOMContentLoaded', domContentLoaded)

const dtOptions = {
    info: true,
    processing: true,
    stateSave: false,
    stateSaveParams: function (settings, data) {
        data.search.search = ''
    },
    responsive: true,
    // responsive: {
    //     breakpoints: [
    //         { name: 'name', width: Infinity },
    //         { name: 'permissions', width: 1000 },
    //     ],
    // },
    // fixedColumns: true,
    autoWidth: false,
    order: [[3, 'asc']],
    pageLength: -1,
    lengthMenu: [
        [-1, 10, 25, 50, 100, 250, 500, 1000],
        ['All', 10, 25, 50, 100, 250, 500, 1000],
    ],
    language: {
        emptyTable: 'No History',
        lengthMenu: '_MENU_ Extensions',
        search: 'Filter:',
        searchPlaceholder: 'Type to Filter...',
        zeroRecords: 'No Results',
    },
    rowCallback: function (row, data) {
        // console.log('rowCallback:', row, data)
        row.dataset.id = data.id
        // if (data.id in extWhitelist) {
        //     // $(td).class('bg-success-subtle')
        //     row.classList.add('bg-success-subtle')
        // }
    },
    columns: [
        {
            className: 'dt-control',
            orderable: false,
            data: null,
            defaultContent: '',
            name: 'dt-control',
        },
        { data: 'enabled', name: 'enabled', width: '48px' },
        { data: 'manifest', name: 'manifest' },
        // { data: 'id', name: 'whitelist', width: '28px' },
        { data: 'name', name: 'name' },
        { data: 'hostPermissions', name: 'hostPermissions' },
        { data: 'permissions', name: 'permissions' },
    ],
    columnDefs: [
        {
            targets: ['enabled'],
            render: renderSwitch,
            orderable: false,
            className: 'text-center',
        },
        {
            targets: ['manifest'],
            render: renderButtons,
            orderable: false,
            className: 'text-center',
        },
        // {
        //     targets: ['whitelist'],
        //     render: renderWhitelist,
        //     orderable: false,
        //     className: 'text-center',
        // },
        {
            targets: ['name'],
            render: renderName,
            orderable: true,
        },
        {
            targets: ['hostPermissions'],
            render: renderHosts,
            orderable: false,
        },
        {
            targets: ['permissions'],
            render: renderPerms,
            orderable: false,
            // createdCell: function (td, cellData, rowData, row, col) {
            //     console.log('createdCell:', rowData.id)
            //     if (rowData.id in extWhitelist) {
            //         td.classList.add('bg-success-subtle')
            //     }
            // },
        },
        {
            targets: '_all',
            visible: true,
        },
    ],
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
                        columns: [2, 3, 4],
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
                        title: 'extensions',
                        exportOptions: {
                            orthogonal: 'export',
                            columns:
                                ':visible:not(:first-child):not(:nth-child(2))',
                        },
                    },
                    {
                        extend: 'pdf',
                        text: 'PDF',
                        // className: 'btn-primary',
                        exportOptions: {
                            orthogonal: 'export',
                            // columns: ':visible:not(:eq(0)):not(:eq(0))',
                            columns:
                                ':visible:not(:first-child):not(:nth-child(2))',
                        },
                    },
                    {
                        extend: 'print',
                        text: 'Print',
                        // className: 'btn-primary',
                        exportOptions: {
                            orthogonal: 'export',
                            columns:
                                ':visible:not(:first-child):not(:nth-child(2))',
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
}

let table
let extOptions
let extWhitelist

/**
 * DOMContentLoaded
 * @function domContentLoaded
 */
async function domContentLoaded() {
    console.debug('domContentLoaded')

    const { options } = await chrome.storage.sync.get(['options'])
    extOptions = options
    console.debug('extOptions:', extOptions)

    const { whitelist } = await chrome.storage.sync.get(['whitelist'])
    extWhitelist = whitelist
    console.debug('extWhitelist:', extWhitelist)

    const extensions = await getExtensions()
    console.debug('extensions:', extensions)
    table = new DataTable('#extensions-table', dtOptions)
    table.rows.add(extensions).draw()
    window.dispatchEvent(new Event('resize'))
    table.on('click', 'td.dt-control', tableOnClick)

    // if (chrome.runtime.lastError) {
    //     showToast(chrome.runtime.lastError.message, 'warning')
    // }
}

async function updateExtensions(info) {
    console.info('updateExtensions:', info)
    const extensions = await getExtensions()
    console.debug('extensions:', extensions)
    table.clear()
    table.rows.add(extensions).draw()
    window.dispatchEvent(new Event('resize'))
}

function formatExpand(d) {
    // console.log('formatExpand:', d)
    const div = document.createElement('div')
    if (d.description) {
        const span = document.createElement('span')
        span.innerHTML = `<strong>Description:</strong> ${d.description}`
        div.appendChild(span)
        div.appendChild(document.createElement('br'))
    }
    if (d.hostPermissions?.length) {
        const span = document.createElement('span')
        span.textContent = d.hostPermissions.join(', ')
        span.classList.add('small')
        div.appendChild(span)
        // for (const perm of d.hostPermissions) {
        // }
    }
    return div
    // return `<strong>Description:</strong> ${desc}`
}

function tableOnClick(e) {
    console.log('event:', e.target)
    // if (e.target.nodeName !== 'TD') {
    //     return console.log('click not on td')
    // }
    let tr = e.target.closest('tr')
    let row = table.row(tr)

    if (row.child.isShown()) {
        // This row is already open - close it
        row.child.hide()
    } else {
        // Open this row
        row.child(formatExpand(row.data())).show()
    }
}

function renderSwitch(data, type, row, meta) {
    const div = document.createElement('div')

    // Switch
    const form = document.createElement('div')
    form.classList.add('form-check', 'form-switch')
    const input = document.createElement('input')
    input.classList.add('form-check-input')
    input.type = 'checkbox'
    input.role = 'switch'
    input.dataset.id = row.id
    input.addEventListener('click', toggleExtension)
    if (row.enabled) {
        input.checked = true
    }
    form.appendChild(input)
    div.appendChild(form)

    // Icon
    if (row.icon) {
        const icon = document.createElement('img')
        icon.src = row.icon
        icon.width = 32
        icon.height = 32
        div.appendChild(icon)
    }
    return div
}

function renderName(data, type, row, meta) {
    const div = document.createElement('div')

    // Enable / Disable
    const fa = document.querySelector('.d-none .fa-circle').cloneNode(true)
    if (row.enabled) {
        fa.classList.add('text-success')
    } else {
        fa.classList.add('text-danger')
    }
    fa.addEventListener('click', toggleExtension)
    fa.setAttribute('role', 'button')
    fa.dataset.id = row.id
    div.appendChild(fa)

    // Name / URL
    if (row.homepageUrl) {
        const link = document.createElement('a')
        link.textContent = row.name
        link.target = '_blank'
        link.rel = 'noopener'
        link.href = row.homepageUrl
        link.title = row.homepageUrl
        div.appendChild(link)
    } else {
        appendClipSpan(div, row.name, false, false, ['text-primary-emphasis'])
    }

    // Version
    appendClipSpan(div, ` v${row.version} `, false, false, ['text-primary'])

    // Development
    if (row.installType === 'development') {
        appendClipSpan(div, ' (dev)', false, false)
    }
    div.appendChild(document.createElement('br'))

    // ID / UUID
    appendClipSpan(div, `${row.id} `, true, true, ['text-nowrap'])
    if (row.uuid !== row.id) {
        appendClipSpan(div, row.uuid, true, true, [
            'text-nowrap',
            'text-dark-emphasis',
        ])
    }
    return div
}

function renderButtons(data, type, row, meta) {
    const div = document.createElement('div')

    div.style.maxWidth = '86px'
    const btn = getButton('Manifest', data, 'outline-secondary')
    if (!row.enabled) btn.classList.add('disabled')
    div.appendChild(btn)
    if (row.optionsUrl) {
        const btn = getButton('Options', row.optionsUrl, 'outline-primary')
        btn.classList.remove('my-0')
        btn.classList.add('mb-0')
        if (!row.enabled) btn.classList.add('disabled')
        div.appendChild(btn)
    }
    return div
}

// function renderWhitelist(data, type, row, meta) {
//     const div = document.createElement('div')
//     const input = document.createElement('input')
//     div.appendChild(input)
//     input.classList.add('form-check-input')
//     input.type = 'checkbox'
//     input.ariaLabel = 'Whitelist'
//     input.dataset.id = row.id
//     input.addEventListener('change', whitelistExtension)
//     if (data in extWhitelist) {
//         input.checked = true
//     }
//     return div
// }

function renderHosts(data, type, row, meta) {
    const div = document.createElement('div')
    const number = extOptions.hostsDisplay
    let count = 0
    for (const host of data) {
        const pre = document.createElement('pre')
        pre.textContent = host
        div.appendChild(pre)
        div.appendChild(document.createTextNode(' '))
        count += 1
        if (count === number) {
            break
        }
    }
    if (data.length > number) {
        const text = `+${data.length - number} More...`
        appendClipSpan(div, text, false, false, ['text-danger'])
    }
    return div

    // TODO: Determine why data.splice is not working...

    // if (data.length > 4) {
    //     return 'more than 4'
    // }
    // const div = document.createElement('div')
    // const spliceData = data.splice(0, 4)
    // console.debug('spliceData:', spliceData)
    // for (const host of spliceData) {
    //     const span = document.createElement('pre')
    //     span.textContent = host
    //     div.appendChild(span)
    // }
    // return div

    // // console.log(`${row.name}:`, data)
    // const div = document.createElement('div')
    // const display = document.createElement('div')
    // // console.debug('info.hostPermissions:', info.hostPermissions)
    // // const hostText = data.join('\n')
    // const hostPermissions = data.splice(0, 4)
    // // console.debug('hostPermissions:', hostPermissions)
    // console.log(`${row.name}:`, hostPermissions)
    // for (const host of hostPermissions) {
    //     // appendClipSpan(display, host, false, true, ['text-nowrap'])
    //     const span = document.createElement('pre')
    //     console.log('adding host:', host)
    //     span.textContent = 'wtf'
    //     display.appendChild(span)
    // }
    // // display.classList.add('clip')
    // // display.setAttribute('role', 'button')
    // // display.dataset.clipboardText = hostText
    // div.appendChild(display)
    // // if (data.length) {
    // //     // console.debug('extra hosts count:', row.hostPermissions.length)
    // //     const span = document.createElement('span')
    // //     span.textContent = `+${data.length - 4} More...`
    // //     span.classList.add('text-danger')
    // //     div.appendChild(span)
    // // }
    // return div
}

function renderPerms(data, type, row, meta) {
    if (!data?.length) {
        return ''
    }
    const div = document.createElement('div')
    // if (row.id in extWhitelist) {
    //     div.classList.add('bg-success-subtle')
    // }
    for (const perm of data) {
        const span = document.createElement('span')
        span.textContent = perm
        if (extWhitelist[row.id]?.includes(perm)) {
            span.classList.add('text-success')
        } else if (extOptions.disablePerms.includes(perm)) {
            span.classList.add('text-danger')
        }
        span.setAttribute('role', 'button')
        span.addEventListener('click', whitelistPermission)
        div.appendChild(span)
        div.appendChild(document.createTextNode(', '))
    }
    if (div.children.length) {
        div.removeChild(div.lastChild)
    }
    return div
}

function getButton(text, href, style) {
    const link = document.querySelector('.d-none a').cloneNode(true)
    link.addEventListener('click', openLink)
    link.classList.add(`btn-${style}`)
    link.textContent = text
    link.title = href
    link.dataset.href = href
    return link
}

async function openLink(event) {
    console.debug('openLink:', event)
    event.preventDefault()
    const url = event.target.dataset.href
    await chrome.tabs.create({ active: true, url })
}

async function toggleExtension(event) {
    console.debug('toggleExtension:', event)
    event.preventDefault()
    try {
        const id = event.target.dataset.id
        let info = await chrome.management.get(id)
        await chrome.management.setEnabled(id, !info.enabled)
    } catch (e) {
        showToast(e.toString(), 'danger')
    }
}

async function whitelistPermission(event) {
    console.debug('whitelistPermission:', event)
    const perm = event.target.textContent
    console.debug('perm:', perm)
    event.preventDefault()
    const tr = event.target.closest('tr')
    const id = tr.dataset.id
    console.debug('id:', id)

    try {
        let { whitelist } = await chrome.storage.sync.get(['whitelist'])
        // console.debug('whitelist:', whitelist)
        if (!whitelist[id]) {
            whitelist[id] = []
        }
        if (whitelist[id].includes(perm)) {
            console.debug('remove perm:', perm)
            const index = whitelist[id].indexOf(perm)
            whitelist[id].splice(index, 1)
            event.target.classList.remove('text-success')
            if (extOptions.disablePerms.includes(perm)) {
                event.target.classList.add('text-danger')
            }
        } else {
            console.debug('add perm:', perm)
            whitelist[id].push(perm)
            // event.target.classList.add('text-success')
            event.target.className = 'text-success'
        }
        console.debug('whitelist:', whitelist)
        extWhitelist = whitelist
        await chrome.storage.sync.set({ whitelist })
    } catch (e) {
        showToast(e.toString(), 'danger')
    }
}

// async function whitelistExtension(event) {
//     console.debug('whitelistExtension:', event)
//     event.preventDefault()
//     try {
//         let { whitelist } = await chrome.storage.sync.get(['whitelist'])
//         console.debug('whitelist:', whitelist)
//         const id = event.target.dataset.id
//         console.debug('id:', id)
//         let info = await chrome.management.get(id)
//         console.debug('info:', info)
//         console.debug('event.target.checked:', event.target.checked)
//         if (event.target.checked) {
//             whitelist[id] = true
//         } else if (id in whitelist) {
//             delete whitelist[id]
//         }
//         console.debug('whitelist:', whitelist)
//         extWhitelist = whitelist
//         await chrome.storage.sync.set({ whitelist })
//     } catch (e) {
//         showToast(e.toString(), 'danger')
//     }
// }
