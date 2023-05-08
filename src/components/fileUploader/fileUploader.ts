import './fileUploader.scss';
import {
    containsIllegalfileNameChars
} from '../../utils/utils.ts';
import {
    objMerge
} from '../../utils/utilsObjects.ts';
import {
    formatBytes
} from '../../utils/utilsNumber.ts';
import DOMPurify from 'dompurify';
import { IFileUploaderOptions } from "../interfaces.ts";
// const hashSupportedExtToMIMEImage = {
//     jpg: 'image/jpeg',
//     jpeg: 'image/jpeg',
//     png: 'image/png',
//     gif: 'image/gif',
//     tif: 'image/tiff',
//     tiff: 'image/tiff',
//     bmp: 'image/bmp',
//     pdf: 'application/pdf'
// };

const whiteList: string[] = [];
const maxFileNameChars: number = 120;
let countInitializedInstances: number = 0; // when > 1 fileUploaders on same page

interface ResultFileSanitization {
    isValid: boolean,
    foundLength: number
}

class jFile  {
    filename: string;
    totalfilesize: number;
    file: File;

    constructor (file:File) {
        this.filename = file.name;
        this.totalfilesize = file.size;
        this.file = file;
    }
}

class FileListItem {
    fileName: string;
    src: string | null;
    size: string;

    constructor (file: File) {
        this.fileName = file.name;
        this.src = null;
        this.size = formatBytes(file.size);
    }
}

class Vm {
    private kp = ko.postbox;
    // const self = this;

    private elDropArea: HTMLDivElement | null = null;
    private elFileInput: HTMLInputElement | null = null;

    private queuedFileTransfers: Array<jFile> = [];
    private allowedFileTypes: string = '*';

    private configApi: Function | null = null;
    private configMultiple: boolean = false;
    private configValidateContent: boolean | null = false;
    private configMaxFileSize: number | null = null;
    private configAllowedFileExtensions: string[] = [];

    fileListItems: KnockoutObservableArray<FileListItem> = ko.observableArray([]);
    isFileReadyForUpload: KnockoutObservable<boolean> = ko.observable(false).extend({
        notify: 'always'
    });
    selectedFileName: KnockoutObservable<string | null> = ko.observable(null);
    elemIdFileInput: KnockoutObservable<string> = ko.observable('');
    textButton: KnockoutObservable<string>  = ko.observable(null);
    textLabel: KnockoutObservable<string>  = ko.observable(null);
    textAllowedExt: KnockoutObservable<string> = ko.observable(null);
    isWaiting: KnockoutObservable<boolean> = ko.observable(false);

    constructor() {
        countInitializedInstances++;
    }

    private preventDefaults(e: Event): void {
        e.preventDefault();
        e.stopPropagation();
    }

    private highlight(): void {
        this.elDropArea && this.elDropArea.classList.add('file-upload__drop-area--is-dragover');
    }

    private unhighlight(): void {
        this.elDropArea && this.elDropArea.classList.remove('file-upload__drop-area--is-dragover');
    }

    private validateFileSize(args: File): boolean {
        return this.configMaxFileSize === null ? true : args.size <= this.configMaxFileSize;
    }

    private validateFileExtension(extension:string): boolean {
        return this.configAllowedFileExtensions.length === 0 ? true : this.configAllowedFileExtensions.indexOf(extension.toLowerCase()) !== -1;
    }

    private validateFileNameIllegalChars(args: File): boolean {
        return containsIllegalfileNameChars(args.name) === false;
    }

    private validateFileNameLength(args: File): boolean {
        return args.name.length <= maxFileNameChars;
    }

    private validateFileContent(args: File): Promise<ResultFileSanitization> {
        const reader: FileReader = new FileReader();

        return new Promise((resolve, reject) => {
            reader.onloadend = function (e: ProgressEvent<FileReader>) {
                const readerResult = <string>e.target.result;
                let totalWhiteList: number = 0;
                
                DOMPurify.sanitize(readerResult);
                const violations = DOMPurify.removed;
                // IF SANITIZED != READERRESULT AND VIOLATIONS.LENGTH > 0
                // THIS MEANS DOMPURIFY ESCAPED CONTENT -- WE ARE NOT CONCERNED
                // WITH THIS.
    
                for (let i = 0, len = whiteList.length; i < len; i++) {
                    totalWhiteList += (readerResult.match(new RegExp(whiteList[i], 'gi')) || []).length;
                }
               
                resolve({
                    isValid: violations.length === 0 || (violations.length > 0 && totalWhiteList === violations.length),
                    foundLength: Math.abs(violations.length - totalWhiteList)
                });
            };
            reader.onerror = (err) => {
                reader.abort();
                reject('There was an error reading the file.');
            }
            reader.readAsText(args);    
        })
    }

