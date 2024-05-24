// JS Background Service Worker

import { activateOrOpen, getExtensions } from './export.js'

chrome.runtime.onStartup.addListener(onStartup)
chrome.runtime.onInstalled.addListener(onInstalled)
chrome.contextMenus.onClicked.addListener(onClicked)
chrome.commands.onCommand.addListener(onCommand)
chrome.storage.onChanged.addListener(onChanged)
chrome.notifications.onClicked.addListener(notificationsClicked)

chrome.management.onInstalled.addListener(extInstalled)
chrome.management.onUninstalled.addListener(extUninstalled)
chrome.management.onEnabled.addListener(extEnabled)
chrome.management.onDisabled.addListener(extDisabled)

/**
 * On Startup Callback
 * @function onStartup
 */
async function onStartup() {
    console.log('onStartup')
    await setExtensions()
    if (typeof browser !== 'undefined') {
        console.log('Firefox CTX Menu Workaround')
        const { options } = await chrome.storage.sync.get(['options'])
        console.debug('options:', options)
        if (options.contextMenu) {
            createContextMenus()
        }
    }
}

/**
 * On Installed Callback
 * @function onInstalled
 * @param {InstalledDetails} details
 */
async function onInstalled(details) {
    console.log('onInstalled:', details)
    const githubURL = 'https://github.com/smashedr/extension-manager'
    const options = await Promise.resolve(
        setDefaultOptions({
            hostsDisplay: 4,
            autoDisable: true,
            disablePerms: ['downloads.open'],
            contextMenu: true,
            showUpdate: false,
        })
    )
    console.debug('options:', options)
    if (options.contextMenu) {
        createContextMenus()
    }
    if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        chrome.runtime.openOptionsPage()
    } else if (details.reason === chrome.runtime.OnInstalledReason.UPDATE) {
        if (options.showUpdate) {
            const manifest = chrome.runtime.getManifest()
            if (manifest.version !== details.previousVersion) {
                const url = `${githubURL}/releases/tag/${manifest.version}`
                await chrome.tabs.create({ active: false, url })
            }
        }
    }
    await chrome.runtime.setUninstallURL(`${githubURL}/issues`)
    await setExtensions()
}

/**
 * On Clicked Callback
 * @function onClicked
 * @param {OnClickData} ctx
 * @param {chrome.tabs.Tab} tab
 */
async function onClicked(ctx, tab) {
    console.debug('onClicked:', ctx, tab)
    if (ctx.menuItemId === 'openOptions') {
        chrome.runtime.openOptionsPage()
    } else if (ctx.menuItemId === 'openHome') {
        const url = chrome.runtime.getURL('/html/home.html')
        activateOrOpen(url)
    } else if (ctx.menuItemId === 'openHistory') {
        const url = chrome.runtime.getURL('/html/history.html')
        activateOrOpen(url)
    } else if (ctx.menuItemId === 'showPanel') {
        await chrome.windows.create({
            type: 'panel',
            url: '/html/panel.html',
            width: 720,
            height: 480,
        })
    } else {
        console.error(`Unknown ctx.menuItemId: ${ctx.menuItemId}`)
    }
}

/**
 * On Command Callback
 * @function onCommand
 * @param {String} command
 */
async function onCommand(command) {
    console.debug(`onCommand: ${command}`)
    if (command === 'openHome') {
        const url = chrome.runtime.getURL('/html/home.html')
        activateOrOpen(url)
    } else if (command === 'showPanel') {
        await chrome.windows.create({
            type: 'panel',
            url: '/html/panel.html',
            width: 480,
            height: 360,
        })
    }
}

/**
 * On Changed Callback
 * @function onChanged
 * @param {Object} changes
 * @param {String} namespace
 */
