export function jDefer() {
    // JCS: 08/21/2020
    // pull out scope
    var fnComplete, fnReject;
    // must have a 'then'  if complete
    // must have a 'catch' if failed
    var promise = new Promise((complete, failed) => {
        fnComplete = complete;
        fnReject = failed;
    });

    promise.complete = fnComplete;
    promise.failed = fnReject;

    return promise;
}

export function containsIllegalfileNameChars(str) {
    if (typeof str !== 'string') {
        return true;
    }
    // NOTE: NOT ABLE TO TEST FOR SINGLE BACKSLASH, ONLY 2+.
    // JAVASCRIPT WILL CONVERT STR = 'ASDF\ASDF' -> 'ASDFASDF'
    // BEFORE IT CAN BE TESTED.

    return /[\\:*?"<>|/]/.test(str);
}

/**
 * [injectDynamicImportHtmlIntoDom]
 * @param  string html [Html to insert]
 * @param  element parentNode [node that will receive the html]
 * @param  boolean insertBefore [if true, inserts before parentNode children]
 * @return element [the element that was inserted into DOM]
 */
export function injectDynamicImportHtmlIntoDom(args) {
    // 1. YOU CAN APPLY BINDINGS TO A FRESHLY INJECTED HTML BLOCK
    // WITHIN A NODE THAT HAD BINDINGS APPLIED
    // 2. YOU CANNOT INJECT HTML INTO AN EXISTING NODE AND APPLY BINDINGS
    // 3. YOU CAN INJECT A TEMPLATE INTO AN EXISTING NODE THAT HAD BINDINGS APPLIED


    // const frag = document.createRange().createContextualFragment(args.html);
    // cant use above cuz cant apply bindings to a fragment :(

    const node = args.parentNode === void 0 ? document.body : args.parentNode;
    const el = document.createElement('div');

    el.innerHTML = args.html;

    if (args.insertBefore === true) {
        node.insertBefore(el, node.firstChild);
    } else {
        node.appendChild(el);
    }

    return el;
}

export function fetchComponent(module){
    return Promise.all([
        module.filePath(),
        module.filePathTemplate()
    ]);
}
export default 'noop';