    private async validate(file: File): Promise<boolean> {
        if (this.validateFileNameIllegalChars(file) === false) {
            this.notifyValidationFailuresFileName(file);
            return false;
        }

        const ext: string = this.getFileExtension(file);
        if (this.validateFileExtension(ext) === false) {
            this.notifyValidationFailuresExtension(ext);
            return false;
        }    
        
        if (this.validateFileNameLength(file) === false) {
            this.notifyValidationFailuresFileNameLength();
            return false;
        }

        if (this.validateFileSize(file) === false) {
            this.notifyValidationFailuresSizeLimit(file);
            return false;
        }

        if (this.configValidateContent === true && file.type === 'text/plain') {
            const result: ResultFileSanitization = await this.validateFileContent(file);

            if (result.isValid === false) {
                this.notifyValidationFailuresContent(result.foundLength);
                return false;
            } else {
                this.notifyValidationSuccessContent();
            }
        }

        return true;
    }

    private notifyValidationFailuresSizeLimit(args: {
        name: string
    }): void {
        this.kp.publish('add-application-message', {
            type: 'invalid',
            content: `File <strong>${args.name}</strong> exceeds the <strong>${formatBytes(this.configMaxFileSize)}</strong> size limit and will not be uploaded.`,
            isPersistant: true
        });
    }

    private notifyValidationFailuresExtension(ext: string): void {
        this.kp.publish('add-application-message', {
            type: 'invalid',
            content: `File type <strong>${ext}</strong> is not permitted, only <strong>${this.configAllowedFileExtensions.join(', ')}</strong> are accepted.`,
            isPersistant: true
        });
    }

    private notifyValidationFailuresFileName(args: {name: string}): void {
        this.kp.publish('add-application-message', {
            type: 'invalid',
            content: `Please rename file <strong>${args.name}</strong>. Filenames cannot contain <strong>\\ / : * ? " < > |</strong>`,
            isPersistant: true
        });
    }

    private notifyValidationFailuresFileNameLength(): void {
        this.kp.publish('add-application-message', {
            type: 'invalid',
            content: `File name cannot exceed <strong>${maxFileNameChars}</strong> characters in length. Please shorten the file name.`,
            isPersistant: true
        });
    }

    private notifyValidationFailuresContent(foundLength: number): void {
        this.kp.publish('add-application-message', {
            type: 'invalid',
            content: `We have detected <strong>${foundLength} issue${foundLength === 1 ? '' : 's'}</strong> with this file. Upload Blocked.`,
            isPersistant: true
        });
    }

    private notifyValidationSuccessContent(): void {
        this.kp.publish('add-application-message', {
            type: 'valid',
            content: `Success. DOMPurify found 0 issues with this file`
        });
    }

    private getFileExtension(args: File): string {
        if (typeof args.name !== 'string') {
            throw new Error('fileName must be a string');
        }

        const fileName: string = args.name;
        const index: number = fileName.lastIndexOf('.');

        if (index === -1) {
            return '';
        }

        return `.${fileName.substring(index + 1, fileName.length)}`;
    }
    
    // #FIX, the any
    private handleDrop = (e: any): void => {
        e.preventDefault();
        this.setFiles(e.dataTransfer.files);
    }

    private handleSubmit = (e: Event): void =>  {
        this.setFiles((<HTMLInputElement>e.target).files);
    }

    /**
     * @param fileList input will be fileList or Event object
     * @return undefined
     */
    private async setFiles(input: FileList): Promise<void> {
        if (input.length === 0) {
            return;
        }
        
        const filesRaw = this.configMultiple === false ? [input[0]] : [...input];
        
        if (this.elFileInput) {
            this.elFileInput.value = ''; // WE HAVE TO KEEP IT EMPTY OR YOU CANNOT UPLOAD A FILE YOU DELETED. EVERYTHING IS MANAGED IN THE que
        }

        if (this.configMultiple === false && input.length > 1) {
            this.kp.publish('add-application-message', {
                type: 'information',
                content: `Only <strong>one file</strong> may be dropped at a time. <strong>${filesRaw[0].name}</strong> was accepted, the others have been removed.`
            });
        }

        filesRaw.forEach(async (f:File) => {
            if (await this.validate(f) === true) {
                this.queueFileTransfers(f);
            }
        });
    }

