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
    order: [[2, 'asc']],
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
                        columns: [0, 1, 3, 4],
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
    columns: [
        { data: 'enabled' },
        { data: 'manifest' },
        { data: 'name' },
        { data: 'hostPermissions' },
        { data: 'permissions' },
    ],
    columnDefs: [
        {
            targets: 0,
            responsivePriority: 2,
            render: renderSwitch,
            orderable: false,
        },
        {
            targets: 1,
            responsivePriority: 3,
            render: renderButtons,
            orderable: false,
        },
        {
            targets: 2,
            responsivePriority: 1,
            render: renderName,
            orderable: true,
        },
        {
            targets: 3,
            responsivePriority: 4,
            render: renderHosts,
            orderable: false,
        },
        {
            targets: 4,
            responsivePriority: 5,
            render: renderPerms,
            orderable: false,
        },
        {
            targets: '_all',
            visible: true,
        },
    ],
}

let table
let extOptions

/**
 * DOMContentLoaded
 * @function domContentLoaded
 */
async function domContentLoaded() {
    console.debug('domContentLoaded')

    const { options } = await chrome.storage.sync.get(['options'])
    extOptions = options
    console.debug('extOptions:', extOptions)

    const extensions = await getExtensions()
    console.debug('extensions:', extensions)
    table = new DataTable('#extensions-table', dtOptions)
    table.rows.add(extensions).draw()
    window.dispatchEvent(new Event('resize'))

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
        if (!row.enabled) btn.classList.add('disabled')
        div.appendChild(btn)
    }
    return div
}

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
    for (const perm of data) {
        if (extOptions.disablePerms.includes(perm)) {
            const span = document.createElement('span')
            span.classList.add('text-danger')
            span.textContent = perm
            div.appendChild(span)
        } else {
            const text = document.createTextNode(perm)
            div.appendChild(text)
        }
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
