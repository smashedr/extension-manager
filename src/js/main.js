// JS for links.html and options.html

import { showToast } from './export.js'

// Manually Set Theme for DataTables
let prefers = window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
let html = document.querySelector('html')
html.classList.add(prefers)
html.setAttribute('data-bs-theme', prefers)

document.querySelectorAll('.open-options').forEach((el) =>
    el.addEventListener('click', (e) => {
        e.preventDefault()
        chrome.runtime.openOptionsPage()
    })
)

const backToTop = document.getElementById('back-to-top')
if (backToTop) {
    window.addEventListener('scroll', debounce(onScroll))
    backToTop.addEventListener('click', () => {
        document.body.scrollTop = 0
        document.documentElement.scrollTop = 0
    })
}

if (typeof ClipboardJS !== 'undefined') {
    const clipboard = new ClipboardJS('.clip')
    clipboard.on('success', function (event) {
        // console.debug('clipboard.success:', event)
        const text = event.text.trim()
        console.debug(`text: "${text}"`)
        if (event.trigger.dataset.toast) {
            showToast(event.trigger.dataset.toast)
        } else {
            showToast('Copied to Clipboard')
        }
    })
    clipboard.on('error', function (event) {
        // console.debug('clipboard.error:', event)
        showToast('Clipboard Copy Failed', 'warning')
    })
}

/**
 * On Scroll Callback
 * @function onScroll
 */
function onScroll() {
    if (
        document.body.scrollTop > 20 ||
        document.documentElement.scrollTop > 20
    ) {
        backToTop.style.display = 'block'
    } else {
        backToTop.style.display = 'none'
    }
}

/**
 * DeBounce Function
 * @function debounce
 * @param {Function} fn
 * @param {Number} timeout
 */
function debounce(fn, timeout = 250) {
    let timeoutID
    return (...args) => {
        clearTimeout(timeoutID)
        timeoutID = setTimeout(() => fn(...args), timeout)
    }
}
