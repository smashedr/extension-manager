// JS Background Service Worker

import { activateOrOpen, getExtensions } from './export.js'

chrome.runtime.onStartup.addListener(onStartup)
chrome.runtime.onInstalled.addListener(onInstalled)
chrome.contextMenus.onClicked.addListener(onClicked)
chrome.commands.onCommand.addListener(onCommand)
chrome.storage.onChanged.addListener(onChanged)

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
    console.debug('setExtensions:', extensions)
    // let { installed } = await chrome.storage.local.get(['installed'])
    const installed = {}
    for (const info of extensions) {
        installed[info.id] = true
    }
    await chrome.storage.local.set({ installed })
}

/**
 * Extension Installed Callback
 * @function extInstalled
 * @param {ExtensionInfo} info
 */
async function extInstalled(info) {
    console.debug('extInstalled:', info)
    let { installed } = await chrome.storage.local.get(['installed'])
    console.debug('installed:', installed)
    if (info.id in installed) {
        await addHistory('update', info)
    } else {
        await addHistory('install', info)
        installed[info.id] = true
        await chrome.storage.local.set({ installed })
    }
}

/**
 * Extension Uninstalled Callback
 * @function extUninstalled
 * @param {ExtensionInfo} info
 */
async function extUninstalled(info) {
    console.debug('extUninstalled:', info)
    let { installed } = await chrome.storage.local.get(['installed'])
    if (info.id in installed) {
        if (delete installed[info.id]) {
            await chrome.storage.local.set({ installed })
        }
    }
    await addHistory('uninstall', info)
}

/**
 * Extension Enabled Callback
 * @function extEnabled
 * @param {ExtensionInfo} info
 */
async function extEnabled(info) {
    console.debug('extEnabled:', info)
    await addHistory('enable', info)
}

/**
 * Extension Disabled Callback
 * @function extDisabled
 * @param {ExtensionInfo} info
 */
async function extDisabled(info) {
    console.debug('extDisabled:', info)
    await addHistory('disable', info)
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
    console.log('addHistory:', action, info)
    let { history } = await chrome.storage.local.get(['history'])
    info.action = action
    info.date = Date.now()
    // console.log('info:', info)
    history.push(info)
    console.debug('history:', history)
    await chrome.storage.local.set({ history })
}
