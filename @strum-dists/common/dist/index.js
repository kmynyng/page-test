'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var path = require('path');
var dateFns = require('date-fns');
var prettysize = require('prettysize');
var tslib = require('tslib');
var React = require('react');
var styled = require('styled-components');
var reactRouterDom = require('react-router-dom');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var prettysize__default = /*#__PURE__*/_interopDefaultLegacy(prettysize);
var React__default = /*#__PURE__*/_interopDefaultLegacy(React);
var styled__default = /*#__PURE__*/_interopDefaultLegacy(styled);

class ImageClipboard {
    setImageData(imageData) {
        this.imageData = imageData;
    }
    getImageData() {
        return this.imageData;
    }
}
class ItemClipboard {
    setItems(items) {
        this.items = items;
    }
    getItems() {
        return this.items;
    }
}
const imageClipboard = new ImageClipboard();
const itemClipboard = new ItemClipboard();

function safeParse(json) {
    let object = null;
    try {
        object = JSON.parse(json);
    }
    catch (e) {
        return null;
    }
    return object;
}
function safeStringify(json) {
    let object = null;
    try {
        object = JSON.stringify(json);
    }
    catch (e) {
    }
    return object;
}
function safeToString(value) {
    return value ? value.toString() : '';
}
function safeExceptExtension(fileId) {
    const extname = path__default['default'].extname(fileId);
    if (!extname) {
        return null;
    }
    const splited = fileId.split(extname);
    if (splited.length === 0) {
        return null;
    }
    return splited[0];
}
// Check the parameters is valid or not
function safeArguments(...args) {
    const errors = [];
    if (args) {
        for (const arg of args) {
            if (arg === undefined || arg === null) {
                errors.push(arg);
            }
        }
    }
    if (errors.length > 0) ;
    return errors;
}
function safePush(array, item, key) {
    const found = array.find((element) => element[key] === item);
    if (!found) {
        array.push(item);
    }
}

exports.SafeError = void 0;
(function (SafeError) {
    SafeError["storageTypeError"] = "storageTypeError";
})(exports.SafeError || (exports.SafeError = {}));

// Do not expose localStorage object to outer file.
// by @isaac
const { clearStorage, safeWriteJson, safeReadJson, safeDeleteJson, } = (function () {
    const clearStorage = () => {
        localStorage.clear();
    };
    const safeWriteJson = (key, value) => {
        const text = safeStringify(value);
        if (!text) {
            return Promise.reject(exports.SafeError.storageTypeError);
        }
        return localStorage.setItem(key, text);
    };
    const safeReadJson = (key) => {
        const result = localStorage.getItem(key);
        if (!result) {
            return null;
        }
        const parsed = safeParse(result);
        return parsed;
    };
    const safeDeleteJson = (key) => {
        const result = localStorage.getItem(key);
        if (!result) {
            return null;
        }
        localStorage.removeItem(key);
    };
    return {
        clearStorage,
        safeWriteJson,
        safeReadJson,
        safeDeleteJson,
    };
})();

const DATABASE_NAME = 'Strum';
const version = 4;
const STORE_NAME = {
    StrumRecordEvent: 'StrumRecordEvent',
    StrumRecordOngoing: 'StrumRecordOngoing',
    StrumRecordVoice: 'StrumRecordVoice',
    StrumRecordAnnotation: 'StrumRecordAnnotation',
    FileHistory: 'FileHistory',
};
const Database = indexedDB.open(DATABASE_NAME, version);
// Create the schema
Database.onupgradeneeded = function () {
    reset();
};
Database.onsuccess = function () {
    // console.log('open success')
};
function reset() {
    const db = Database.result;
    // console.log(db.objectStoreNames)
    if (!db.objectStoreNames.contains(STORE_NAME.StrumRecordEvent)) {
        db.createObjectStore(STORE_NAME.StrumRecordEvent, { keyPath: 'id', autoIncrement: true });
    }
    if (!db.objectStoreNames.contains(STORE_NAME.StrumRecordOngoing)) {
        db.createObjectStore(STORE_NAME.StrumRecordOngoing, { keyPath: 'id', autoIncrement: true });
    }
    if (!db.objectStoreNames.contains(STORE_NAME.StrumRecordAnnotation)) {
        db.createObjectStore(STORE_NAME.StrumRecordAnnotation, { keyPath: 'id', autoIncrement: true });
    }
    if (!db.objectStoreNames.contains(STORE_NAME.StrumRecordVoice)) {
        db.createObjectStore(STORE_NAME.StrumRecordVoice, { keyPath: 'id', autoIncrement: true });
    }
    if (!db.objectStoreNames.contains(STORE_NAME.FileHistory)) {
        // file history
        const store = db.createObjectStore(STORE_NAME.FileHistory, { keyPath: 'fileId', autoIncrement: false });
        store.createIndex('FileIdIndex', 'fileId');
        store.createIndex('UpdatedIndex', 'updatedAt');
    }
}

const RecordOngoingDB = {
    getStore() {
        return Database.result
            .transaction(STORE_NAME.StrumRecordOngoing, 'readwrite')
            .objectStore(STORE_NAME.StrumRecordOngoing);
    },
    write(value) {
        const store = this.getStore();
        store.put(value);
    },
    read(id) {
        const store = this.getStore();
        const value = store.get(id);
        return value;
    },
    clear() {
        const store = this.getStore();
        store.clear();
    },
    getAll() {
        const store = this.getStore();
        const allRecords = store.getAll();
        // console.log(allRecords)
        return allRecords;
    },
    getAllData() {
        return new Promise((resolve, reject) => {
            const allData = this.getAll();
            allData.onsuccess = () => resolve(allData.result);
            allData.onerror = () => reject(allData.error);
        });
    },
};

exports.ActionEventType = void 0;
(function (ActionEventType) {
    ActionEventType["boxSelection"] = "boxSelection";
    ActionEventType["cursor"] = "cursor";
    ActionEventType["viewport"] = "viewport";
    ActionEventType["textSelection"] = "textSelection";
    ActionEventType["setAnnotations"] = "setAnnotations";
    ActionEventType["removeAnnotations"] = "removeAnnotations";
    ActionEventType["penDrawing"] = "penDrawing";
    ActionEventType["textOngoing"] = "textOngoing";
    ActionEventType["changeFile"] = "changeFile";
    ActionEventType["penDrawingPoint"] = "penDrawingPoint";
})(exports.ActionEventType || (exports.ActionEventType = {}));
const RecordEventDB = {
    getStore() {
        return Database.result
            .transaction(STORE_NAME.StrumRecordEvent, 'readwrite')
            .objectStore(STORE_NAME.StrumRecordEvent);
    },
    write(value) {
        const store = this.getStore();
        store.put(value);
    },
    read(id) {
        const store = this.getStore();
        const value = store.get(id);
        return value;
    },
    clear() {
        const store = this.getStore();
        store.clear();
    },
    getAll() {
        const store = this.getStore();
        const allRecords = store.getAll();
        return allRecords;
    },
    getAllData() {
        return new Promise((resolve, reject) => {
            const allData = this.getAll();
            allData.onsuccess = () => resolve(allData.result);
            allData.onerror = () => reject(allData.error);
        });
    },
};

const RecordVoiceDB = {
    getStore() {
        return Database.result
            .transaction(STORE_NAME.StrumRecordVoice, 'readwrite')
            .objectStore(STORE_NAME.StrumRecordVoice);
    },
    getIndex(indexName) {
        const store = this.getStore();
        var index = store.index(indexName);
        return index;
    },
    write(value) {
        const store = this.getStore();
        store.put(value);
    },
    read(id) {
        const store = this.getStore();
        const value = store.get(id);
        return value;
    },
    readByKeyIndex(key) {
        const index = this.getIndex('KeyIndex');
        const value = index.get(key);
        return value;
    },
    clear() {
        const store = this.getStore();
        store.clear();
    },
    getAll() {
        const store = this.getStore();
        const allRecords = store.getAll();
        // console.log(allRecords)
        return allRecords;
    },
    getAllData() {
        return new Promise((resolve, reject) => {
            const allData = this.getAll();
            allData.onsuccess = () => resolve(allData.result);
            allData.onerror = () => reject(allData.error);
        });
    },
};

const RecordAnnotationDB = {
    getStore() {
        return Database.result
            .transaction(STORE_NAME.StrumRecordAnnotation, 'readwrite')
            .objectStore(STORE_NAME.StrumRecordAnnotation);
    },
    write(value) {
        const store = this.getStore();
        store.put(value);
    },
    read(id) {
        const store = this.getStore();
        const value = store.get(id);
        return value;
    },
    clear() {
        const store = this.getStore();
        store.clear();
    },
    getAll() {
        const store = this.getStore();
        const allRecords = store.getAll();
        // console.log(allRecords)
        return allRecords;
    },
    getAllData() {
        return new Promise((resolve, reject) => {
            const allData = this.getAll();
            allData.onsuccess = () => resolve(allData.result);
            allData.onerror = () => reject(allData.error);
        });
    },
};

const dateFromNow = (date) => {
    // return formatDistanceToNowStrict(new Date(date), { unit: 'minute' })
    return dateFns.formatDistanceToNow(new Date(date), { addSuffix: true });
};
const dateFomat = (date) => {
    return dateFns.format(new Date(date), 'yy/L/d H:m');
};
const fillZero = (num) => {
    return `${num}`.length === 1 && num >= 0 ? '0' + num : num;
};
function msToTime(date) {
    const ms = date % 1000;
    date = (date - ms) / 1000;
    const secs = date % 60;
    date = (date - secs) / 60;
    const mins = date % 60;
    // const hrs = (date - mins) / 60
    // return fillZero(hrs) + ':' + fillZero(mins) + ':' + fillZero(secs)
    return fillZero(mins) + ':' + fillZero(secs);
}
function TimeFomat(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return fillZero(m) + ':' + fillZero(s);
}
const currentTimeFromNow = (start) => {
    const now = new Date().getTime();
    return msToTime(now - start);
};

function fullName(props) {
    var _a;
    if (!props)
        return '';
    if (props.firstName) {
        if (props.lastName)
            return props.firstName + ' ' + props.lastName;
        return props.firstName;
    }
    return (_a = props.lastName) !== null && _a !== void 0 ? _a : props.email;
}
const fileExtentionTitle = (fileName) => {
    const extName = path__default['default'].extname(fileName);
    if (extName) {
        return {
            fileName: path__default['default'].basename(fileName, extName),
            format: extName,
        };
    }
    else {
        return {
            fileName: '',
            format: '',
        };
    }
};
const getBaseName = (filePath) => {
    if (!filePath)
        return '';
    const extName = path__default['default'].basename(filePath);
    return extName !== null && extName !== void 0 ? extName : filePath;
};
function isSlackFile(url) {
    return url.startsWith('https://files.slack.com');
}

exports.permissions = void 0;
(function (permissions) {
    permissions[permissions["Can Write"] = 0] = "Can Write";
    permissions[permissions["Can Read"] = 1] = "Can Read";
})(exports.permissions || (exports.permissions = {}));
const uiPermissions = ['Can Write', 'Can Read'];
// export const uiMemberMenu = ['Can Write', 'Can Read', 'Remove']
exports.MemberMenu = void 0;
(function (MemberMenu) {
    MemberMenu["edit"] = "Can Write";
    MemberMenu["read"] = "Can Read";
    MemberMenu["remove"] = "Remove";
})(exports.MemberMenu || (exports.MemberMenu = {}));
const uiMemberMenu = [exports.MemberMenu.edit, exports.MemberMenu.read, exports.MemberMenu.remove];
exports.shareLinkPermissions = void 0;
(function (shareLinkPermissions) {
    shareLinkPermissions[shareLinkPermissions["Anyone with this link"] = 0] = "Anyone with this link";
    shareLinkPermissions[shareLinkPermissions["Only members can access"] = 1] = "Only members can access";
})(exports.shareLinkPermissions || (exports.shareLinkPermissions = {}));
const uiShareLinkPermissions = [
    'Anyone with this link',
    'Only members can access',
];

function keyExistsInObject(object, key) {
    return object && Object.keys(object).includes(key);
}

function byteToMb(byte) {
    return prettysize__default['default'](byte);
}

exports.StringKeyCodes = void 0;
(function (StringKeyCodes) {
    StringKeyCodes["up"] = "ArrowUp";
    StringKeyCodes["down"] = "ArrowDown";
    StringKeyCodes["enter"] = "Enter";
    StringKeyCodes["esc"] = "Escape";
    StringKeyCodes["space"] = "Space";
    StringKeyCodes["tab"] = "Tab";
    StringKeyCodes["backslash"] = "Backslash";
})(exports.StringKeyCodes || (exports.StringKeyCodes = {}));

