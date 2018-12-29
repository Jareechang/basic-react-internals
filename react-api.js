/** @jsx Real.createElement */

const isListener = name => name.startsWith('on');
const isAttribute = name => !isListener(name) && name !== 'children';
const isTextNode = type => type === 'text';
const hasNodeValue = props => !!props.nodeValue;
const isArray = element => element.__proto__.constructor === Array;
const isFunction = element => element instanceof Function;
const isObject = element => element instanceof Object;

let rootInstance = null;

function render(element, container) {
    const prevInstance = rootInstance;
    const nextInstance = reconcile(container, prevInstance, element);
    rootInstance = nextInstance;
}

function reconcile(parentDOM, instance, element) {
    console.log('Running Reconiliation...');
    if (instance == null) {
        console.log('instantiating new rootInstance');
        const newInstance = instantiate(element);
        parentDOM.appendChild(newInstance.dom);
        return newInstance;
    } else if (instance == null) {
        console.log('Removing dom Nodes');
        parentDOM.removeChild(instance.dom);
        return null;
    } else if (instance.element.type === element.type) {
        console.log(`[HTML node: ${instance.element.type}] -> Re-using dom Nodes`);
        updateDomProps(instance.dom, instance.element.props, element.props);
        instance.element = element;
        instance.childInstances = reconcileChildren(instance, element);
        return instance;
    } else {
        console.log('default creating new dom Nodes');
        const newInstance = instantiate(element);
        parentDOM.replaceChild(instance.dom, newInstance.dom);
        return newInstance;
    }
}

function reconcileChildren(instance, element) {
    const dom = instance.dom;
    const childInstances = instance.childInstances;
    const nextChildrenElements = element.props.children || [];
    const newChildInstances = [];
    const count = Math.max(childInstances.length, nextChildrenElements.length);
    for (let i = 0; i < count; i++) {
        const childInstance = childInstances[i];
        const nextChildElement = nextChildrenElements[i];
        const newChildInstance = reconcile(dom, childInstance, nextChildElement);
        newChildInstances.push(newChildInstance);
    }
    return newChildInstances.filter(instance => instance !== null);
}

function updateDomProps(dom, prevProps, nextProps) {

    // Remove existing properties from dom nodes
    removeDomProps(dom, prevProps);
    // Add new properties from dom nodes
    setDomProps(dom, nextProps);
}

function setDomProps(dom, props) {
    Object.keys(props).filter(isAttribute).forEach((attr) => {
        dom[attr] = props[attr];
    });

    Object.keys(props).filter(isListener).forEach((name) => {
        const eventType = name.toLowerCase().substring(2);
        document.addEventListener(eventType, props[name]);
    });
}

function removeDomProps(dom, props) {
    Object.keys(props).filter(isListener).forEach((name) => {
        const eventType = name.toLowerCase().substring(2);
        document.removeEventListener(eventType, props[name]);
    });

    Object.keys(props).filter(isAttribute).forEach((attr) => {
        dom[attr] = null;
    });
}

function instantiate(element) {
    const {
        type,
        props
    } = element;
    const dom = isTextNode(type)
        ? document.createTextNode("")
        : document.createElement(type);

    updateDomProps(dom, {}, props);

    const childElements = props.children || [];
    const childInstances = childElements.map(instantiate);
    const childDoms = childInstances
        .map(childInstance => childInstance.dom)
        .forEach(childDom => dom.appendChild(childDom));

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

    return {
        dom,
        element,
        childInstances
    };
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
        .filter(c => c != null && c !== false)
        .map(c => isObject(c) ? c : Real.createTextElement(c));
    return { type, props };
}


let globalCounter = 0;

function App() {
    const buttonClick = () => {
        globalCounter += 1;
        render(App(), document.getElementById('root'));
    };
    return (
        <div id="container">
            <p> count: {globalCounter}</p>
            <button onClick={e => buttonClick()}>
                Click to say Hello
            </button>
        </div>
    );
}

window.onload = function() {
    render(App(), document.getElementById('root'));
}
