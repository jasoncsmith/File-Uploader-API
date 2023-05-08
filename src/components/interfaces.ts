export interface IFileUploaderOptions {
    el: Element,
    endpoint: Function,
    allowsMultiple: boolean,
    allowedExtensions: string[],
    maxFileSize: number,
    labelText: string,
    labelButton: string,
    validatePlainTextContent: boolean   
}

export interface IDynamicImportHtml {
    html: string,
    element: Element,
    parentNode?: Element,
    insertBefore: boolean
}

// read
// https://stackoverflow.com/questions/42233987/how-to-configure-custom-global-interfaces-d-ts-files-for-typescript