function onChanged(changes, namespace) {
    // console.debug('onChanged:', changes, namespace)
    for (const [key, { oldValue, newValue }] of Object.entries(changes)) {
        if (namespace === 'sync' && key === 'options' && oldValue && newValue) {
            if (oldValue.contextMenu !== newValue.contextMenu) {
                if (newValue?.contextMenu) {
                    console.info('Enabled contextMenu...')
                    createContextMenus()
                } else {
                    console.info('Disabled contextMenu...')
                    chrome.contextMenus.removeAll()
                }
            }
        }
    }
}

/**
 * Notifications On Clicked Callback
 * @function notificationsClicked
 * @param {String} notificationId
 */
async function notificationsClicked(notificationId) {
    console.debug('notifications.onClicked:', notificationId)
    chrome.notifications.clear(notificationId)
    const url = chrome.runtime.getURL('/html/home.html')
    console.debug('url:', url)
    activateOrOpen(url)
}

/**
 * Create Context Menus
 * @function createContextMenus
 */
function createContextMenus() {
    console.debug('createContextMenus')
    chrome.contextMenus.removeAll()
    const contexts = [
        [['all'], 'openHome', 'normal', 'Extension Manager'],
        [['all'], 'openHistory', 'normal', 'Extension History'],
        [['all'], 'showPanel', 'normal', 'Show Panel'],
        [['all'], 's-1', 'separator', ''],
        [['all'], 'openOptions', 'normal', 'Open Options'],
    ]
    contexts.forEach((context) => {
        chrome.contextMenus.create({
            contexts: context[0],
            id: context[1],
            type: context[2],
            title: context[3],
        })
    })
}

/**
 * Set Default Options
 * @function setDefaultOptions
 * @param {Object} defaultOptions
 * @return {Object}
 */
async function setDefaultOptions(defaultOptions) {
    console.log('setDefaultOptions', defaultOptions)
    let { history } = await chrome.storage.local.get(['history'])
    if (!history) {
        history = []
        await chrome.storage.local.set({ history })
        console.log('initialize empty history')
    }
    let { alltime } = await chrome.storage.sync.get(['alltime'])
    if (!alltime) {
        alltime = {}
        await chrome.storage.sync.set({ alltime })
        console.log('initialize empty alltime')
    }
    let { options } = await chrome.storage.sync.get(['options'])
    options = options || {}
    let changed = false
    for (const [key, value] of Object.entries(defaultOptions)) {
        // console.log(`${key}: default: ${value} current: ${options[key]}`)
        if (options[key] === undefined) {
            changed = true
            options[key] = value
            console.log(`Set ${key}:`, value)
        }
    }
    if (changed) {
        await chrome.storage.sync.set({ options })
        console.log('changed:', options)
    }
    return options
}

async function setExtensions() {
    const extensions = await getExtensions()
    console.debug('setExtensions: extensions:', extensions)
    // let { installed } = await chrome.storage.local.get(['installed'])
    const { alltime } = await chrome.storage.sync.get(['alltime'])
    // console.log('alltime', alltime)
    let changed = false
    const installed = {}
    for (const info of extensions) {
        // console.log('info:', info)
        installed[info.id] = true
        if (!(info.id in alltime)) {
            // console.debug('add alltime:', info)
            changed = true
            alltime[info.id] = {
                name: info.name,
                version: info.version,
                // description: info.description,
                homepageUrl: info.homepageUrl,
                date: Date.now(),
            }
        }
    }
    await chrome.storage.local.set({ installed })
    if (changed) {
        await chrome.storage.sync.set({ alltime })
    }
}

/**
 * Extension Installed Callback
 * @function extInstalled
 * @param {ExtensionInfo} info
 */
async function extInstalled(info) {
    console.debug('extInstalled:', info)
    const ext = await chrome.management.get(info.id)
    console.debug('ext:', ext)
    let { installed } = await chrome.storage.local.get(['installed'])
    console.debug('installed:', installed)
    if (ext.id in installed) {
        await addHistory('update', ext)
    } else {
        await addHistory('install', ext)
        installed[ext.id] = true
        await chrome.storage.local.set({ installed })
    }
    await processExtensionChange(ext)
}