function makeError() {
    return new DOMException('The request is not allowed', 'NotAllowedError');
}
function copyClipboardApi(text) {
    return tslib.__awaiter(this, void 0, void 0, function* () {
        // Use the Async Clipboard API when available. Requires a secure browsing
        // context (i.e. HTTPS)
        if (!navigator.clipboard) {
            throw makeError();
        }
        return navigator.clipboard.writeText(text);
    });
}
function copyExecCommand(text) {
    return tslib.__awaiter(this, void 0, void 0, function* () {
        // Put the text to copy into a <span>
        const span = document.createElement('span');
        span.textContent = text;
        // Preserve consecutive spaces and newlines
        span.style.whiteSpace = 'pre';
        span.style.webkitUserSelect = 'auto';
        span.style.userSelect = 'all';
        // Add the <span> to the page
        document.body.appendChild(span);
        // Make a selection object representing the range of text selected by the user
        const selection = window.getSelection();
        const range = window.document.createRange();
        selection.removeAllRanges();
        range.selectNode(span);
        selection.addRange(range);
        // Copy text to the clipboard
        let success = false;
        try {
            success = window.document.execCommand('copy');
        }
        finally {
            // Cleanup
            selection.removeAllRanges();
            window.document.body.removeChild(span);
        }
        if (!success)
            throw makeError();
    });
}
function clipboardCopy(text) {
    return tslib.__awaiter(this, void 0, void 0, function* () {
        try {
            yield copyClipboardApi(text);
        }
        catch (err) {
            // ...Otherwise, use document.execCommand() fallback
            try {
                yield copyExecCommand(text);
            }
            catch (err2) {
                throw (err2 || err || makeError());
            }
        }
    });
}

// import { Account } from '@controllers/account/.api'
exports.LocalToken = void 0;
(function (LocalToken) {
    const STORAGE_KEY_AUTH_TOKEN = 'authToken';
    function getToken() {
        return safeReadJson(STORAGE_KEY_AUTH_TOKEN) || '';
    }
    LocalToken.getToken = getToken;
    function setToken(token) {
        if (!token) {
            token = '';
        }
        return safeWriteJson(STORAGE_KEY_AUTH_TOKEN, token);
    }
    LocalToken.setToken = setToken;
    function invalidate() {
        return safeWriteJson(STORAGE_KEY_AUTH_TOKEN, '');
    }
    LocalToken.invalidate = invalidate;
})(exports.LocalToken || (exports.LocalToken = {}));

// import faker from 'faker'
function getBaseArray(length) {
    const array = Array.from(Array(length).keys());
    return array;
}
function getRandomInt(max) {
    return (Math.floor(Math.random() * (max))) + 1;
}
// export function getFullName() {
//   return faker.name.firstName() + ' ' + faker.name.lastName()
// }
// export function getUsers(length: number) {
//   return getBaseArray(length).map(() => {
//     return {
//       photo: faker.image.avatar(),
//       name: getFullName(),
//     }
//   })
// }
const stopPropagation = (e) => e.stopPropagation();

const HoverContext = React__default['default'].createContext({
    hover: false,
});

const VisibleContext = React__default['default'].createContext({
    visible: null,
    setVisible: null,
});
function VisibleProvider(props) {
    const { visible, setVisible } = props;
    return (React__default['default'].createElement(VisibleContext.Provider, { value: { visible, setVisible } },
        React__default['default'].createElement(React__default['default'].Fragment, null, props.children)));
}
function useVisibleProvider(Visibled) {
    const [value, setValue] = React.useState(Visibled);
    return [value, setValue];
}
function useVisible() {
    const context = React.useContext(VisibleContext);
    return context.visible;
}
function useSetVisible() {
    const context = React.useContext(VisibleContext);
    return context.setVisible;
}

// import React from 'react'
function Condition(props) {
    if (props.value) {
        return props.children;
    }
    return null;
}
function If({ v, children }) {
    if (v) {
        return children;
    }
    return null;
}

function Map$1(props) {
    if (!props.children) {
        return React__default['default'].createElement(React__default['default'].Fragment, null);
    }
    const mapped = props.propsList
        .filter((item) => item !== undefined && item !== null)
        .map((item) => React__default['default'].cloneElement(props.children, Object.assign(Object.assign({}, item), { id: item.key ? item.key : item.id, itemId: item.itemId ? item.itemId : item.id })));
    return mapped;
}

function Switcher(props) {
    if (props.children && props.children.find) {
        const selected = props.children.find((child) => child.props.case && child.props.case === props.current);
        return selected;
    }
    else {
        return props.children;
    }
}
const Wrapper = (props) => {
    return (React__default['default'].createElement(React__default['default'].Fragment, null, props.children));
};
function SwitcherCase(props) {
    return (React__default['default'].createElement(Wrapper, { case: props.case }, props.children));
}

styled__default['default'].div `
  position:absolute;
  width: 100%;
  height: 100%;
`;
styled__default['default'].div `
  position:absolute;
  top: 0px;
  left: 0px;
  bottom: 0px;
  opacity: 1;
`;
styled__default['default'].div `
  position:absolute;
  top: 0px;
  left: 1000px;
  bottom: 0px;
  opacity: 1;
`;

function useModals(opened, setOpened, PopupComponent, props, noClose, setClosed) {
    const close = () => {
        if (!noClose) {
            setOpened(false);
        }
        if (setClosed) {
            setClosed();
        }
    };
    const stopBubbling = (e) => {
        e.stopPropagation();
    };
    const handleClick = (e) => {
        stopBubbling(e);
        close();
    };
    const PopupModal = () => (React__default['default'].createElement(Condition, { value: opened },
        React__default['default'].createElement(Vail, { onClick: handleClick },
            React__default['default'].createElement(PopupBox, { onClick: stopBubbling },
                React__default['default'].createElement(PopupComponent, { props: props ? Object.assign({}, props) : {}, onClose: close })))));
    return PopupModal;
}
const backgroundFadeFrame = styled.keyframes `
  from {
    background-color: rgba(0, 0, 0, 0.0);
  }

  to {
    background-color: rgba(0, 0, 0, 0.25);
  }
`;
const fadeIn = styled.css `
  animation: ${backgroundFadeFrame} .2s .1s linear forwards;
`;
const Vail = styled__default['default'].div `
  width: 100%;
  height: 100vh;
  z-index: 10;
  background-color: rgba(0, 0, 0, 0.0);
  position: fixed;
  left: 0;
  top: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  ${fadeIn}
`;
const PopupBox = styled__default['default'].div `
  display: flex;
  justify-content: center;
  align-items: center;
  ${fadeIn}
`;

function useMount(initlaize) {
    React.useEffect(() => {
        initlaize();
    }, []);
}
function useUnmount(deinitlaize) {
    React.useEffect(() => {
        return deinitlaize();
    }, []);
}

function useFullScreen() {
    const [screen, setScreen] = React.useState({ width: 0, height: 0 });
    React.useEffect(() => {
        window.addEventListener('resize', updateDimensions);
        setScreen({ width: window.innerWidth, height: window.innerHeight });
        return cleanup;
    }, []);
    const cleanup = () => {
        window.removeEventListener('resize', updateDimensions);
    };
    const updateDimensions = () => {
        setScreen({ width: window.innerWidth, height: window.innerHeight });
    };
    return screen;
}
function useResize(ref, onResized) {
    const [size, setSize] = React.useState({ width: 0, height: 0 });
    React.useEffect(() => {
        if (ref.current) {
            ref.current.addEventListener('resize', updateDimensions);
            setSize({ width: ref.current.offsetWidth, height: ref.current.offsetHeight });
            if (onResized) {
                onResized(size);
            }
        }
        return cleanup;
    }, [ref, ref.current]);
    const cleanup = () => {
        ref.current.removeEventListener('resize', updateDimensions);
    };
    const updateDimensions = () => {
        setSize({ width: ref.current.offsetWidth, height: ref.current.offsetHeight });
        // console.log('resized')
        if (onResized) {
            onResized(size);
        }
    };
    return size;
}

const SelectorContext$1 = React__default['default'].createContext({
    groups: null,
});
function SelectorGroup(props) {
    const { onSelected } = props;
    const groups = new Map();
    for (let i = 0; i < props.groups.length; i++) {
        const [selected, setSelected] = React.useState(props.groups[i].initial);
        groups.set(props.groups[i].groupId, { selected, setSelected });
    }
    return (React__default['default'].createElement(SelectorContext$1.Provider, { value: { groups, onSelected } },
        React__default['default'].createElement(React__default['default'].Fragment, null, props.children)));
}
function useSelect(key, groupId) {
    const { groups, onSelected } = React.useContext(SelectorContext$1);
    const { selected, setSelected } = groups.get(groupId);
    const setSelect = () => {
        setSelected(key);
        onSelected && onSelected(key);
    };
    return [selected === key, setSelect];
}
function useSelectCurrent(groupId) {
    const context = React.useContext(SelectorContext$1);
    return context.groups.get(groupId).selected;
}
function setSelect(groupId, key) {
    const context = React.useContext(SelectorContext$1);
    const { setSelected } = context.groups.get(groupId);
    setSelected(key);
}
function releaseSelect(groupId) {
    const context = React.useContext(SelectorContext$1);
    const { setSelected } = context.groups.get(groupId);
    return () => {
        setSelected('');
    };
}

function useFocus() {
    const element = React.useRef(null);
    React.useEffect(() => {
        if (element.current) {
            element.current.focus();
        }
    }, [element.current]);
    return element;
}

const SelectorContext = React__default['default'].createContext({
    groups: null,
});
function ToggleGroup(props) {
    const groups = new Map();
    for (let i = 0; i < props.groups.length; i++) {
        const [isOn, setOn] = React.useState(props.groups[i].initial);
        groups.set(props.groups[i].groupId, { isOn, setOn });
    }
    return (React__default['default'].createElement(SelectorContext.Provider, { value: { groups } }, props.children));
}
function useToggle(groupId) {
    const context = React.useContext(SelectorContext);
    const group = context.groups.get(groupId);
    const setOn = (val) => {
        group.setOn(val);
    };
    return [group.isOn, setOn];
}
const toggleGroupList = [
    { groupId: 'diffToggle', initial: false },
];

const MutltiSelectorContext = React__default['default'].createContext({
    multiGroups: null,
});
function MultiSelectorGroup(props) {
    const multiGroups = new Map();
    for (let i = 0; i < props.groups.length; i++) {
        const [selecteds, setSelecteds] = React.useState(props.groups[i].initial);
        multiGroups.set(props.groups[i].groupId, { selecteds, setSelecteds });
    }
    return (React__default['default'].createElement(MutltiSelectorContext.Provider, { value: { multiGroups } }, props.children));
}
function useMultiSelect(groupId) {
    const context = React.useContext(MutltiSelectorContext);
    const { selecteds, setSelecteds } = context.multiGroups.get(groupId);
    const setSelect = (selecteds) => {
        setSelecteds(selecteds);
    };
    return [selecteds, setSelect];
}
// export const getSingleSelectorList = [
//   { groupId: 'toolSelector', initial: 'snap' },
//   { groupId: 'editSelector', initial: 'select' },
//   { groupId: 'tabSelector', initial: 'home' },
//   { groupId: 'messageSelector', initial: 'messages' },
//   { groupId: 'sortSelector', initial: 'date' },
// ]
// export const multiSelectorList = [
//   { groupId: 'fileBrowserSelector', initial: [] },
// ]

const isBrowserChrome = () => navigator.userAgent.indexOf('Chrome') !== -1;
const isBrowserSafari = () => navigator.userAgent.indexOf('Safari') !== -1;

function FlexColumn(props) {
    var _a;
    // children spacing
    let children = [];
    if (props.gap &&
        !isBrowserChrome() &&
        isBrowserSafari() &&
        ((_a = props.children) === null || _a === void 0 ? void 0 : _a.length) > 1 &&
        typeof props.children !== 'string') {
        // console.log(props.children)
        Array.prototype.forEach.call(props.children, (child, i) => {
            if (i < props.children.length - 1 && (typeof child !== 'string')) {
                children.push(React__default['default'].cloneElement(child, {
                    style: props.gap ? { marginRight: props.gap } : {},
                    props,
                }));
                // children.push(child as ReactElement)
            }
            else {
                children.push(child);
            }
        });
    }
    else {
        children = props.children;
    }
    return (React__default['default'].createElement(Container$a, Object.assign({}, props), children));
}
const Container$a = styled__default['default'].div `
  display: flex;
  flex-direction: column;

  ${(props) => props.center
    ? exports.containers.itemsCenter
    : props.centerCol
        ? 'justify-content: center;'
        : ''}

  ${({ h }) => h ? `height: ${h}px;` : ''}
  ${({ w }) => w ? `width: ${w}px;` : ''}

  ${({ bg }) => bg ? `background:${bg};` : ''}
  ${({ pad }) => pad ? `padding:${pad};` : ''}
  ${({ relative }) => relative ? 'position: relative' : ''};
  ${({ fit }) => fit ? 'width: 100%;' : ''};
  ${({ gap }) => gap ? `gap:${gap};` : ''}
  ${({ full }) => full ? 'height: 100%;' : ''}
  ${({ SPA }) => SPA ? 'height: 100vh;' : ''}
  ${({ white }) => white ? 'background: white;' : ''}
  ${({ background }) => background ? `background: ${background};` : ''}
  /* min-height: 0px; */
`;
// const Container = styled.div`
//   ${containers.flexColumn}
//   ${(props) => props.center
//     ? containers.itemsCenter
//     : props.centerCol
//       ? 'justify-content: center;'
//       : ''}
//   ${({ gap }) => gap ? `gap:${gap};` : ''}
//   ${({ full }) => full ? 'height: 100%;' : ''}
//   ${({ white }) => white ? 'background: white;' : ''}
//   min-height: 0px;
// `

