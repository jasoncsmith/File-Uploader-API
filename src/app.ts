import "knockout-postbox";

import { injectDynamicImportHtmlIntoDom } from "./utils/utils.ts";
import {
    IFileUploaderOptions,
    IDynamicImportHtml,
} from "./components/interfaces.ts";

export default function appLaunch(): void {
    Promise.all([
        import(
            /* webpackChunkName: "applicationMessages_js" */
            "./components/applicationMessages/applicationMessages"
        ),
        import(
            /* webpackChunkName: "applicationMessages_html" */
            "./components/applicationMessages/applicationMessages.html"
        ),
    ]).then((arr) => {
        const appMessagesApi = arr[0].default();
        const html: string = arr[1].default;

        const el: HTMLElement = injectDynamicImportHtmlIntoDom({
            parentNode: document.querySelector(".app"),
            html: html,
        } as IDynamicImportHtml);

        appMessagesApi.initialize();

        ko.applyBindings(appMessagesApi, el);
    });

    Promise.all([
        import(
            /* webpackChunkName: "fileUploader_js" */
            "./components/fileUploader/fileUploader"
        ),
        import(
            /* webpackChunkName: "fileUploader_html" */
            "./components/fileUploader/fileUploader.html"
        ),
    ]).then((arr) => {
        const fileUploaderApi = new arr[0].default();
        const html: string = arr[1].default;

        const el: HTMLElement = injectDynamicImportHtmlIntoDom({
            parentNode: document.querySelector(".app__content"),
            html: html,
        } as IDynamicImportHtml);

        fileUploaderApi.initialize({
            el,
            endpoint: (data: object): object => Promise.resolve(data), // noop
            allowsMultiple: true,
            validatePlainTextContent: true,
            maxFileSize: 5242880, // 1mb = 1024 * 1024 bytes,
            allowedExtensions: [".txt", ".jpg"],
            labelText: "Drop file(s) here",
            labelButton: "Choose file",
        } as IFileUploaderOptions);

        ko.applyBindings(fileUploaderApi, el);
    });
}