/**
 * Extension Uninstalled Callback
 * @function extUninstalled
 * @param {ExtensionInfo} info
 */
async function extUninstalled(info) {
    console.debug('extUninstalled:', info)
    const ext = await chrome.management.get(info.id)
    console.debug('ext:', ext)
    let { installed } = await chrome.storage.local.get(['installed'])
    if (ext.id in installed) {
        if (delete installed[ext.id]) {
            await chrome.storage.local.set({ installed })
        }
    }
    await addHistory('uninstall', ext)
}

/**
 * Extension Enabled Callback
 * @function extEnabled
 * @param {ExtensionInfo} info
 */
async function extEnabled(info) {
    console.debug('extEnabled:', info)
    const ext = await chrome.management.get(info.id)
    console.debug('ext:', ext)
    await addHistory('enable', ext)
    await processExtensionChange(ext)
}

/**
 * Extension Disabled Callback
 * @function extDisabled
 * @param {ExtensionInfo} info
 */
async function extDisabled(info) {
    console.debug('extDisabled:', info)
    const ext = await chrome.management.get(info.id)
    console.debug('ext:', ext)
    await addHistory('disable', ext)
}

/**
 * Extension Disabled Callback
 * @function processExtensionChange
 * @param {ExtensionInfo} info
 */
async function processExtensionChange(info) {
    console.debug('processExtensionChange:', info)
    const ext = await chrome.management.get(info.id)
    console.debug('ext:', ext)
    console.debug('ext.permissions:', ext.permissions)
    const { options } = await chrome.storage.sync.get(['options'])
    if (options.disablePerms) {
        const perms = []
        for (const perm of ext.permissions) {
            if (options.disablePerms.includes(perm)) {
                perms.push(perm)
            }
        }
        if (perms.length) {
            console.log('Disable:', ext.id, perms)
            let msg
            try {
                await chrome.management.setEnabled(ext.id, false)
                msg = `${ext.name} disabled due to permission: ${perms.join(', ')}`
            } catch (e) {
                console.debug(e)
                msg = `${ext.name} should be disabled due to permission: ${perms.join(', ')}`
            }
            console.log('msg:', msg)
            await sendNotification('Disabled Extension', msg)
        }
    }
}

/**
 * Extension Disabled Callback
 * @function extDisabled
 * @param {String} action
 * @param {ExtensionInfo} info
 */
async function addHistory(action, info) {
    if (['extension-manager@cssnr.com'].includes(info.id)) {
        return console.debug('skipping self')
    }
    if (info.type !== 'extension' || info.id.endsWith('@search.mozilla.org')) {
        return console.debug('skipping non-extension', info)
    }
    console.log(`addHistory: ${action}:`, info)
    let { history } = await chrome.storage.local.get(['history'])
    info.action = action
    info.date = Date.now()
    history.push(info)
    // console.debug('history:', history)
    await chrome.storage.local.set({ history })

    // console.debug('update alltime:', info)
    const { alltime } = await chrome.storage.sync.get(['alltime'])
    alltime[info.id] = {
        name: info.name,
        version: info.version,
        // description: info.description,
        homepageUrl: info.homepageUrl,
        date: Date.now(),
    }
    await chrome.storage.sync.set({ alltime })
}

/**
 * Send Notification
 * @function sendNotification
 * @param {String} title
 * @param {String} text
 * @param {String} id - Optional
 * @param {Number} timeout - Optional
 */
async function sendNotification(title, text, id = '', timeout = 10) {
    console.debug('sendNotification', title, text, id, timeout)
    const options = {
        type: 'basic',
        iconUrl: chrome.runtime.getURL('/images/logo96.png'),
        title: title,
        message: text,
    }
    chrome.notifications.create(id, options, function (notification) {
        setTimeout(function () {
            chrome.notifications.clear(notification)
        }, timeout * 1000)
    })
}
