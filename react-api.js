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

window.onload = function() {
    const elements = {
        type: 'div',
        props: {
            children: [
                {type: 'p',
                    props:
                    {
                        children: [
                            {
                                type: 'text',
                                props: {
                                    nodeValue: 'hello world'
                                }
                            }
                        ]
                    }
                },
                {type: 'a',
                    props: {
                        href: 'http://www.google.com',
                        children: [
                            {type: 'text', props: {nodeValue: 'click me'}}
                        ]
                    }
                }
            ]
        }
    };
    render(elements, document.getElementById('root'));
}
