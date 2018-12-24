const isListener = name => name.startsWith('on');
const isAttribute = name => !isListener(name) && name !== 'children';
const isTextNode = type => type === 'text';
const hasNodeValue = props => !!props.nodeValue;
const isArray = element => element.__proto__.constructor === Array;
const isFunction = element => element instanceof Function;
const hasLazyLoad = lazyLoad => lazyLoad && typeof lazyLoad === 'object';

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

    const lazyLoad = props.lazyLoad;
    const lazyLoadTriggerEventName = hasLazyLoad(lazyLoad) ? lazyLoad.triggerEventName : '';
    const triggerEvent = props[lazyLoadTriggerEventName];

    if (lazyLoadTriggerEventName && !triggerEvent)
        throw new Error(`Cannot find an event set on the element type: '${type}' with name: '${lazyLoadTriggerEventName}' for lazy loading`);

    const wrappedLazyLoadFn = function() {
        const lazyLoadDomElement = hasLazyLoad(lazyLoad) && lazyLoad.domElement;
        triggerEvent();
        render(lazyLoadDomElement, parentDOM);
    }
    
    Object.keys(props).filter(isListener).forEach((name) => {
        const eventType = name.toLowerCase().substring(2);
        const isLazyLoadEvent = name === lazyLoadTriggerEventName;
        document.addEventListener(eventType, isLazyLoadEvent ? wrappedLazyLoadFn : props[name]);
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

    if (componentWillMount && isFunction(componentWillMount)) componentWillMount();
    element.componentWillMount();

    parentDOM.appendChild(dom);

    if (componentDidMount && isFunction(componentDidMount)) componentDidMount();
}

function DomElement(type, props, value) {
    this.type = type;
    this.props = props;
    if (value) {
        this.props = Object.assign(this.props, {
            children: [new TextDomElement(value)]
        });
    }
    this.componentWillMount = () => {};
    this.componentDidMount = () => {};
}

function TextDomElement(nodeValue) {
    const baseProps = {children: null};
    const textElementProps = Object.assign(baseProps, {nodeValue});
    DomElement.call(this, 'text', textElementProps, null);
}

function ParagraphDomElement(value, children) {
    const baseProps = {children: null};
    const paragraphElementProps = Object.assign(baseProps, {
        children
    });
    DomElement.call(this, 'p', paragraphElementProps, value);
}

function ButtonDomElement(value, eventHandlers, children) {
    const baseProps = {children: null};
    const buttonElementProps = Object.assign(baseProps, {
        ...eventHandlers,
        children 
    });
    DomElement.call(this, 'button', buttonElementProps, value);
}

function LinkDomElement(value, href) {
    const baseProps = {children: null};
    const linkElementProps = Object.assign(baseProps, {
        href,
        children: [
            new TextDomElement(value)
        ]
    });
    DomElement.call(this, 'a', linkElementProps);
}

window.onload = function() {
    const elements = new DomElement('div', {
        children: [
            new ParagraphDomElement('hello world'),
            new ButtonDomElement('Show Link', {
                onClick: function() {
                    console.log('hello');
                },
                lazyLoad: {
                    triggerEventName: 'onClick',
                    domElement: new LinkDomElement('Go to Google.com', 'http://www.google.com')
                }
            })
        ]
    });
    render(elements, document.getElementById('root'));
}
