/*jslint white:true, nomen: true, plusplus: true */
/*global mx, define, require, browser, devel, console, document, jQuery */
/*mendix */
/*
    DropdownDivConverter
    ========================

    @file      : DropdownDivConverter.js
    @version   : 1.0
    @author    : Willem Gorisse
    @date      : Wed, 24 Jun 2015 15:15:32 GMT
    @copyright : 2015 Mendix
    @license   : Apache Licence 2.0

    Documentation
    ========================
    The DropdownDivConverter converts a Mendix (div-)container into a - Bootstrap based - dropdown menu with a button. Simply create a container in Mendix with all the content you want in the dropdown menu and the DropdownDivConverter widget as it's last child. Everything you will have added then becomes the content of the dropdown menu.
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
		buttonAttribute: "",
		buttonEntity: "",
        buttonGlyphicon: "",
		contextObject: "",
        isDropUp: "",
        isRightAligned: "",
        startOpen: "",
        autoClose: "",
        splitButtonActive: "",
        splitButtonClicked:"",

        // Internal variables. Non-primitives created in the prototype are shared between all widget instances.
        _handles: null,
        _contextObj: null,
        _alertDiv: null,
        _allDropDowns: {},
        _eventsSet: null,
        _isOpen: null,
		_buttonHandles: null,

        // dojo.declare.constructor is called to construct the widget instance. Implement to initialize non-primitive properties.
        constructor: function () {
            this._handles = [];
			this._buttonHandles = [];
            this._eventsSet = false;
        },

        // dijit._WidgetBase.postCreate is called after constructing the widget. Implement to do extra setup work.
        postCreate: function () {
            this._allDropDowns[this.id] = this;
            this._isOpen = false;
        },
        
        // mxui.widget._WidgetBase.update is called when context is changed or initialized. Implement to re-render and / or fetch data.
        update: function (obj, callback) {
            var contextChange = this._contextObj !== obj;
			this._contextObj = obj;
            
            this._resetSubscriptions();
			
			//child objects don't get their update function called automatically for some reason
			if(contextChange) {
				this._updateChildren(obj);	
			}
			
            this._updateRendering(callback);

        },

		// Make sure all children are updated, because their update function doesn't get called automatically
        _updateChildren: function (obj) {
            // find all the children
			var children = domQuery(this.dropdownMenu).children();
            // loop through siblings and move them inside the dropdownMenu
            dojoArray.forEach(children, lang.hitch(this, function(entry, i) {
                var widget = dijit.registry.byNode(entry);
				if (widget && widget.update) {
					widget.update(obj, function(){});	
				}
            }));
        },
		
        // Reordering the interface: selecting the siblings and putting them in the dropdown menu
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
            this._updateButtonTitle();
			
          
            this._setButtonTypes(this.dropdownButton);
            
            // implement visual settings of the widget
            if (renderAsOpen && !domClass.contains(this.domNode,"open")) {
                domClass.add(this.domNode,"open"); 
                this._isOpen = true;
            }
            if (this.isDropUp) {
                this._transformToDropUp();
            }
            if (this.isRightAligned) {
                if (!domClass.contains(this.dropdownMenu, "dropdown-menu-right")) {
                    domClass.add(this.dropdownMenu, "dropdown-menu-right");
                }   
            }
            if (this.splitButtonActive) {
                this._createSplitButton();  
            } else {
                domConstruct.destroy(this.splitButton);
            }
            
            this._setupEvents(callback);  
        },
        
        // Attach events to HTML dom elements
        _setupEvents: function (callback) {
            // only set events one time
            if (!this._eventsSet) {
                this._eventsSet = true;
                
                // set window click
                this.connect(document, "click", lang.hitch(this,function(event){
                    // if a widget external click is made: close the menu if open
					
					//if autoclose is enabled, we can just do a simple close here if open
					if (this.autoClose) {
						if (domClass.contains(this.domNode,"open")) {
							domClass.remove(this.domNode,"open");
                        	this._isOpen = false;
						}
					//if autoclose is disabled, only listen to clicks from outside the dropdown menu
					} else if (domClass.contains(this.domNode,"open") && !this.dropdownMenu.contains(event.target)) {
                        domClass.remove(this.domNode,"open");
                        this._isOpen = false;
					}
                }));

                // set action for the normal dropdown button
                this.connect(this.dropdownButton, "click", lang.hitch(this,function(e){
                    event.stop(e);
                    var dropdown = null;
					
					/*
					var parentDropDown = null;
					var parentNode = domQuery(this.domNode.parentNode).closest(".dropdown-div-converter")[0];
					
                    if (parentNode) {
						parentDropDown = dijit.registry.byNode(parentNode).id;
					}
					*/
					
                    for(dropdown in this._allDropDowns) {
						//Don't close a parent dropdown just because a child DropdownDivConverter was clicked.
						if (this._allDropDowns[dropdown].domNode.contains(this.domNode)) continue;
						
						if (this._allDropDowns.hasOwnProperty(dropdown) && dropdown !== this.id){					
							if (this._allDropDowns[dropdown]._isOpen === true) {
                                domClass.remove(this._allDropDowns[dropdown].domNode, "open");
                                this._allDropDowns[dropdown]._isOpen = false;
                            }
                        }         
                    }
                    
                    this._toggleMenu();
                }));
                
                // prevent default closing on dropdownMenu if needed
                // ET 3/30/2016, replaced stopping the event with a check on the close handler to see if the click happened inside the dropdownmenu
				// This was done to fix a bug when using a tooltip inside the dropdown
				/*
				if (!this.autoClose){
                    this.connect(this.dropdownMenu, "click", lang.hitch(this,function(e) {
                        //event.stop(e);
                    }));
                }
                */
				
				// Handle Mendix buttons and links, and listviews, since their events don't bubble.
                this._setInternalButtonListeners();
                
                // set the action for the possible split group button
                if (this.splitButtonActive){
                    this.connect(this.splitButton, "click", lang.hitch(this, function(e){
                        
                        // if a microflow is checked and a contextobject is defined
                        if (this.splitButtonClicked !== "" && this._contextObj) {
                            // do we have a contextObj for the microflow?
                            
                            var id = this._contextObj.getGuid();

                            mx.data.action({
                                params          : {
                                    applyto     : "selection",
                                    actionname  : this.splitButtonClicked,
                                    guids       : [id]
                                },
                                callback        : function(success) {
                                    // if success was true, the microflow was indeed followed through
                                },
                                error           : function(error) {
                                    // if there was an error
                                } 
                            }, this);
                        } else if (this.simpleSplitButtonClicked !== "") {

                            mx.data.action({
                                params          : {
                                    applyto     : "none",
                                    actionname  : this.simpleSplitButtonClicked
                                },
                                callback        : function(success) {
                                    // if success was true, the microflow was indeed followed through
                                },
                                error           : function(error) {
                                    // if there was an error
                                }
                            }, this);
                        }
                        
                    }));
                }

            }
            if (callback){
                callback();
            }
        },
		
		_setInternalButtonListeners: function() {
			if (this._buttonHandles) {
				dojoArray.forEach(this._buttonHandles, function(handle, i){
					dojo.disconnect(handle);
				});

				this._buttonHandles = [];
            }
			
			// Mendix buttons and links stop events from bubbling: set actions for internal button clicks to close the menu if needed
			if (this.autoClose){
				var internalButtons = domQuery("button, a, .mx-listview-item",this.dropdownMenu);
				dojoArray.forEach(internalButtons, lang.hitch(this,function(node, i){
					this._buttonHandles[i] = this.connect(node, "click", lang.hitch(this, function(e) {
						if (this._isOpen){
							this._toggleMenu();
						}
					}));
				}));
			}
		},
		
		_getButtonTextFromReference: function() {
			var ref = this.buttonEntity.split('/')[0],
			refGuid = this._contextObj.getReference(ref);

			if (refGuid !== "") {
				mx.data.get({
					guid: refGuid.toString(),
					callback: lang.hitch(this, function (buttonTitleObj) {

						this._setButtonTitle(buttonTitleObj.get(this.buttonAttribute));

					}),
					error: function (err) {
						console.warn('Error retrieving referenced object: ', err);
					}
				});
			} else {
				this._setButtonTitle(this.buttonTitle);	
			}	
		},
		
		_updateButtonTitle: function() {
			var newTitle = this.buttonTitle;
			var needCallback = false;
			
			if (this.buttonAttribute !== '' && this._contextObj) {
				if (this.buttonEntity == this.contextObject) {
					if (this._contextObj.getEnumCaption(this.buttonAttribute)) {
						newTitle = this._contextObj.getEnumCaption(this.buttonAttribute);
					} else if (this._contextObj.get(this.buttonAttribute)) {
						newTitle = this._contextObj.get(this.buttonAttribute);
					}
				} else {
					needCallback = true;
					this._getButtonTextFromReference();
				}
			}
			
			if (!needCallback) {
				this._setButtonTitle(newTitle);
			}		
		},
							
		_setButtonTitle: function(titleText) {
		
			if(this.splitButtonActive) {
				this.splitButton.innerHTML = titleText;
				// if a glyphicon icon was requested and the splitButton is not wanted: add the glyphicon to the button.
				if (this.buttonGlyphicon !== ''){
					this._addGlyphicon(this.splitButton);   
				}
			} else {
				this.dropdownButton.innerHTML = titleText + "<span class='caret'></span>";
				// if a glyphicon icon was requested and the splitButton is not wanted: add the glyphicon to the button.
				if (this.buttonGlyphicon !== '') {
					this._addGlyphicon(this.dropdownButton);   
				}
			}
			
		},
        
        // toggle dropdown state
        _toggleMenu: function() {
			
            if (domClass.contains(this.domNode,"open")){
                domClass.remove(this.domNode,"open");
                this._isOpen = false;
            } else {
                domClass.add(this.domNode,"open");
                this._isOpen = true;
				this._setInternalButtonListeners();
            }
			
			this._updateButtonTitle();
        },
        
        // Set button types: size and type
        _setButtonTypes: function(button){
            // first set the button type
            var typeClassName = "btn-"+this.buttonType,
                sizeClassName;
            
            if (!domClass.contains(button,typeClassName)){
                domClass.add(button,typeClassName);
            }
            
            switch(this.buttonSize) {
                case "default":
                    // default buttonsize is allready implemented
                    break;
                default:
                    sizeClassName = "btn-"+this.buttonSize;
                    if (!domClass.contains(button,sizeClassName)){
                        domClass.add(button,sizeClassName);
                    }                    
            }
        },
        
        // Transform the dropdown into a dropup
        _transformToDropUp: function() {
            if (!domClass.contains(this.domNode,"dropup")){
                domClass.add(this.domNode,"dropup");
            }
        },
        
        // Create a split button group 
        _createSplitButton: function() {
            this._setButtonTypes(this.splitButton);
            
            // adjust the dropdownButtons content
            this.dropdownButton.innerHTML = "<span class='caret'></span><span class='sr-only'>Toggle Dropdown</span";
        },
        
        // Add a glyphicon to a button
        _addGlyphicon: function(buttonObject) {
            buttonObject.innerHTML = "<span class='glyphicon " + this.buttonGlyphicon + "'></span>" + buttonObject.innerHTML;
        },

        // Reset subscriptions.
        _resetSubscriptions: function () {
            var _objectHandle = null,
                _attrHandle = null,
				_contextHandle = null,
                _refHandle = null;

            // Release handles on previous object, if any.
            if (this._handles) {
                dojoArray.forEach(this._handles, function(handle, i){
                    mx.data.unsubscribe(handle);
                });

                this._handles = [];
            }

            // When a mendix object exists create subscribtions. 
            if (this._contextObj && this.buttonEntity && this.buttonAttribute) {
				var ref = this.buttonEntity.split('/')[0],
				refGuid = this._contextObj.getReference(ref);
				
				//Listen to the reference selector
				_contextHandle = this.subscribe({
						guid: this._contextObj.getGuid(),
						callback: lang.hitch(this, function (guid) {
							this._updateButtonTitle();
						})
					});				
				_refHandle = this.subscribe({
					guid: this._contextObj.getGuid(),
					attr: ref,
					callback: lang.hitch(this, function (guid, attr, attrValue) {
						this._updateButtonTitle();
					})
				});	
				
				this._handles = [_refHandle, _contextHandle];
				
				if(refGuid) {
					_objectHandle = this.subscribe({
						guid: refGuid,
						callback: lang.hitch(this, function (guid) {
							this._updateButtonTitle();
						})
					});				
					_attrHandle = this.subscribe({
						guid: refGuid,
						attr: this.buttonAttribute,
						callback: lang.hitch(this, function (guid, attr, attrValue) {
							this._updateButtonTitle();
						})
					});

                	this._handles = [_objectHandle, _refHandle, _attrHandle, _contextHandle];
				}
            }
        },
		
        // mxui.widget._WidgetBase.uninitialize is called when the widget is destroyed. Implement to do special tear-down work.
        uninitialize: function() {
          	logger.debug(this.id + ".uninitialize");
			// Clean up listeners, helper objects, etc. There is no need to remove listeners added with this.connect / this.subscribe / this.own.
			delete this._allDropDowns[this.id];
        }
    });
});
require(['DropdownDivConverter/widget/DropdownDivConverter'], function () {
    'use strict';
});