const _doc = document;

export function removeNode(id) {
    const el = _doc.querySelector(id);
    if (el === null || el.length > 0) {
        return false;
    }
    return el.parentNode.removeChild(el);
}