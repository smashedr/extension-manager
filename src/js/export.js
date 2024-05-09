// JS Exports

/**
 * Save Options Callback
 * @function saveOptions
 * @param {InputEvent} event
 */
export async function saveOptions(event) {
    console.debug('saveOptions:', event)
    const { options } = await chrome.storage.sync.get(['options'])
    let key = event.target.id
    let value
    if (event.target.type === 'radio') {
        key = event.target.name
        const radios = document.getElementsByName(key)
        for (const input of radios) {
            if (input.checked) {
                value = input.id
                break
            }
        }
    } else if (event.target.type === 'checkbox') {
        value = event.target.checked
    } else if (event.target.type === 'number') {
        value = event.target.value.toString()
    } else {
        value = event.target.value
    }
    if (value !== undefined) {
        options[key] = value
        console.info(`Set: ${key}:`, value)
        await chrome.storage.sync.set({ options })
    } else {
        console.warn('No Value for key:', key)
    }
}

/**
 * Update Options based on type
 * @function initOptions
 * @param {Object} options
 */
export function updateOptions(options) {
    console.debug('updateOptions:', options)
    for (let [key, value] of Object.entries(options)) {
        if (typeof value === 'undefined') {
            console.warn('Value undefined for key:', key)
            continue
        }
        if (key.startsWith('radio')) {
            key = value
            value = true
        }
        // console.debug(`${key}: ${value}`)
        const el = document.getElementById(key)
        if (!el) {
            continue
        }
        if (el.tagName !== 'INPUT') {
            el.textContent = value.toString()
        } else if (el.type === 'checkbox') {
            el.checked = value
        } else {
            el.value = value
        }
        if (el.dataset.related) {
            hideShowElement(`#${el.dataset.related}`, value)
        }
    }
}

function hideShowElement(selector, show, speed = 'fast') {
    const element = $(`${selector}`)
    // console.debug('hideShowElement:', show, element)
    if (show) {
        element.show(speed)
    } else {
        element.hide(speed)
    }
}

/**
 * Activate or Open Tab from URL
 * @function activateOrOpen
 * @param {String} url
 * @param {Boolean} [open]
 * @return {Boolean}
 */
export async function activateOrOpen(url, open = true) {
    console.debug('activateOrOpen:', url)
    const tabs = await chrome.tabs.query({ currentWindow: true })
    // console.debug('tabs:', tabs)
    for (const tab of tabs) {
        if (tab.url === url) {
            console.debug('tab:', tab)
            await chrome.tabs.update(tab.id, { active: true })
            return
        }
    }
    if (open) {
        await chrome.tabs.create({ active: true, url })
    }
}

/**
 * Show Bootstrap Toast
 * @function showToast
 * @param {String} message
 * @param {String} type
 */
export function showToast(message, type = 'success') {
    console.debug(`showToast: ${type}: ${message}`)
    const clone = document.querySelector('.d-none .toast')
    const container = document.getElementById('toast-container')
    if (!clone || !container) {
        return console.warn('Missing clone or container:', clone, container)
    }
    const element = clone.cloneNode(true)
    element.querySelector('.toast-body').innerHTML = message
    element.classList.add(`text-bg-${type}`)
    container.appendChild(element)
    const toast = new bootstrap.Toast(element)
    element.addEventListener('mousemove', () => toast.hide())
    toast.show()
}

/**
 * Update History Table
 * @function getExtensions
 * @return  {Array}
 */
export async function getExtensions() {
    const extensions = await chrome.management.getAll()
    console.debug('getExtensions:', extensions)
    const results = []
    for (const info of extensions) {
        if (
            info.type !== 'extension' ||
            info.id.endsWith('@search.mozilla.org')
        ) {
            continue
        }

        const hostPermissions = []
        let uuid
        if (info.hostPermissions) {
            for (const hostPerm of info.hostPermissions) {
                if (hostPerm.startsWith('moz-extension://')) {
                    uuid = hostPerm.split('/')[2]
                } else {
                    hostPermissions.push(hostPerm)
                }
            }
        }
        uuid = uuid || info.id

        const manifest = `${browserSpec('protocol')}://${uuid}/manifest.json`

        const icon = getIconUrl(info.icons, 32)

        info.hostPermissions = hostPermissions
        info.icon = icon
        info.uuid = uuid
        info.manifest = manifest
        results.push(info)
    }
    return results
}

function browserSpec(key) {
    let data
    if (chrome.runtime.getBrowserInfo) {
        // console.debug('Firefox')
        data = {
            protocol: 'moz-extension',
        }
    } else {
        // console.debug('Chrome')
        data = {
            protocol: 'chrome-extension',
        }
    }
    return data[key]
}

function getIconUrl(icons, size = 32) {
    // console.debug('getIconUrl:', size, icons)
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

export function appendClipSpan(parent, text) {
    const span = document.createElement('span')
    span.textContent = text
    span.classList.add('clip')
    span.setAttribute('role', 'button')
    span.dataset.clipboardText = text
    parent.appendChild(span)
}
