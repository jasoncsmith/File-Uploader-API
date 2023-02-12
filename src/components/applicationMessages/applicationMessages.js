import './applicationMessages.scss';

const AppMessaging = function () {
    const messages = ko.observableArray([]);
    const duration = 5000;
    const kp = ko.postbox;

    function create(options) {
        options = options || {};

        return {
            type: ko.observable(`message--is-${options.type}`),
            content: ko.observable(options.content || ''),
            removedAnimation: ko.observable(true).extend({ notify: 'always' })
        };
    }

    function clear() {
        messages.removeAll();
    }

    function remove(message) {
        message.removedAnimation(true);
        setTimeout(messages.remove.bind(messages, message), 300); // wait until animation is finished
    }

    function add(options) {
        options = options || {};

        var newMessage = create(options);

        messages.push(newMessage);

        if (!options.isPersistant) {
            setTimeout(remove.bind(null, newMessage), options.duration || duration);
        }
    }

    function initialize() {
        kp.subscribe('add-application-message', add);
        kp.subscribe('remove-application-message', remove);
        kp.subscribe('clear-application-message', clear);
    }

    function destroy() {
        clear();
    }

    return {
        messages,
        clear,
        remove,
        add,
        initialize,
        destroy
    };
};

export default AppMessaging;
