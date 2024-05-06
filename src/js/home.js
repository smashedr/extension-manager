// JS for home.html

import { showToast } from './export.js'

document.addEventListener('DOMContentLoaded', domContentLoaded)

const extensionsTable = document.getElementById('extensions-table')
const faCircle = document.querySelector('.d-none .fa-circle')

/**
 * DOMContentLoaded
 * @function domContentLoaded
 */
async function domContentLoaded() {
    console.debug('domContentLoaded')
    const { options } = await chrome.storage.sync.get(['options'])
    console.debug('options:', options)
    // const extensions = await chrome.management.getAll()
    const extensions = await getExtensions()
    await updateExtensions(extensions)

    if (chrome.runtime.lastError) {
        showToast(chrome.runtime.lastError.message, 'warning')
    }
}

/**
 * Update History Table
 * @function updateHistory
 * @param {Array} extensions
 */
async function updateExtensions(extensions) {
    console.debug('updateExtensions:', extensions)
    const tbody = extensionsTable.querySelector('tbody')
    tbody.innerHTML = ''
    const tr = extensionsTable.querySelector('tfoot tr')
    for (const ext of extensions) {
        const row = tr.cloneNode(true)
        let cell

        // Icon
        cell = row.cells[0]
        if (ext.icon) {
            const icon = document.createElement('img')
            icon.src = ext.icon
            icon.width = 32
            icon.height = 32
            cell.appendChild(icon)
        }

        // Name, Version, ID, UUID
        cell = row.cells[1]
        const fa = faCircle.cloneNode(true)
        if (ext.enabled) {
            fa.classList.add('text-success')
        } else {
            fa.classList.add('text-danger')
        }
        cell.appendChild(fa)
        if (ext.homepageUrl) {
            const link = document.createElement('a')
            link.textContent = ext.name
            console.debug('ext.name:', ext.name)
            // link.classList.add('link-body-emphasis')
            link.target = '_blank'
            link.rel = 'noopener'
            link.href = ext.homepageUrl
            link.title = ext.homepageUrl
            cell.appendChild(link)
        } else {
            const span = document.createElement('span')
            span.textContent = ext.name
            span.classList.add('text-primary-emphasis')
            cell.appendChild(span)
        }
        cell.appendChild(document.createTextNode(' '))
        const span = document.createElement('span')
        span.classList.add('text-primary')
        span.textContent = `v${ext.version}`
        cell.appendChild(span)
        cell.appendChild(document.createElement('br'))
        cell.appendChild(document.createTextNode(ext.id))
        if (ext.uuid !== ext.id) {
            cell.appendChild(document.createElement('br'))
            cell.appendChild(document.createTextNode(ext.uuid))
        }

        // Buttons
        cell = row.cells[2]
        cell.style.maxWidth = '84px'
        if (ext.enabled) {
            const btn = getButton('Manifest', ext.manifest, 'outline-secondary')
            cell.appendChild(btn)
            if (ext.optionsUrl) {
                const btn = getButton(
                    'Options',
                    ext.optionsUrl,
                    'outline-primary'
                )
                cell.appendChild(btn)
            }
        }

        // Host Permissions
        cell = row.cells[3]
        for (const perm of ext.hostPermissions) {
            cell.appendChild(document.createTextNode(perm))
            cell.appendChild(document.createElement('br'))
        }

        // Permissions
        cell = row.cells[4]
        cell.textContent = ext.permissions?.join(', ') || 'None'

        tbody.appendChild(row)
    }
}

function getButton(text, href, style) {
    // const link = document.createElement('a')
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

/**
 * Update History Table
 * @function getExtensions
 * @return  {Array}
 */
async function getExtensions() {
    const extensions = await chrome.management.getAll()
    console.debug('getExtensions:', extensions)
    const results = []
    for (const ext of extensions) {
        if (
            ext.type !== 'extension' ||
            ext.permissions?.includes('internal:svgContextPropertiesAllowed')
        ) {
            // console.debug('skipping non-extension:', ext)
            continue
        }

        const hostPermissions = []
        let uuid
        if (ext.hostPermissions) {
            for (const hostPerm of ext.hostPermissions) {
                if (hostPerm.startsWith('moz-extension://')) {
                    uuid = hostPerm.split('/')[2]
                } else {
                    hostPermissions.push(hostPerm)
                }
            }
        }
        uuid = uuid || ext.id

        const manifest = `${browserSpec('protocol')}://${uuid}/manifest.json`

        const icon = getIconUrl(ext.icons, 32)

        ext.hostPermissions = hostPermissions
        ext.icon = icon
        ext.uuid = uuid
        ext.manifest = manifest
        results.push(ext)
    }
    return results
}

function browserSpec(key) {
    let data
    if (chrome.runtime.getBrowserInfo) {
        // console.info('Firefox')
        data = {
            protocol: 'moz-extension',
        }
    } else {
        // console.info('Chrome')
        data = {
            protocol: 'chrome-extension',
        }
    }
    return data[key]
}

function getIconUrl(icons, size = 32) {
    console.debug('getIconUrl:', size, icons)
    if (!icons?.length) {
        return null
    }
    for (const icon of icons) {
        if (icon.size === size) {
            return icon.url
        }
    }
    return icons[0].url
}
