const isListener = name => name.startsWith('on');
const isAttribute = name => !isListener(name) && name !== 'children';
const isTextNode = type => type === 'text';
const hasNodeValue = props => !!props.nodeValue;
const isArray = element => element.__proto__.constructor === Array;

function render(element, parentDOM) {
    const { type, props } = element;
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

function DomElement(type, props, value) {
    this.type = type;
    this.props = props;
    if (value) {
        this.props = Object.assign(this.props, {
            children: [new TextDomElement(value)]
        });
    }
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
    const elements = {
        type: 'div',
        props: {
            children: [
                new ParagraphDomElement('hello world'),
                new ButtonDomElement('Say Hi', {
                    onClick: () => {
                        console.log('hello');
                    }
                }),
                new LinkDomElement('Go to Google.com', 'http://www.google.com')
            ]
        }
    };
    render(elements, document.getElementById('root'));
}
