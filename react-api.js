const isListener = name => name.startsWith('on');
const isAttribute = name => !isListener(name) && name !== 'children';
const isTextNode = type => type === 'text';
const hasNodeValue = props => !!props.nodeValue;
const isArray = element => element.__proto__.constructor === Array;
const isFunction = element => element instanceof Function;
const isObject = element => element instanceof Object;

function render(element, parentDOM) {
    const {
        type,
        props,
        componentWillMount,
        componentDidMount
    } = element;
    const childElements = props.children || [];
    const dom = isTextNode(type)
        ? document.createTextNode("")
        : document.createElement(type);

    Object.keys(props).filter(isListener).forEach((name) => {
        const eventType = name.toLowerCase().substring(2);
        document.addEventListener(eventType, props[name]);
    });

    Object.keys(props).filter(isAttribute).forEach((attr) => {
        dom[attr] = props[attr];
    });

    if (!isArray(childElements)) {
        throw new Error(`
            Children must be an array of dom elements

            example:

            [
                {type: 'p', props: {type: 'text', props: {nodeValue: 'hello'}}},
                ...
            ]
        `)

    }

    childElements.forEach(childElement => render(childElement, dom));

    parentDOM.appendChild(dom);
}

function Real() {
    const instance = this;

    Real = function() { return instance; }

    // Reattach __proto__ and constructor
    Real.prototype = new Real();
    Real.constructor = Real;
    return instance;
}

Real.createTextElement = function createTextElement(value) {
    return Real.createElement("text", { nodeValue: value });
}

Real.createElement = function createElement(type, config, ...args) {
    const props = Object.assign({}, config);
    const hasChildren = args.length > 0;
    const rawChildren = hasChildren ? [].concat(args) : [];
    props.children = rawChildren
        .filter(c => c != null && !!c !== false)
        .map(c => isObject(c) ? c : Real.createTextElement(c));
    return { type, props };
}

window.onload = function() {
    const elements = Real.createElement(
        "div",
        { id: 'container' },
        Real.createElement(
            'p',
            {},
            "Hellow world"
        ),
        Real.createElement(
            "button",
            { onClick: () => alert('hello') },
            "Show Link"
        )
    );
    render(elements, document.getElementById('root'));
}
