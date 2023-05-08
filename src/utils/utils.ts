import {
    IDynamicImportHtml
} from "../components/interfaces.ts";

export function containsIllegalfileNameChars(str: string): boolean {
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
export function injectDynamicImportHtmlIntoDom(args: IDynamicImportHtml): HTMLElement {
    // 1. YOU CAN APPLY BINDINGS TO A FRESHLY INJECTED HTML BLOCK
    // WITHIN A NODE THAT HAD BINDINGS APPLIED
    // 2. YOU CANNOT INJECT HTML INTO AN EXISTING NODE AND APPLY BINDINGS
    // 3. YOU CAN INJECT A TEMPLATE INTO AN EXISTING NODE THAT HAD BINDINGS APPLIED


    // const frag = document.createRange().createContextualFragment(args.html);
    // cant use above cuz cant apply bindings to a fragment :(

    const node: Element = args.parentNode === void 0 ? document.body : args.parentNode;
    const el: HTMLDivElement = document.createElement('div');

    el.innerHTML = args.html;

    if (args.insertBefore === true) {
        node.insertBefore(el, node.firstChild);
    } else {
        node.appendChild(el);
    }

    return el;
}