function FlexRow(props) {
    var _a;
    // children spacing
    let children = [];
    if (props.gap &&
        !isBrowserChrome() &&
        isBrowserSafari() &&
        ((_a = props.children) === null || _a === void 0 ? void 0 : _a.length) > 1 &&
        typeof props.children !== 'string') {
        // console.log(props.children)
        Array.prototype.forEach.call(props.children, (child, i) => {
            if (i < props.children.length - 1 && (typeof child !== 'string')) {
                children.push(React__default['default'].cloneElement(child, {
                    style: props.gap ? { marginRight: props.gap } : {},
                    props,
                }));
            }
            else {
                children.push(child);
            }
        });
    }
    else {
        children = props.children;
    }
    return (React__default['default'].createElement(Container$9, Object.assign({}, props), children));
}
const Container$9 = styled__default['default'].div `
  display: flex;
  flex-direction: row;

  ${({ center }) => center ? exports.containers.itemsCenter : ''}
  ${({ centerRow }) => centerRow ? 'align-items: center;' : ''}

  ${({ h }) => h ? `height: ${h}px; flex: 0 0 ${h}px;` : ''}
  ${({ w }) => w ? `width: ${w}px;` : ''}

  ${({ relative }) => relative ? 'position: relative' : ''};
  ${({ left }) => left ? 'align-items: flex-start;' : ''}
  ${({ right }) => right ? 'align-items: flex-end;' : ''}
  ${({ gap }) => gap ? `gap:${gap};` : ''}
  ${({ bg }) => bg ? `background:${bg};` : ''}
  ${({ pad }) => pad ? `padding:${pad};` : ''}

  ${({ fit }) => fit ? 'width: 100%;' : ''}
  ${({ full }) => full ? 'height: 100%;' : ''}
  ${({ white }) => white ? 'background: white;' : ''}
  ${({ justify }) => justify ? `justify-content: ${justify};` : ''}

  min-height: 0px;
`;
// const Container = styled.div`
//   ${containers.flexRow}
//   ${(props) => props.center
//     ? containers.itemsCenter
//     : props.centerCol
//       ? 'justify-content: center;'
//       : ''}
//   ${({ gap }) => gap ? `gap:${gap};` : ''};
//   ${({ full }) => full ? 'height: 100%;' : ''}
//   ${({ white }) => white ? 'background: white;' : ''}
//   min-height: 0px;
// `

const whiteFillHover = styled.css `
&:hover {
  // background: rgba(255, 255, 255, 1);
  opacity: 0.8;
  background: #fff;
  transition: background-color 0.1s;
}
&:active {
  background: rgba(255, 255, 255, 1);
  opacity: 0.5;
}
`;
const textHighlightHover = styled.css `
&:hover {
  color: rgba(255, 255, 255, 0.8);
  transition: background-color 0.1s;
}
&:active {
  color: rgba(255, 255, 255, 0.5);
}
`;
const boundsFillHover = styled.css `
&:hover {
  background: #eee;
  // background: rgba(200, 200, 200, 0.3);
  opacity: 0.8;
  border-radius: 4px;
  transition: background-color 0.1s;
}
&:active {
  background: #eee;
  // background: rgba(200, 200, 200, 0.7);
  opacity: 0.5;
  border-radius: 4px;
  transition: background-color 0.1s;
}
`;
const boundsStrokeHover = styled.css `
&:hover {
  border: 1px solid #eee;
  opacity: 0.8;
  transition: background-color 0.1s;
}
&:active {
  border: 1px solid #eee;
  opacity: 0.5;
  transition: background-color 0.1s;
}
`;
const boundsFillHoverDark = styled.css `
&:hover {
  background: #555;
  opacity: 0.8;
  border-radius: 4px;
  transition: background-color 0.1s;
}
&:active {
  background: #555;
  opacity: 0.5;
  border-radius: 4px;
  transition: background-color 0.1s;
}
`;
const flatFillHover = styled.css `
&:hover {
  background: #eee;
  opacity: 0.8;
  // background: rgba(200, 200, 200, 0.3);
  transition: background-color 0.1s;
}
&:active {
  background: #eee;
  opacity: 0.5;
  // background: rgba(200, 200, 200, 0.7);
  transition: background-color 0.1s;
}
`;
const flatFillHoverDark = styled.css `
&:hover {
  background: #555;
  opacity: 0.8;
  transition: background-color 0.1s;
}
&:active {
  background: #555;
  opacity: 0.5;
  transition: background-color 0.1s;
}
`;
const clickable = styled.css `
  cursor: pointer;
  &:active {
    filter: brightness(90%) !important;
    opacity: 0.8;
  };
  &:hover {
    filter: brightness(95%);
  };
`;
const disable = styled.css `
  filter: brightness(130%);
  /* cursor: not-allowed; */
`;
const lightClickable = styled.css `
  cursor: pointer;
  &:active {
    filter: brightness(170%) !important;
  };&:hover {
    filter: brightness(150%);
  };
`;
const transparentClickable = styled.css `
  cursor: pointer;
  &:active {
    background: #CCCCCC !important;
  };&:hover {
    background: #EEEEEE;
  };
`;
const textSelectable = styled.css `
  user-select: text;
`;

const typo = {
    formText: styled.css `
    font: bold 32px Roboto;
    color: white;
  `,
    title: styled.css `
    font: bold 16px Roboto;
    /* color: #2B3139; */
  `,
    subtitle: styled.css `
    font: normal 400 15px Roboto;
    /* color: #2B3139; */
  `,
    iconic: styled.css `
    font: bold 16px Roboto;
    /* color: #2B3139; */
  `,
    description: styled.css `
    font: normal 400 14px Roboto;
    /* color: #2B3139; */
  `,
    smallinfo: styled.css `
    font: 400 13px Roboto;
    /* color: #2B3139; */
  `,
    smallLinkWhite: styled.css `
    font: 400 13px Roboto;
    color: white;
  `,
    text: styled.css `
    font: normal 400 15px/140% Roboto;
    `,
    groupTitle: styled.css `
    font: bold 13px Roboto;
    color: #4f4f4f;
  `,
    button: styled.css `
    font: normal 13px Roboto;
    /* color: #2B3139; */
  `,
    menu: styled.css `
    font: normal 400 13px Roboto;
    /* color: #2B3139; */
  `,
    badge: styled.css `
    font: bold 13px/120% Roboto;
    `,
    smallDescription: styled.css `
    font: 400 13px Roboto;
    line-height: 18px;
    /* color: #2B3139; */
  `,
    small: styled.css `
    font: 400 10px Roboto;
    /* color: #2B3139; */
  `,
    ellipsis: styled.css `
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  `,
};
const header = {
    topicTitle: styled.css `
    font: bold 36px Roboto;
    /* color: #2B3139; */
  `,
};
const palette = {
    normal: '',
    text: '',
    highlight: '#06BEBD',
    backgroundDark: '',
};

