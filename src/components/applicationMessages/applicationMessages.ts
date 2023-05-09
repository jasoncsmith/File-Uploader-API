import "./applicationMessages.scss";

interface IMessageOptions {
    type: "string";
    content: "string";
    isPersistant?: boolean;
    duration?: number;
}

interface IMessage {
    type: KnockoutObservable<string>;
    content: KnockoutObservable<string>;
    removedAnimation: KnockoutObservable<boolean>;
}

const AppMessaging = function () {
    const messages: KnockoutObservableArray<IMessage> = ko.observableArray([]);
    const duration = 5000;
    const kp: KnockoutPostBox = ko.postbox;

    function create(options: IMessageOptions): IMessage {
        return {
            type: ko.observable(`message--is-${options.type}`),
            content: ko.observable(options.content || ""),
            removedAnimation: ko.observable(true).extend({ notify: "always" }),
        };
    }

    function clear(): void {
        messages.removeAll();
    }

    function remove(message: IMessage): void {
        message.removedAnimation(true);
        setTimeout(() => messages.remove(message), 300); // wait until animation is finished
    }

    function add(options: IMessageOptions): void {
        const newMessage: IMessage = create(options);

        messages.push(newMessage);

        if (!options.isPersistant) {
            setTimeout(
                remove.bind(null, newMessage),
                options.duration || duration
            );
        }
    }

    function initialize(): void {
        kp.subscribe("add-application-message", add);
        kp.subscribe("remove-application-message", remove);
        kp.subscribe("clear-application-message", clear);
    }

    function destroy(): void {
        clear();
    }

    return {
        messages,
        clear,
        remove,
        add,
        initialize,
        destroy,
    };
};

export default AppMessaging;
