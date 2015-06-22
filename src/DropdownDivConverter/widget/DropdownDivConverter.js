/*jslint white:true, nomen: true, plusplus: true */
/*global mx, define, require, browser, devel, console, document, jQuery */
/*mendix */
/*
    DropdownDivConverter
    ========================

    @file      : DropdownDivConverter.js
    @version   : 1.0
    @author    : Willem Gorisse
    @date      : Wed, 17 Jun 2015 15:15:32 GMT
    @copyright : 2015 Mendix
    @license   : Apache Licence 2.0

    Documentation
    ========================
    The DropdownDivConverter converts a Mendix (div-)container into a dropdown menu with a button.
	Simply create a container in Mendix with the DropdownDivConverter widget in it as it's first child. Everything you will then add as content will be the content of the dropdown menu.
*/

// Required module list. Remove unnecessary modules, you can always get them back from the boilerplate.
define([
    'dojo/_base/declare', 'mxui/widget/_WidgetBase', 'dijit/_TemplatedMixin',
    'mxui/dom', 'dojo/dom', 'dojo/query', 'dojo/NodeList-traverse' , 'dojo/dom-prop', 'dojo/dom-geometry', 'dojo/dom-class', 'dojo/dom-style', 'dojo/dom-construct', 'dojo/_base/array', 'dojo/_base/lang', 'dojo/text', 'dojo/html', 'dojo/_base/event',
     'dojo/text!DropdownDivConverter/widget/template/DropdownDivConverter.html'
], function (declare, _WidgetBase, _TemplatedMixin, dom, dojoDom, domQuery, domTraverse, domProp, domGeom, domClass, domStyle, domConstruct, dojoArray, lang, text, html, event, widgetTemplate) {
    'use strict';

    // Declare widget's prototype.
    return declare('DropdownDivConverter.widget.DropdownDivConverter', [_WidgetBase, _TemplatedMixin], {

        // _TemplatedMixin will create our dom node using this HTML template.
        templateString: widgetTemplate,

        // Parameters configured in the Modeler.
        buttonTitle: "",
        startOpen: "",

        // Internal variables. Non-primitives created in the prototype are shared between all widget instances.
        _handles: null,
        _contextObj: null,
        _alertDiv: null,
        _eventsSet: null,

        // dojo.declare.constructor is called to construct the widget instance. Implement to initialize non-primitive properties.
        constructor: function () {
            this._handles = [];
            this._eventsSet = false;
        },

        // dijit._WidgetBase.postCreate is called after constructing the widget. Implement to do extra setup work.
        postCreate: function () {
            this._updateRendering(function(){});
        },

        // mxui.widget._WidgetBase.update is called when context is changed or initialized. Implement to re-render and / or fetch data.
        update: function (obj, callback) {
            this._contextObj = obj;
            this._resetSubscriptions();
            this._updateRendering(callback);

        },

        // mxui.widget._WidgetBase.enable is called when the widget should enable editing. Implement to enable editing if widget is input widget.
        enable: function () {},

        // mxui.widget._WidgetBase.enable is called when the widget should disable editing. Implement to disable editing if widget is input widget.
        disable: function () {},

        // mxui.widget._WidgetBase.resize is called when the page's layout is recalculated. Implement to do sizing calculations. Prefer using CSS instead.
        resize: function (box) {},

        // mxui.widget._WidgetBase.uninitialize is called when the widget is destroyed. Implement to do special tear-down work.
        uninitialize: function () {
            // Clean up listeners, helper objects, etc. There is no need to remove listeners added with this.connect / this.subscribe / this.own.
        },

        // Attach events to HTML dom elements
        _setupEvents: function (callback) {
            // only set events one time
            if (!this._eventsSet) {
                this._eventsSet = true;
                
                // set window click
                this.connect(document, "click", lang.hitch(this,function(event){
                    // if a widget external click is made: close the menu if open
                    if(domClass.contains(this.domNode,"open")){
                        domClass.remove(this.domNode,"open");
                    }
                }));

                // set action for button
                this.connect(this.dropdownButton, "click", lang.hitch(this,function(e){
                    event.stop(e);
                    this._toggleMenu();
                }));  

            }
            callback();
        },

        // toggle dropdown state
        _toggleMenu: function() {
            if (domClass.contains(this.domNode,"open")){
                domClass.remove(this.domNode,"open");   
            } else {
                domClass.add(this.domNode,"open");   
            }
        },

        // Rerender the interface.
        _updateRendering: function (callback) {
            // find all the siblings
            var siblings = domQuery(this.domNode).siblings();
            // loop through siblings and move them inside the dropdownMenu
            dojoArray.forEach(siblings, lang.hitch(this, function(entry, i) {
                domConstruct.place(entry,this.dropdownMenu,"last");
            }));
            
            this._renderInterface(this.startOpen,callback);
        },

        // Really render the interface, if renderAsOpen is true: render the menu in open state
        _renderInterface: function(renderAsOpen, callback) {
            this.dropdownButton.innerHTML = this.buttonTitle + "<span class='caret'></span>";
            if (renderAsOpen && !domClass.contains(this.domNode,"open")) {
                domClass.add(this.domNode,"open");  
            }
            
            this._setupEvents(callback);  
        },

        // Reset subscriptions.
        _resetSubscriptions: function () {
            var _objectHandle = null,
                _attrHandle = null,
                _validationHandle = null;

            // Release handles on previous object, if any.
            if (this._handles) {
                this._handles.forEach(function (handle, i) {
                    mx.data.unsubscribe(handle);
                });
                this._handles = [];
            }

            // When a mendix object exists create subscribtions. 
            if (this._contextObj) {

                _objectHandle = this.subscribe({
                    guid: this._contextObj.getGuid(),
                    callback: lang.hitch(this, function (guid) {
                        this._updateRendering();
                    })
                });

                _attrHandle = this.subscribe({
                    guid: this._contextObj.getGuid(),
                    attr: this.backgroundColor,
                    callback: lang.hitch(this, function (guid, attr, attrValue) {
                        this._updateRendering();
                    })
                });

                _validationHandle = this.subscribe({
                    guid: this._contextObj.getGuid(),
                    val: true,
                    callback: lang.hitch(this, this._handleValidation)
                });

                this._handles = [_objectHandle, _attrHandle, _validationHandle];
            }
        }
    });
});
require(['DropdownDivConverter/widget/DropdownDivConverter'], function () {
    'use strict';
});