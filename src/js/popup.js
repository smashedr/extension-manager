// JS for popup.html

import {
    linkClick,
    processPerms,
    saveOptions,
    showToast,
    updateManifest,
    updateOptions,
} from './export.js'

document.addEventListener('DOMContentLoaded', initPopup)
document
    .querySelectorAll('a[href]')
    .forEach((el) =>
        el.addEventListener('click', (event) => linkClick(event, true))
    )
document
    .querySelectorAll('#options-form input')
    .forEach((el) => el.addEventListener('change', saveOptions))
document
    .querySelectorAll('[data-bs-toggle="tooltip"]')
    .forEach((el) => new bootstrap.Tooltip(el))
document.querySelectorAll('.process-perms').forEach((el) =>
    el.addEventListener('click', (e) => {
        e.preventDefault()
        chrome.runtime.sendMessage('processPerms')
        window.close()
    })
)

/**
 * Initialize Popup
 * @function initPopup
 */
async function initPopup() {
    console.debug('initPopup')
    updateManifest()

    const { options } = await chrome.storage.sync.get(['options'])
    console.debug('options:', options)
    updateOptions(options)

    if (chrome.runtime.lastError) {
        showToast(chrome.runtime.lastError.message, 'warning')
    }
}
