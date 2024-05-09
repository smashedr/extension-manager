// JS for home.html

import { appendClipSpan, getExtensions, showToast } from './export.js'

chrome.management.onInstalled.addListener(updateExtensions)
chrome.management.onUninstalled.addListener(updateExtensions)
chrome.management.onEnabled.addListener(updateExtensions)
chrome.management.onDisabled.addListener(updateExtensions)

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
    await updateExtensions()

    if (chrome.runtime.lastError) {
        showToast(chrome.runtime.lastError.message, 'warning')
    }
}

/**
 * Update Extensions Table
 * @function updateExtensions
 */
async function updateExtensions() {
    const extensions = await getExtensions()
    console.debug('updateExtensions:', extensions)
    const tbody = extensionsTable.querySelector('tbody')
    tbody.innerHTML = ''
    const tr = extensionsTable.querySelector('tfoot tr')
    for (const info of extensions) {
        const row = tr.cloneNode(true)
        let cell

        // Icon
        cell = row.cells[0]
        if (info.icon) {
            const icon = document.createElement('img')
            icon.src = info.icon
            icon.width = 32
            icon.height = 32
            cell.appendChild(icon)
        }

        // Name, Version, ID, UUID
        cell = row.cells[1]
        const fa = faCircle.cloneNode(true)
        if (info.enabled) {
            fa.classList.add('text-success')
        } else {
            fa.classList.add('text-danger')
        }
        fa.addEventListener('click', toggleExtension)
        fa.setAttribute('role', 'button')
        fa.dataset.id = info.id
        cell.appendChild(fa)
        if (info.homepageUrl) {
            const link = document.createElement('a')
            link.textContent = info.name
            // console.debug('info.name:', info.name)
            // link.classList.add('link-body-emphasis')
            link.target = '_blank'
            link.rel = 'noopener'
            link.href = info.homepageUrl
            link.title = info.homepageUrl
            cell.appendChild(link)
        } else {
            const span = document.createElement('span')
            span.textContent = info.name
            span.classList.add('text-primary-emphasis')
            cell.appendChild(span)
        }
        cell.appendChild(document.createTextNode(' '))
        const span = document.createElement('span')
        span.classList.add('text-primary')
        span.textContent = `v${info.version}`
        cell.appendChild(span)
        cell.appendChild(document.createElement('br'))
        const span2 = document.createElement('span')
        span2.classList.add('clip')
        span2.setAttribute('role', 'button')
        span2.dataset.clipboardText = info.id
        span2.textContent = info.id
        cell.appendChild(span2)
        if (info.uuid !== info.id) {
            cell.appendChild(document.createElement('br'))
            cell.appendChild(document.createTextNode(info.uuid))
        }

        // Buttons
        cell = row.cells[2]
        cell.style.maxWidth = '84px'
        if (info.enabled) {
            const btn = getButton(
                'Manifest',
                info.manifest,
                'outline-secondary'
            )
            cell.appendChild(btn)
            if (info.optionsUrl) {
                const btn = getButton(
                    'Options',
                    info.optionsUrl,
                    'outline-primary'
                )
                cell.appendChild(btn)
            }
        }

        // Host Permissions
        cell = row.cells[3]
        for (const perm of info.hostPermissions) {
            cell.appendChild(document.createTextNode(perm))
            cell.appendChild(document.createElement('br'))
        }

        // Permissions
        cell = row.cells[4]
        cell.textContent = info.permissions?.join(', ') || 'None'

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
