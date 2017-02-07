# DropdownDivConverter widget

A very easy way of creating custom - Bootstrap based - dropdown menu's. Create whatever you want in the Mendix Modeler and use this as content for the dropdown menu.

## Contributing

For more information on contributing to this repository visit [Contributing to a GitHub repository](https://world.mendix.com/display/howto50/Contributing+to+a+GitHub+repository)!

## Description

The DropdownDivConverter converts a Mendix (div-)container into a - Bootstrap based - dropdown menu with a button. Simply create a container in Mendix with all the content you want in the dropdown menu and the DropdownDivConverter widget as it's last child. Everything you will have added then becomes the content of the dropdown menu.

## Special Split button settings

The split button is a special button combination in Bootstrap: it offers a primary button and pasted onto it a dropdown button offering access to the dropdown menu.
The DropdownDivConverter widget offers two ways of adding behaviour to the primary button:

1. Use a simple microflow without a needed entity: use the Simple Microflow setting and leave the Microflow setting empty.

2. Use a microflow with an entity as it's parameter: use the Microflow and Context object setting to accomplish this.


Note that 'Dropdown button label'-setting will now be used for the label on the primary button instead.

## Implementation steps

1. Create a container element with all the contents needed in the dropdown menu (including any needed logic).
2. Add the DropdownDivConverter widget as the container's last child.
3. Change the widget settings to accomodate for the wanted behaviour / appearance.

## Notes
It's possible to use multiple DropdownDivConverter widgets on the same page. That does mean that the dropdown-menu will be included in the normal HTML contents of the Mendix application. Sometimes this will have the effect that a dataview e.g. does not accomodate any space for the dropdown menu itself. Use the css propery "overflow: visible" to solve this issue.

Since the dropdown menu is based on bootstraps dropdown button it is recommended to follow the applications Bootstrap theming rules with respect to buttons.

## Release Notes
Appstore 1.5 release:
- updated closing behaviour to be compatible with other similar custom widget closing constructions
- added closing behaviour to split button click
- updated to enable Mx 6.10+ compatibility
- updated to support nesting a dropdown in a dropdown (note: set the outer one to non self-closing)
- updated the testproject to higher version. Note that this release will therefore not be tested on 5.14.1 anymore.

Appstore 1.4 release:
- added self closing behaviour support for clickable listview (listviews with a microflow 'on click' property).

Appstore 1.3 release:
- added bootstrap glyphicon icon support: just add the "glyphicon-" classname to the settings.

Appstore 1.2 release:
- added dropdown-menu-right option for the dropdown menu realising right aligned dropdown menu's.

Appstore 1.1 release:
- missing callback bug preventing correct reset behaviour (e.g. if a blocking popup is closed).
- dropdown menu internal links will now automatically close the menu.
- new option to prevent auto closing the dropdown menu if clicked on or in the menu.

## More information
http://http://bootstrapdocs.com/v3.0.2/docs/components/#btn-dropdowns
