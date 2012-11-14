var AddressPickerRails = AddressPickerRails || {}

/**
 * The original script, encapsulated for deferred loading, since Google Maps API may not be defined yet.
 */
AddressPickerRails.OriginalPicker = function (my) {

    my.define = function () {
        //console.debug("Defining jquery.ui.addresspicker");

        /***************************************************************************************************************
         *
         * From https://github.com/sgruhier/jquery-addresspicker/blob/master/src/jquery.ui.addresspicker.js
         * Version of 2012.06.04 08:36:57
         * Starts here
         *
         **************************************************************************************************************/

        /*
         * jQuery UI addresspicker @VERSION
         *
         * Copyright 2010, AUTHORS.txt (http://jqueryui.com/about)
         * Dual licensed under the MIT or GPL Version 2 licenses.
         * http://jquery.org/license
         *
         * http://docs.jquery.com/UI/Progressbar
         *
         * Depends:
         *   jquery.ui.core.js
         *   jquery.ui.widget.js
         *   jquery.ui.autocomplete.js
         */
        (function ($, undefined) {

            $.widget("ui.addresspicker", {
                options:{
                    appendAddressString:"",
                    draggableMarker    :true,
                    regionBias         :null,
                    mapOptions         :{
                        zoom       :5,
                        center     :new google.maps.LatLng(46, 2),
                        scrollwheel:false,
                        mapTypeId  :google.maps.MapTypeId.ROADMAP
                    },
                    elements           :{
                        map     :false,
                        lat     :false,
                        lng     :false,
                        locality:false,
                        country :false,
                        type    :false
                    }
                },

                marker:function () {
                    return this.gmarker;
                },

                map:function () {
                    return this.gmap;
                },

                updatePosition:function () {
                    this._updatePosition(this.gmarker.getPosition());
                },

                reloadPosition:function () {
                    this.gmarker.setVisible(true);
                    this.gmarker.setPosition(new google.maps.LatLng(this.lat.val(), this.lng.val()));
                    this.gmap.setCenter(this.gmarker.getPosition());
                },

                selected:function () {
                    return this.selectedResult;
                },

                _create:function () {
                    this.geocoder = new google.maps.Geocoder();
                    this.element.autocomplete({
                        source:$.proxy(this._geocode, this),
                        focus :$.proxy(this._focusAddress, this),
                        select:$.proxy(this._selectAddress, this)
                    });

                    this.lat = $(this.options.elements.lat);
                    this.lng = $(this.options.elements.lng);
                    this.locality = $(this.options.elements.locality);
                    this.country = $(this.options.elements.country);
                    this.type = $(this.options.elements.type);
                    if (this.options.elements.map) {
                        this.mapElement = $(this.options.elements.map);
                        this._initMap();
                    }
                },

                _initMap:function () {
                    if (this.lat && this.lat.val()) {
                        this.options.mapOptions.center = new google.maps.LatLng(this.lat.val(), this.lng.val());
                    }

                    this.gmap = new google.maps.Map(this.mapElement[0], this.options.mapOptions);
                    this.gmarker = new google.maps.Marker({
                        position :this.options.mapOptions.center,
                        map      :this.gmap,
                        draggable:this.options.draggableMarker});
                    google.maps.event.addListener(this.gmarker, 'dragend', $.proxy(this._markerMoved, this));
                    this.gmarker.setVisible(false);
                },

                _updatePosition:function (location) {
                    if (this.lat) {
                        this.lat.val(location.lat());
                    }
                    if (this.lng) {
                        this.lng.val(location.lng());
                    }
                },

                _markerMoved:function () {
                    this._updatePosition(this.gmarker.getPosition());
                },

                // Autocomplete source method: fill its suggests with google geocoder results
                _geocode    :function (request, response) {
                    var address = request.term, self = this;
                    this.geocoder.geocode({
                        'address':address + this.options.appendAddressString,
                        'region' :this.options.regionBias
                    }, function (results, status) {
                        var fr_results= [];
                        if (status == google.maps.GeocoderStatus.OK) {
                            for (var i = 0; i < results.length; i++) {
                                results[i].label = results[i].formatted_address;
                                for (var j = 0; j<results[i].address_components.length; j++){
                                    //console.log(results[i]);
                                    if ((results[i].address_components[j].types[0] =="country") && (results[i].address_components[j].short_name =="FR" || results[i].address_components[j].short_name =="CH" || results[i].address_components[j].short_name =="PM" || results[i].address_components[j].short_name =="RE" || results[i].address_components[j].short_name =="MQ" || results[i].address_components[j].short_name =="LU" || results[i].address_components[j].short_name =="GP" || results[i].address_components[j].short_name =="GF" || results[i].address_components[j].short_name =="BE"))
                                    {
                                        //console.log(results[i].address_components[j].short_name);
                                        results[i].label = results[i].formatted_address;
                                        //fr_results[i] = results[i];
                                        fr_results.push(results[i]);
                                    }
                                }
                            };
                        }
                        response(fr_results);
                    })
                },

                _findInfo:function (result, type) {
                    for (var i = 0; i < result.address_components.length; i++) {
                        var component = result.address_components[i];
                        if (component.types.indexOf(type) != -1) {
                            return component.long_name;
                        }
                    }
                    return false;
                },

                _focusAddress:function (event, ui) {
                    var address = ui.item;
                    if (!address) {
                        return;
                    }

                    if (this.gmarker) {
                        this.gmarker.setPosition(address.geometry.location);
                        this.gmarker.setVisible(true);

                        this.gmap.fitBounds(address.geometry.viewport);
                    }
                    this._updatePosition(address.geometry.location);

                    if (this.locality) {
                        this.locality.val(this._findInfo(address, 'locality'));
                    }
                    if (this.country) {
                        this.country.val(this._findInfo(address, 'country'));
                    }
                    if (this.type) {
                        this.type.val(address.types[0]);
                    }
                },

                _selectAddress:function (event, ui) {
                    this.selectedResult = ui.item;
                }
            });

            $.extend($.ui.addresspicker, {
                version:"@VERSION"
            });

            // make IE think it doesn't suck
            if (!Array.indexOf) {
                Array.prototype.indexOf = function (obj) {
                    for (var i = 0; i < this.length; i++) {
                        if (this[i] == obj) {
                            return i;
                        }
                    }
                    return -1;
                }
            }

        })(jQuery);

        /***************************************************************************************************************
         *
         * From https://github.com/sgruhier/jquery-addresspicker/blob/master/src/jquery.ui.addresspicker.js
         * Ends here
         *
         **************************************************************************************************************/
    };

    return my;

}(AddressPickerRails.OriginalPicker || {});
