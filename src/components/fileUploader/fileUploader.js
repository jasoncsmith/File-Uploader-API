import './fileUploader.scss';
import {
    containsIllegalfileNameChars,
    jDefer
} from '../../utils/utils.js';
import {
    objMerge
} from '../../utils/utilsObjects.js';
import {
    formatBytes
} from '../../utils/utilsNumber.js';
import DOMPurify from 'dompurify';

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


const whiteList = [];
const maxFileNameChars = 120;
let countInitializedInstances = 0; // when > 1 fileUploaders on same page

function File(file) {
    this.filename = file.name;
    this.totalfilesize = file.size;
    this.file = file;
}

function FileListItem(file) {
    this.fileName = file.name;
    this.src = null;
    this.size = formatBytes(file.size);
}


export default function () {
    const kp = ko.postbox;
    const self = this;

    let elDropArea = null;
    let elFileInput = null;

    let queuedFileTransfers = [];
    let allowedFileTypes = '*';

    let configApi = null;
    let configMultiple = false;
    let configMaxFileSize = null;
    let configValidateContent = false;
    let configAllowedFileExtensions = [];

    countInitializedInstances++;

    self.fileListItems = ko.observableArray([]);
    self.isFileReadyForUpload = ko.observable(null).extend({
        notify: 'always'
    });
    self.selectedFileName = ko.observable(null);
    self.elemIdFileInput = ko.observable('');
    self.textButton = ko.observable(null);
    self.textLabel = ko.observable(null);
    self.textAllowedExt = ko.observable(null);
    self.isWaiting = ko.observable(false);

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function highlight() {
        elDropArea.classList.add('file-upload__drop-area--is-dragover');
    }

    function unhighlight() {
        elDropArea.classList.remove('file-upload__drop-area--is-dragover');
    }

    function validateFileSize({
        size
    }) {
        return configMaxFileSize === null ? true : size <= configMaxFileSize;
    }

    function validateFileExtension(extension) {
        return configAllowedFileExtensions.length === 0 ? true : configAllowedFileExtensions.indexOf(extension.toLowerCase()) !== -1;
    }

    function validateFileNameIllegalChars({
        name
    }) {
        return containsIllegalfileNameChars(name) === false;
    }

    function validateFileNameLength({name}) {
        return name.length <= maxFileNameChars;
    }

    function validateFileContent(file) {
        const reader = new FileReader();
        const prms = jDefer();

        reader.readAsText(file);
        reader.onloadend = function (e) {
            const readerResult = e.target.result;
            let totalWhiteList = 0;
            
            DOMPurify.sanitize(readerResult);
            const violations = DOMPurify.removed;
            // IF SANITIZED != READERRESULT AND VIOLATIONS.LENGTH > 0
            // THIS MEANS DOMPURIFY ESCAPED CONTENT -- WE ARE NOT CONCERNED
            // WITH THIS.

            for (let i = 0, len = whiteList.length; i < len; i++) {
                totalWhiteList += (readerResult.match(new RegExp(whiteList[i], 'gi')) || []).length;
            }
           
            prms.complete({
                isValid: violations.length === 0 || (violations.length > 0 && totalWhiteList === violations.length),
                foundLength: Math.abs(violations.length - totalWhiteList)
            });
        };

        return prms;
    }

    async function validate(file) {
        if (validateFileNameIllegalChars(file) === false) {
            notifyValidationFailuresFileName(file);
            return false;
        }

        const ext = getFileExtension(file);
        if (validateFileExtension(ext) === false) {
            notifyValidationFailuresExtension(ext);
            return false;
        }    
        
        if (validateFileNameLength(file) === false) {
            notifyValidationFailuresFileNameLength();
            return false;
        }

        if (validateFileSize(file) === false) {
            notifyValidationFailuresSizeLimit(file);
            return false;
        }    

        if (configValidateContent === true && file.type === 'text/plain') {
            const result = await validateFileContent(file);

            if (result.isValid === false) {
                notifyValidationFailuresContent(result.foundLength);
                return false;
            } else {
                notifyValidationSuccessContent();
            }
        }

        return true;
    }

    function notifyValidationFailuresSizeLimit({
        name
    }) {
        kp.publish('add-application-message', {
            type: 'invalid',
            content: `File <strong>${name}</strong> exceeds the <strong>${formatBytes(configMaxFileSize)}</strong> size limit and will not be uploaded.`,
            isPersistant: true
        });
    }

    function notifyValidationFailuresExtension(ext) {
        kp.publish('add-application-message', {
            type: 'invalid',
            content: `File type <strong>${ext}</strong> is not permitted, only <strong>${configAllowedFileExtensions.join(', ')}</strong> are accepted.`,
            isPersistant: true
        });
    }

    function notifyValidationFailuresFileName({
        name
    }) {
        kp.publish('add-application-message', {
            type: 'invalid',
            content: `Please rename file <strong>${name}</strong>. Filenames cannot contain <strong>\\ / : * ? " < > |</strong>`,
            isPersistant: true
        });
    }

    function notifyValidationFailuresFileNameLength() {
        kp.publish('add-application-message', {
            type: 'invalid',
            content: `File name cannot exceed <strong>${maxFileNameChars}</strong> characters in length. Please shorten the file name.`,
            isPersistant: true
        });
    }

    function notifyValidationFailuresContent(foundLength) {
        kp.publish('add-application-message', {
            type: 'invalid',
            content: `We were not able to validate this file. We have detected <strong>${foundLength} issue${foundLength === 1 ? '' : 's'}</strong>. Please contact support.`,
            isPersistant: true
        });
    }

    function notifyValidationSuccessContent() {
        kp.publish('add-application-message', {
            type: 'valid',
            content: `Success. DOMPurify found 0 issues with this file`
        });
    }

    function getFileExtension({
        name
    }) {
        if (typeof name !== 'string') {
            throw new Error('fileName must be a string');
        }

        const fileName = name;
        const index = fileName.lastIndexOf('.');

        if (index === -1) {
            return '';
        }

        return `.${fileName.substring(index + 1, fileName.length)}`;
    }

    function handleDrop(e) {
        setFiles(e.dataTransfer.files);
    }

    function handleSubmit(e) {
        setFiles(e.target.files);
    }

    /**
     * @param fileList input will be fileList or Event object
     * @return undefined
     */
    async function setFiles(input) {
        if (input.length === 0) {
            return;
        }
        
        const filesRaw = configMultiple === false ? [input[0]] : [...input];
        
        elFileInput.value = ''; // WE HAVE TO KEEP IT EMPTY OR YOU CANNOT UPLOAD A FILE YOU DELETED. EVERYTHING IS MANAGED IN THE que

        if (configMultiple === false && input.length > 1) {
            kp.publish('add-application-message', {
                type: 'information',
                content: `Only <strong>one file</strong> may be dropped at a time. <strong>${filesRaw[0].name}</strong> was accepted, the others have been removed.`
            });
        }

        filesRaw.forEach(async f => {
            if (await validate(f) === true) {
                queueFileTransfers(f);
            }
        });
    }

    function queueFileTransfers(rawFile) {
         // will be the one that is dragged or the last one. Only wil truly work in case of single
        self.selectedFileName(rawFile.name);

        configMultiple === false ?
            queuedFileTransfers = [new File(rawFile)] :
            queuedFileTransfers.push(new File(rawFile));

        renderFileListItem(rawFile);

        self.isFileReadyForUpload(true);
    }

    function renderFileListItem(file) {
        const listItem = new FileListItem(file);

        if (file.type.includes('image/')) {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = e => {
                listItem.src = e.target.result;
                configMultiple === false ? self.fileListItems([listItem]) :
                    self.fileListItems.push(listItem);
            };
        } else {
            configMultiple === false ? self.fileListItems([listItem]) :
                self.fileListItems.push(listItem);
        }
    }

    function setDom(el) {

        elDropArea = el.querySelector('.file-upload__drop-area');
        elFileInput = el.querySelector('.file-upload__input-file');

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            elDropArea.addEventListener(eventName, preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            elDropArea.addEventListener(eventName, highlight, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            elDropArea.addEventListener(eventName, unhighlight, false);
        });

        elDropArea.addEventListener('drop', handleDrop, false);

        elDropArea.addEventListener('input', handleSubmit, false);

        if (configMultiple === true) {
            elFileInput.setAttribute('multiple', 'multiple');
        }

        if (configAllowedFileExtensions.length > 0) {
            allowedFileTypes = configAllowedFileExtensions.join(',');
        }

        elFileInput.setAttribute('accept', `${allowedFileTypes}`);
    }

    function notifySuccess(args) {
        kp.publish('add-application-message', {
            type: 'valid',
            content: `File ${args.filename} has been uploaded successfully`
        });        
    }

    this.deleteQueuedFile = function (obj) {
        const qf = queuedFileTransfers.find(f => f.filename === obj.fileName);

        if (typeof qf === 'undefined') {
            throw new Error('queued file transfer not found.');
        }

        queuedFileTransfers.splice(queuedFileTransfers.indexOf(qf), 1);

        self.fileListItems.remove(obj);

        self.isFileReadyForUpload(self.fileListItems().length > 0);

        if (obj.fileName === self.selectedFileName()) {
            self.selectedFileName(null);
        }
    };

    /**
     * reset - governing vm can invoke
     * @param undefined
     * @return undefined
     */
    this.reset = function () {
        queuedFileTransfers = [];
        self.fileListItems([]);
        self.selectedFileName(null);
        self.isFileReadyForUpload(false);
        self.isWaiting(false);
    };

    this.uploadFile = function () {
        const uploads = [];

        if (queuedFileTransfers.length === 0) {
            return Promise.reject('Please select a file to upload.');
        }

        queuedFileTransfers.forEach(
            ft => uploads.push(configApi(objMerge({}, ft)))
        );

        self.isWaiting(true);

        return Promise.all(uploads)
            .then(resp => resp.forEach(notifySuccess))
            .catch(err => {
                kp.publish('add-application-message', {
                    type: 'invalid',
                    content: err
                });
                self.isWaiting(false);
            })
            .finally(self.reset);

    };

    /**
     * 
     * @param {boolean} allowsMultiple whether you can select multiple files
     * @param {Element} el Element in which to insert template
     * @param {string} endpoint api you want files to be sent
     * @return undefined
     */
    this.initialize = function ({
        el,
        endpoint,
        allowsMultiple,
        allowedExtensions,
        maxFileSize,
        labelText,
        labelButton,
        validatePlainTextContent
    }) {
        configApi = endpoint;
        configMultiple = allowsMultiple;
        configMaxFileSize = maxFileSize;
        configValidateContent = validatePlainTextContent;
        configAllowedFileExtensions = allowedExtensions || [];

        self.textLabel(labelText);
        self.textButton(configMultiple === true ? `${labelButton}(s)` : labelButton);
        self.elemIdFileInput(`file-elem-${countInitializedInstances}`);

        if (configAllowedFileExtensions.length > 0) {
            self.textAllowedExt(`Accepted: ${configAllowedFileExtensions.join(', ')}`);
        }

        setDom(el);
    };
}