exports.containers = void 0;
(function (containers) {
    containers.white = styled.css `
  background: white;
`;
    containers.fullSize = styled.css `
  height: 100%;
  width: 100%;
`;
    containers.flexColumn = styled.css `
  display: flex;
  flex-direction: column;
`;
    containers.flexColumnTop = styled.css `
  display: flex;
  flex-direction: column;
  align-self: flex-start;
`;
    containers.flexColumnCenter = styled.css `
  display: flex;
  flex-direction: column;
  align-self: center;
`;
    containers.flexRow = styled.css `
  display: flex;
  flex-direction: row;
  /* align-items: center; */
`;
    containers.inlineFlexRow = styled.css `
  display: inline-flex;
  flex-direction: row;
  /* align-items: center; */
`;
    containers.flexRowCenter = styled.css `
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;
    containers.verticalScroll = styled.css `
  &::-webkit-scrollbar {background: #FFF; width: 8px;}
  &::-webkit-scrollbar-thumb { background: #22222250; border-radius: 5px;}
  overflow-x: hidden;
  overflow-y: auto;

`;
    containers.itemsCenter = styled.css `
  justify-content: center;
  align-items: center;
`;
    containers.flexFull = styled.css `
  flex: 1;
`;
    containers.flexFixed = (length) => styled.css `
  flex: 0 0 ${length};
`;
})(exports.containers || (exports.containers = {}));

exports.relative = void 0;
(function (relative) {
    relative.widthFull = styled.css `
  width: 100%;
`;
    relative.position = styled.css `
  position: relative;
`;
    relative.attachRight = (amount = '0px') => styled.css `
  right: ${amount};
`;
    relative.attachLeft = (amount = '0px') => styled.css `
  left: ${amount};
`;
    relative.attachTop = (amount = '0px') => styled.css `
  top: ${amount};
`;
    relative.attachBottom = (amount = '0px') => styled.css `
  bottom: ${amount};
`;
    relative.fixedHeightFullWidth = (height) => styled.css `
  width: 100%;
  height: ${height};
`;
    relative.widthCenterAlign = (width) => styled.css `
  width: ${width};
  left: calc(50% - ${width}/2);
`;
    relative.leftSpacing = (left, width = '100%') => styled.css `
width: calc(${width} - ${left});
left: ${left};
`;
    relative.heightFull = styled.css `
height: 100%;
`;
    relative.heightCenterAlign = (height) => styled.css `
  height: ${height};
  top: calc(50% - ${height}/2);
`;
    relative.circleVerticalCenter = (length) => styled.css `
  width: ${length}px;
  height: ${length}px;
  top: calc(50% - ${length}/2)px;
  border-radius: calc(${length}/2)px;
`;
    relative.circle = (length) => styled.css `
  width: ${length}px;
  height: ${length}px;
  border-radius: calc(${length}px/2);
`;
    relative.boxVerticalCenter = (length) => styled.css `
  width: ${length};
  height: ${length};
  top: calc(50% - ${length}/2);
`;
})(exports.relative || (exports.relative = {}));
const basisHeight = {
    auto: 'auto',
    small: '16px',
    normal: '32px',
    large: '48px',
};

exports.animations = void 0;
(function (animations) {
    animations.slide = styled.css `
    opacity: 1.0;
    transition: transform 0.4s, opacity 0.4s;

    &:active {
      opacity: 1.0;
      transform: translate(20%, 0);
    }
  `;
    // failed to try animation after insertion
    animations.insertedSlide = styled.css `
    opacity: 0.0;
    transition: transform 0.4s, opacity 0.4s;

    &:after {
      opacity: 1.0;
      transition: transform 0.4s, opacity 0.4s;
      transform: translate(20%, 0);
    }
  `;
})(exports.animations || (exports.animations = {}));

const colors$1 = {
    primary: '#355BE4',
    secondary: '#4397E5',
    negative: '#F17070',
    warn: '#F1BD70',
    border: '#E0E0E0',
    light: '#D2EAFF',
    white: '#FFFFFF',
    black: '#2B3139',
    gray: '#BDBDBD',
    lightGray: '#F2F2F2',
    green: '#27AE60',
    darkBackground: '#333333',
    lightBackground: '#F8F8FA',
};

exports.borders = void 0;
(function (borders) {
    borders.flatLightBorder = styled.css `
  border: 1px solid #dddddd;
`;
    borders.borderBottom = `
  border-bottom: 1px solid ${colors$1.border};
`;
    borders.radius = styled.css `
  border-radius: 4px;
`;
    borders.radiusLarge = styled.css `
  border-radius: 8px;
`;
    borders.radiusBig = styled.css `
  border-radius: 16px;
`;
    borders.border = styled.css `
  border: 1px solid ${colors$1.border};
`;
})(exports.borders || (exports.borders = {}));

exports.padding = void 0;
(function (padding) {
    padding.paddingLarge = styled.css `
  padding: 24px;
`;
    padding.paddingForm = styled.css `
  padding: 20px;
`;
    padding.paddingNormal = styled.css `
  padding: 12px;
`;
    padding.paddingSmall = styled.css `
  padding: 8px;
`;
    padding.paddingTiny = styled.css `
  padding: 4px;
`;
})(exports.padding || (exports.padding = {}));

exports.shadow = void 0;
(function (shadow) {
    shadow.shadowNormal = styled.css `
    box-shadow: 0 0 30px 0 #8E8E8E;
  `;
    shadow.shadowSmall = styled.css `
    box-shadow: 0px 0px 20px rgba(0, 0, 0, 0.15);
  `;
    shadow.shadowShallow = styled.css `
    box-shadow: 0px 1px 8px rgba(0, 0, 0, 0.12);
  `;
    shadow.shadowButton = styled.css `
    box-shadow: 0px 0px 20px rgba(0, 0, 0, 0.4);
  `;
    shadow.shadowInset = styled.css `
    box-shadow: inset 0px 0px 20px rgba(0, 0, 0, 0.15);
  `; // inset
    shadow.shadowInsetLeft = styled.css `
    box-shadow: inset 16px 0px 16px -10px rgba(0, 0, 0, 0.15);
  `;
    shadow.shadowInsetRight = styled.css `
    box-shadow: inset -16px 0px 16px -10px rgba(0, 0, 0, 0.15);
  `;
})(exports.shadow || (exports.shadow = {}));

function FullCenter({ children }) {
    return React__default['default'].createElement(SPAContainer, null,
        React__default['default'].createElement(FlexColumn, { center: true, full: true }, children));
}
const SPAContainer = styled__default['default'].div `
  width: 100%;
  height: 100vh;
  background: #ffffff !important;
 &::-webkit-scrollbar {display: none};
 ${({ flexColumn }) => flexColumn
    ? exports.containers.flexColumn
    : ''}
`;
const RelativeFull = styled__default['default'].div `
  width: 100%;
  height: 100%;
  position: relative;
`;
const AbsoluteFull = styled__default['default'].div `
  width: 100%;
  height: 100%;
  position: absolute;
`;
const VerticalScrollContainer = styled__default['default'].div `
  ${exports.containers.fullSize} 
  ${exports.containers.verticalScroll}
  &::-webkit-scrollbar {display: none};

  min-height: 0px;
`;
const RelativeWidth = styled__default['default'].div `
  width: 100%;
  ${({ height }) => height ? `height:${height};` : ''};
  position: relative;
`;
const DimScreen = styled__default['default'].div `
  width: 100%;
  height: 100vh;
  
  position: absolute;
  left: 0;
  top: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  ${(props) => props.light
    ? 'background-color: rgba(0, 0, 0, 0.15); z-index: 3;'
    : 'background-color: rgba(0, 0, 0, 0.5); z-index: 10;'}
`;
const FlexItem = styled__default['default'].div `
  ${({ fit }) => fit ? 'flex: 0 0 auto;' : 'flex: 1 0 auto;'}
  ${({ ellipsis }) => ellipsis ? typo.ellipsis : ''}
  ${({ row }) => row ? exports.containers.flexRow : ''};
  ${({ flex }) => flex ? 'display: flex' : ''};
`;
const PopupContainer = styled__default['default'].div `
  height: 720px;
  width: 1024px;
  background: white;
  position: absolute; left: 50%; top: 50%;
  transform: translate(-50%, -50%);
    
  ${exports.borders.radius}
  ${exports.shadow.shadowNormal}
`;
const AbsRow = styled__default['default'](FlexRow) `
  ${exports.containers.flexRow}
  ${(props) => props.center
    ? exports.containers.itemsCenter
    : props.centerRow
        ? 'align-items: center;'
        : ''}

  position: absolute;
  ${({ heightFull }) => heightFull ? 'height: 100%;' : ''};
  ${({ widthFull }) => widthFull ? 'width: 100%;' : ''};
  ${({ left, right }) => left ? `left:${left};` : right ? `right:${right};` : 'left:0px'};
  ${({ top, bottom }) => top ? `top:${top};` : bottom ? `bottom:${bottom};` : 'top:0px;'};
`;
const AbsColumn = styled__default['default'](FlexColumn) `
  ${exports.containers.flexColumn}
  ${(props) => props.center
    ? exports.containers.itemsCenter
    : props.centerCol
        ? 'justify-content: center;'
        : ''}

  position: absolute;
  ${({ heightFull }) => heightFull ? 'height: 100%;' : ''};
  ${({ widthFull }) => widthFull ? 'height: 100%;' : ''};
  ${({ left, right }) => left ? `left:${left};` : right ? `right:${right};` : 'left:0px'};
  ${({ top, bottom }) => top ? `top:${top};` : bottom ? `bottom:${bottom};` : 'top:0px;'};
`;

const FullSizeImage = styled__default['default'].img `
  ${exports.containers.fullSize}
  position: ${(props) => props.position
    ? props.position
    : 'relative'};
`;
const AvatarMiddle = styled__default['default'].img `
  width: 32px;
  height: 32px;
  border-radius: 16px;
`;
const ImageContainer = styled__default['default'].img `
  width: ${({ width }) => width};
  height: ${({ height }) => height};
  ${({ disabled }) => disabled ? 'opacity: 0.5;' : ''}
  ${({ invert }) => invert ? 'filter: invert(1);' : ''}
`;

const Clickable = styled__default['default'].div `
  &:active {
    filter: brightness(85%) !important;
    opacity: 0.5;
  };
  &:hover {
    filter: brightness(95%);
    opacity: 0.7;
  };
`;
const Selectable = styled__default['default'].div.attrs((props) => ({
    className: props.className,
    props: props,
})) `
  transition: .0.3s ease;
  ${(props) => props.background ? `background:${props.background}` : ''}
  &:active {
    filter: brightness(85%) !important;
  };
  &:hover {
    filter: brightness(95%);
  };
  /* ${({ selected }) => selected
    ? 'filter: brightness(90%);'
    : ''} */
  cursor: pointer;
`;
const selectable = styled.css `
  transition: .0.3s ease;
  ${(props) => props.background ? `background:${props.background}` : ''}
  &:active {
    filter: brightness(85%) !important;
  };
  &:hover {
    filter: brightness(95%);
  };
  cursor: pointer;
`;

const RotateButton = styled__default['default'].div `
  ${(props) => props.show ? 'transform: rotate(90deg);' : ''}
`;
const EnableButton = styled__default['default'].div `
  ${(props) => props.enabled
    ? selectable
    : disable}
  ${(props) => props.grayScale
    ? 'filter: grayscale(100%);'
    : ''}
`;

const RoundInput = styled__default['default'].input `
  outline: none; 
  border: none;
  padding: 0px 16px;
  width: 100%;
  height: 52px;
  ${exports.borders.radius}
  border: none;
  background: white !important;
`;
const BasicInput = styled__default['default'].input `
  border: none;
  opacity: 0.4;
  &:focus {
    opacity: 1.0;
    outline: none;
  };

  ${({ fullWidth }) => fullWidth ? 'width: 100%;' : ''}
`;
// input
const DescriptionInput = styled__default['default'](BasicInput) `
  ${typo.description}
  width: 100%;
`;
const SmallInfoInput = styled__default['default'](BasicInput) `
  ${typo.smallinfo}
  /* width: 100%; */
`;
const TitleInputBox = styled__default['default'](BasicInput) `
  ${header.topicTitle}
  margin: 24px 16px 0px 16px;
`;
const SubTitleInputBox = styled__default['default'](BasicInput) `
  ${typo.subtitle}
`;
const ContactInput = styled__default['default'](DescriptionInput) `
  ${exports.padding.paddingSmall}
`;

const TextNormal = styled__default['default'].span `
  font: normal 15px Roboto;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: ${(props) => props.color ? props.color : '#000000'};
`;
const BasicText = styled__default['default'].div `
  ${({ ellipsis }) => ellipsis ? typo.ellipsis : ''}
  color: ${(props) => props.color ? props.color : '#000000'};
  ${({ selectable }) => selectable ? textSelectable : ''}
  ${({ sub }) => sub ? 'color: #666 !important;' : ''}
  ${({ white }) => white ? 'color: #fff !important;' : ''}
  ${({ bold }) => bold ? 'font-weight: bold !important;' : ''}
  ${({ center }) => center ? 'text-align: center;' : ''}
  ${({ width }) => width ? `width: ${width};` : ''}
  ${({ maxWidth }) => maxWidth ? `max-width: ${maxWidth};` : ''}
  ${({ justify }) => justify ? ' text-align: justify; text-justify: inter-word;' : ''}
`;
const FormTitleText = styled__default['default'](BasicText) `
  ${typo.formText}
`;
// typo - button
const TitleText = styled__default['default'](BasicText) `
  ${typo.title}
`;
const SubTitleText = styled__default['default'](BasicText) `
  ${typo.subtitle}
`;
const DescriptionText = styled__default['default'](BasicText) `
  ${typo.description}
`;
const SmallDescriptionText = styled__default['default'](BasicText) `
  ${typo.smallDescription}
`;
const SmallInfoText = styled__default['default'](BasicText) `
  ${typo.smallinfo}
`;
const SmallText = styled__default['default'](BasicText) `
  ${typo.small}
`;
const SmallErrorText = styled__default['default'](BasicText) `
  ${typo.smallinfo}
  color: ${colors$1.negative};
`;
const GroupTitle = styled__default['default'](Selectable) `
  ${typo.groupTitle}
  
  ${(props) => props.subTitle ? 'color: #828282;' : ''}
  margin-left: ${(props) => props.indent ? '24px' : '4px'};
`;
const EllipsisText = styled__default['default'].div `
  width: 100%;
  ${typo.subtitle}
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  /* line-height: 20px; */
  max-height: 40px; /* calc(line-clamp * line-height) */
  -webkit-box-orient: vertical;
`;

const Badge$3 = styled__default['default'].div `
  ${exports.relative.circle('14')}
  background: ${colors$1.primary};
  color: white;
  text-align: center;
`;
const ActiveState = styled__default['default'].div `
  ${(props) => props.size
    ? exports.relative.circle(props.size)
    : exports.relative.circle('8')}
  background: ${(props) => props.active
    ? '#27ae60'
    : '#bdbdbd'} ;
`;
const PrimaryPoint = styled__default['default'].div `
  height: 12px;
  width: 12px;
  border-radius: 9px;
  background: ${colors$1.primary};
`;
const bounceKeyframes = styled.keyframes `
  70% { transform:translateY(0%); }
  80% { transform:translateY(-15%); }
  90% { transform:translateY(0%); }
  95% { transform:translateY(-7%); }
  97% { transform:translateY(0%); }
  99% { transform:translateY(-3%); }
  100% { transform:translateY(0); }
`;
styled.css `
  animation: ${bounceKeyframes} 1s ease infinite;
`;
const flashKeyframes = styled.keyframes `
  0% { opacity: 0.5; }
  50% { opacity: 1; }
  100% { opacity: 0.5; }
`;
const flash = styled.css `
  animation: ${flashKeyframes} 1500ms ease-in-out infinite alternate;
`;
const UnreadPoint = styled__default['default'].div `
  height: 12px;
  width: 12px;
  border-radius: 9px;
  background: ${colors$1.negative};
  ${({ animation }) => animation ? flash : ''}
`;

// flex divider
const Divider = styled__default['default'].div `
  flex: 0 0 1px;
  background: ${colors$1.border};
`;

function MenuIconItem(props) {
    const icon = props.svgIcon && props.svgIcon({ width: 18, height: 18, color: '#888' });
    return (React__default['default'].createElement(Container$8, Object.assign({}, props),
        React__default['default'].createElement(Content, null,
            React__default['default'].createElement(Condition, { value: props.useCheck },
                React__default['default'].createElement(CheckBox, null,
                    React__default['default'].createElement(Condition, { value: props.checked },
                        React__default['default'].createElement(CheckIcon, { src: require('./CheckIcon.svg') })))),
            React__default['default'].createElement(Condition, { value: icon },
                React__default['default'].createElement(Icon$1, null, icon)),
            React__default['default'].createElement(Condition, { value: props.image }, props.image),
            React__default['default'].createElement(Title, null, props.title),
            React__default['default'].createElement(Condition, { value: props.badgeNumber },
                React__default['default'].createElement(BadgeFrame, null,
                    React__default['default'].createElement(UpdateBadge, null,
                        React__default['default'].createElement(BadgeNumber, null, props.badgeNumber))))),
        props.children));
}
// Styled components
const Container$8 = styled__default['default'].div `
  /* Head */
  /* Auto layout */
  display: flex;
  flex-direction: row;
  position: relative;
  background: #ffffff;
  padding: 8px 16px;
  ${flatFillHover}
  ${(props) => props.width ? 'width: ' + props.width + 'px;' : '100%;'}
  ${(props) => props.h ? 'height: ' + props.h + 'px;' : ''}
  ${(props) => props.height ? 'height: ' + props.height + 'px;' : ''}
  ${(props) => props.inValid ? 'opacity: 0.3;' : ''};
`;
const Content = styled__default['default'].div `
  align-self: center;
  /* Auto layout */
  display: flex;
  flex-direction: row;
`;
const CheckBox = styled__default['default'].div `
  margin-right: 0px;
  align-self: flex-start;
  width: 28px;
  height: 28px;
  position: relative;
`;
const CheckIcon = styled__default['default'].img `
  width: 14px;
  height: 14px;
  /* Constraints */
  left: calc(50% - 14px/2);
  top: calc(50% - 14px/2);
  position: absolute;
`;
const Icon$1 = styled__default['default'].div `
  margin-right: 0px;
  align-self: center;
  width: 28px;
  height: 28px;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
`;
const Title = styled__default['default'].span `
  margin-right: 0px;
  align-self: center;
  ${typo.menu}
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #000000;
`;
const BadgeFrame = styled__default['default'].div `
  align-self: center;
  width: 28px;
  height: 28px;
  position: relative;
`;
const UpdateBadge = styled__default['default'].div `
  width: 22px;
  height: 11px;
  /* Constraints */
  left: 3px;
  top: calc(50% - 11px/2);
  /* Auto layout */
  display: flex;
  flex-direction: row;
  position: absolute;
  background: #383f4a;
  border-radius: 6px;
  padding: 1px 4px;
`;
const BadgeNumber = styled__default['default'].span `
  align-self: flex-end;
  height: 9px;
  // font: 800 10px Open Sans;
  ${typo.badge}
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #ffffff;
`;

exports.Animations = void 0;
(function (Animations) {
    const fadeInKeyframe = styled.keyframes `
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
  `;
    const popupKeyframe = styled.keyframes `
  from {
    opacity: 0;
    transform: scale(0);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
  `;
    Animations.boxShadowKeyframe = styled.keyframes `
  0% { box-shadow: 0px 0px 4px white;}
  20%, 60% { box-shadow: 0px 0px 4px ${colors$1.primary}; }
  100% {box-shadow: 0px 0px 4px white; }
`;
    Animations.scale = styled.css `
  animation: ${popupKeyframe} .2s .2s cubic-bezier(0,.8,.32,1.07) forwards;
  `;
    Animations.fadeIn = styled.css `
  animation: ${fadeInKeyframe} .2s .2s cubic-bezier(0,.8,.32,1.07) forwards;
  `;
})(exports.Animations || (exports.Animations = {}));

const SubLink = (props) => {
    return (React__default['default'].createElement(SubLinkBox, { onClick: props.onClick },
        React__default['default'].createElement(SubLinkText, { typo: props.typo }, props.title)));
};
const SubLinkBox = styled__default['default'].span `
  /* margin-top: 10px; */
  cursor: pointer;
`;
const SubLinkText = styled__default['default'].span `
  font: 15px 'Open Sans';
  color: #708CF1;
  font-weight: 400;
  ${(props) => props.typo ? props.typo : ''}
`;

function ProgressBar(props) {
    return (React__default['default'].createElement(TotalProgressBox, { width: props.width },
        React__default['default'].createElement(ValueProgressBox, { percent: props.percent > 0 ? (props.percent + 1) + '%' : '0px' })));
}
const TotalProgressBox = styled__default['default'].div `
  position: absolute;
  bottom: 0px;
  left: 0px;
  /* background-color: #ffffff; */
  width: ${(props) => props.width};
  height: 2px;
`;
const ValueProgressBox = styled__default['default'].div `
  background-color: #51A6F5;
  height: 3px;
  width: ${(props) => props.percent};
  position: relative;
  -webkit-transition: width 0.3s ease 0s;
  transition: width 0.3s ease 0s;
  bottom: 1px;
`;

function BasicCard(props) {
    let style = '';
    // padding style
    // let space = 0
    // if (props.smallSpace) space = spaceSize.small
    // else if (props.normalSpace) space = spaceSize.normal
    // else if (props.largeSpace) space = spaceSize.large
    // style += space ? 'padding: ' + space + 'px;' : ''
    // hover style
    if (props.border)
        style += borderHovering;
    else if (props.fill)
        style += clickable;
    // border Style
    if (props.borderStyle) {
        if (props.borderStyle !== 'none') {
            style += props.borderStyle;
        }
    }
    else {
        style += defaultBorderStyle;
    }
    // direction style
    if (props.vertical)
        style += 'flex-direction: column;';
    if (props.horizontal)
        style += 'flex-direction: row;';
    if (props.fullSize)
        style += 'width: 100%; height: 100%;';
    style += props.center ? centerStyle$2 : '';
    style += props.end ? endStyle$2 : '';
    // background style
    style += 'background: ' + (props.background ? props.background : 'white') + ';';
    // children spacing
    // let children : ReactElement[] = []
    // if (props.children && props.children.length > 1) {
    //   props.children.forEach(function(child, i) {
    //     if (i < props.children.length - 1 && child.type.displayName === (<Column/>).type.displayName) {
    //       children.push(React.cloneElement(child as ReactElement, {
    //         right: true,
    //         parentSpace: space,
    //         // key: child.props.key ? child.props.key : Date.now().toString(),
    //       }))
    //     } else {
    //       children.push(child as ReactElement)
    //     }
    //   })
    // } else {
    //   children = props.children
    // }
    return (React__default['default'].createElement(Container$7, { onClick: props.onClick, styled: style }, props.children));
}
const Container$7 = styled__default['default'].div `
  display: flex;
  ${(props) => props.styled}
  overflow: hidden;
`;
const defaultBorderStyle = `
  border: 1px solid #dddddd;
  border-radius: 4px;
`;
const borderHovering = `
  cursor: pointer;
  &:active {
    filter: brightness(80%) !important;
  };&:hover {
    border: 1px solid ${colors$1.primary};
  };
`;
const centerStyle$2 = `
  justify-self: center;
  text-align: center;
  items-self: center;
`;
const endStyle$2 = `
  justify-self: flex-end;
  items-self: flex-end;
  text-align: right;
  margin-top: auto;
`;

const CardBody = styled__default['default'].div.attrs((props) => ({
    className: props.className,
})) `
  
  ${(props) => props.row ? exports.containers.flexRow : ''}
  ${(props) => props.column ? exports.containers.flexColumn : ''}
  padding: 4px;
  ${(props) => props.small ? 'padding: 4px;' : ''}
  ${(props) => props.normal ? 'padding: 8px;' : ''}
  ${(props) => props.large ? 'padding: 12px;' : ''}
  ${(props) => props.xlarge ? 'padding: 16px;' : ''}

  ${(props) => props.disabled ? 'opacity: 0.5;' : ''}

  ${(props) => props.gap ? 'gap:' + props.gap + ';' : ''}
`;

const Card = BasicCard;

function BadgeButton(props) {
    let styles = '';
    if (props.small) {
        styles += 'height: 20px;';
    }
    styles += props.selected
        ? 'background: #AAAAAA;'
        : 'background: #F2F2F2;';
    return (React__default['default'].createElement(Button$2, Object.assign({}, props, { styles: styles }), props.children));
}
const Button$2 = styled__default['default'](Selectable) `
  ${exports.containers.flexRow}
  ${typo.ellipsis}
  ${typo.smallDescription}
  
  align-items: center;
  margin: 4px;
  border-radius: 16px;
  padding: 4px 8px;
  ${(props) => props.styles}
`;

/**
 * 기본 버튼 입니다.
 *
 */
function BasicButton(props) {
    let color = '';
    let border = '';
    let isGhost = false;
    if (props.type === 'secondary') {
        color = colors$1.secondary;
    }
    else if (props.type === 'negative') {
        color = colors$1.negative;
    }
    else if (props.type === 'warn') {
        color = colors$1.warn;
    }
    else if (props.type === 'negative-ghost') {
        color = '#ffffff00';
        border = '1px solid ' + colors$1.negative;
        isGhost = true;
    }
    else if (props.type === 'ghost') {
        color = '#ffffff';
        border = '1px solid ' + colors$1.primary;
        isGhost = true;
    }
    else {
        color = colors$1.primary;
    }
    let styles = '';
    if (props.shadow) {
        styles += 'box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.25);';
    }
    if (props.right) {
        styles += 'align-self: flex-end;';
    }
    else if (props.center) {
        styles += 'align-self: center;';
    }
    if (props.round) {
        styles += 'border-radius: 40px;';
    }
    const title = props.title ? props.title : props.children;
    return (React__default['default'].createElement(ButtonContainer, Object.assign({}, props, { styles: styles, className: props.className, width: props.width, bolder: border, color: color, disabled: props.disabled, onClick: props.onClick }),
        React__default['default'].createElement(ButtonText$1, { isSmall: props.height === 'small', isGhost: isGhost }, title)));
}
BasicButton.defaultProps = {
    disabled: false,
    height: 'normal',
};
const HeightMap = {
    small: 24,
    normal: 32,
    large: 40,
    big: 52,
};
const RadiusMap = {
    small: 2,
    normal: 4,
    large: 8,
    big: 12,
};
const ButtonContainer = styled__default['default'].div `
  width: ${({ width }) => width !== null && width !== void 0 ? width : ''}px;
  height: ${({ height }) => { var _a; return (_a = HeightMap[height]) !== null && _a !== void 0 ? _a : HeightMap.normal; }}px;
  border-radius: ${({ height }) => { var _a; return (_a = RadiusMap[height]) !== null && _a !== void 0 ? _a : RadiusMap.normal; }}px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: ${(props) => props.color};
  border: ${(props) => props.bolder};
  padding: 1em 1em;
  ${(props) => props.disabled ? 'background: #DDDDDD !important; border: none !important; cursor: not-allowed;' : clickable};
  ${(props) => props.styles}
`;
const ButtonText$1 = styled__default['default'].span `
  font: ${(props) => props.isSmall ? 12 : 15}px Roboto;
  color: ${(props) => props.isGhost ? colors$1.primary : '#ffffff'};
`;

const IconicButton = (props) => (React__default['default'].createElement(Button$1, { onClick: props.onClick, className: props.className }, props.children));
const Button$1 = styled__default['default'].div `
  width: 32px;
  height: 32px;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
`;

const SimpleButton = (props) => {
    let color = '#000000';
    if (props.type === 'primary') {
        color = colors$1.primary;
    }
    else if (props.type === 'secondary') {
        color = colors$1.secondary;
    }
    else if (props.type === 'warn') {
        color = colors$1.warn;
    }
    return (React__default['default'].createElement(Button, { className: props.className, disabled: props.disabled, width: props.width, onClick: props.onClick },
        props.children,
        props.title ? (React__default['default'].createElement(ButtonText, { color: color, isIcon: props.children }, props.title)) : React__default['default'].createElement(React__default['default'].Fragment, null)));
};
const Button = styled__default['default'].div `
  width: ${(props) => props.width ? props.width + 'px' : 'padding: 1em 1em'};
  /* height: 32px; */
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  ${(props) => props.disabled ? 'opacity: 0.3;' : lightClickable}
  ${(props) => props.customStyle}
  ${exports.relative.position}
`;
const ButtonText = styled__default['default'].span `
  font: 15px Roboto;
  color: ${(props) => props.color};
  font-weight: 400;
  ${(props) => props.isIcon ? 'margin-left: 3px;' : ''}
`;

function BasicBadge(props) {
    return (React__default['default'].createElement(Badge$2, Object.assign({}, props, { gap: '2px' }),
        React__default['default'].createElement(Condition, { value: props.icon },
            React__default['default'].createElement(IconContainer, { size: props.height }, props.icon)),
        props.children));
}
const Badge$2 = styled__default['default'].div `
  ${exports.containers.itemsCenter}
  padding: 0px ${({ height }) => height / 2 || '8'}px;
  border-radius: ${({ height }) => height / 2 || '8'}px; 
  height: ${({ height }) => height || '16'}px; 
  min-width: ${({ height }) => height || '16'}px; 
  background: ${({ background }) => background || '#F2F2F2'};
`;
const IconContainer = styled__default['default'].div `
  width: ${({ size }) => size * 0.9 || '16'}px; 
  height: ${({ size }) => size * 0.9 || '16'}px; 
`;

function NotificationBadge(props) {
    return (React__default['default'].createElement(Badge$1, Object.assign({}, props, { onClick: props.onClick }),
        React__default['default'].createElement(CountText, null, props.children)));
}
const Badge$1 = styled__default['default'].div `
  ${exports.containers.itemsCenter}
  height: ${({ size }) => size !== null && size !== void 0 ? size : '15'}px;
  min-width: ${({ size }) => size !== null && size !== void 0 ? size : '15'}px;
  border-radius: ${({ size }) => size ? (size / 2) : '9'}px;
  padding: 2px 4px;
  background: ${colors$1.primary};
`;
const CountText = styled__default['default'].span `
  ${typo.smallLinkWhite}
`;

function IconBadge(props) {
    return (React__default['default'].createElement(Badge, Object.assign({}, props),
        React__default['default'].createElement(SmallText, { white: true }, props.children)));
}
const Badge = styled__default['default'].div `
  ${exports.containers.flexRow}
  ${exports.containers.itemsCenter}
  height: ${({ size }) => size !== null && size !== void 0 ? size : '15'}px;
  min-width: ${({ size }) => size !== null && size !== void 0 ? size : '15'}px;
  border-radius: ${({ size }) => size ? (size / 2) : '9'}px;
  background: ${colors$1.negative};
  padding: 2px 4px;
  top: 0px;
  right: 0px;
  z-index: 2;
  position: absolute;
`;

const blackIcon = require('./SVGBlankIcon.svg');
// const BLANK_IMG = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png'
function Avatar(props) {
    var _a;
    const handleImageError = (e) => {
        e.target.src = blackIcon;
        e.target.onerror = null;
    };
    return (React__default['default'].createElement(Container$6, { className: props.className, length: props.size ? props.size : 18, selectable: props.selectable }, props.image || !props.name
        ? React__default['default'].createElement(FullSizeImage, { key: 'Avatar', src: (_a = props.image) !== null && _a !== void 0 ? _a : blackIcon, onClick: props.handleClick, position: 'absolute', onError: handleImageError })
        : React__default['default'].createElement(InitialAvatar, { name: props.name, size: props.size })));
}
const Container$6 = styled__default['default'].div `
  ${(props) => exports.relative.circle(props.length)}
  ${({ length }) => `flex: 0 0 ${length}px;`}
  overflow: hidden;
  ${exports.relative.position}
  ${({ selectable }) => selectable ? lightClickable : ''}
`;
function getInitial(name) {
    let initial = '';
    // if (!name || name.length === 0) { }
    const nameSplit = name.split(' ');
    if (nameSplit.length === 1) {
        initial = name.charAt(0).toUpperCase();
    }
    else if (nameSplit.length >= 2) {
        initial = nameSplit[0].charAt(0).toUpperCase() + nameSplit[1].charAt(0).toUpperCase();
    }
    return initial;
}
const colors = ['#1abc9c', '#2ecc71', '#3498db', '#9b59b6', '#34495e', '#16a085', '#27ae60', '#2980b9', '#8e44ad', '#2c3e50', '#f1c40f', '#e67e22', '#e74c3c', '#95a5a6', '#f39c12', '#d35400', '#c0392b', '#bdc3c7', '#7f8c8d'];
function InitialAvatar(props) {
    const { name, size } = props;
    const initial = getInitial(name);
    const charIndex = (initial === null || initial === void 0 ? void 0 : initial.charCodeAt(0)) - 65;
    const colourIndex = charIndex % 19;
    const fontSize = size * 0.5;
    return (React__default['default'].createElement("div", { className: ' flex-row-center full', style: { background: colors[colourIndex || 0] } },
        React__default['default'].createElement("p", { className: 'text-white', style: { fontSize } }, initial)));
}

styled__default['default'].div `
  border-radius: 4px;
  ${clickable}
  background: ${(props) => props.selected
    ? colors$1.primary
    : '#F2F2F2;'};
  ${(props) => props.styled}

`;

// Styled components
styled__default['default'].div `
  align-self: flex-start;
  ${typo.text}
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  outline-style: none;
  max-height: 200px;
  appearance: none;
  background: #ffffff;
  display: flex;
  flex-direction: row;
  position: relative;
  ${exports.containers.verticalScroll}
  /* border-radius: 4px; */
`;

function ScrollContainer(props) {
    const { loadItems, children } = props;
    const viewRef = React.useRef(null);
    const handleScroll = (e) => {
        const element = e.target;
        if (element.scrollTop + element.clientHeight >= element.scrollHeight) {
            loadItems();
        }
    };
    return (React__default['default'].createElement(Container$5, { ref: viewRef, onScroll: handleScroll }, children));
}
const Container$5 = styled__default['default'].div `
  height: 100%;
  overflow: auto;
`;

function ColumnGrid$1(props) {
    let style = '';
    style += props.fit ? isFit$1 : isGrow$1;
    style += props.fontStyle ? props.fontStyle : '';
    const space = props.parentSpace ? props.parentSpace : 0;
    style += props.right ? 'margin-right: ' + space + 'px;' : '';
    style += 'flex-basis: ' + (props.width ? props.width : 'auto') + ';';
    style += props.center ? centerStyle$1 : '';
    style += props.end ? endStyle$1 : '';
    style += props.start ? startStyle$1 : '';
    style += props.text ? 'display: inline-block; width: 0px' : '';
    return (React__default['default'].createElement(Container$4, Object.assign({}, props, { styled: style }), props.children));
}
const Container$4 = styled__default['default'].div `
  /* min-width: 0; */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  flex-direction: column;
  align-self: center;
  ${(props) => props.styled}
  /* width: 180px; */
`;
const centerStyle$1 = `
align-self: center;
justify-self: center;
text-align: center;
`;
const endStyle$1 = `
align-self: flex-end;
justify-self: flex-end;
text-align: right;
`;
const startStyle$1 = `
align-self: flex-start;
justify-self: flex-start;
text-align: left;
`;
const isGrow$1 = `
flex-grow: 1;
flex-shrink: 1;
`;
const isFit$1 = `
flex-grow: 0;
flex-shrink: 0;
`;

function RowGrid$1(props) {
    let style = '';
    style += props.fit ? isFit : isGrow;
    style += 'flex-basis: ' + (props.height ? props.height : 'auto') + ';';
    style += props.center ? centerStyle : '';
    style += props.end ? endStyle : '';
    style += props.start ? startStyle : '';
    return (React__default['default'].createElement(Container$3, Object.assign({}, props, { styled: style }), props.children));
}
const Container$3 = styled__default['default'].div `
  display: flex;
  flex-direction: row;
  overflow: hidden;
  width: 100%;
  align-items: center;
  ${(props) => props.styled}
`;
const centerStyle = `
align-self: center;
justify-self: center;
text-align: center;
`;
const endStyle = `
align-self: flex-start;
justify-self: flex-end;
text-align: right;
`;
const startStyle = `
align-self: flex-start;
justify-self: flex-start;
text-align: left;
`;
const isGrow = `
flex-grow: 1;
flex-shrink: 1;
`;
const isFit = `
flex-grow: 0;
flex-shrink: 0;
`;

const Row = RowGrid$1;
const Column = ColumnGrid$1;
const RowGrid = RowGrid$1;
const ColumnGrid = ColumnGrid$1;

const FormInput = (props) => {
    return (React__default['default'].createElement(Container$2, { gap: '4px' },
        React__default['default'].createElement(Input, Object.assign({}, props)),
        React__default['default'].createElement(Condition, { value: props.error && props.error !== '' },
            React__default['default'].createElement(InputErrorText, null, props.error))));
};
const Container$2 = styled__default['default'](FlexColumn) `
  width: 300px;
  /* border: 1px solid ${colors$1.primary}; */
`;
const Input = styled__default['default'](RoundInput) `
  border: 1px solid ${colors$1.primary};
`;
const InputErrorText = styled__default['default'].span `
  ${typo.smallinfo}
  color: red;
  font-weight: 400;
  /* width:${(props) => props.width}; */
`;

styled__default['default'].div `
  display: flex;
  justify-content: flex-start;
  align-items: center;
  width: ${(props) => props.width};
  height: ${(props) => props.height}px;
  ${(props) => props.type === 'box' ? 'border: 1px solid #dddddd; border-radius: 4px;' : ''}
  ${(props) => props.type === 'under' ? 'border-bottom: 1px solid #dddddd;' : ''}
  overflow: hidden;
  &:hover {
    ${(props) => props.type === 'box' ? `border: 1px solid ${colors$1.primary}; border-radius: 4px;` : ''}
    ${(props) => props.type === 'under' ? `border-bottom: 1px solid ${colors$1.primary};` : ''}
  }
  &:focus {
    ${(props) => props.type === 'box' ? `border: 1px solid ${colors$1.primary}; border-radius: 4px;` : ''}
    ${(props) => props.type === 'under' ? `border-bottom: 1px solid ${colors$1.primary};` : ''}
  }
`;
styled__default['default'].div `
  width: 34px;
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
`;
styled__default['default'].div `
  width: 34px;
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
  ${transparentClickable}
`;
styled__default['default'].div `
  width: 80px;
  height: ${(props) => props.height}px;
  display: flex;
  justify-content: center;
  background-color: #ffffff;
  align-items: center;
`;
styled__default['default'].input `
  border: none;
  width: 100%;
  outline: none;

  font: 15px Roboto;
  font-weight: 400;
  color: #AAA;
  height: ${(props) => props.height - 2}px;
  ${(props) => props.isIcon ? '' : 'padding-left: 20px;'}
  
  &:focus{
    color: #555;
  }
  &::placeholder {
    font-weight: 300;
    color: #DDD;
  }
  &:focus::placeholder {
    color: #AAA;
  }
`;
React__default['default'].createElement("svg", { width: '24', height: '24', viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' },
    React__default['default'].createElement("path", { d: 'M 12.490560246100634 0 L 13.169279098510742 0.6787202296319882 L 0.6787202257010858 13.168319702148438 L 0 12.49008058212444 L 12.490560246100634 0 Z', transform: 'translate(5.415359973907471, 5.415359973907471)', fill: '#888888' }),
    React__default['default'].createElement("path", { d: 'M 0.6787202257010858 0 L 13.169279098510742 12.489598978583848 L 12.490560246100634 13.16879940032959 L 0 0.6791999639820833 L 0.6787202257010858 0 Z', transform: 'translate(5.415359973907471, 5.415359973907471)', fill: '#888888' }));

function Icon(props) {
    return (React__default['default'].createElement(Container$1, Object.assign({}, props), props.children));
}
/* Styled components */
const Container$1 = styled__default['default'].div `
  ${(props) => props.size ? 'width:' + props.size + 'px;' : ''}
  ${(props) => props.size ? 'height:' + props.size + 'px;' : ''}
`;

const Loader = () => (React__default['default'].createElement("svg", { width: '100%', height: '100%', viewBox: '0 0 38 38', xmlns: 'http://www.w3.org/2000/svg', stroke: '#aaa' },
    React__default['default'].createElement("g", { fill: 'none', fillRule: 'evenodd' },
        React__default['default'].createElement("g", { transform: 'translate(1 1)', strokeWidth: '2' },
            React__default['default'].createElement("circle", { strokeOpacity: '.5', cx: '18', cy: '18', r: '18' }),
            React__default['default'].createElement("path", { d: 'M36 18c0-9.94-8.06-18-18-18' },
                React__default['default'].createElement("animateTransform", { attributeName: 'transform', type: 'rotate', from: '0 18 18', to: '360 18 18', dur: '1s', repeatCount: 'indefinite' }))))));

function LoaderIcon(props) {
    return (React__default['default'].createElement(Container, Object.assign({}, props),
        React__default['default'].createElement(Loader, null)));
}
/* Styled components */
const Container = styled__default['default'].div `
  ${({ size }) => size
    ? 'width:' + size + 'px; height: ' + size + 'px;'
    : ''}
  ${({ white }) => white
    ? 'filter: sepia(1);'
    : ''}
`;

// import '../../../../node_modules/emoji-mart/css/emoji-mart.css'
function EmojiPicker(props) {
    return (
    // <Picker onSelect={props.onSelect} title='Pick emoji' set='emojione' />
    React__default['default'].createElement(React__default['default'].Fragment, null));
}

function EditableInput(props) {
    const { changeInput, maxWidth, text, white, hover } = props;
    const [editable, setEditable] = React.useState(false);
    const inputRef = React.useRef(null);
    const handleBlur = (e) => {
        const value = e.target.value.trim();
        if (value.length) {
            changeInput(value);
        }
        setEditable(false);
    };
    const handleClick = () => {
        setEditable(true);
    };
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            inputRef.current.blur();
            e.preventDefault();
        }
    };
    React.useEffect(() => {
        if (!inputRef.current) {
            return;
        }
        inputRef.current.value = text;
        inputRef.current.focus();
    }, [editable, text]);
    return (React__default['default'].createElement(React__default['default'].Fragment, null,
        React__default['default'].createElement(Condition, { value: editable },
            React__default['default'].createElement(InputDiv, { ref: inputRef, contentEditable: editable, onBlur: handleBlur, onKeyDown: handleKeyDown, placeholder: text })),
        React__default['default'].createElement(Condition, { value: !editable },
            React__default['default'].createElement(Condition, { value: hover },
                React__default['default'].createElement(Text, { onClick: handleClick, white: white, ellipsis: true, maxWidth: maxWidth }, text)),
            React__default['default'].createElement(Condition, { value: !hover },
                React__default['default'].createElement(Text, { onClick: handleClick, white: white, ellipsis: true, maxWidth: maxWidth }, text)))));
}
const InputDiv = styled__default['default'](BasicInput) `
  border-radius: 4px; 
  border: 1px solid skyblue;
  padding: 0px 2px;
  max-width: 140px;
  color: ${colors$1.black};
`;
const Text = styled__default['default'](SubTitleText) `
  cursor: pointer;
  ${({ maxWidth }) => maxWidth ? `max-width: ${maxWidth}px; ` : ''}
`;

styled__default['default'].div `
  width: 100% !important;
`;
styled__default['default'].div `
  width: 100% !important;
`;
styled__default['default'].div `
  background: red;
`;

styled__default['default'].div `
  border-radius: 4px;
  ${clickable}
  background: ${(props) => props.selected
    ? colors$1.primary
    : '#F2F2F2;'};
  ${(props) => props.styled}

`;

function ColDivider() { return React__default['default'].createElement("div", { className: 'h-full border-l border-solid bg-dim' }); }
function RowDivider() { return React__default['default'].createElement("div", { className: 'w-full border-t border-solid bg-dim' }); }

function AuthHeader(props) {
    const history = reactRouterDom.useHistory();
    const handleHome = () => {
        history.push('/');
    };
    return (React__default['default'].createElement("header", { className: 'flex flex-row items-center w-full h-16 max-w-screen-xl px-6 mx-auto app-titlebar place-content-between' },
        React__default['default'].createElement("div", { className: 'cursor-pointer typo-title', onClick: handleHome }, "Issuenote"),
        React__default['default'].createElement("div", { className: 'relative h-2 rounded-full bg-dim-border w-44' },
            React__default['default'].createElement("div", { className: 'absolute left-0 top-0 h-full bg-secondary rounded-full', style: { width: props.percent / 100 * 176 + 'px' } }))));
}

function getMenuPosition(targetRect, popupRect) {
    var _a, _b;
    const pos = { x: targetRect.left, y: targetRect.bottom };
    const docRect = (_b = (_a = document.getElementsByTagName('body')) === null || _a === void 0 ? void 0 : _a.item(0)) === null || _b === void 0 ? void 0 : _b.getBoundingClientRect();
    if (!docRect)
        return pos;
    if (docRect.width < (pos.x + popupRect.width + 4)) {
        pos.x = docRect.width - popupRect.width - 12;
    }
    if (docRect.height < (pos.y + popupRect.height + 4)) {
        pos.y = docRect.height - popupRect.height - 12;
    }
    return pos;
}
function getContextMenuPosition(targetPos, popupRect) {
    var _a, _b;
    const pos = targetPos;
    const docRect = (_b = (_a = document.getElementsByTagName('body')) === null || _a === void 0 ? void 0 : _a.item(0)) === null || _b === void 0 ? void 0 : _b.getBoundingClientRect();
    if (!docRect)
        return pos;
    if (docRect.width < (pos.x + popupRect.width + 4)) {
        pos.x = docRect.width - popupRect.width - 12;
    }
    if (docRect.height < (pos.y + popupRect.height + 4)) {
        pos.y = docRect.height - popupRect.height - 12;
    }
    return pos;
}

function PopupContextMenu(props) {
    const { targetPos, setClose } = props;
    const menuRef = React.useRef(null);
    React.useLayoutEffect(() => {
        if (!menuRef.current) {
            return;
        }
        const popupRect = menuRef.current.getBoundingClientRect();
        if (!targetPos || !popupRect) {
            return;
        }
        const pos = getContextMenuPosition(targetPos, popupRect);
        if (!pos) {
            return;
        }
        menuRef.current.style.left = pos.x + 'px';
        menuRef.current.style.top = pos.y + 'px';
    }, [targetPos]);
    return (targetPos
        ? React__default['default'].createElement("div", { className: 'fixed top-0 left-0 z-50 popup-menu' },
            React__default['default'].createElement("div", { ref: menuRef, className: 'menu-container absolute flex flex-col bg-white border border-dim-border border-solid w-max rounded overflow-hidden' }, props.children),
            React__default['default'].createElement("div", { className: 'vail', onClick: (e) => {
                    e.stopPropagation();
                    setClose();
                } }))
        : null);
}
function usePopupContextMenu(options) {
    const [targetPos, setTargetPos] = React.useState(null);
    const handleClose = () => {
        var _a;
        setTargetPos(null);
        (_a = options === null || options === void 0 ? void 0 : options.close) === null || _a === void 0 ? void 0 : _a.call(options);
    };
    const handleOpen = (e, pos) => {
        if (e) {
            !targetPos && setTargetPos({ x: e.clientX, y: e.clientY });
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        !targetPos && setTargetPos(pos);
    };
    return [
        targetPos,
        handleClose,
        handleOpen,
    ];
}

function PopupMenu(props) {
    const { targetRect, setClose } = props;
    const menuRef = React.useRef(null);
    React.useLayoutEffect(() => {
        if (!menuRef.current) {
            return;
        }
        const popupRect = menuRef.current.getBoundingClientRect();
        if (!targetRect || !popupRect) {
            return;
        }
        const pos = getMenuPosition(targetRect, popupRect);
        if (!pos) {
            return;
        }
        menuRef.current.style.left = pos.x + 'px';
        menuRef.current.style.top = pos.y + 'px';
    }, [targetRect]);
    return (targetRect
        ? React__default['default'].createElement("div", { className: 'fixed top-0 left-0 z-50 popup-menu' },
            React__default['default'].createElement("div", { ref: menuRef, className: 'menu-container absolute flex flex-col bg-white border border-dim-border border-solid w-max rounded overflow-hidden' }, props.children),
            React__default['default'].createElement("div", { className: 'vail', onClick: setClose }))
        : null);
}
function usePopupMenu() {
    const [targetRect, setTargetRect] = React.useState(null);
    const handleClose = () => {
        setTargetRect(null);
    };
    const handleOpen = (e) => {
        const target = e.currentTarget;
        if (target) {
            setTargetRect(target.getBoundingClientRect());
        }
    };
    return [
        targetRect,
        handleClose,
        handleOpen,
    ];
}

function MenuItem(props) {
    return (React__default['default'].createElement("div", { className: ` text-dim flex flex-row space-x-2 w-52 min-w-max cursor-pointer items-center px-3 py-2 bg-white hover:bg-dim-light ${props.checked ? 'bg-dim-light' : ''} ` + props.className || '', onClick: (e) => { var _a; return (_a = props === null || props === void 0 ? void 0 : props.onClick) === null || _a === void 0 ? void 0 : _a.call(props, e); } }, props.children));
}
function MenuLabel(props) {
    return (React__default['default'].createElement("div", { className: 'flex flex-row flex-grow items-center' },
        React__default['default'].createElement("p", { className: 'text-sm' }, props.children)));
}
function MenuDivider() {
    return (React__default['default'].createElement("div", { className: 'my-1' },
        " ",
        React__default['default'].createElement(RowDivider, null),
        " "));
}

const ModalContext = React__default['default'].createContext({
    modalRef: null,
    setKeyEvent: null,
});
function useModalContext() {
    return React.useContext(ModalContext);
}
const KEY_ENTER_CLASSNAME = 'key-enter';
function PopupModal(props) {
    const modalRef = React.useRef(null);
    const keyEvent = React.useRef({});
    const setKeyEvent = (code, func) => {
        keyEvent.current[code] = func;
    };
    const handleEnterButton = () => {
        // input에 focus가 되어 있을 때, modal에 걸어둔 enter 이벤트 무효화
        if (document.activeElement.tagName === 'INPUT') {
            return;
        }
        // enter입력시 Modal 내부에 class가 'key-enter'인 버튼의 click 이벤트 발생시키기
        const buttons = modalRef.current.getElementsByClassName(KEY_ENTER_CLASSNAME);
        if (buttons.length === 0) {
            return;
        }
        const btn = buttons.item(buttons.length - 1);
        if (btn instanceof HTMLElement) {
            btn.click();
        }
    };
    const handleEscapeKey = () => {
        if (document.activeElement.tagName === 'INPUT') {
            return;
        }
        props.setClose();
    };
    const handleKeyDown = (e) => {
        var _a, _b;
        // console.log(keyEvent.current, e.code)
        if (e.code in keyEvent.current) {
            (_b = (_a = keyEvent.current)[e.code]) === null || _b === void 0 ? void 0 : _b.call(_a);
        }
    };
    const handleKeyUp = (e) => {
        // console.log(e.code in keyEvent.current, e.code, keyEvent.current)
        if (e.code === exports.StringKeyCodes.enter) {
            handleEnterButton();
            return;
        }
        if (e.code === exports.StringKeyCodes.esc && !props.disableEscClose) {
            handleEscapeKey();
        }
    };
    React.useEffect(() => {
        var _a;
        if (document.querySelectorAll('div :focus').length === 0) {
            (_a = modalRef.current) === null || _a === void 0 ? void 0 : _a.focus();
        }
    }, [props.opened]);
    return (props.opened
        ? React__default['default'].createElement(ModalContext.Provider, { value: { modalRef, setKeyEvent } },
            React__default['default'].createElement("div", { className: 'flex flex-col items-center justify-center bg-gray-600 vail bg-opacity-40', onClick: () => props.disableOutsideClose ? {} : props.setClose() },
                React__default['default'].createElement("div", { className: 'absolute focus:outline-none', ref: modalRef, tabIndex: 0, onKeyUp: handleKeyUp, onKeyDown: handleKeyDown, onClick: (e) => e.stopPropagation() }, props.children)))
        : null);
}
function usePopupModal() {
    const [opened, setOpened] = React.useState(false);
    const handleCloseModal = () => {
        setOpened(false);
    };
    const handleOpenModal = () => {
        setOpened(true);
    };
    return [
        opened,
        handleCloseModal,
        handleOpenModal,
    ];
}

class Size {
}
class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    subtract(point) {
        return new Point(this.x - point.x, this.y - point.y);
    }
    add(point) {
        return new Point(this.x + point.x, this.y + point.y);
    }
    multiplyPoint(point) {
        return new Point(this.x * point.x, this.y * point.y);
    }
    multiply(ratio) {
        return new Point(this.x * ratio, this.y * ratio);
    }
    divide(ratio) {
        return new Point(this.x / ratio, this.y / ratio);
    }
    isNaN() {
        return isNaN(this.x) || isNaN(this.y);
    }
    testExpected(title, x, y) {
        if (this.x === x && this.x === y) ;
        else {
            console.error('Test error', title, 'Expected:', x, y, 'But:', this.x, this.y);
        }
    }
    get length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    clone() {
        return new Point(this.x, this.y);
    }
    norm() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    normalize() {
        const norm = this.norm();
        this.x /= norm;
        this.y /= norm;
    }
    normalized() {
        const norm = this.norm();
        return new Point(this.x / norm, this.y / norm);
    }
}
class Vec2 extends Point {
}
const distancePointToPoint = (p1, p2) => {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
};

class Rect {
    constructor(x, y, w, h) {
        if (!x)
            x = 0;
        if (!y)
            y = 0;
        if (!w)
            w = 0;
        if (!h)
            h = 0;
        this.origin = new Point(x, y);
        this.size = new Point(w, h);
    }
    clone() {
        return new Rect(this.minX, this.minY, this.width, this.height);
    }
    get toGQL() {
        const round = (n) => Math.round(n);
        return {
            x: round(this.minX),
            y: round(this.minY),
            width: round(this.width),
            height: round(this.height),
        };
    }
    get x() {
        return this.origin.x;
    }
    get y() {
        return this.origin.y;
    }
    get minX() {
        return this.origin.x;
    }
    set minX(value) {
        this.origin.x = value;
    }
    get minY() {
        return this.origin.y;
    }
    set minY(value) {
        this.origin.y = value;
    }
    get maxX() {
        return this.origin.x + this.size.x;
    }
    set maxX(value) {
        this.size.x = value - this.origin.x;
    }
    get maxY() {
        return this.origin.y + this.size.y;
    }
    set maxY(value) {
        this.size.y = value - this.origin.y;
    }
    get width() {
        return this.size.x;
    }
    set width(value) {
        this.size.x = value;
    }
    get height() {
        return this.size.y;
    }
    set height(value) {
        this.size.y = value;
    }
    get distance() {
        return Math.sqrt(this.width * this.width + this.height * this.height);
    }
    contains(x, y) {
        return this.origin.x <= x && x <= this.origin.x + this.size.x &&
            this.origin.y <= y && y <= this.origin.y + this.size.y;
    }
    get centerX() {
        return this.origin.x + this.width / 2;
    }
    get centerY() {
        return this.origin.y + this.height / 2;
    }
    get center() {
        return new Point(this.origin.x + this.width / 2, this.origin.y + this.height / 2);
    }
    get rb() {
        return new Point(this.origin.x + this.width, this.origin.y + this.height);
    }
    set rb(point) {
        this.width = point.x - this.origin.x;
        this.height = point.y - this.origin.y;
    }
    inflate(x, y) {
        this.origin.x -= x;
        this.origin.y -= y;
        this.size.x += x * 2;
        this.size.y += y * 2;
    }
    translate(x, y) {
        this.origin.x += x;
        this.origin.y += y;
        return this;
    }
    divide(ratio) {
        this.origin = this.origin.divide(ratio);
        this.size = this.size.divide(ratio);
        return this;
    }
    scale(ratio) {
        this.minX *= ratio;
        this.minY *= ratio;
        this.width *= ratio;
        this.height *= ratio;
        return this;
    }
    union(rect) {
        const minX = Math.min(this.minX, rect.minX);
        const minY = Math.min(this.minY, rect.minY);
        const maxX = Math.max(this.maxX, rect.maxX);
        const maxY = Math.max(this.maxY, rect.maxY);
        return new Rect(minX, minY, maxX - minX, maxY - minY);
    }
    intersect(rect) {
        const a = rect.normalized();
        const b = this.normalized();
        return !(a.minX > b.maxX ||
            a.maxX < b.minX ||
            a.minY > b.maxY ||
            a.maxY < b.minY);
    }
    intersectionRect(rect) {
        if (this.intersect(rect)) {
            const x = Math.max(this.minX, rect.minX);
            const y = Math.max(this.minY, rect.minY);
            const maxX = Math.min(this.maxX, rect.maxX);
            const maxY = Math.min(this.maxY, rect.maxY);
            return new Rect(x, y, maxX - x, maxY - y);
        }
        return null;
    }
    normalized() {
        const x = Math.min(this.minX, this.maxX);
        const y = Math.min(this.minY, this.maxY);
        const maxX = Math.max(this.minX, this.maxX);
        const maxY = Math.max(this.minY, this.maxY);
        return new Rect(x, y, maxX - x, maxY - y);
    }
    log(title) {
        // console.log(title, this.minX, this.minY, this.width, this.height)
    }
    get string() {
        return `x: ${this.minX}, y: ${this.minY}, width: ${this.width}, height: ${this.height} `;
    }
    testExpected(title, x, y, w, h) {
        if (this.minX === x && this.minY === y && this.width === w && this.height === h) ;
        else {
            console.error('Test error', title, 'Expected:', x, y, w, h, 'But:', this.minX, this.minY, this.width, this.height);
        }
    }
}

function distancePointToLine(a, b, c, x, y) {
    return Math.abs(a * x + b * y + c) / Math.sqrt(a * a + b * b);
}
function isLineIntersectRect(lineRect, rect) {
    if (!lineRect.intersect(rect)) {
        return false;
    }
    const r = rect.normalized();
    if (lineRect.maxX - lineRect.minX === 0) {
        return lineRect.minX >= rect.minX && lineRect.minX <= rect.maxX;
    }
    const m = (lineRect.maxY - lineRect.minY) / (lineRect.maxX - lineRect.minX);
    const n = lineRect.minY - m * lineRect.minX;
    const getYintersect = (x) => m * x + n;
    const getXintersect = (y) => (y - n) / m;
    const insideYBoundary = (y) => y >= r.minY && y <= r.maxY;
    const insideXBoundary = (x) => x >= r.minX && x <= r.maxX;
    if (insideYBoundary(getYintersect(rect.minX)) ||
        insideYBoundary(getYintersect(rect.maxX)) ||
        insideXBoundary(getXintersect(rect.minY)) ||
        insideXBoundary(getXintersect(rect.maxY))) {
        return true;
    }
    return false;
}

const isPointInTriangle = (a, b, c, p) => {
    const getSign = (n) => n > 0;
    const ab = b.subtract(a);
    const bc = c.subtract(b);
    const ca = a.subtract(c);
    const ap = p.subtract(a);
    const bp = p.subtract(b);
    const cp = p.subtract(c);
    const crossProd = ab.x * ap.y - ab.y * ap.x;
    const sign = getSign(crossProd);
    if (crossProd === 0) {
        return false;
    }
    if (sign !== getSign(bc.x * bp.y - bc.y * bp.x)) {
        return false;
    }
    if (sign !== getSign(ca.x * cp.y - ca.y * cp.x)) {
        return false;
    }
    return true;
};
const isTriangleIntersectRect = (a, b, c, rect) => {
    const trianglePoints = [a, b, c];
    for (const point of trianglePoints) {
        if (rect.contains(point.x, point.y)) {
            return true;
        }
    }
    for (let i = 0; i < trianglePoints.length; i++) {
        const p1 = trianglePoints[i];
        const p2 = trianglePoints[(i + 1) % 3];
        const lineRect = new Rect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
        if (isLineIntersectRect(lineRect, rect)) {
            return true;
        }
    }
    return isPointInTriangle(a, b, c, rect.center);
};

const wrapTextInLines = (args) => {
    const { text, fontSize, width, fontWeight, fontFamily } = args;
    const texts = text.split('\n');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    let res = [];
    context.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    context.textBaseline = 'bottom';
    for (const text of texts) {
        const textConverted = text.replace(/\t/g, '        '); // convert tab intent to 8 spaces. Because measureText does not identify 'tab indent'
        res = res.concat(wrapLine(textConverted, width, context));
    }
    return res;
};
const wrapLine = (line, width, context) => {
    if (line.length === 0) {
        return [''];
    }
    const breakPoints = getWordBreakPoints(line);
    let i = 0;
    let j = 0;
    let left = 0;
    let originLeft;
    let right;
    let mid;
    let res = [];
    while (i < line.length) {
        j = 0;
        right = breakPoints.length - 1;
        originLeft = left;
        while (left <= right) {
            mid = Math.floor((left + right) / 2);
            if (context.measureText(line.slice(i, breakPoints[mid])).width <= width) {
                j = breakPoints[mid];
                left = mid + 1;
            }
            else {
                right = mid - 1;
            }
        }
        if (i < j) {
            left = right;
            res.push(line.slice(i, j));
        }
        else {
            left = originLeft + 1;
            j = breakPoints[left];
            res = res.concat(wrapWord(line.slice(i, j), width, context));
        }
        i = j + 1;
        if (i < line.length) {
            res[res.length - 1] += ' ';
        }
    }
    return res;
};
const getWordBreakPoints = (line) => {
    const breakPoints = [0];
    for (let i = 0; i < line.length; i++) {
        /[\s\t]/.exec(line[i]) && breakPoints.push(i);
    }
    breakPoints[0] > 0 && breakPoints.unshift(0);
    breakPoints.push(line.length);
    return breakPoints;
};
const wrapWord = (word, width, context) => {
    const sliceLen = getWordSliceLength(word, width, context);
    return word.match(new RegExp(`.{1,${sliceLen}}`, 'g')) || [];
};
const getWordSliceLength = (word, width, context) => {
    let left = 0;
    let right = word.length;
    let mid;
    let len;
    let token;
    while (left <= right) {
        mid = Math.floor((left + right) / 2);
        token = word.slice(0, mid);
        if (context.measureText(token).width <= width) {
            len = mid;
            left = mid + 1;
        }
        else {
            right = mid - 1;
        }
    }
    return len || 1;
};

exports.AbsColumn = AbsColumn;
exports.AbsRow = AbsRow;
exports.AbsoluteFull = AbsoluteFull;
exports.ActiveState = ActiveState;
exports.AuthHeader = AuthHeader;
exports.Avatar = Avatar;
exports.AvatarMiddle = AvatarMiddle;
exports.Badge = Badge$3;
exports.BadgeButton = BadgeButton;
exports.BasicBadge = BasicBadge;
exports.BasicButton = BasicButton;
exports.BasicInput = BasicInput;
exports.BasicText = BasicText;
exports.Card = Card;
exports.CardBody = CardBody;
exports.Clickable = Clickable;
exports.ColDivider = ColDivider;
exports.Column = Column;
exports.ColumnGrid = ColumnGrid;
exports.Condition = Condition;
exports.ContactInput = ContactInput;
exports.Database = Database;
exports.DescriptionInput = DescriptionInput;
exports.DescriptionText = DescriptionText;
exports.DimScreen = DimScreen;
exports.Divider = Divider;
exports.EditableInput = EditableInput;
exports.EllipsisText = EllipsisText;
exports.EmojiPicker = EmojiPicker;
exports.EnableButton = EnableButton;
exports.FlexColumn = FlexColumn;
exports.FlexItem = FlexItem;
exports.FlexRow = FlexRow;
exports.FormInput = FormInput;
exports.FormTitleText = FormTitleText;
exports.FullCenter = FullCenter;
exports.FullSizeImage = FullSizeImage;
exports.GroupTitle = GroupTitle;
exports.HoverContext = HoverContext;
exports.Icon = Icon;
exports.IconBadge = IconBadge;
exports.IconicButton = IconicButton;
exports.If = If;
exports.ImageContainer = ImageContainer;
exports.LoaderIcon = LoaderIcon;
exports.Map = Map$1;
exports.MenuDivider = MenuDivider;
exports.MenuIconItem = MenuIconItem;
exports.MenuItem = MenuItem;
exports.MenuLabel = MenuLabel;
exports.MultiSelectorGroup = MultiSelectorGroup;
exports.NotificationBadge = NotificationBadge;
exports.Point = Point;
exports.PopupContainer = PopupContainer;
exports.PopupContextMenu = PopupContextMenu;
exports.PopupMenu = PopupMenu;
exports.PopupModal = PopupModal;
exports.PrimaryPoint = PrimaryPoint;
exports.ProgressBar = ProgressBar;
exports.RecordAnnotationDB = RecordAnnotationDB;
exports.RecordEventDB = RecordEventDB;
exports.RecordOngoingDB = RecordOngoingDB;
exports.RecordVoiceDB = RecordVoiceDB;
exports.Rect = Rect;
exports.RelativeFull = RelativeFull;
exports.RelativeWidth = RelativeWidth;
exports.RotateButton = RotateButton;
exports.RoundInput = RoundInput;
exports.Row = Row;
exports.RowDivider = RowDivider;
exports.RowGrid = RowGrid;
exports.SPAContainer = SPAContainer;
exports.STORE_NAME = STORE_NAME;
exports.ScrollContainer = ScrollContainer;
exports.Selectable = Selectable;
exports.SelectorGroup = SelectorGroup;
exports.SimpleButton = SimpleButton;
exports.Size = Size;
exports.SmallDescriptionText = SmallDescriptionText;
exports.SmallErrorText = SmallErrorText;
exports.SmallInfoInput = SmallInfoInput;
exports.SmallInfoText = SmallInfoText;
exports.SmallText = SmallText;
exports.SubLink = SubLink;
exports.SubTitleInputBox = SubTitleInputBox;
exports.SubTitleText = SubTitleText;
exports.Switcher = Switcher;
exports.SwitcherCase = SwitcherCase;
exports.TextNormal = TextNormal;
exports.TimeFomat = TimeFomat;
exports.TitleInputBox = TitleInputBox;
exports.TitleText = TitleText;
exports.ToggleGroup = ToggleGroup;
exports.UnreadPoint = UnreadPoint;
exports.Vec2 = Vec2;
exports.VerticalScrollContainer = VerticalScrollContainer;
exports.VisibleProvider = VisibleProvider;
exports.basisHeight = basisHeight;
exports.boundsFillHover = boundsFillHover;
exports.boundsFillHoverDark = boundsFillHoverDark;
exports.boundsStrokeHover = boundsStrokeHover;
exports.byteToMb = byteToMb;
exports.clearStorage = clearStorage;
exports.clickable = clickable;
exports.clipboardCopy = clipboardCopy;
exports.colors = colors$1;
exports.currentTimeFromNow = currentTimeFromNow;
exports.dateFomat = dateFomat;
exports.dateFromNow = dateFromNow;
exports.disable = disable;
exports.distancePointToLine = distancePointToLine;
exports.distancePointToPoint = distancePointToPoint;
exports.fileExtentionTitle = fileExtentionTitle;
exports.flatFillHover = flatFillHover;
exports.flatFillHoverDark = flatFillHoverDark;
exports.fullName = fullName;
exports.getBaseArray = getBaseArray;
exports.getBaseName = getBaseName;
exports.getRandomInt = getRandomInt;
exports.header = header;
exports.imageClipboard = imageClipboard;
exports.isLineIntersectRect = isLineIntersectRect;
exports.isPointInTriangle = isPointInTriangle;
exports.isSlackFile = isSlackFile;
exports.isTriangleIntersectRect = isTriangleIntersectRect;
exports.itemClipboard = itemClipboard;
exports.keyExistsInObject = keyExistsInObject;
exports.lightClickable = lightClickable;
exports.palette = palette;
exports.releaseSelect = releaseSelect;
exports.safeArguments = safeArguments;
exports.safeDeleteJson = safeDeleteJson;
exports.safeExceptExtension = safeExceptExtension;
exports.safeParse = safeParse;
exports.safePush = safePush;
exports.safeReadJson = safeReadJson;
exports.safeStringify = safeStringify;
exports.safeToString = safeToString;
exports.safeWriteJson = safeWriteJson;
exports.selectable = selectable;
exports.setSelect = setSelect;
exports.stopPropagation = stopPropagation;
exports.textHighlightHover = textHighlightHover;
exports.textSelectable = textSelectable;
exports.toggleGroupList = toggleGroupList;
exports.transparentClickable = transparentClickable;
exports.typo = typo;
exports.uiMemberMenu = uiMemberMenu;
exports.uiPermissions = uiPermissions;
exports.uiShareLinkPermissions = uiShareLinkPermissions;
exports.useFocus = useFocus;
exports.useFullScreen = useFullScreen;
exports.useModalContext = useModalContext;
exports.useModals = useModals;
exports.useMount = useMount;
exports.useMultiSelect = useMultiSelect;
exports.usePopupContextMenu = usePopupContextMenu;
exports.usePopupMenu = usePopupMenu;
exports.usePopupModal = usePopupModal;
exports.useResize = useResize;
exports.useSelect = useSelect;
exports.useSelectCurrent = useSelectCurrent;
exports.useSetVisible = useSetVisible;
exports.useToggle = useToggle;
exports.useUnmount = useUnmount;
exports.useVisible = useVisible;
exports.useVisibleProvider = useVisibleProvider;
exports.whiteFillHover = whiteFillHover;
exports.wrapTextInLines = wrapTextInLines;
//# sourceMappingURL=index.js.map