    private queueFileTransfers(rawFile: File): void {
         // will be the one that is dragged or the last one. Only wil truly work in case of single
        this.selectedFileName(rawFile.name);

        this.configMultiple === false ?
            this.queuedFileTransfers = [new jFile(rawFile)] :
            this.queuedFileTransfers.push(new jFile(rawFile));

        this.renderFileListItem(rawFile);

        this.isFileReadyForUpload(true);
    }

    private renderFileListItem(file: File): void {
        const listItem = new FileListItem(file);

        if (file.type.includes('image/')) {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = (e: ProgressEvent<FileReader>) => {
                listItem.src = <string>e.target.result;
                this.configMultiple === false ? this.fileListItems([listItem]) :
                    this.fileListItems.push(listItem);
            };
        } else {
            this.configMultiple === false ? this.fileListItems([listItem]) :
                this.fileListItems.push(listItem);
        }
    }

    private setDom(el: Element): void {
        if (el === null) {
            return;
        }

        this.elDropArea = el.querySelector('.file-upload__drop-area');
        this.elFileInput = el.querySelector('.file-upload__input-file');

        if (this.elDropArea === null || !this.elFileInput === null) {
            throw new Error('Elements required.');
        }

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.elDropArea.addEventListener(eventName, this.preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            this.elDropArea.addEventListener(eventName, this.highlight, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            this.elDropArea.addEventListener(eventName, this.unhighlight, false);
        });

        this.elDropArea.addEventListener('drop', this.handleDrop, false);

        this.elDropArea.addEventListener('input', this.handleSubmit, false);

        if (this.configMultiple === true) {
            this.elFileInput.setAttribute('multiple', 'multiple');
        }

        if (this.configAllowedFileExtensions.length > 0) {
            this.allowedFileTypes = this.configAllowedFileExtensions.join(',');
        }

        this.elFileInput.setAttribute('accept', `${this.allowedFileTypes}`);
    }

    private notifySuccess(args: jFile): void {
        this.kp.publish('add-application-message', {
            type: 'valid',
            content: `File ${args.filename} has been uploaded successfully`
        });        
    }

    public deleteQueuedFile = (obj:FileListItem): void => {
        const qf = this.queuedFileTransfers.find(f => f.filename === obj.fileName);

        if (typeof qf === 'undefined') {
            throw new Error('queued file transfer not found.');
        }

        this.queuedFileTransfers.splice(this.queuedFileTransfers.indexOf(qf), 1);

        this.fileListItems.remove(obj);

        this.isFileReadyForUpload(this.fileListItems().length > 0);

        if (obj.fileName === this.selectedFileName()) {
            this.selectedFileName(null);
        }
    };

    /**
     * reset - governing vm can invoke
     * @param undefined
     * @return undefined
     */
    public reset = (): void => {
        this.queuedFileTransfers = [];
        this.fileListItems([]);
        this.selectedFileName(null);
        this.isFileReadyForUpload(false);
        this.isWaiting(false);
    };

    public uploadFile = (): Promise<void> =>{
        const uploads: Array<jFile> = [];

        if (this.queuedFileTransfers.length === 0) {
            return Promise.reject('Please select a file to upload.');
        }

        this.queuedFileTransfers.forEach(
            ft => uploads.push(this.configApi(objMerge({}, ft)))
        );

        this.isWaiting(true);

        return Promise.all(uploads)
            .then(resp => resp.forEach((f) => this.notifySuccess(f)))
            .catch(err => {
                this.kp.publish('add-application-message', {
                    type: 'invalid',
                    content: err
                });
                this.isWaiting(false);
            })
            .finally(this.reset);
    };

    public initialize (args: IFileUploaderOptions): void {
        this.configApi = args.endpoint;
        this.configMultiple = args.allowsMultiple;
        this.configMaxFileSize = args.maxFileSize;
        this.configValidateContent = args.validatePlainTextContent;
        this.configAllowedFileExtensions = args.allowedExtensions || [];

        this.textLabel(args.labelText);
        this.textButton(this.configMultiple === true ? `${args.labelButton}(s)` : args.labelButton);
        this.elemIdFileInput(`file-elem-${countInitializedInstances}`);

        if (this.configAllowedFileExtensions.length > 0) {
            this.textAllowedExt(`Accepted: ${this.configAllowedFileExtensions.join(', ')}`);
        }

        this.setDom(args.el);
    };
}

export default Vm;