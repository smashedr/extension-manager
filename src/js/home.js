// JS for home.html

import {
    appendClipSpan,
    getExtensions,
    linkClick,
    showToast,
} from './export.js'

chrome.management.onInstalled.addListener(updateExtensions)
chrome.management.onUninstalled.addListener(updateExtensions)
chrome.management.onEnabled.addListener(updateExtensions)
chrome.management.onDisabled.addListener(updateExtensions)

document.addEventListener('DOMContentLoaded', domContentLoaded)

// document
//     .querySelectorAll('a[href]')
//     .forEach((el) => el.addEventListener('click', linkClick))

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
        const outer = document.createElement('div')
        outer.classList.add('form-check', 'form-switch')
        //   <input class="form-check-input" type="checkbox" role="switch" >
        const inner = document.createElement('input')
        inner.classList.add('form-check-input')
        inner.type = 'checkbox'
        inner.role = 'switch'
        inner.dataset.id = info.id
        inner.addEventListener('click', toggleExtension)
        if (info.enabled) {
            inner.checked = true
        }
        outer.appendChild(inner)
        cell.appendChild(outer)
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

        console.log('info.installType:', info.installType)
        if (info.installType === 'development') {
            const span = document.createElement('span')
            // span.classList.add('text-primary')
            span.textContent = ' (dev) '
            cell.appendChild(span)
        }

        const span = document.createElement('span')
        span.classList.add('text-primary')
        span.textContent = `v${info.version}`
        cell.appendChild(span)
        cell.appendChild(document.createElement('br'))
        appendClipSpan(cell, info.id, true, true, ['text-nowrap'])
        if (info.uuid !== info.id) {
            appendClipSpan(cell, info.uuid, true, true, [
                'text-nowrap',
                'text-dark-emphasis',
            ])
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
        const displayCount = 4
        console.debug('info.hostPermissions:', info.hostPermissions)
        const hostText = info.hostPermissions.join('\n')
        console.debug('hostText:', hostText)
        const hostPermissions = info.hostPermissions.splice(0, displayCount)
        const div = document.createElement('div')
        for (const host of hostPermissions) {
            appendClipSpan(div, host, false, true, ['text-nowrap'])
        }
        div.classList.add('clip')
        div.setAttribute('role', 'button')
        div.dataset.clipboardText = hostText
        cell.appendChild(div)
        if (info.hostPermissions.length) {
            console.debug('extra hosts count:', info.hostPermissions.length)
            span.textContent = `+${info.hostPermissions.length - displayCount} More...`
            span.classList.add('text-danger')
            cell.appendChild(span)
        }

        // Permissions
        const perm = info.permissions?.join(', ') || ''
        appendClipSpan(row.cells[4], perm)

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
