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
    if (key.startsWith('perm-')) {
        const perm = key.split('-')[1]
        if (event.target.checked) {
            options.disablePerms.push(perm)
        } else {
            const index = options.disablePerms.indexOf(perm)
            options.disablePerms.splice(index, 1)
        }
        await chrome.storage.sync.set({ options })
        return
    }
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
        const number = parseInt(event.target.value)
        if (!isNaN(number) && number >= 1) {
            value = number
        } else {
            value = options[key]
        }
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
    document
        .querySelectorAll('[id^="perm-"]')
        .forEach((el) => (el.checked = false))
    for (let [key, value] of Object.entries(options)) {
        if (typeof value === 'undefined') {
            console.warn('Value undefined for key:', key)
            continue
        }
        if (key === 'disablePerms') {
            for (const perm of value) {
                const el = document.getElementById(`perm-${perm}`)
                if (!el) {
                    continue
                }
                el.checked = true
            }
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
 * Link Click Callback
 * Firefox requires a call to window.close()
 * @function linkClick
 * @param {Event} event
 * @param {Boolean} close
 */
export async function linkClick(event, close = false) {
    console.debug('linkClick:', event, close)
    event.preventDefault()
    const anchor = event.target.closest('a')
    const href = anchor.getAttribute('href').replace(/^\.+/g, '')
    console.debug('href:', href)
    if (href === '#') {
        if (close) window.close()
        return
    }
    let url
    if (href.endsWith('html/options.html')) {
        chrome.runtime.openOptionsPage()
        if (close) window.close()
        return
    } else if (href.endsWith('html/panel.html')) {
        await chrome.windows.create({
            type: 'panel',
            url: '/html/panel.html',
            width: 720,
            height: 480,
        })
        if (close) window.close()
        return
    } else if (href.startsWith('http')) {
        url = href
    } else {
        url = chrome.runtime.getURL(href)
    }
    console.debug('url:', url)
    await activateOrOpen(url)
    if (close) window.close()
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
export function showToast(message, type = 'info') {
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
 * Send Notification
 * @function sendNotification
 * @param {String} title
 * @param {String} text
 * @param {String} id - Optional
 * @param {Number} timeout - Optional
 */
export async function sendNotification(title, text, id = '', timeout = 30) {
    console.debug('sendNotification', title, text, id, timeout)
    const options = {
        type: 'basic',
        iconUrl: chrome.runtime.getURL('/images/logo96.png'),
        title: title,
        message: text,
    }
    if (id) {
        const rand = Math.random().toString().substring(2, 7)
        id = `${id}-${rand}`
    }
    chrome.notifications.create(id, options, function (notification) {
        setTimeout(function () {
            chrome.notifications.clear(notification)
        }, timeout * 1000)
    })
}

/**
 * Update History Table
 * @function getExtensions
 * @return  {Array}
 */
export async function getExtensions() {
    console.debug('getExtensions')
    const extensions = await chrome.management.getAll()
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
        info.hostPermissions = hostPermissions
        info.icon = getIconUrl(info.icons, 32)
        info.uuid = uuid
        info.manifest = `${browserSpec('protocol')}://${uuid}/manifest.json`
        info.permissions = info.permissions || []
        results.push(info)
    }
    results.sort((a, b) => a.name.localeCompare(b.name))
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

export function appendClipSpan(
    parent,
    text,
    clip = false,
    br = false,
    classes = []
) {
    if (!text) {
        return
    }
    const span = document.createElement('span')
    span.textContent = text
    span.classList.add(...classes)
    if (clip) {
        span.classList.add('clip')
        span.dataset.clipboardText = text
        span.setAttribute('role', 'button')
    }
    parent.appendChild(span)
    if (br) {
        parent.appendChild(document.createElement('br'))
    }
}

/**
 * Extension Disabled Callback
 * @function processExtensionChange
 * @param {ExtensionInfo} info
 */
export async function processExtensionChange(info) {
    console.debug('processExtensionChange:', info)
    const self = await chrome.management.getSelf()
    if (info.id === self.id) {
        return console.debug('skipping self')
    }
    let ext
    try {
        ext = await chrome.management.get(info.id)
    } catch (e) {
        console.warn(e)
        return
    }
    console.debug('ext:', ext)
    if (!ext.enabled || !ext.permissions?.length) {
        console.debug('disabled or no permissions')
        return
    }
    const { whitelist } = await chrome.storage.sync.get(['whitelist'])
    // console.debug('whitelist:', whitelist)
    // if (info.id in whitelist) {
    //     console.debug('extension in whitelist:', info.id)
    //     return
    // }
    const { options } = await chrome.storage.sync.get(['options'])
    if (options.autoDisable || !options.disablePerms?.length) {
        console.debug('options:', options.autoDisable, options.disablePerms)
        const perms = []
        for (const perm of ext.permissions) {
            if (options.disablePerms.includes(perm)) {
                console.debug('disable perm:', perm)
                if (whitelist[info.id]?.includes(perm)) {
                    console.debug('whitelisted:', perm)
                } else {
                    perms.push(perm)
                }
            }
        }
        if (perms.length) {
            console.debug('Disable:', ext.id, perms)
            let msg
            try {
                await chrome.management.setEnabled(ext.id, false)
                msg = `${ext.name} disabled due to permission: ${perms.join(', ')}`
            } catch (e) {
                console.debug(e)
                msg = `${ext.name} should be disabled due to permission: ${perms.join(', ')}`
            }
            // console.debug('msg:', msg)
            await sendNotification('Disabled Extension', msg, 'home')
        }
    }
}

/**
 * TODO: Split This into an Event Listener and Function
 * @function processPerms
 * @param {MouseEvent} [event]
 */
export async function processPerms(event) {
    console.debug('processPerms:', event)
    event?.preventDefault()
    const { options } = await chrome.storage.sync.get(['options'])
    if (!options.autoDisable || !options.disablePerms?.length) {
        if (event) {
            console.debug('send notification for event')
            await sendNotification(
                'Disabled Perms Not Configured',
                'You have not configured any disable permissions in Options.',
                'options'
            )
        }
        window.close()
        return console.debug('autoDisable disabled or no disablePerms')
    }
    console.debug('proceed')
    const extensions = await getExtensions()
    // console.debug('processPerms:', extensions)
    for (const info of extensions) {
        await processExtensionChange(info)
    }
    if (event) window.close()
}
