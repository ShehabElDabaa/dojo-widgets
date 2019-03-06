define(["dojo/_base/declare", "dojo/parser", "dojo/ready", 'dojo/_base/lang', "dojo/dom-construct",
    "dojo/fx/Toggler", "dojo/fx", "dojo/_base/fx",
    "dijit/_WidgetBase", "dijit/_TemplatedMixin", "dojo/text!./template.html", "dojo/domReady!"
], function (declare, parser, ready, lang, domConstruct, Toggler, coreFx, fx,
    _WidgetBase, _TemplatedMixin, CheckboxDropdownTemplate) {

    return declare([_WidgetBase, _TemplatedMixin], {

        templateString: CheckboxDropdownTemplate,

        _focusClassName: "mouseOver",

        _placeholder: "Place holder",
        _itemIdPrefix: undefined,
        _items: [],
        _srcRefNode: "",

        checkedItems: [],

        _cbxClickHandler: undefined,
        _cbxBlurHandler: undefined,
        _lblClickHandler: undefined,

        _placeholder: "",
        _searchboxPlaceholder: "",

        _filterKey: "text",

        _isInsideControl: false,

        _isStyleFixed: false,

        _onOpenCallBack: undefined,
        _onCloseCallBack: undefined,

        _toggler: undefined,

        _isListVisible: false,

        constructor: function (params, srcRefNode) {
            this._items = params.items;
            this._placeholder = params.placeholder;
            this._searchboxPlaceholder = params.searchboxPlaceholder
            this._filterKey = params.filterKey;

            this.checkedItems = [];

            this._appendStyleSheet();
        },

        startup: function () {

            this.uList.id = this._generateRandomString();

            this._initToggler();

            this._focusClassName = this._generateRandomString();

            this._itemIdPrefix = this._generateRandomString() + "_";

            this._loadCustomComboxItems();

            this.placeholderNode.innerHTML += "<label class='placehoder'>" + this._placeholder + "</label>";

            this.Searchbox.placeholder = this._searchboxPlaceholder;

            var that = this;

            this.domNode.onmouseenter = function (evtArgs) {
                that._isInsideControl = true;
            };
            this.domNode.onmouseout = function (evtArgs) {
                that._isInsideControl = false;
            };

            this.domNode.onclick = function () {
                that._isInsideControl = true;
            };
        },

        _initToggler: function (duration) {
            this._toggler = new Toggler({
                node: this.uList,
                showDuration: duration || 500,
                hideDuration: duration || 500,
                showFunc: coreFx.wipeIn,
                hideFunc: coreFx.wipeOut,
                onEnd: lang.hitch(this, function () {
                    if (this._isListVisible) {
                        if (this._onOpenCallBack)
                            this._onOpenCallBack(this);
                    }
                    else {
                        if (this._onCloseCallBack)
                            this._onCloseCallBack(this);
                    }
                })
            });
            this._toggler.hide();
        },

        _appendStyleSheet: function () {
            var cssElemId = "customCxbCSS";
            if (!document.getElementById(cssElemId)) {
                var element = document.createElement('link');
                element.href = './customWidgets/CheckboxDropdown/style.css';
                element.rel = 'stylesheet';
                element.type = 'text/css';
                element.id = cssElemId;

                document.body.appendChild(element);
            }
        },

        /*Items is an array of objects. Each object must have 3 properties (text,id and displayName) containg values.*/
        _loadCustomComboxItems: function () {

            var that = this;

            var ulDom = document.getElementById(this.uList.id);

            while (ulDom.children.length > 1)
                ulDom.removeChild(ulDom.lastChild);

            ulDom.className += this._focusClassName;

            ulDom.children[0].children[0].className += " " + this._focusClassName;

            ulDom.name = this._itemIdPrefix + "ul";

            ulDom.onmouseenter = function () {
                that._isInsideControl = true;
            };
            ulDom.onmouseout = function () {
                that._isInsideControl = false;
            };

            for (var i = 0; i < this._items.length; i++) {

                var item = this._items[i];

                if (item.text && item.id >= 0 && item.displayName) {
                    var newCheckBox = document.createElement("input");
                    newCheckBox.type = "checkbox";

                    newCheckBox.id = this._itemIdPrefix + item.id;

                    newCheckBox.name = this._itemIdPrefix + item.id;
                    newCheckBox.title = item.tooltip || item.displayName;
                    newCheckBox.className = this._focusClassName;
                    newCheckBox.onblur = lang.hitch(this, this._focusOutChanged);
                    newCheckBox.onclick = lang.hitch(this, this._cbxClicked);
                    newCheckBox.onfocus = function () {
                        that._isInsideControl = true;
                    };

                    var nameElement = document.createElement("input");
                    nameElement.type = "button";
                    nameElement.name = this._itemIdPrefix + item.id;
                    nameElement.readOnly = true;
                    nameElement.className = 'inputNameDisplay ' + this._focusClassName;
                    nameElement.value = item.displayName;
                    nameElement.title = item.tooltip || item.displayName;
                    nameElement.onclick = function (e) {
                        that._isInsideControl = true;
                        that._cbxLabelClicked(e);
                    }

                    var newListItem = document.createElement('li');
                    newListItem.className = this._focusClassName;
                    newListItem.appendChild(newCheckBox);
                    newListItem.appendChild(nameElement);
                    newListItem.name = this._itemIdPrefix + item.id;

                    ulDom.appendChild(newListItem);
                }
            }
        },

        _cbxClicked: function (evtArgs) {
            this._isInsideControl = true;

            var currentChbx = evtArgs.currentTarget;

            this._selectedItemsChanged(currentChbx);
        },

        _cbxLabelClicked: function (evtArgs) {

            var currLbl = evtArgs.currentTarget;

            var currCheckbx = document.getElementById(currLbl.name);
            currCheckbx.checked = !currCheckbx.checked;

            currCheckbx.focus();

            this._selectedItemsChanged(currCheckbx);
        },

        _selectedItemsChanged: function (currentChbx) {

            var that = this;

            var selectedItem = this._items.filter(function (item) {
                return that._itemIdPrefix + item.id == currentChbx.id;
            })[0];

            if (currentChbx.checked)
                this.checkedItems.push(selectedItem);
            else
                this.checkedItems.pop(selectedItem);
        },

        _searchCustomCbxItems: function (searchTxt, filterKey) {

            var lis = document.getElementById(this.uList.id).children;

            var checkboxes = [];
            for (var i = 1; i < lis.length; i++)
                checkboxes.push(lis[i].children[0]);

            if (searchTxt && searchTxt.length > 1) {

                for (var i = 0; i < checkboxes.length; i++)
                    checkboxes[i].parentElement.style.display = 'block';

                var unmatchedData = this._items.filter(function (item) {
                    return item[filterKey || "text"].toLowerCase().indexOf(searchTxt.toLowerCase()) == -1;
                });

                for (var i = 0; i < unmatchedData.length; i++) {

                    var checkedChb = document.getElementById(this._itemIdPrefix + unmatchedData[i].id);
                    if (checkedChb && checkedChb.parentElement)
                        checkedChb.parentElement.style.display = 'none';
                }
            }
            else {
                for (var i = 0; i < checkboxes.length; i++) {
                    checkboxes[i].parentElement.style.display = 'block';
                }
            }
        },

        _toggleCustomCombox: function () {

            this._isListVisible = this.uList.style.display != "none";

            if (this._isListVisible) {
                this._toggler.hide();
                this._isListVisible = false;
            }
            else {
                this._toggler.show();
                this.Searchbox.focus();
                this._isListVisible = true;
            }
        },

        _focusOutChanged: function (eventArgs) {

            var targetElement = eventArgs.relatedTarget || document.activeElement;

            if (!targetElement || !targetElement.className || targetElement.className.indexOf(this._focusClassName) == -1) {
                this._isInsideControl = false;
            }
            else {
                this._isInsideControl = true;
            }

            if (!this._isInsideControl)
                this._toggleCustomCombox();
        },

        _generateRandomString: function () {
            var text = "";
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

            for (var i = 0; i < 5; i++)
                text += possible.charAt(Math.floor(Math.random() * possible.length));

            return text;
        },

        Searchbox_focusout: function (eventArgs) {
            this._focusOutChanged(eventArgs);
        },

        Searchbox_Keyup: function (eventArgs) {
            var inputTxt = eventArgs.currentTarget.value;
            this._searchCustomCbxItems(inputTxt, this._filterKey);
        },

        onOpen: function (callback) {
            this._onOpenCallBack = callback;
        },

        onClose: function (callback) {
            this._onCloseCallBack = callback;
        }


    });

    ready(function () {

        parser.parse();
    });
});
